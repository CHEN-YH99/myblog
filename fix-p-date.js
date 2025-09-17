// 修复 p_date 字段的脚本
import mongoose from 'mongoose';

// 连接数据库
mongoose.connect('mongodb://localhost:27017/my-blog')
  .then(() => console.log('MongoDB连接成功'))
  .catch((err) => console.error('MongoDB连接失败:', err));

// 文章模型
const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  content: { type: String, required: true },
  contentFormat: { type: String, enum: ['markdown', 'html'], default: 'markdown' },
  contentHtml: { type: String },
  toc: [{ 
    id: String, 
    text: String, 
    level: Number 
  }],
  author: { type: String, required: true },
  category: { type: String },
  tags: [{ type: String }],
  publishDate: { type: Date, default: Date.now },
  updateDate: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  excerpt: { type: String },
  image: { type: String },
  p_date: { type: mongoose.Schema.Types.Mixed } // 允许混合类型以便修复
});

const Article = mongoose.model('Article', ArticleSchema);

async function fixPDateField() {
  try {
    console.log('开始修复 p_date 字段...');
    
    // 查找所有文章
    const allArticles = await Article.find({});
    console.log(`找到 ${allArticles.length} 篇文章`);
    
    let fixedCount = 0;
    
    for (const article of allArticles) {
      let needsUpdate = false;
      let newPDate = null;
      
      // 检查 p_date 字段的类型和值
      if (!article.p_date) {
        // 没有 p_date 字段，使用 publishDate 的年份
        const publishDate = article.publishDate || new Date();
        newPDate = publishDate.getFullYear();
        needsUpdate = true;
        console.log(`文章 "${article.title}": 缺少 p_date，设置为 ${newPDate}`);
      } else if (typeof article.p_date === 'object' && article.p_date instanceof Date) {
        // p_date 是 Date 类型，转换为年份数字
        newPDate = article.p_date.getFullYear();
        needsUpdate = true;
        console.log(`文章 "${article.title}": p_date 是 Date 类型 (${article.p_date})，转换为 ${newPDate}`);
      } else if (typeof article.p_date === 'number') {
        // 检查是否是合理的年份
        if (article.p_date < 1970 || article.p_date > 2030) {
          // 不合理的年份，使用 publishDate
          const publishDate = article.publishDate || new Date();
          newPDate = publishDate.getFullYear();
          needsUpdate = true;
          console.log(`文章 "${article.title}": p_date 年份不合理 (${article.p_date})，设置为 ${newPDate}`);
        } else {
          console.log(`文章 "${article.title}": p_date 正常 (${article.p_date})`);
        }
      } else {
        // 其他类型，使用 publishDate 的年份
        const publishDate = article.publishDate || new Date();
        newPDate = publishDate.getFullYear();
        needsUpdate = true;
        console.log(`文章 "${article.title}": p_date 类型异常 (${typeof article.p_date})，设置为 ${newPDate}`);
      }
      
      if (needsUpdate && newPDate) {
        await Article.updateOne(
          { _id: article._id },
          { $set: { p_date: newPDate } }
        );
        fixedCount++;
      }
    }
    
    console.log(`\n修复完成！共修复了 ${fixedCount} 篇文章`);
    
    // 验证修复结果
    const updatedArticles = await Article.find({});
    console.log('\n修复后的文章列表:');
    
    const yearStats = {};
    updatedArticles.forEach((article, index) => {
      const year = article.p_date || '无';
      console.log(`${index + 1}. ${article.title} - p_date: ${year}`);
      
      yearStats[year] = (yearStats[year] || 0) + 1;
    });
    
    console.log('\n各年份文章统计:');
    Object.entries(yearStats).sort(([a], [b]) => b - a).forEach(([year, count]) => {
      console.log(`${year}年: ${count}篇文章`);
    });
    
  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    mongoose.connection.close();
  }
}

// 执行修复
fixPDateField();