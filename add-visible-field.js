// 为现有文章添加 visible 字段的迁移脚本
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
  p_date: { type: Number },
  visible: { type: Boolean, default: true }
});

const Article = mongoose.model('Article', ArticleSchema);

async function addVisibleField() {
  try {
    console.log('开始为文章添加 visible 字段...');
    
    // 查找所有没有 visible 字段的文章
    const articlesWithoutVisible = await Article.find({ visible: { $exists: false } });
    console.log(`找到 ${articlesWithoutVisible.length} 篇文章需要添加 visible 字段`);
    
    if (articlesWithoutVisible.length === 0) {
      console.log('所有文章都已有 visible 字段');
      return;
    }
    
    // 为每篇文章添加 visible 字段，默认设置为 true（公开）
    for (const article of articlesWithoutVisible) {
      await Article.updateOne(
        { _id: article._id },
        { $set: { visible: true } }
      );
      console.log(`更新文章: ${article.title} - visible: true`);
    }
    
    console.log('visible 字段添加完成！');
    
    // 验证结果
    const allArticles = await Article.find({});
    console.log('\n所有文章的可见性状态:');
    
    const visibilityStats = { visible: 0, hidden: 0 };
    allArticles.forEach((article, index) => {
      const status = article.visible !== false ? '公开' : '隐藏';
      console.log(`${index + 1}. ${article.title} - ${status}`);
      
      if (article.visible !== false) {
        visibilityStats.visible++;
      } else {
        visibilityStats.hidden++;
      }
    });
    
    console.log('\n可见性统计:');
    console.log(`公开文章: ${visibilityStats.visible}篇`);
    console.log(`隐藏文章: ${visibilityStats.hidden}篇`);
    
  } catch (error) {
    console.error('添加 visible 字段失败:', error);
  } finally {
    mongoose.connection.close();
  }
}

// 执行迁移
addVisibleField();