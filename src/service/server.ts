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
import multer from 'multer';
import path from 'path';
import fs from 'fs';


const app = express();
const PORT = process.env.PORT || 3001;

// 创建上传目录
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 中间件
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB 限制
  },
  fileFilter: (_req, file, cb) => {
    // 只允许上传图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json());

// 静态文件服务 - 提供上传的图片访问
app.use('/uploads', express.static(uploadDir));

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
  author: { type: String, required: false },
  category: { type: String },
  tags: [{ type: String }],
  publishDate: { type: Date, default: Date.now },
  updateDate: { type: Date, default: Date.now },
  likes: { type: mongoose.Schema.Types.Mixed, default: 0 },
  views: { type: mongoose.Schema.Types.Mixed, default: 0 },
  excerpt: { type: String },
  image: { type: String },
  p_date: { type: Number }, // p_date 字段存储年份数字（如 2024）
  visible: { type: Boolean, default: true } // 文章可见性，默认为可见
});

const Article = mongoose.model('Article', ArticleSchema);

// 分类模型
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  color: { type: String, default: '#409eff' },
  sort: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createTime: { type: Date, default: Date.now },
  updateTime: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：文章数量
CategorySchema.virtual('articleCount', {
  ref: 'Article',
  localField: 'name',
  foreignField: 'category',
  count: true
});

const Category = mongoose.model('Category', CategorySchema);

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
    const { tag, category, limit, offset, page, size, searchVal, year, admin } = req.query;
    
    // 构建查询条件
    const query: any = {};
    if (tag) query.tags = { $in: [tag] };
    if (category) query.category = category;
    
    // 可见性筛选：只有管理员请求才能看到隐藏文章
    if (!admin || admin !== 'true') {
      query.visible = { $ne: false }; // 前端只显示可见文章（包括undefined和true）
    }
    
    // 搜索功能
    if (searchVal) {
      query.$or = [
        { title: { $regex: searchVal, $options: 'i' } },
        { content: { $regex: searchVal, $options: 'i' } },
        { excerpt: { $regex: searchVal, $options: 'i' } },
        { tags: { $in: [new RegExp(searchVal as string, 'i')] } }
      ];
    }
    
    // 年份筛选 - 使用新的 p_date 字段（数字类型）
    if (year && year !== 'All' && year !== '全部') {
      const yearNum = parseInt(year as string);
      query.p_date = yearNum;  // 直接匹配年份数字
      console.log('年份筛选 (p_date):', year, '筛选条件:', { p_date: yearNum });
    }
    
    // 分页处理 - 使用 publishDate 字段精确排序（最新发布的在前）
    let articlesQuery = Article.find(query).sort({ publishDate: -1 });
    
    if (page && size) {
      const pageNum = Number(page);
      const pageSize = Number(size);
      const skip = (pageNum - 1) * pageSize;
      articlesQuery = articlesQuery.skip(skip).limit(pageSize);
    } else {
      if (limit) {
        articlesQuery = articlesQuery.limit(Number(limit));
      }
      if (offset) {
        articlesQuery = articlesQuery.skip(Number(offset));
      }
    }
    
    const articles = await articlesQuery.exec();
    const total = await Article.countDocuments(query);
    
    console.log('查询结果:', { query, total, articlesCount: articles.length });
    
    // 调试：检查返回的文章是否包含 p_date 字段
    if (articles.length > 0) {
      console.log('第一篇文章的字段:', Object.keys(articles[0].toObject()));
      console.log('第一篇文章的 p_date:', articles[0].p_date);
    }
    

    
    res.json(createResponse({
      articles,
      total,
      currentPage: page ? Number(page) : 1,
      pageSize: size ? Number(size) : articles.length
    }, '获取文章列表成功'));
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json(createErrorResponse('获取文章列表失败', 500));
  }
});

/**
 * 专门为后台管理系统的文章详情接口（不增加浏览量）
 */
app.get('/api/admin/articles/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    
    console.log('\n====== 后台管理文章详情请求 ======');
    console.log(`🔑 后台管理专用接口，不增加浏览量`);
    console.log(`🔍 文章ID/Slug: ${idOrSlug}`);
    
    // 尝试通过ID或slug查找文章
    let article;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      article = await Article.findById(idOrSlug);
    } else {
      article = await Article.findOne({ slug: idOrSlug });
    }
    
    if (!article) {
      console.log('❌ 文章未找到');
      return res.status(404).json(createErrorResponse('文章未找到', 404));
    }
    
    console.log(`✅ 后台管理获取文章成功，浏览量保持不变: ${article.views}`);
    console.log('====== 后台管理文章详情请求结束 ======\n');
    
    res.json(createResponse(article, '获取文章详情成功'));
  } catch (error) {
    console.error('❌ 后台管理获取文章详情失败:', error);
    res.status(500).json(createErrorResponse('获取文章详情失败', 500));
  }
});

/**
 * 获取文章详情
 */
app.get('/api/articles/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    const { admin, noIncrement } = req.query;
    
    console.log('\n====== 文章详情请求开始 ======');
    console.log(`🔍 文章ID/Slug: ${idOrSlug}`);
    console.log(`🔑 Admin参数: "${admin}" (类型: ${typeof admin})`);
    console.log(`⏭️ NoIncrement参数: "${noIncrement}" (类型: ${typeof noIncrement})`);
    console.log(`🌐 请求来源: ${req.headers.referer || '未知'}`);
    console.log(`🔍 User-Agent: ${req.headers['user-agent']?.substring(0, 50) || '未知'}...`);
    
    // 尝试通过ID或slug查找文章
    let article;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      article = await Article.findById(idOrSlug);
    } else {
      article = await Article.findOne({ slug: idOrSlug });
    }
    
    if (!article) {
      console.log('❌ 文章未找到');
      return res.status(404).json(createErrorResponse('文章未找到', 404));
    }
    
    const originalViews = article.views;
    console.log(`📈 当前浏览量: ${originalViews}`);
    
    // 更严格的参数检查：只要admin参数存在且不为空，就不增加浏览量
    const isAdminRequest = admin !== undefined && admin !== null && admin !== '';
    const isNoIncrement = noIncrement !== undefined && noIncrement !== null && noIncrement !== '';
    const shouldIncrement = !isAdminRequest && !isNoIncrement;
    
    console.log(`🤔 是否为管理员请求: ${isAdminRequest}`);
    console.log(`🤔 是否禁止增加: ${isNoIncrement}`);
    console.log(`🤔 是否增加浏览量: ${shouldIncrement}`);
    
    if (shouldIncrement) {
      article.views += 1;
      await article.save();
      console.log(`✅ 浏览量已增加: ${originalViews} -> ${article.views} (文章: ${article.title})`);
    } else {
      if (isAdminRequest) {
        console.log(`⏭️ 管理员访问，跳过浏览量增加 (文章: ${article.title})`);
      } else if (isNoIncrement) {
        console.log(`⏭️ 禁止增加标记，跳过浏览量增加 (文章: ${article.title})`);
      }
    }
    
    console.log('====== 文章详情请求结束 ======\n');
    
    res.json(createResponse(article, '获取文章详情成功'));
  } catch (error) {
    console.error('❌ 获取文章详情失败:', error);
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
    
    // 设置发布时间和年份字段
    const now = new Date();
    articleData.publishDate = now;
    articleData.updateDate = now;
    articleData.p_date = now.getFullYear(); // 设置年份用于排序和筛选
    
    console.log('创建文章数据:', {
      title: articleData.title,
      publishDate: articleData.publishDate,
      p_date: articleData.p_date
    });
    
    const article = new Article(articleData);
    const savedArticle = await article.save();
    
    console.log('文章创建成功:', {
      id: savedArticle._id,
      title: savedArticle.title,
      p_date: savedArticle.p_date
    });
    
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
    
    // 如果更新了发布时间相关字段，同时更新p_date
    if (updateData.publishDate) {
      const publishDate = new Date(updateData.publishDate);
      updateData.p_date = publishDate.getFullYear();
    }
    
    console.log('更新文章数据:', {
      id,
      title: updateData.title,
      updateDate: updateData.updateDate,
      p_date: updateData.p_date
    });
    
    const article = await Article.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });
    
    if (!article) {
      return res.status(404).json(createErrorResponse('文章未找到', 404));
    }
    
    console.log('文章更新成功:', {
      id: article._id,
      title: article.title,
      p_date: article.p_date
    });
    
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
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const { page, size, keyword, status } = req.query;
    
    // 构建查询条件
    const query: any = {};
    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    
    // 分页处理
    let categoriesQuery = Category.find(query).sort({ sort: 1, createTime: -1 });
    
    if (page && size) {
      const pageNum = Number(page);
      const pageSize = Number(size);
      const skip = (pageNum - 1) * pageSize;
      categoriesQuery = categoriesQuery.skip(skip).limit(pageSize);
    }
    
    const categories = await categoriesQuery.populate('articleCount').exec();
    const total = await Category.countDocuments(query);
    
    // 获取每个分类的文章数量
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const articleCount = await Article.countDocuments({ category: category.name });
        return {
          ...category.toObject(),
          articleCount
        };
      })
    );
    
    if (page && size) {
      res.json(createResponse({
        categories: categoriesWithCount,
        total,
        currentPage: Number(page),
        pageSize: Number(size)
      }, '获取分类列表成功'));
    } else {
      // 不分页时返回简单格式（兼容原有接口）
      const simpleCategoriesWithCount = await Promise.all(
        (await Category.find({ status: 'active' }).sort({ sort: 1 }))
        .map(async (category) => ({
          name: category.name,
          count: await Article.countDocuments({ category: category.name })
        }))
      );
      res.json(createResponse(simpleCategoriesWithCount, '获取分类成功'));
    }
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json(createErrorResponse('获取分类失败', 500));
  }
});

/**
 * 获取分类详情
 */
app.get('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json(createErrorResponse('分类未找到', 404));
    }
    
    // 获取文章数量
    const articleCount = await Article.countDocuments({ category: category.name });
    
    res.json(createResponse({
      ...category.toObject(),
      articleCount
    }, '获取分类详情成功'));
  } catch (error) {
    console.error('获取分类详情失败:', error);
    res.status(500).json(createErrorResponse('获取分类详情失败', 500));
  }
});

/**
 * 创建分类
 */
app.post('/api/categories', async (req: Request, res: Response) => {
  try {
    const categoryData = req.body;
    
    // 如果没有提供slug，根据name生成
    if (!categoryData.slug && categoryData.name) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
    
    const category = new Category(categoryData);
    const savedCategory = await category.save();
    
    res.status(201).json(createResponse(savedCategory, '分类创建成功', 201));
  } catch (error) {
    console.error('创建分类失败:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      res.status(400).json(createErrorResponse('分类名称或URL别名已存在', 400));
    } else {
      res.status(500).json(createErrorResponse('创建分类失败', 500));
    }
  }
});

/**
 * 更新分类
 */
app.put('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updateTime: new Date() };
    
    const category = await Category.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });
    
    if (!category) {
      return res.status(404).json(createErrorResponse('分类未找到', 404));
    }
    
    // 获取文章数量
    const articleCount = await Article.countDocuments({ category: category.name });
    
    res.json(createResponse({
      ...category.toObject(),
      articleCount
    }, '分类更新成功'));
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json(createErrorResponse('更新分类失败', 500));
  }
});

/**
 * 删除分类
 */
app.delete('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json(createErrorResponse('分类未找到', 404));
    }
    
    // 检查是否有文章使用该分类
    const articleCount = await Article.countDocuments({ category: category.name });
    if (articleCount > 0) {
      return res.status(400).json(createErrorResponse('该分类下还有文章，无法删除', 400));
    }
    
    await Category.findByIdAndDelete(id);
    
    res.json(createResponse(null, '分类删除成功'));
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json(createErrorResponse('删除分类失败', 500));
  }
});

/**
 * 批量删除分类
 */
app.delete('/api/categories', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(createErrorResponse('请提供要删除的分类ID列表', 400));
    }
    
    // 检查所有分类是否可以删除
    const categories = await Category.find({ _id: { $in: ids } });
    for (const category of categories) {
      const articleCount = await Article.countDocuments({ category: category.name });
      if (articleCount > 0) {
        return res.status(400).json(createErrorResponse(`分类「${category.name}」下还有文章，无法删除`, 400));
      }
    }
    
    const result = await Category.deleteMany({ _id: { $in: ids } });
    
    res.json(createResponse({ deletedCount: result.deletedCount }, `成功删除 ${result.deletedCount} 个分类`));
  } catch (error) {
    console.error('批量删除分类失败:', error);
    res.status(500).json(createErrorResponse('批量删除分类失败', 500));
  }
});

/**
 * 批量更新分类状态
 */
app.patch('/api/categories/status', async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(createErrorResponse('请提供要更新的分类ID列表', 400));
    }
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json(createErrorResponse('请提供正确的状态值', 400));
    }
    
    const result = await Category.updateMany(
      { _id: { $in: ids } },
      { status, updateTime: new Date() }
    );
    
    res.json(createResponse({ modifiedCount: result.modifiedCount }, `成功更新 ${result.modifiedCount} 个分类的状态`));
  } catch (error) {
    console.error('批量更新分类状态失败:', error);
    res.status(500).json(createErrorResponse('批量更新分类状态失败', 500));
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
 * 文件上传接口
 */
app.post('/api/uploads', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json(createErrorResponse('没有上传文件', 400));
    }

    // 构建文件URL（这里使用相对路径）
    const fileUrl = `/uploads/${req.file.filename}`;
    
    console.log('文件上传成功:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      url: fileUrl
    });
    
    res.json(createResponse({ 
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size 
    }, '上传成功'));
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
