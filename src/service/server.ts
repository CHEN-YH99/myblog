// import express, { type Request, type Response } from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';

// const app = express();
// const PORT = process.env.PORT || 3001;

// // 中间件
// app.use(cors());
// app.use(express.json());

// // 通用请求日志（每次请求都会打印）
// app.use((req, _res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
//   next();
// });

// // 连接MongoDB
// mongoose.connect('mongodb://localhost:27017/my-blog')
// .then(() => console.log('MongoDB连接成功'))
// .catch((err: Error) => console.error('MongoDB连接失败:', err));

// // 文章模型
// const ArticleSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   content: { type: String, required: true },
//   author: { type: String, required: true },
//   tags: [{ type: String }],
//   publishDate: { type: Date, default: Date.now },
//   updateDate: { type: Date, default: Date.now },
//   likes: { type: Number, default: 0 },
//   views: { type: Number, default: 0 },
//   excerpt: { type: String },
// });

// const Article = mongoose.model('Article', ArticleSchema);
// /**
//  * 获取文章列表
//  */
// app.get('/api/articles', async (_req: Request, res: Response) => {
//   try {
//     const articles = await Article.find().sort({ publishDate: -1 });
//     res.json(articles);
//   } catch (error) {
//     console.error('获取文章列表失败:', error);
//     res.status(500).json({ error: '获取文章失败' });
//   }
// });

// /**
//  * 获取文章详情
//  */
// app.get('/api/articles/:id', async (req: Request, res: Response) => {
//   try {
//     const article = await Article.findById(req.params.id);
//     if (!article) {
//       return res.status(404).json({ error: '文章未找到' });
//     }
//     res.json(article);
//   } catch (error) {
//     console.error('获取文章详情失败:', error);
//     res.status(500).json({ error: '获取文章失败' });
//   }
// });

// // 启动服务器并监听端口
// app.listen(PORT, () => {
//   console.log(`服务器运行在 http://localhost:${PORT}`);
// });




// 9-13重构的代码

import express, { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 通用请求日志（每次请求都会打印）
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// 连接MongoDB
mongoose.connect('mongodb://localhost:27017/my-blog')
.then(() => console.log('MongoDB连接成功'))
.catch((err: Error) => console.error('MongoDB连接失败:', err));

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
  image: { type: String }
});

const Article = mongoose.model('Article', ArticleSchema);

// 统一响应格式函数
const createResponse = <T>(data: T, message: string = '操作成功', code: number = 200) => {
  return {
    code,
    msg: message,
    data
  };
};

const createErrorResponse = (message: string = '操作失败', code: number = 500) => {
  return {
    code,
    msg: message,
    data: null
  };
};

/**
 * 获取文章列表
 */
app.get('/api/articles', async (req: Request, res: Response) => {
  try {
    const { tag, category, limit, offset } = req.query;
    
    // 构建查询条件
    const query: any = {};
    if (tag) query.tags = { $in: [tag] };
    if (category) query.category = category;
    
    // 执行查询
    let articlesQuery = Article.find(query).sort({ publishDate: -1 });
    
    if (limit) {
      articlesQuery = articlesQuery.limit(Number(limit));
    }
    if (offset) {
      articlesQuery = articlesQuery.skip(Number(offset));
    }
    
    const articles = await articlesQuery.exec();
    
    res.json(createResponse(articles, '获取文章列表成功'));
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json(createErrorResponse('获取文章列表失败', 500));
  }
});

/**
 * 获取文章详情
 */
app.get('/api/articles/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    
    // 尝试通过ID或slug查找文章
    let article;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      article = await Article.findById(idOrSlug);
    } else {
      article = await Article.findOne({ slug: idOrSlug });
    }
    
    if (!article) {
      return res.status(404).json(createErrorResponse('文章未找到', 404));
    }
    
    // 增加浏览量
    article.views += 1;
    await article.save();
    
    res.json(createResponse(article, '获取文章详情成功'));
  } catch (error) {
    console.error('获取文章详情失败:', error);
    res.status(500).json(createErrorResponse('获取文章详情失败', 500));
  }
});

/**
 * 创建文章
 */
app.post('/api/articles', async (req: Request, res: Response) => {
  try {
    const articleData = req.body;
    
    // 如果没有提供slug，根据title生成
    if (!articleData.slug && articleData.title) {
      articleData.slug = articleData.title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
    
    const article = new Article(articleData);
    const savedArticle = await article.save();
    
    res.status(201).json(createResponse(savedArticle, '文章创建成功', 201));
  } catch (error) {
    console.error('创建文章失败:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      res.status(400).json(createErrorResponse('文章slug已存在', 400));
    } else {
      res.status(500).json(createErrorResponse('创建文章失败', 500));
    }
  }
});

/**
 * 更新文章
 */
app.put('/api/articles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updateDate: new Date() };
    
    const article = await Article.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });
    
    if (!article) {
      return res.status(404).json(createErrorResponse('文章未找到', 404));
    }
    
    res.json(createResponse(article, '文章更新成功'));
  } catch (error) {
    console.error('更新文章失败:', error);
    res.status(500).json(createErrorResponse('更新文章失败', 500));
  }
});

/**
 * 删除文章
 */
app.delete('/api/articles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findByIdAndDelete(id);
    
    if (!article) {
      return res.status(404).json(createErrorResponse('文章未找到', 404));
    }
    
    res.json(createResponse(null, '文章删除成功'));
  } catch (error) {
    console.error('删除文章失败:', error);
    res.status(500).json(createErrorResponse('删除文章失败', 500));
  }
});

/**
 * 点赞文章
 */
app.post('/api/articles/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    
    if (!article) {
      return res.status(404).json(createErrorResponse('文章未找到', 404));
    }
    
    res.json(createResponse({ likes: article.likes }, '点赞成功'));
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json(createErrorResponse('点赞失败', 500));
  }
});

/**
 * 取消点赞
 */
app.post('/api/articles/:id/unlike', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findByIdAndUpdate(
      id,
      { $inc: { likes: -1 } },
      { new: true }
    );
    
    if (!article) {
      return res.status(404).json(createErrorResponse('文章未找到', 404));
    }
    
    // 确保点赞数不为负数
    if (article.likes < 0) {
      article.likes = 0;
      await article.save();
    }
    
    res.json(createResponse({ likes: article.likes }, '取消点赞成功'));
  } catch (error) {
    console.error('取消点赞失败:', error);
    res.status(500).json(createErrorResponse('取消点赞失败', 500));
  }
});

/**
 * 获取热门文章
 */
app.get('/api/articles/popular', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    
    const articles = await Article.find()
      .sort({ likes: -1, views: -1 })
      .limit(Number(limit))
      .select('title slug author publishDate likes views excerpt image');
    
    res.json(createResponse(articles, '获取热门文章成功'));
  } catch (error) {
    console.error('获取热门文章失败:', error);
    res.status(500).json(createErrorResponse('获取热门文章失败', 500));
  }
});

/**
 * 搜索文章
 */
app.get('/api/articles/search', async (req: Request, res: Response) => {
  try {
    const { keyword, limit = 20 } = req.query;
    
    if (!keyword) {
      return res.status(400).json(createErrorResponse('搜索关键词不能为空', 400));
    }
    
    const articles = await Article.find({
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
        { excerpt: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword as string, 'i')] } }
      ]
    })
    .sort({ publishDate: -1 })
    .limit(Number(limit));
    
    res.json(createResponse({
      articles,
      total: articles.length,
      keyword
    }, '搜索完成'));
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json(createErrorResponse('搜索失败', 500));
  }
});

/**
 * 获取所有分类
 */
app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await Article.distinct('category');
    const categoriesWithCount = await Promise.all(
      categories.filter(Boolean).map(async (category) => ({
        name: category,
        count: await Article.countDocuments({ category })
      }))
    );
    
    res.json(createResponse(categoriesWithCount, '获取分类成功'));
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json(createErrorResponse('获取分类失败', 500));
  }
});

/**
 * 获取所有标签
 */
app.get('/api/tags', async (_req: Request, res: Response) => {
  try {
    const allTags = await Article.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const tags = allTags.map(tag => ({
      name: tag._id,
      count: tag.count
    }));
    
    res.json(createResponse(tags, '获取标签成功'));
  } catch (error) {
    console.error('获取标签失败:', error);
    res.status(500).json(createErrorResponse('获取标签失败', 500));
  }
});

/**
 * 文件上传 (简单实现)
 */
app.post('/api/uploads', async (_req: Request, res: Response) => {
  try {
    // 这里应该实现真正的文件上传逻辑
    // 目前返回模拟数据
    const mockUrl = `https://picsum.photos/800/400?random=${Date.now()}`;
    
    res.json(createResponse({ url: mockUrl }, '上传成功'));
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json(createErrorResponse('上传失败', 500));
  }
});

// 全局错误处理中间件
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('服务器错误:', err);
  res.status(500).json(createErrorResponse('服务器内部错误', 500));
});

// 404处理
app.use((_req: Request, res: Response) => {
  res.status(404).json(createErrorResponse('接口不存在', 404));
});

// 启动服务器并监听端口
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
