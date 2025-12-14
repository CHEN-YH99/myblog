import express, { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';


const app = express();
const PORT = process.env.PORT || 3001;

// 创建上传目录 - 修正路径到myblog项目的uploads文件夹
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
app.set('trust proxy', true); // 信任代理，正确获取客户端IP
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175', 
    'http://localhost:5176',
    'https://www.xiaohui88.site',
    'https://www.xhui886.online'
  ],
  credentials: true
}));
app.use(express.json());

// 静态文件服务 - 提供上传的图片访问（必须在所有API路由之前）
app.use('/uploads', express.static(uploadDir));

// 通用请求日志（每次请求都会打印）
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('请求头:', req.headers);
  console.log('查询参数:', req.query);
  console.log('客户端IP:', req.ip);
  console.log('连接远程地址:', req.connection?.remoteAddress);
  console.log('Socket远程地址:', req.socket?.remoteAddress);
  next();
});

// 添加根路径测试路由
app.get('/', (req: Request, res: Response) => {
  console.log('根路径被访问');
  res.json({ message: '服务器正常运行', timestamp: new Date().toISOString() });
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
  isTop: { type: Boolean, default: false }, // 文章置顶状态，默认不置顶
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

// 图片分类模型
const PhotoCategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  title: { type: String, required: false, default: '' },
  description: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  photoCount: { type: Number, default: 0 },
  sortOrder: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PhotoCategory = mongoose.model('PhotoCategory', PhotoCategorySchema, 'photocategories');

// 照片模型
const PhotoSchema = new mongoose.Schema({
  categoryId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  tags: [{ type: String }],
  uploadDate: { type: Date, default: Date.now },
  sortOrder: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 }
});

const Photo = mongoose.model('Photo', PhotoSchema);

// 说说模型
const TalkSchema = new mongoose.Schema({
  content: { type: String, required: true }, // 说说内容
  images: [{ type: String }], // 图片数组
  author: { type: String, required: false, default: '管理员' }, // 作者
  publishDate: { type: Date, default: Date.now }, // 发布时间
  updateDate: { type: Date, default: Date.now }, // 更新时间
  likes: { type: Number, default: 0 }, // 点赞数
  views: { type: Number, default: 0 }, // 浏览数
  status: { 
    type: String, 
    enum: ['public', 'private', 'deleted'], 
    default: 'public' 
  }, // 状态：公开、私密、已删除
  isTop: { type: Boolean, default: false }, // 是否置顶
  isHidden: { type: Boolean, default: false }, // 是否隐藏
  location: { type: String, default: '' }, // 位置信息
  mood: { type: String, default: '' }, // 心情
  weather: { type: String, default: '' }, // 天气
  tags: [{ type: String }], // 标签
  deleteDate: { type: Date }, // 删除时间（软删除）
  sort: { type: Number, default: 0 } // 排序权重
});

const Talk = mongoose.model('Talk', TalkSchema);

// 回复模型
const ReplySchema = new mongoose.Schema({
  talkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Talk', required: true }, // 关联的说说ID
  content: { type: String, required: true }, // 回复内容
  author: { type: String, required: true }, // 回复者昵称
  email: { type: String, required: false }, // 回复者邮箱（可选）
  website: { type: String, required: false }, // 回复者网站（可选）
  avatar: { type: String, required: false }, // 回复者头像（可选）
  ip: { type: String, required: false }, // IP地址
  location: { type: String, required: false }, // 地理位置
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reply', required: false }, // 父回复ID（用于嵌套回复）
  replyTo: { type: String, required: false }, // 回复给谁（昵称）
  publishDate: { type: Date, default: Date.now }, // 发布时间
  status: { 
    type: String, 
    enum: ['approved', 'pending', 'rejected'], 
    default: 'approved' 
  }, // 审核状态
  likes: { type: Number, default: 0 }, // 点赞数
  isDeleted: { type: Boolean, default: false } // 是否删除
});

const Reply = mongoose.model('Reply', ReplySchema);

// 点赞记录模型（防止重复点赞）
const LikeSchema = new mongoose.Schema({
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // 目标ID（说说、回复或文章）
  targetType: { type: String, enum: ['talk', 'reply', 'article'], required: true }, // 目标类型
  ip: { type: String, required: true }, // 点赞者IP
  userAgent: { type: String, required: false }, // 用户代理
  publishDate: { type: Date, default: Date.now } // 点赞时间
});

const Like = mongoose.model('Like', LikeSchema);

// 角色模型
const RoleSchema = new mongoose.Schema({
  roleId: { type: Number, required: true, unique: true },
  roleName: { type: String, required: true },
  roleCode: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  enabled: { type: Boolean, default: true },
  permissions: [{ type: String }], // 权限列表
  createTime: { type: Date, default: Date.now },
  updateTime: { type: Date, default: Date.now }
});

const Role = mongoose.model('Role', RoleSchema);

// 用户模型
const UserSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  password: { type: String, required: true }, // 实际应用中应该加密存储
  avatar: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  roleId: { type: Number, ref: 'Role', required: true },
  roleName: { type: String, required: true }, // 冗余字段，便于查询
  enabled: { type: Boolean, default: true },
  lastLoginTime: { type: Date },
  lastLoginIp: { type: String, default: '' },
  registerSource: { type: String, default: 'frontend' },
  registerIp: { type: String, default: '' },
  createTime: { type: Date, default: Date.now },
  updateTime: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// 通用响应格式
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

// ==================== 文章相关API ====================

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
 * 获取用户详情 - 支持多个路径
 */
// 用户详情接口移动到用户列表接口之后，避免路由冲突

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
      .limit(Number(limit))
      .select('title slug author publishDate likes views excerpt image tags');
    
    res.json(createResponse(articles, '搜索文章成功'));
  } catch (error) {
    console.error('搜索文章失败:', error);
    res.status(500).json(createErrorResponse('搜索文章失败', 500));
  }
});

/**
 * 获取文章列表
 */
app.get('/api/articles', async (req: Request, res: Response) => {
  try {
    const { tag, category, limit, offset, page, size, searchVal, year, admin } = req.query;
    
    console.log('📋 获取文章列表请求:', { tag, category, limit, offset, page, size, searchVal, year, admin });
    
    // 构建查询条件
    const query: any = {};
    if (tag) query.tags = { $in: [tag] };
    if (category) query.category = category;
    
    // 可见性筛选：只有管理员请求才能看到隐藏文章
    if (!admin || admin !== 'true') {
      query.visible = { $ne: false }; // 前端只显示可见文章（包括 undefined 和 true）
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
      console.log('年份筛选(p_date):', year, '筛选条件:', { p_date: yearNum });
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
    
    console.log('文章列表查询成功:', { query, total, articlesCount: articles.length });
    
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

// 删除这个路由定义，将在更合适的位置重新定义

/**
 * 说说图片上传
 */
app.post('/api/talks/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json(createErrorResponse('没有上传文件', 400));
    }

    // 构建文件URL（这里使用相对路径）
    const fileUrl = `/uploads/${req.file.filename}`;
    
    console.log('说说图片上传成功:', {
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
    console.error('说说图片上传失败:', error);
    res.status(500).json(createErrorResponse('上传失败', 500));
  }
});

// 删除这个错误的路由定义，它实际上是处理文章数据的，不应该使用 /api/talks 路径



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
      console.log('文章未找到');
      return res.status(404).json(createErrorResponse('文章未找到', 404));
    }
    
    console.log(`后台管理获取文章成功，浏览量保持不变: ${article.views}`);
    console.log('====== 后台管理文章详情请求结束 ======\n');
    
    res.json(createResponse(article, '获取文章详情成功'));
  } catch (error) {
    console.error('后台管理获取文章详情失败:', error);
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
      console.log('文章未找到');
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
    
    // 详细的调试日志，特别关注isTop字段
    console.log('🔄 更新文章请求:', {
      id,
      requestBody: req.body,
      isTopInRequest: req.body.isTop,
      isTopType: typeof req.body.isTop,
      updateData: {
        title: updateData.title,
        isTop: updateData.isTop,
        updateDate: updateData.updateDate,
        p_date: updateData.p_date
      }
    });
    
    // 查询更新前的文章状态
    const beforeUpdate = await Article.findById(id);
    console.log('📋 更新前文章状态:', {
      id: beforeUpdate?._id,
      title: beforeUpdate?.title,
      isTop: beforeUpdate?.isTop,
      isTopType: typeof beforeUpdate?.isTop
    });
    
    const article = await Article.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });
    
    if (!article) {
      return res.status(404).json(createErrorResponse('文章未找到', 404));
    }
    
    console.log('✅ 文章更新成功:', {
      id: article._id,
      title: article.title,
      isTop: article.isTop,
      isTopType: typeof article.isTop,
      p_date: article.p_date
    });
    
    res.json(createResponse(article, '文章更新成功'));
  } catch (error) {
    console.error('❌ 更新文章失败:', error);
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
    const rawIP = req.ip || (req.connection as any)?.remoteAddress || 'unknown';
    const clientIP = normalizeIP(rawIP);
    const authorization = req.get('Authorization') || '';

    // 获取用户标识符（优先使用token中的用户信息，开发环境下避免IP冲突）
    let userIdentifier = clientIP;
    if (authorization && authorization.startsWith('mock-jwt-token-')) {
      // 从token中提取用户标识符
      const tokenParts = authorization.split('-');
      if (tokenParts.length >= 5) {
        const username = decodeURIComponent(tokenParts[3]);
        userIdentifier = `user_${username}`;
      }
    }

    // 检查是否已点赞，避免重复计数
    const existingLike = await Like.findOne({
      targetId: id,
      targetType: 'article',
      ip: userIdentifier
    });
    if (existingLike) {
      return res.status(400).json(createErrorResponse('您已经点过赞', 400));
    }

    // 记录点赞
    await Like.create({
      targetId: id,
      targetType: 'article',
      ip: userIdentifier,
      userAgent: req.headers['user-agent'] || ''
    });

    // 增加文章点赞数
    const article = await Article.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!article) {
      // 回滚点赞记录
      await Like.deleteOne({ targetId: id, targetType: 'article', ip: userIdentifier });
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
    const rawIP = req.ip || (req.connection as any)?.remoteAddress || 'unknown';
    const clientIP = normalizeIP(rawIP);
    const authorization = req.get('Authorization') || '';

    // 获取用户标识符（优先使用token中的用户信息，开发环境下避免IP冲突）
    let userIdentifier = clientIP;
    if (authorization && authorization.startsWith('mock-jwt-token-')) {
      // 从token中提取用户标识符
      const tokenParts = authorization.split('-');
      if (tokenParts.length >= 5) {
        const username = decodeURIComponent(tokenParts[3]);
        userIdentifier = `user_${username}`;
      }
    }

    // 检查是否有点赞记录
    const likeRecord = await Like.findOne({
      targetId: id,
      targetType: 'article',
      ip: userIdentifier
    });
    if (!likeRecord) {
      return res.status(400).json(createErrorResponse('您还没有点赞', 400));
    }

    // 删除点赞记录
    await Like.deleteOne({ _id: likeRecord._id });

    // 减少文章点赞数
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
 * 获取文章点赞状态（是否已点赞）
 */
app.get('/api/articles/:id/like-status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rawIP = req.ip || (req.connection as any)?.remoteAddress || 'unknown';
    const clientIP = normalizeIP(rawIP);
    const authorization = req.get('Authorization') || '';

    // 获取用户标识符（优先使用token中的用户信息，开发环境下避免IP冲突）
    let userIdentifier = clientIP;
    if (authorization && authorization.startsWith('mock-jwt-token-')) {
      // 从token中提取用户标识符
      const tokenParts = authorization.split('-');
      if (tokenParts.length >= 5) {
        const username = decodeURIComponent(tokenParts[3]);
        userIdentifier = `user_${username}`;
      }
    }

    const existingLike = await Like.findOne({
      targetId: id,
      targetType: 'article',
      ip: userIdentifier
    });

    res.json(createResponse({ isLiked: !!existingLike }, '获取点赞状态成功'));
  } catch (error) {
    console.error('获取文章点赞状态失败:', error);
    res.status(500).json(createErrorResponse('获取文章点赞状态失败', 500));
  }
});

/**
 * 批量获取文章点赞状态
 */
app.post('/api/articles/batch-like-status', async (req: Request, res: Response) => {
  try {
    const { articleIds } = (req.body || {}) as { articleIds: string[] };
    const rawIP = req.ip || (req.connection as any)?.remoteAddress || 'unknown';
    const clientIP = normalizeIP(rawIP);
    const authorization = req.get('Authorization') || '';

    // 统一用户标识（与点赞/取消接口一致）：优先 token 用户，其次 IP
    let userIdentifier = clientIP;
    if (authorization && authorization.startsWith('mock-jwt-token-')) {
      const tokenParts = authorization.split('-');
      if (tokenParts.length >= 5) {
        const username = decodeURIComponent(tokenParts.slice(3, -1).join('-'));
        userIdentifier = `user_${username}`;
      }
    }

    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return res.json(createResponse({}, '无文章ID'));
    }

    const likes = await Like.find({
      targetType: 'article',
      ip: userIdentifier,
      targetId: { $in: articleIds }
    }).select('targetId').lean();

    const likedSet = new Set<string>(likes.map((l: any) => String(l.targetId)));
    const result = articleIds.reduce((acc: Record<string, boolean>, aid: string) => {
      acc[aid] = likedSet.has(aid);
      return acc;
    }, {});

    res.json(createResponse(result, '获取批量点赞状态成功'));
  } catch (error) {
    console.error('批量获取文章点赞状态失败:', error);
    res.status(500).json(createErrorResponse('批量获取文章点赞状态失败', 500));
  }
});

/**
 * 获取文章点赞数
 */
app.get('/api/articles/:id/likes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await Article.findById(id).select('likes');
    if (!article) {
      return res.status(404).json(createErrorResponse('文章未找到', 404));
    }
    res.json(createResponse({ likes: article.likes }, '获取点赞数成功'));
  } catch (error) {
    console.error('获取文章点赞数失败:', error);
    res.status(500).json(createErrorResponse('获取文章点赞数失败', 500));
  }
});

/**
 * 获取当前用户（通过IP）已点赞的文章列表
 */
app.get('/api/user/liked-articles', async (req: Request, res: Response) => {
  try {
    const rawIP = req.ip || (req.connection as any)?.remoteAddress || 'unknown';
    const clientIP = normalizeIP(rawIP);

    const likeRecords = await Like.find({
      targetType: 'article',
      ip: clientIP
    }).select('targetId').lean();

    const ids = likeRecords.map((l: any) => l.targetId);
    if (!ids.length) {
      return res.json(createResponse([], '获取已点赞文章成功'));
    }

    const articles = await Article.find({ _id: { $in: ids } }).lean();
    res.json(createResponse(articles, '获取已点赞文章成功'));
  } catch (error) {
    console.error('获取已点赞文章列表失败:', error);
    res.status(500).json(createErrorResponse('获取已点赞文章列表失败', 500));
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

    res.json(createResponse(category, '获取分类详情成功'));
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
    const updateData = req.body || {};

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json(createErrorResponse('分类未找到', 404));
    }

    const updatableFields: Array<'name' | 'slug' | 'description' | 'color' | 'sort' | 'status'> = [
      'name', 'slug', 'description', 'color', 'sort', 'status'
    ];

    for (const key of updatableFields) {
      if (Object.prototype.hasOwnProperty.call(updateData, key)) {
        (category as any)[key] = (updateData as any)[key];
      }
    }

    (category as any).updateTime = new Date();

    const saved = await category.save();
    res.json(createResponse(saved, '分类更新成功'));
  } catch (error) {
    console.error('更新分类失败:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      res.status(400).json(createErrorResponse('分类名称或URL别名已存在', 400));
    } else {
      res.status(500).json(createErrorResponse('更新分类失败', 500));
    }
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
      return res.status(400).json(createErrorResponse('请提供正确的状态', 400));
    }
    
    const result = await Category.updateMany(
      { _id: { $in: ids } },
      { $set: { status, updateTime: new Date() } }
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

/**
 * 获取图片分类列表
 */
app.get('/api/photo-categories', async (req: Request, res: Response) => {
  try {
    const { current = 1, size = 10, keyword, isVisible } = req.query;
    
    // 构建查询条件
    const query: any = {};
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (isVisible !== undefined) {
      query.isVisible = isVisible === 'true';
    }
    
    const pageNum = Number(current);
    const pageSize = Number(size);
    const skip = (pageNum - 1) * pageSize;
    
    const categories = await PhotoCategory.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize);
    
    const total = await PhotoCategory.countDocuments(query);
    
    res.json(createResponse({
      categories,
      total,
      currentPage: pageNum,
      pageSize
    }, '获取图片分类列表成功'));
  } catch (error) {
    console.error('获取图片分类列表失败:', error);
    res.status(500).json(createErrorResponse('获取图片分类列表失败', 500));
  }
});

/**
 * 获取图片分类详情
 */
app.get('/api/photo-categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 尝试使用id字段查询，如果没找到则使用_id字段查询
    let category = await PhotoCategory.findOne({ id });
    
    // 如果使用id字段没找到，尝试使用_id字段
    if (!category) {
      category = await PhotoCategory.findOne({ _id: id });
    }
    
    if (!category) {
      return res.status(404).json(createErrorResponse('图片分类未找到', 404));
    }
    
    res.json(createResponse(category, '获取图片分类详情成功'));
  } catch (error) {
    console.error('获取图片分类详情失败:', error);
    res.status(500).json(createErrorResponse('获取图片分类详情失败', 500));
  }
});

/**
 * 创建图片分类
 */
app.post('/api/photo-categories', async (req: Request, res: Response) => {
  try {
    const categoryData = req.body;
    
    // 如果没有提供id，生成一个唯一ID
    if (!categoryData.id) {
      categoryData.id = 'pc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    const category = new PhotoCategory(categoryData);
    const savedCategory = await category.save();
    
    res.status(201).json(createResponse(savedCategory, '图片分类创建成功', 201));
  } catch (error) {
    console.error('创建图片分类失败:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      res.status(400).json(createErrorResponse('图片分类ID已存在', 400));
    } else {
      res.status(500).json(createErrorResponse('创建图片分类失败', 500));
    }
  }
});

/**
 * 更新图片分类
 */
app.put('/api/photo-categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};

    // 依次尝试：id(字符串) -> id(数字) -> _id(ObjectId) 查找
    const candidates: any[] = [{ id }];
    if (/^\d+$/.test(id)) {
      candidates.push({ id: Number(id) });
    }
    if ((mongoose as any).Types?.ObjectId?.isValid?.(id)) {
      candidates.push({ _id: id });
    }

    let category: any = null;
    for (const filter of candidates) {
      category = await PhotoCategory.findOne(filter);
      if (category) break;
    }

    if (!category) {
      return res.status(404).json(createErrorResponse('图片分类未找到', 404));
    }

    // 仅白名单字段可被更新，避免无效字段触发校验类型错误
    const updatableFields: Array<keyof typeof category> = [
      'name',
      'title',
      'description',
      'coverImage',
      'sortOrder',
      'isVisible',
      'photoCount'
    ];

    for (const key of updatableFields) {
      if (Object.prototype.hasOwnProperty.call(updateData, key)) {
        (category as any)[key] = (updateData as any)[key];
      }
    }

    category.updatedAt = new Date();

    const saved = await category.save();
    res.json(createResponse(saved, '图片分类更新成功'));
  } catch (error) {
    console.error('更新图片分类失败:', error);
    res.status(500).json(createErrorResponse('更新图片分类失败', 500));
  }
});

/**
 * 删除图片分类
 */
app.delete('/api/photo-categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 尝试使用id字段删除，如果没找到则使用_id字段删除
    let category = await PhotoCategory.findOneAndDelete({ id });
    
    // 如果使用id字段没找到，尝试使用_id字段
    if (!category) {
      category = await PhotoCategory.findOneAndDelete({ _id: id });
    }
    
    if (!category) {
      return res.status(404).json(createErrorResponse('图片分类未找到', 404));
    }
    
    // 同时删除该分类下的所有照片（使用原始id参数）
    await Photo.deleteMany({ categoryId: id });
    
    res.json(createResponse(null, '图片分类删除成功'));
  } catch (error) {
    console.error('删除图片分类失败:', error);
    res.status(500).json(createErrorResponse('删除图片分类失败', 500));
  }
});

/**
 * 获取照片列表
 */
app.get('/api/photos', async (req: Request, res: Response) => {
  try {
    const { current = 1, size = 20, categoryId, keyword, tag, isVisible } = req.query;
    
    // 构建查询条件
    const query: any = {};
    if (categoryId) {
      query.categoryId = categoryId;
    }
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (tag) {
      query.tags = { $in: [tag] };
    }
    if (isVisible !== undefined) {
      query.isVisible = isVisible === 'true';
    }
    
    const pageNum = Number(current);
    const pageSize = Number(size);
    const skip = (pageNum - 1) * pageSize;
    
    const photos = await Photo.find(query)
      .sort({ sortOrder: 1, uploadDate: -1 })
      .skip(skip)
      .limit(pageSize);
    
    const total = await Photo.countDocuments(query);
    
    res.json(createResponse({
      photos,
      total,
      currentPage: pageNum,
      pageSize
    }, '获取照片列表成功'));
  } catch (error) {
    console.error('获取照片列表失败:', error);
    res.status(500).json(createErrorResponse('获取照片列表失败', 500));
  }
});

/**
 * 获取照片详情
 */
app.get('/api/photos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json(createErrorResponse('照片未找到', 404));
    }
    
    // 增加浏览次数
    photo.viewCount += 1;
    await photo.save();
    
    res.json(createResponse(photo, '获取照片详情成功'));
  } catch (error) {
    console.error('获取照片详情失败:', error);
    res.status(500).json(createErrorResponse('获取照片详情失败', 500));
  }
});

/**
 * 创建照片
 */
app.post('/api/photos', async (req: Request, res: Response) => {
  try {
    const photoData = req.body;
    
    const photo = new Photo(photoData);
    const savedPhoto = await photo.save();
    
    // 更新分类的照片数量
    if (photoData.categoryId) {
      const category = await PhotoCategory.findOne({ id: photoData.categoryId });
      if (category) {
        category.photoCount = await Photo.countDocuments({ categoryId: photoData.categoryId });
        category.updatedAt = new Date();
        await category.save();
      }
    }
    
    res.status(201).json(createResponse(savedPhoto, '照片创建成功', 201));
  } catch (error) {
    console.error('创建照片失败:', error);
    res.status(500).json(createErrorResponse('创建照片失败', 500));
  }
});

/**
 * 更新照片
 */
app.put('/api/photos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const photo = await Photo.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    
    if (!photo) {
      return res.status(404).json(createErrorResponse('照片未找到', 404));
    }
    
    res.json(createResponse(photo, '照片更新成功'));
  } catch (error) {
    console.error('更新照片失败:', error);
    res.status(500).json(createErrorResponse('更新照片失败', 500));
  }
});

/**
 * 删除照片
 */
app.delete('/api/photos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const photo = await Photo.findByIdAndDelete(id);
    if (!photo) {
      return res.status(404).json(createErrorResponse('照片未找到', 404));
    }
    
    // 更新分类的照片数量
    if (photo.categoryId) {
      const category = await PhotoCategory.findOne({ id: photo.categoryId });
      if (category) {
        category.photoCount = await Photo.countDocuments({ categoryId: photo.categoryId });
        category.updatedAt = new Date();
        await category.save();
      }
    }
    
    res.json(createResponse(null, '照片删除成功'));
  } catch (error) {
    console.error('删除照片失败:', error);
    res.status(500).json(createErrorResponse('删除照片失败', 500));
  }
});

/**
 * 照片点赞
 */
app.post('/api/photos/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const photo = await Photo.findByIdAndUpdate(
      id,
      { $inc: { likeCount: 1 } },
      { new: true }
    );
    
    if (!photo) {
      return res.status(404).json(createErrorResponse('照片未找到', 404));
    }
    
    res.json(createResponse({ likeCount: photo.likeCount }, '点赞成功'));
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json(createErrorResponse('点赞失败', 500));
  }
});

// 认证相关接口
// 测试接口
app.post('/api/test', async (req: Request, res: Response) => {
  console.log('测试接口被调用');
  res.json({ message: '测试成功', body: req.body });
});

// ==================== 说说相关API ====================

// 获取说说列表
app.get('/api/talks', async (req: Request, res: Response) => {
  try {
    const { 
      current = 1, 
      size = 10, 
      status = 'all',
      isTop,
      isHidden,
      keyword
    } = req.query;

    const page = parseInt(current as string);
    const limit = parseInt(size as string);
    const skip = (page - 1) * limit;

    // 构建查询条件
    let query: any = {};
    
    // 状态筛选
    if (status === 'public') {
      query.status = 'public';
      query.isHidden = false;
    } else if (status === 'private') {
      query.status = 'private';
    } else if (status === 'deleted') {
      query.status = 'deleted';
    } else if (status !== 'all') {
      query.status = status;
    }

    // 置顶筛选
    if (isTop !== undefined) {
      query.isTop = isTop === 'true';
    }

    // 隐藏筛选
    if (isHidden !== undefined) {
      query.isHidden = isHidden === 'true';
    }

    // 关键词搜索
    if (keyword) {
      query.content = { $regex: keyword, $options: 'i' };
    }

    // 排序：置顶优先，然后按发布时间倒序
    const sortOptions: any = { isTop: -1, publishDate: -1 };

    const talks = await Talk.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Talk.countDocuments(query);

    res.json(createResponse({
      records: talks,
      total,
      current: page,
      size: limit
    }, '获取说说列表成功'));
  } catch (error: any) {
    console.error('获取说说列表失败:', error);
    res.status(500).json(createErrorResponse('获取说说列表失败', 500));
  }
});

// 获取单个说说详情
app.get('/api/talks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const talk = await Talk.findById(id);
    
    if (!talk) {
      return res.status(404).json(createErrorResponse('说说不存在', 404));
    }

    // 增加浏览量
    await Talk.findByIdAndUpdate(id, { $inc: { views: 1 } });
    talk.views += 1;

    res.json(createResponse(talk, '获取说说详情成功'));
  } catch (error: any) {
    console.error('获取说说详情失败:', error);
    res.status(500).json(createErrorResponse('获取说说详情失败', 500));
  }
});

// 创建说说
app.post('/api/talks', async (req: Request, res: Response) => {
  try {
    const talkData = {
      ...req.body,
      publishDate: new Date(),
      updateDate: new Date()
    };

    const talk = new Talk(talkData);
    await talk.save();

    res.json(createResponse(talk, '发布说说成功'));
  } catch (error: any) {
    console.error('发布说说失败:', error);
    res.status(500).json(createErrorResponse('发布说说失败', 500));
  }
});

// 更新说说
app.put('/api/talks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updateDate: new Date()
    };

    const talk = await Talk.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!talk) {
      return res.status(404).json(createErrorResponse('说说不存在', 404));
    }

    res.json(createResponse(talk, '更新说说成功'));
  } catch (error: any) {
    console.error('更新说说失败:', error);
    res.status(500).json(createErrorResponse('更新说说失败', 500));
  }
});

// 删除说说（软删除）
app.delete('/api/talks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    if (permanent === 'true') {
      // 永久删除
      const talk = await Talk.findByIdAndDelete(id);
      if (!talk) {
        return res.status(404).json(createErrorResponse('说说不存在', 404));
      }
      res.json(createResponse(null, '永久删除说说成功'));
    } else {
      // 软删除
      const talk = await Talk.findByIdAndUpdate(id, {
        status: 'deleted',
        deleteDate: new Date(),
        updateDate: new Date()
      }, { new: true });
      
      if (!talk) {
        return res.status(404).json(createErrorResponse('说说不存在', 404));
      }
      res.json(createResponse(talk, '删除说说成功'));
    }
  } catch (error: any) {
    console.error('删除说说失败:', error);
    res.status(500).json(createErrorResponse('删除说说失败', 500));
  }
});

// 恢复说说
app.put('/api/talks/:id/restore', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const talk = await Talk.findByIdAndUpdate(id, {
      status: 'public',
      deleteDate: undefined,
      updateDate: new Date()
    }, { new: true });
    
    if (!talk) {
      return res.status(404).json(createErrorResponse('说说不存在', 404));
    }

    res.json(createResponse(talk, '恢复说说成功'));
  } catch (error: any) {
    console.error('恢复说说失败:', error);
    res.status(500).json(createErrorResponse('恢复说说失败', 500));
  }
});

// 置顶/取消置顶说说
app.put('/api/talks/:id/top', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isTop } = req.body;
    
    const talk = await Talk.findByIdAndUpdate(id, {
      isTop: isTop,
      updateDate: new Date()
    }, { new: true });
    
    if (!talk) {
      return res.status(404).json(createErrorResponse('说说不存在', 404));
    }

    res.json(createResponse(talk, isTop ? '置顶说说成功' : '取消置顶成功'));
  } catch (error: any) {
    console.error('置顶操作失败:', error);
    res.status(500).json(createErrorResponse('置顶操作失败', 500));
  }
});

// 隐藏/显示说说
app.put('/api/talks/:id/hide', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isHidden } = req.body;
    
    const talk = await Talk.findByIdAndUpdate(id, {
      isHidden: isHidden,
      updateDate: new Date()
    }, { new: true });
    
    if (!talk) {
      return res.status(404).json(createErrorResponse('说说不存在', 404));
    }

    res.json(createResponse(talk, isHidden ? '隐藏说说成功' : '显示说说成功'));
  } catch (error: any) {
    console.error('隐藏操作失败:', error);
    res.status(500).json(createErrorResponse('隐藏操作失败', 500));
  }
});

// 批量操作说说
app.post('/api/talks/batch', async (req: Request, res: Response) => {
  try {
    const { ids, action, data } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(createErrorResponse('请选择要操作的说说', 400));
    }

    let updateData: any = { updateDate: new Date() };
    let message = '';

    switch (action) {
      case 'delete':
        updateData.status = 'deleted';
        updateData.deleteDate = new Date();
        message = '批量删除成功';
        break;
      case 'restore':
        updateData.status = 'public';
        updateData.deleteDate = undefined;
        message = '批量恢复成功';
        break;
      case 'top':
        updateData.isTop = data?.isTop || true;
        message = data?.isTop ? '批量置顶成功' : '批量取消置顶成功';
        break;
      case 'hide':
        updateData.isHidden = data?.isHidden || true;
        message = data?.isHidden ? '批量隐藏成功' : '批量显示成功';
        break;
      case 'changeStatus':
        updateData.status = data?.status || 'public';
        message = '批量修改状态成功';
        break;
      default:
        return res.status(400).json(createErrorResponse('不支持的操作类型', 400));
    }

    const result = await Talk.updateMany(
      { _id: { $in: ids } },
      updateData
    );

    res.json(createResponse({
      modifiedCount: result.modifiedCount
    }, message));
  } catch (error: any) {
    console.error('批量操作失败:', error);
    res.status(500).json(createErrorResponse('批量操作失败', 500));
  }
});

// ==================== 点赞相关API ====================

// IP地址标准化函数
function normalizeIP(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown';
  
  // 将IPv6的localhost (::1) 和 IPv4映射的IPv6地址 (::ffff:127.0.0.1) 都转换为 127.0.0.1
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  
  // 如果是IPv4映射的IPv6地址，提取IPv4部分
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  
  return ip;
}

// 点赞说说
app.post('/api/talks/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rawIP = req.ip || req.connection.remoteAddress || 'unknown';
    const clientIP = normalizeIP(rawIP);
    const userAgent = req.get('User-Agent') || '';
    const authorization = req.get('Authorization') || '';

    console.log('=== 点赞请求 ===');
    console.log('说说ID:', id);
    console.log('原始IP:', rawIP);
    console.log('标准化IP:', clientIP);
    console.log('Authorization:', authorization);
    console.log('req.ip:', req.ip);
    console.log('req.connection.remoteAddress:', req.connection?.remoteAddress);

    // 获取用户标识符（优先使用token中的用户信息，开发环境下避免IP冲突）
    let userIdentifier = clientIP;
    if (authorization && authorization.startsWith('mock-jwt-token-')) {
      // 从token中提取用户标识符
      const tokenParts = authorization.split('-');
      if (tokenParts.length >= 5) {
        const username = decodeURIComponent(tokenParts[3]);
        userIdentifier = `user_${username}`;
        console.log('使用用户标识符:', userIdentifier);
      }
    }

    // 检查是否已经点赞过（使用用户标识符而不是IP）
    const existingLike = await Like.findOne({
      targetId: id,
      targetType: 'talk',
      ip: userIdentifier
    });

    console.log('查找到的现有点赞记录:', existingLike);

    if (existingLike) {
      console.log('已经点赞过，返回400错误');
      return res.status(400).json(createErrorResponse('您已经点赞过', 400));
    }

    // 创建点赞记录
    const newLike = await Like.create({
      targetId: id,
      targetType: 'talk',
      ip: userIdentifier,
      userAgent
    });

    console.log('创建的新点赞记录:', newLike);

    // 增加说说的点赞数
    const talk = await Talk.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!talk) {
      return res.status(404).json(createErrorResponse('说说不存在', 404));
    }

    console.log('点赞成功，当前点赞数:', talk.likes);
    res.json(createResponse({
      likes: talk.likes
    }, '点赞成功'));
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json(createErrorResponse('点赞失败', 500));
  }
});

// 取消点赞说说
app.delete('/api/talks/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rawIP = req.ip || req.connection.remoteAddress || 'unknown';
    const clientIP = normalizeIP(rawIP);
    const authorization = req.get('Authorization') || '';
    
    console.log('=== 取消点赞请求 ===');
    console.log('说说ID:', id);
    console.log('原始IP:', rawIP);
    console.log('标准化IP:', clientIP);
    console.log('Authorization:', authorization);
    console.log('req.ip:', req.ip);
    console.log('req.connection.remoteAddress:', req.connection?.remoteAddress);

    // 获取用户标识符（优先使用token中的用户信息，开发环境下避免IP冲突）
    let userIdentifier = clientIP;
    if (authorization && authorization.startsWith('mock-jwt-token-')) {
      // 从token中提取用户标识符
      const tokenParts = authorization.split('-');
      if (tokenParts.length >= 5) {
        const username = decodeURIComponent(tokenParts[3]);
        userIdentifier = `user_${username}`;
        console.log('使用用户标识符:', userIdentifier);
      }
    }

    // 查找并删除点赞记录
    const likeRecord = await Like.findOneAndDelete({
      targetId: id,
      targetType: 'talk',
      ip: userIdentifier
    });

    console.log('查找到的点赞记录:', likeRecord);

    if (!likeRecord) {
      console.log('未找到点赞记录，返回400错误');
      return res.status(400).json(createErrorResponse('您还没有点赞', 400));
    }

    // 减少说说的点赞数
    const talk = await Talk.findByIdAndUpdate(
      id,
      { $inc: { likes: -1 } },
      { new: true }
    );

    if (!talk) {
      return res.status(404).json(createErrorResponse('说说不存在', 404));
    }

    console.log('取消点赞成功，当前点赞数:', talk.likes);
    res.json(createResponse({
      likes: Math.max(0, talk.likes) // 确保点赞数不为负
    }, '取消点赞成功'));
  } catch (error) {
    console.error('取消点赞失败:', error);
    res.status(500).json(createErrorResponse('取消点赞失败', 500));
  }
});

// 检查是否已点赞
app.get('/api/talks/:id/like/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // 与点赞/取消点赞保持一致，统一标准化IP，避免 ::1 与 127.0.0.1 不一致导致状态错误
    const rawIP = req.ip || req.connection.remoteAddress || 'unknown';
    const clientIP = normalizeIP(rawIP);
    const authorization = req.get('Authorization') || '';

    // 获取用户标识符（优先使用token中的用户信息，开发环境下避免IP冲突）
    let userIdentifier = clientIP;
    if (authorization && authorization.startsWith('mock-jwt-token-')) {
      // 从token中提取用户标识符
      const tokenParts = authorization.split('-');
      if (tokenParts.length >= 5) {
        const username = decodeURIComponent(tokenParts[3]);
        userIdentifier = `user_${username}`;
      }
    }

    const existingLike = await Like.findOne({
      targetId: id,
      targetType: 'talk',
      ip: userIdentifier
    });

    res.json(createResponse({
      isLiked: !!existingLike
    }));
  } catch (error) {
    console.error('检查点赞状态失败:', error);
    res.status(500).json(createErrorResponse('检查点赞状态失败', 500));
  }
});

// ==================== 回复相关API ====================

// 获取说说的回复列表
app.get('/api/talks/:id/replies', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { current = 1, size = 10 } = req.query;

    const currentPage = parseInt(current as string);
    const pageSize = parseInt(size as string);
    const skip = (currentPage - 1) * pageSize;

    // 获取回复列表（只获取顶级回复，子回复通过 populate 获取）
    const replies = await Reply.find({
      talkId: id,
      parentId: null, // 只获取顶级回复
      isDeleted: false,
      status: 'approved'
    })
    .populate({
      path: 'parentId',
      select: 'author content'
    })
    .sort({ publishDate: -1 })
    .skip(skip)
    .limit(pageSize);

    // 获取每个顶级回复的子回复
    const repliesWithChildren = await Promise.all(
      replies.map(async (reply) => {
        const children = await Reply.find({
          parentId: reply._id,
          isDeleted: false,
          status: 'approved'
        })
        .sort({ publishDate: 1 })
        .limit(10); // 限制子回复数量

        return {
          ...reply.toObject(),
          children
        };
      })
    );

    // 获取总数
    const total = await Reply.countDocuments({
      talkId: id,
      parentId: null,
      isDeleted: false,
      status: 'approved'
    });

    res.json(createResponse({
      records: repliesWithChildren,
      total,
      current: currentPage,
      size: pageSize
    }));
  } catch (error) {
    console.error('获取回复列表失败:', error);
    res.status(500).json(createErrorResponse('获取回复列表失败', 500));
  }
});

// 添加回复
app.post('/api/talks/:id/replies', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, author, email, website, parentId, replyTo } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    if (!content || !author) {
      return res.status(400).json(createErrorResponse('回复内容和昵称不能为空', 400));
    }

    // 检查说说是否存在
    const talk = await Talk.findById(id);
    if (!talk) {
      return res.status(404).json(createErrorResponse('说说不存在', 404));
    }

    // 如果是回复某个回复，检查父回复是否存在
    if (parentId) {
      const parentReply = await Reply.findById(parentId);
      if (!parentReply) {
        return res.status(404).json(createErrorResponse('被回复的内容不存在', 404));
      }
    }

    // 创建回复
    const reply = await Reply.create({
      talkId: id,
      content,
      author,
      email,
      website,
      parentId: parentId || null,
      replyTo,
      ip: clientIP
    });

    res.json(createResponse(reply, '回复成功'));
  } catch (error) {
    console.error('添加回复失败:', error);
    res.status(500).json(createErrorResponse('添加回复失败', 500));
  }
});

// 点赞回复
app.post('/api/replies/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || '';

    // 检查是否已经点赞过
    const existingLike = await Like.findOne({
      targetId: id,
      targetType: 'reply',
      ip: clientIP
    });

    if (existingLike) {
      return res.status(400).json(createErrorResponse('您已经点赞过', 400));
    }

    // 创建点赞记录
    await Like.create({
      targetId: id,
      targetType: 'reply',
      ip: clientIP,
      userAgent
    });

    // 增加回复的点赞数
    const reply = await Reply.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!reply) {
      return res.status(404).json(createErrorResponse('回复不存在', 404));
    }

    res.json(createResponse({
      likes: reply.likes
    }, '点赞成功'));
  } catch (error) {
    console.error('点赞回复失败:', error);
    res.status(500).json(createErrorResponse('点赞回复失败', 500));
  }
});

// 取消点赞回复
app.delete('/api/replies/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // 查找并删除点赞记录
    const likeRecord = await Like.findOneAndDelete({
      targetId: id,
      targetType: 'reply',
      ip: clientIP
    });

    if (!likeRecord) {
      return res.status(400).json(createErrorResponse('您还没有点赞', 400));
    }

    // 减少回复的点赞数
    const reply = await Reply.findByIdAndUpdate(
      id,
      { $inc: { likes: -1 } },
      { new: true }
    );

    if (!reply) {
      return res.status(404).json(createErrorResponse('回复不存在', 404));
    }

    res.json(createResponse({
      likes: Math.max(0, reply.likes)
    }, '取消点赞成功'));
  } catch (error) {
    console.error('取消点赞回复失败:', error);
    res.status(500).json(createErrorResponse('取消点赞回复失败', 500));
  }
});

// ==================== 其他API ====================

// 登录接口
app.post('/api/auth/login', async (req: Request, res: Response) => {
  console.log('=== 登录接口被调用 ===');
  console.log('请求体:', JSON.stringify(req.body, null, 2));
  console.log('请求头:', JSON.stringify(req.headers, null, 2));
  try {
    const { username, userName, password } = req.body;
    
    // 支持前端发送的username字段或后台管理系统的userName字段
    const loginUsername = username || userName;
    console.log('解析的登录用户名:', loginUsername);
    console.log('解析的密码:', password);
    
    if (!loginUsername || !password) {
      console.log('用户名或密码为空，返回400错误');
      return res.status(400).json(createErrorResponse('用户名和密码不能为空', 400));
    }
    
    // 从数据库验证用户
    console.log('开始查找用户:', loginUsername);
    const user = await User.findOne({ username: loginUsername });
    console.log('数据库查询结果:', user ? { 
      username: user.username, 
      enabled: user.enabled, 
      hasPassword: !!user.password,
      passwordHash: user.password 
    } : '用户不存在');
    
    if (!user) {
      console.log('用户不存在，返回401错误');
      return res.status(401).json(createErrorResponse('用户名或密码错误', 401));
    }
    
    // 验证密码（临时使用明文密码比较进行调试）
    console.log('开始验证密码');
    console.log('输入密码:', password);
    console.log('数据库密码哈希:', user.password);
    
    // 临时调试：检查是否是明文密码
    let isPasswordValid = false;
    if (user.password === password) {
      console.log('明文密码匹配成功');
      isPasswordValid = true;
    } else {
      // 尝试bcrypt比较
      try {
        isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('bcrypt.compare结果:', isPasswordValid);
      } catch (error) {
        console.log('bcrypt比较出错:', error);
        // 如果bcrypt出错，尝试直接比较（可能是明文密码）
        isPasswordValid = user.password === password;
      }
    }
    
    if (!isPasswordValid) {
      console.log('密码验证失败，返回401错误');
      return res.status(401).json(createErrorResponse('用户名或密码错误', 401));
    }
    
    // 检查用户是否被禁用
    if (!user.enabled) {
      return res.status(401).json(createErrorResponse('账户已被禁用', 401));
    }
    
    // 更新最后登录时间和IP
    user.lastLoginTime = new Date();
    user.lastLoginIp = req.ip || '';
    await user.save();
    
    const token = 'mock-jwt-token-' + user.username + '-' + Date.now();
    const refreshToken = 'mock-refresh-token-' + user.username + '-' + Date.now();
    
    // 返回登录成功响应，包含用户信息
    res.json(createResponse({
      token,
      refreshToken,
      userInfo: {
        id: user.userId.toString(),
        username: user.username,
        email: user.email || '',
        avatar: user.avatar || '',
        nickname: user.nickname || user.username,
        createTime: user.createTime
      }
    }, '登录成功'));
    
  } catch (error: any) {
    console.error('登录失败:', error);
    res.status(500).json(createErrorResponse('登录失败', 500));
  }
});

// 获取用户信息接口
// 用户信息接口 - 支持多个路径
app.get(['/api/auth/user-info', '/api/user/info'], async (req: Request, res: Response) => {
  try {
    const authorization = req.headers.authorization;

    // 兼容旧路径：/api/user/info 返回固定的管理员信息
    if (req.path === '/api/user/info') {
      const userInfo = {
        userId: 1,
        userName: 'admin',
        nickname: '管理员',
        email: 'admin@example.com',
        avatar: '',
        roles: ['R_SUPER', 'R_ADMIN'],
        permissions: ['*'],
        buttons: ['add', 'edit', 'delete']
      };
      return res.json(createResponse(userInfo, '获取用户信息成功'));
    }

    // 新路径：/api/auth/user-info 根据 token 返回当前登录用户信息
    if (!authorization || !authorization.startsWith('mock-jwt-token-')) {
      return res.status(401).json(createErrorResponse('未授权访问', 401));
    }

    // 解析用户名（兼容含连字符的用户名）：
    // 新格式：mock-jwt-token-{username}-{timestamp}
    const tokenParts = authorization.split('-');
    const isNewFormat = (
      tokenParts.length >= 5 &&
      tokenParts[0] === 'mock' &&
      tokenParts[1] === 'jwt' &&
      tokenParts[2] === 'token' &&
      /^\d+$/.test(tokenParts[tokenParts.length - 1])
    );
    if (!isNewFormat) {
      return res.status(401).json(createErrorResponse('未授权访问，请重新登录', 401));
    }
    const usernameFromToken = tokenParts.slice(3, -1).join('-');

    const user = await User.findOne({ username: usernameFromToken }).select('-password');

    if (!user) {
      return res.status(404).json(createErrorResponse('用户不存在', 404));
    }

    // 从角色表获取角色代码和权限
    const roleDoc = await Role.findOne({ roleId: user.roleId }).lean();
    let roleCode = roleDoc?.roleCode || (user.roleName === '超级管理员' ? 'R_SUPER' : user.roleName === '管理员' ? 'R_ADMIN' : 'R_USER');
    const permissions = Array.isArray(roleDoc?.permissions) ? roleDoc!.permissions : ['*'];

    const userInfo = {
      userId: user.userId,
      userName: user.username,
      nickname: user.nickname || user.username,
      email: user.email || '',
      avatar: user.avatar || '',
      roleName: roleDoc?.roleName || user.roleName || '',
      roles: [roleCode],
      permissions: permissions,
      buttons: ['add', 'edit', 'delete']
    };

    res.json(createResponse(userInfo, '获取用户信息成功'));
  } catch (error: any) {
    console.error('获取用户信息失败:', error);
    res.status(500).json(createErrorResponse('获取用户信息失败', 500));
  }
});

// ==================== 用户管理相关接口 ====================

/**
 * 获取用户列表 - 支持多个路径
 */
app.get(['/api/users', '/api/user/list'], async (req: Request, res: Response) => {
  console.log('=== 用户列表接口被调用 ===');
  console.log('请求路径:', req.path);
  console.log('请求参数:', req.query);
  console.log('请求方法:', req.method);
  
  try {
    const { 
      current = 1, 
      size = 10, 
      username, 
      nickname, 
      roleCode, 
      enabled,
      startTime,
      endTime 
    } = req.query;

    const page = parseInt(current as string);
    const limit = parseInt(size as string);
    const skip = (page - 1) * limit;

    // 构建查询条件
    const query: any = {};
    
    if (username) {
      query.username = { $regex: username, $options: 'i' };
    }
    
    if (nickname) {
      query.nickname = { $regex: nickname, $options: 'i' };
    }
    
    if (roleCode) {
      // 先根据roleCode查找角色
      const role = await Role.findOne({ roleCode });
      if (role) {
        query.roleId = role.roleId;
      }
    }
    
    if (enabled !== undefined) {
      query.enabled = enabled === 'true';
    }
    
    if (startTime && endTime) {
      query.createTime = {
        $gte: new Date(startTime as string),
        $lte: new Date(endTime as string)
      };
    }

    // 查询用户列表
    const users = await User.find(query)
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password'); // 不返回密码字段

    // 获取总数
    const total = await User.countDocuments(query);

    // 格式化返回数据
    const formattedUsers = users.map(user => ({
      userId: user.userId,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId,
      roleName: user.roleName,
      enabled: user.enabled,
      registerSource: user.registerSource,
      lastLoginTime: user.lastLoginTime,
      lastLoginIp: user.lastLoginIp,
      registerIp: user.registerIp,
      createTime: user.createTime,
      updateTime: user.updateTime
    }));

    res.json(createResponse({
      records: formattedUsers,
      total,
      current: page,
      size: limit,
      pages: Math.ceil(total / limit)
    }, '获取用户列表成功'));

  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    res.status(500).json(createErrorResponse('获取用户列表失败', 500));
  }
});

/**
 * 用户详情接口 - 支持多个路径
 */
app.get(['/api/users/:id', '/api/user/detail/:id'], async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json(createErrorResponse('无效的用户ID', 400));
    }

    const user = await User.findOne({ userId }).select('-password');
    
    if (!user) {
      return res.status(404).json(createErrorResponse('用户不存在', 404));
    }

    res.json(createResponse(user, '获取用户详情成功'));
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json(createErrorResponse('获取用户详情失败'));
  }
});

/**
 * 获取角色列表 - 支持多个路径
 */
app.get(['/api/roles', '/api/role/list'], async (req: Request, res: Response) => {
  try {
    const { 
      current = 1, 
      size = 10, 
      roleName, 
      roleCode, 
      enabled,
      startTime,
      endTime 
    } = req.query;

    const page = parseInt(current as string);
    const limit = parseInt(size as string);
    const skip = (page - 1) * limit;

    // 构建查询条件
    const query: any = {};
    
    if (roleName) {
      query.roleName = { $regex: roleName, $options: 'i' };
    }
    
    if (roleCode) {
      query.roleCode = { $regex: roleCode, $options: 'i' };
    }
    
    if (enabled !== undefined) {
      query.enabled = enabled === 'true';
    }
    
    if (startTime && endTime) {
      query.createTime = {
        $gte: new Date(startTime as string),
        $lte: new Date(endTime as string)
      };
    }

    // 查询角色列表
    const roles = await Role.find(query)
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(limit);

    // 获取总数
    const total = await Role.countDocuments(query);

    res.json(createResponse({
      records: roles,
      total,
      current: page,
      size: limit,
      pages: Math.ceil(total / limit)
    }, '获取角色列表成功'));

  } catch (error: any) {
    console.error('获取角色列表失败:', error);
    res.status(500).json(createErrorResponse('获取角色列表失败', 500));
  }
});

/**
 * 创建角色 - 支持多个路径
 */
app.post(['/api/roles', '/api/role/create'], async (req: Request, res: Response) => {
  try {
    const { roleName, roleCode, description = '', permissions = [], enabled = true } = req.body || {}

    if (!roleName || !roleCode) {
      return res.status(400).json(createErrorResponse('角色名称或编码不能为空', 400))
    }

    // 角色编码唯一
    const existCode = await Role.findOne({ roleCode })
    if (existCode) {
      return res.status(400).json(createErrorResponse('角色编码已存在', 400))
    }

    // 生成新的 roleId
    const lastRole = await Role.findOne().sort({ roleId: -1 })
    const newRoleId = lastRole ? lastRole.roleId + 1 : 1

    const now = new Date()
    const newRole = new Role({
      roleId: newRoleId,
      roleName,
      roleCode,
      description,
      permissions: Array.isArray(permissions) ? permissions : [],
      enabled: Boolean(enabled),
      createTime: now,
      updateTime: now
    })

    await newRole.save()

    res.json(createResponse(newRole, '创建角色成功'))
  } catch (error: any) {
    console.error('创建角色失败:', error)
    res.status(500).json(createErrorResponse('创建角色失败', 500))
  }
})

/**
 * 更新角色 - 支持多个路径
 */
app.put(['/api/roles/:id', '/api/role/update/:id'], async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.id)
    if (isNaN(roleId)) {
      return res.status(400).json(createErrorResponse('无效的角色ID', 400))
    }

    const role = await Role.findOne({ roleId })
    if (!role) {
      return res.status(404).json(createErrorResponse('角色不存在', 404))
    }

    const { roleName, roleCode, description, permissions, enabled } = req.body || {}

    // 如果修改了 roleCode，需要校验唯一
    if (roleCode && roleCode !== role.roleCode) {
      const existCode = await Role.findOne({ roleCode })
      if (existCode) {
        return res.status(400).json(createErrorResponse('角色编码已存在', 400))
      }
    }

    const updateData: any = { updateTime: new Date() }
    if (typeof roleName !== 'undefined') updateData.roleName = roleName
    if (typeof roleCode !== 'undefined') updateData.roleCode = roleCode
    if (typeof description !== 'undefined') updateData.description = description
    if (typeof permissions !== 'undefined') updateData.permissions = Array.isArray(permissions) ? permissions : []
    if (typeof enabled !== 'undefined') updateData.enabled = Boolean(enabled)

    await Role.updateOne({ roleId }, { $set: updateData })

    const updated = await Role.findOne({ roleId })
    res.json(createResponse(updated, '更新角色成功'))
  } catch (error: any) {
    console.error('更新角色失败:', error)
    res.status(500).json(createErrorResponse('更新角色失败', 500))
  }
})

/**
 * 删除角色 - 支持多个路径
 */
app.delete(['/api/roles/:id', '/api/role/delete/:id'], async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.id);

    // 检查角色是否存在
    const role = await Role.findOne({ roleId });
    if (!role) {
      return res.status(404).json(createErrorResponse('角色不存在', 404));
    }

    // 检查是否有用户正在使用该角色
    const usersWithRole = await User.countDocuments({ roleId });
    if (usersWithRole > 0) {
      return res.status(400).json(createErrorResponse(`该角色正在被 ${usersWithRole} 个用户使用，无法删除`, 400));
    }

    // 删除角色
    await Role.deleteOne({ roleId });

    res.json(createResponse(null, '删除角色成功'));

  } catch (error: any) {
    console.error('删除角色失败:', error);
    res.status(500).json(createErrorResponse('删除角色失败', 500));
  }
});

/**
 * 创建用户 - 支持多个路径
 */
app.post(['/api/users', '/api/user/create'], async (req: Request, res: Response) => {
  try {
    const { username, nickname, password, email, phone, roleId, enabled = true } = req.body;

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json(createErrorResponse('用户名已存在', 400));
    }

    // 检查角色是否存在
    const role = await Role.findOne({ roleId });
    if (!role) {
      return res.status(400).json(createErrorResponse('角色不存在', 400));
    }

    // 生成新的用户ID
    const lastUser = await User.findOne().sort({ userId: -1 });
    const newUserId = lastUser ? lastUser.userId + 1 : 1;

    // 创建新用户
    const newUser = new User({
      userId: newUserId,
      username,
      nickname,
      password, // 实际应用中应该加密
      email: email || '',
      phone: phone || '',
      roleId,
      roleName: role.roleName,
      enabled,
      registerSource: 'admin',
      registerIp: req.ip || ''
    });

    await newUser.save();

    // 返回用户信息（不包含密码）
    const userResponse = {
      userId: newUser.userId,
      username: newUser.username,
      nickname: newUser.nickname,
      email: newUser.email,
      phone: newUser.phone,
      roleId: newUser.roleId,
      roleName: newUser.roleName,
      enabled: newUser.enabled,
      registerSource: newUser.registerSource,
      createTime: newUser.createTime
    };

    res.json(createResponse(userResponse, '创建用户成功'));

  } catch (error: any) {
    console.error('创建用户失败:', error);
    res.status(500).json(createErrorResponse('创建用户失败', 500));
  }
});

/**
 * 更新用户 - 支持多个路径
 */
app.put(['/api/users/:id', '/api/user/update/:id'], async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { nickname, email, phone, roleId, enabled } = req.body;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json(createErrorResponse('用户不存在', 404));
    }

    // 如果更新角色，检查角色是否存在
    if (roleId && roleId !== user.roleId) {
      const role = await Role.findOne({ roleId });
      if (!role) {
        return res.status(400).json(createErrorResponse('角色不存在', 400));
      }
      user.roleId = roleId;
      user.roleName = role.roleName;
    }

    // 更新用户信息
    if (nickname) user.nickname = nickname;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (enabled !== undefined) user.enabled = enabled;
    user.updateTime = new Date();

    await user.save();

    // 返回更新后的用户信息（不包含密码）
    const userResponse = {
      userId: user.userId,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId,
      roleName: user.roleName,
      enabled: user.enabled,
      updateTime: user.updateTime
    };

    res.json(createResponse(userResponse, '更新用户成功'));

  } catch (error: any) {
    console.error('更新用户失败:', error);
    res.status(500).json(createErrorResponse('更新用户失败', 500));
  }
});

/**
 * 删除用户 - 支持多个路径
 */
app.delete(['/api/users/:id', '/api/user/delete/:id'], async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json(createErrorResponse('用户不存在', 404));
    }

    await User.deleteOne({ userId });

    res.json(createResponse(null, '删除用户成功'));

  } catch (error: any) {
    console.error('删除用户失败:', error);
    res.status(500).json(createErrorResponse('删除用户失败', 500));
  }
});

/**
 * 用户注册
 */
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // 验证密码确认
    if (password !== confirmPassword) {
      return res.status(400).json(createErrorResponse('两次输入的密码不一致', 400));
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json(createErrorResponse('用户名已存在', 400));
    }

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json(createErrorResponse('邮箱已被使用', 400));
      }
    }

    // 查找普通用户角色（假设 roleCode 为 'USER'）
    let userRole = await Role.findOne({ roleCode: 'USER' });
    if (!userRole) {
      // 如果没有普通用户角色，创建一个
      const lastRole = await Role.findOne().sort({ roleId: -1 });
      const newRoleId = lastRole ? lastRole.roleId + 1 : 1;
      
      userRole = new Role({
        roleId: newRoleId,
        roleName: '普通用户',
        roleCode: 'USER',
        description: '普通用户角色',
        enabled: true,
        permissions: ['read']
      });
      await userRole.save();
    }

    // 生成新的用户ID
    const lastUser = await User.findOne().sort({ userId: -1 });
    const newUserId = lastUser ? lastUser.userId + 1 : 1;

    // 解析注册来源
    const resolvedRegisterSource = (() => {
      const raw = typeof req.body?.registerSource === 'string' ? String(req.body.registerSource).toLowerCase() : 'frontend'
      if (raw === 'backend' || raw === 'admin') return 'backend'
      return 'frontend'
    })();

    console.log('[auth/register] 收到注册请求:', {
      username,
      email,
      registerSourceInBody: req.body?.registerSource,
      resolvedRegisterSource
    });

    // 创建新用户
    const newUser = new User({
      userId: newUserId,
      username,
      email: email || '', // 保存email字段
      nickname: username, // 默认昵称为用户名
      password, // 实际应用中应该加密
      roleId: userRole.roleId,
      roleName: userRole.roleName,
      enabled: true,
      registerSource: resolvedRegisterSource,
      registerIp: req.ip || ''
    });

    console.log('[auth/register] 即将写入用户：', {
      userId: newUserId,
      username,
      resolvedRegisterSource
    });

    await newUser.save();

    res.json(createResponse(null, '注册成功'));

  } catch (error: any) {
    console.error('用户注册失败:', error);
    res.status(500).json(createErrorResponse('注册失败', 500));
  }
});

// 修改密码接口
app.put('/api/user/change-password', async (req: Request, res: Response) => {
  console.log('=== 修改密码接口被调用 ===');
  console.log('请求体:', JSON.stringify(req.body, null, 2));
  
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      console.log('密码参数验证失败: currentPassword或newPassword为空');
      return res.status(400).json(createErrorResponse('当前密码和新密码不能为空', 400));
    }
    
    // 从请求头获取token（这里简化处理，实际应该验证token获取用户信息）
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('mock-jwt-token-')) {
      console.log('token验证失败:', authorization);
      return res.status(401).json(createErrorResponse('未授权访问', 401));
    }
    
    // 从token中提取用户名（严格校验格式）
    // 正确的新格式：mock-jwt-token-{username}-{timestamp}
    // 旧格式：mock-jwt-token-{timestamp}
    const tokenParts = authorization.split('-');
    const isNewFormat = (
      tokenParts.length >= 5 &&
      tokenParts[0] === 'mock' &&
      tokenParts[1] === 'jwt' &&
      tokenParts[2] === 'token' &&
      /^\d+$/.test(tokenParts[tokenParts.length - 1])
    );

    if (!isNewFormat) {
      console.log('检测到旧格式或非法token，拒绝处理:', authorization, tokenParts);
      return res.status(401).json(createErrorResponse('未授权访问，请重新登录', 401));
    }

    const username = tokenParts.slice(3, -1).join('-'); // 支持用户名内含连字符
    
    console.log('从token中提取的用户名:', username, '原始token:', authorization);
    
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      console.log('用户不存在:', username);
      return res.status(404).json(createErrorResponse('用户不存在', 404));
    }
    
    console.log('找到用户:', {
      userId: user.userId,
      username: user.username,
      currentPasswordInDB: user.password ? '已设置' : '未设置'
    });
    
    // 验证当前密码
    let isCurrentPasswordValid = false;
    console.log('开始验证当前密码...');
    console.log('用户名:', username);
    console.log('输入的当前密码:', currentPassword);
    console.log('数据库中的密码:', user.password);
    const isBcryptFormat = typeof user.password === 'string' && user.password.startsWith('$2b$');
    console.log('数据库密码是否为bcrypt格式:', isBcryptFormat);
    
    // 判断数据库中的密码是否为bcrypt格式
    if (isBcryptFormat) {
      // bcrypt加密密码，使用bcrypt比较
      try {
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        console.log('bcrypt密码比较结果:', isCurrentPasswordValid);
      } catch (error) {
        console.log('bcrypt比较出错:', error);
        isCurrentPasswordValid = false;
      }
    } else {
      // 明文密码，直接比较
      isCurrentPasswordValid = user.password === currentPassword;
      console.log('明文密码比较结果:', isCurrentPasswordValid);
    }
    
    if (!isCurrentPasswordValid) {
      console.log('当前密码验证失败');
      return res.status(400).json(createErrorResponse('当前密码错误', 400));
    }
    
    console.log('当前密码验证成功，开始更新密码...');
    
    // 加密新密码
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log('新密码加密完成');
    
    // 更新密码
    const oldPassword = user.password;
    user.password = hashedNewPassword;
    user.updateTime = new Date();
    
    console.log('准备保存用户数据...');
    console.log('更新前密码:', oldPassword);
    console.log('更新后密码:', hashedNewPassword);
    
    const saveResult = await user.save();
    console.log('用户数据保存结果:', saveResult ? '成功' : '失败');
    
    // 验证更新是否成功
    const updatedUser = await User.findOne({ username });
    console.log('验证更新结果:', {
      username: updatedUser?.username,
      passwordChanged: updatedUser?.password !== oldPassword,
      newPasswordHash: updatedUser?.password
    });
    
    console.log('密码修改成功，用户:', username);
    res.json(createResponse(null, '密码修改成功'));
    
  } catch (error: any) {
    console.error('修改密码失败:', error);
    res.status(500).json(createErrorResponse('修改密码失败', 500));
  }
});

// ==================== 原有接口 ====================

// 全局错误处理中间件
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('服务器错误:', err);
  res.status(500).json(createErrorResponse('服务器内部错误', 500));
});

// 临时调试API - 查看用户信息（仅用于调试，生产环境应删除）
app.get('/api/debug/user/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json(createErrorResponse('用户不存在', 404));
    }
    
    // 返回用户信息（隐藏敏感信息）
    const userInfo = {
      userId: user.userId,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      passwordExists: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      passwordStartsWith: user.password ? user.password.substring(0, 10) + '...' : '',
      isBcryptFormat: user.password ? user.password.startsWith('$2b$') : false,
      enabled: user.enabled,
      roleId: user.roleId,
      roleName: user.roleName,
      createTime: user.createTime,
      updateTime: user.updateTime
    };
    
    res.json(createResponse(userInfo, '获取用户信息成功'));
  } catch (error: any) {
    console.error('获取用户信息失败:', error);
    res.status(500).json(createErrorResponse('获取用户信息失败', 500));
  }
});

// 404处理
app.use((_req: Request, res: Response) => {
  res.status(404).json(createErrorResponse('接口不存在', 404));
});

// 启动服务器并监听端口
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
