// 临时迁移脚本：为现有文章添加 p_date 字段
import mongoose from 'mongoose';

// 连接数据库
mongoose.connect('mongodb://localhost:27017/my-blog')
  .then(() => console.log('MongoDB连接成功'))
  .catch((err) => console.error('MongoDB连接失败:', err));

// 文章模型（包含 p_date 字段）
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
  p_date: { type: Number } // p_date 字段存储年份数字（如 2024）
});

const Article = mongoose.model('Article', ArticleSchema);

async function migrateData() {
  try {
    console.log('开始迁移数据...');
    
    // 查找所有没有 p_date 字段的文章
    const articlesWithoutPDate = await Article.find({ p_date: { $exists: false } });
    console.log(`找到 ${articlesWithoutPDate.length} 篇文章需要添加 p_date 字段`);
    
    if (articlesWithoutPDate.length === 0) {
      console.log('所有文章都已有 p_date 字段');
      return;
    }
    
    // 为每篇文章添加 p_date 字段（使用 publishDate 的年份作为数字值）
    for (const article of articlesWithoutPDate) {
      const publishDate = article.publishDate || new Date();
      const yearNumber = publishDate.getFullYear(); // 提取年份数字
      await Article.updateOne(
        { _id: article._id },
        { $set: { p_date: yearNumber } }
      );
      console.log(`更新文章: ${article.title} - p_date: ${yearNumber} (年份)`);
    }
    
    console.log('数据迁移完成！');
    
    // 验证迁移结果
    const allArticles = await Article.find({});
    console.log('\n迁移后的文章列表:');
    allArticles.forEach((article, index) => {
      const year = article.p_date ? article.p_date.getFullYear() : '无';
      console.log(`${index + 1}. ${article.title} - p_date年份: ${year}`);
    });
    
  } catch (error) {
    console.error('迁移失败:', error);
  } finally {
    mongoose.connection.close();
  }
}

// 执行迁移
migrateData();