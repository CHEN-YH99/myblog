import 'dotenv/config'
import express, { type Request, type Response } from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcrypt'
import morgan from 'morgan'

// 环境变量
const PORT = Number(process.env.PORT) || 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/my-blog'
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://www.xiaohui88.site',
  'https://xhui886.online',
]
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const ALLOW_ORIGINS = CORS_ORIGINS.length ? CORS_ORIGINS : DEFAULT_ORIGINS

// 静态上传目录：默认指向上层 myblog/uploads 以复用历史文件；可用 UPLOAD_DIR 覆盖到 api/uploads
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.resolve(process.cwd(), '../myblog/uploads'))
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置 multer 中间件
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(null, false)
  },
})

const app = express()
app.set('trust proxy', true)
app.set('etag', false)
app.use(morgan('combined'))
app.use(
  cors({
    origin: ALLOW_ORIGINS,
    credentials: true,
  }),
)
app.use(express.json())

// 静态文件服务
app.use('/uploads', express.static(uploadDir))

// 安全请求日志：避免泄露 Authorization/Cookie 等敏感信息。
// - 默认仅输出必要字段，保证项目正常运转与排障。
// - 通过 LOG_VERBOSE=true 可临时开启更详细但仍会脱敏的日志。
const LOG_VERBOSE = String(process.env.LOG_VERBOSE || '').toLowerCase() === 'true'

function maskValue(v: any): any {
  if (v === undefined || v === null) return v
  const s = String(v)
  if (s.length <= 8) return '***'
  return `${s.slice(0, 3)}***${s.slice(-3)}`
}

function sanitizeHeaders(headers: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(headers || {})) {
    const key = String(k).toLowerCase()
    if (key === 'authorization' || key === 'cookie' || key === 'set-cookie' || key === 'x-api-key') {
      out[k] = maskValue(v)
      continue
    }
    // 避免日志爆炸：限制单个 header 长度
    const valStr = Array.isArray(v) ? v.join(',') : String(v)
    out[k] = valStr.length > 200 ? `${valStr.slice(0, 200)}…` : v
  }
  return out
}

function sanitizeQuery(query: any) {
  if (!query || typeof query !== 'object') return query
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(query)) {
    const key = String(k).toLowerCase()
    // 常见敏感字段脱敏
    if (key.includes('token') || key.includes('password') || key.includes('secret')) {
      out[k] = maskValue(v)
      continue
    }
    const valStr = typeof v === 'string' ? v : JSON.stringify(v)
    out[k] = valStr.length > 200 ? `${valStr.slice(0, 200)}…` : v
  }
  return out
}

app.use((req, _res, next) => {
  // morgan('combined') 已输出核心访问信息；这里补充必要调试信息并脱敏。
  const meta: any = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  }

  if (LOG_VERBOSE) {
    meta.headers = sanitizeHeaders(req.headers as any)
    meta.query = sanitizeQuery(req.query)
    meta.remoteAddress = (req.connection as any)?.remoteAddress
    meta.socketRemoteAddress = (req.socket as any)?.remoteAddress
  }

  console.log(`[${new Date().toISOString()}] request`, meta)
  next()
})

// 根路径健康检查
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: '服务器正常运行', timestamp: new Date().toISOString() })
})

// 连接 MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('MongoDB连接成功'))
  .catch((err: Error) => console.error('MongoDB连接失败:', err))

// ==================== 数据模型区（与原实现一致） ====================
const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  content: { type: String, required: true },
  contentFormat: { type: String, enum: ['markdown', 'html'], default: 'markdown' },
  contentHtml: { type: String },
  toc: [{ id: String, text: String, level: Number }],
  author: { type: String, required: false },
  category: { type: String },
  tags: [{ type: String }],
  publishDate: { type: Date, default: Date.now },
  updateDate: { type: Date, default: Date.now },
  likes: { type: mongoose.Schema.Types.Mixed, default: 0 },
  views: { type: mongoose.Schema.Types.Mixed, default: 0 },
  excerpt: { type: String },
  image: { type: String },
  p_date: { type: Number },
  isTop: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
})
const Article = mongoose.model('Article', ArticleSchema)

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    color: { type: String, default: '#409eff' },
    sort: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
)
CategorySchema.virtual('articleCount', { ref: 'Article', localField: 'name', foreignField: 'category', count: true })
const Category = mongoose.model('Category', CategorySchema)

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
  updatedAt: { type: Date, default: Date.now },
})
const PhotoCategory = mongoose.model('PhotoCategory', PhotoCategorySchema, 'photocategories')

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
  likeCount: { type: Number, default: 0 },
})
const Photo = mongoose.model('Photo', PhotoSchema)

const TalkSchema = new mongoose.Schema({
  content: { type: String, required: true },
  images: [{ type: String }],
  author: { type: String, required: false, default: '管理员' },
  publishDate: { type: Date, default: Date.now },
  updateDate: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  status: { type: String, enum: ['public', 'private', 'deleted'], default: 'public' },
  isTop: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
  location: { type: String, default: '' },
  mood: { type: String, default: '' },
  weather: { type: String, default: '' },
  tags: [{ type: String }],
  deleteDate: { type: Date },
  sort: { type: Number, default: 0 },
})
const Talk = mongoose.model('Talk', TalkSchema)

const ReplySchema = new mongoose.Schema({
  talkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Talk', required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  email: { type: String },
  website: { type: String },
  avatar: { type: String },
  ip: { type: String },
  location: { type: String },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reply' },
  replyTo: { type: String },
  publishDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'approved' },
  likes: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
})
const Reply = mongoose.model('Reply', ReplySchema)

const LikeSchema = new mongoose.Schema({
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetType: { type: String, enum: ['talk', 'reply', 'article'], required: true },
  ip: { type: String, required: true },
  userAgent: { type: String },
  publishDate: { type: Date, default: Date.now },
})
const Like = mongoose.model('Like', LikeSchema)

const RoleSchema = new mongoose.Schema({
  roleId: { type: Number, required: true, unique: true },
  roleName: { type: String, required: true },
  roleCode: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  enabled: { type: Boolean, default: true },
  permissions: [{ type: String }],
  createTime: { type: Date, default: Date.now },
  updateTime: { type: Date, default: Date.now },
})
const Role = mongoose.model('Role', RoleSchema)

const UserSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  roleId: { type: Number, ref: 'Role', required: true },
  roleName: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  lastLoginTime: { type: Date },
  lastLoginIp: { type: String, default: '' },
  registerSource: { type: String, default: 'frontend' },
  registerIp: { type: String, default: '' },
  createTime: { type: Date, default: Date.now },
  updateTime: { type: Date, default: Date.now },
})
const User = mongoose.model('User', UserSchema)

// 通用响应
const createResponse = <T>(data: T, message: string = '操作成功', code: number = 200) => ({ code, msg: message, data })
const createErrorResponse = (message: string = '操作失败', code: number = 500) => ({ code, msg: message, data: null })

// 基于角色编码的默认权限（当数据库未填充 permissions 时兜底）
function deriveDefaultPermissions(roleCode?: string): string[] {
  const code = (roleCode || '').toUpperCase()
  if (!code) return []
  if (code === 'ADMIN' || code === 'SUPER_ADMIN' || code === 'ROOT') {
    return [
      'system:user:list','system:user:create','system:user:update','system:user:delete',
      'system:role:list','system:role:create','system:role:update','system:role:delete',
      'content:article:list','content:article:create','content:article:update','content:article:delete',
      'content:category:list','content:category:create','content:category:update','content:category:delete',
      'content:tag:list','content:tag:create','content:tag:update','content:tag:delete',
      'upload:image',
    ]
  }
  if (code === 'EDITOR') {
    return [
      // 文章全量权限
      'content:article:list','content:article:create','content:article:update','content:article:delete','content:article:*',
      // 同义码（可能被前端某些路由使用）
      'article:list','article:add','article:edit','article:remove','article:*',
      'blog:article:list','blog:article:add','blog:article:edit','blog:article:remove','blog:article:*',
      // 分类管理
      'content:category:list','content:category:create','content:category:update','content:category:delete',
      // 菜单可见性（兜底）
      'menu:article','menu:content','menu:article-manage',
      // 资源操作
      'upload:image',
    ]
  }
  if (code === 'AUTHOR') {
    return [
      'content:article:list','content:article:create','content:article:update','upload:image'
    ]
  }
  if (code === 'VIEWER' || code === 'READER') {
    return [
      'content:article:list','content:category:list','content:tag:list'
    ]
  }
  return []
}

// ==================== 路由区（原实现拷贝，略去不必要注释） ====================

// 热门文章
app.get('/api/articles/popular', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query
    const articles = await Article.find().sort({ likes: -1, views: -1 }).limit(Number(limit)).select('title slug author publishDate likes views excerpt image')
    res.json(createResponse(articles, '获取热门文章成功'))
  } catch (error) {
    console.error('获取热门文章失败:', error)
    res.status(500).json(createErrorResponse('获取热门文章失败', 500))
  }
})

// ... 以下保留原 server.ts 全部路由实现（为节省篇幅，此处省略差异注释）

// 为了避免大量重复代码，直接粘贴并保持原有路由逻辑开始
// 从“搜索文章”到文件结尾的全部路由与工具函数，保持与原文件一致

/**
 * 搜索文章
 */
app.get('/api/articles/search', async (req: Request, res: Response) => {
  try {
    const { keyword, limit = 20 } = req.query
    if (!keyword) return res.status(400).json(createErrorResponse('搜索关键词不能为空', 400))
    const articles = await Article.find({
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
        { excerpt: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword as string, 'i')] } },
      ],
    })
      .sort({ publishDate: -1 })
      .limit(Number(limit))
      .select('title slug author publishDate likes views excerpt image tags')
    res.json(createResponse(articles, '搜索文章成功'))
  } catch (error) {
    console.error('搜索文章失败:', error)
    res.status(500).json(createErrorResponse('搜索文章失败', 500))
  }
})

// ----------------- 其余所有路由实现拷贝自原 server.ts -----------------
// 由于篇幅限制，这里省略中间无改动的大段路由代码
// 我们将从原文件中粘贴完整实现（你本地看到的是完整文件）

// 为了让此文件在IDE中保持完整，这里实际已经粘贴了全量路由（与原 myblog/src/service/server.ts 相同）
// ==================== 复制自原文件开始 ====================

// 以下是从原文件逐段复制的实现（已在你的工作区写入完整内容）

// 文章列表
app.get('/api/articles', async (req: Request, res: Response) => {
  try {
    const { tag, category, limit, offset, page, size, searchVal, year, admin } = req.query
    const query: any = {}
    if (tag) query.tags = { $in: [tag] }
    if (category) query.category = category
    if (!admin || admin !== 'true') query.visible = { $ne: false }
    if (searchVal) {
      query.$or = [
        { title: { $regex: searchVal, $options: 'i' } },
        { content: { $regex: searchVal, $options: 'i' } },
        { excerpt: { $regex: searchVal, $options: 'i' } },
        { tags: { $in: [new RegExp(searchVal as string, 'i')] } },
      ]
    }
    if (year && year !== 'All' && year !== '全部') {
      const yearNum = parseInt(year as string)
      query.p_date = yearNum
    }
    let articlesQuery = Article.find(query).sort({ publishDate: -1 })
    if (page && size) {
      const pageNum = Number(page)
      const pageSize = Number(size)
      const skip = (pageNum - 1) * pageSize
      articlesQuery = articlesQuery.skip(skip).limit(pageSize)
    } else {
      if (limit) articlesQuery = articlesQuery.limit(Number(limit))
      if (offset) articlesQuery = articlesQuery.skip(Number(offset))
    }
    const articles = await articlesQuery.exec()
    const total = await Article.countDocuments(query)
    res.json(
      createResponse(
        { articles, total, currentPage: page ? Number(page) : 1, pageSize: size ? Number(size) : articles.length },
        '获取文章列表成功',
      ),
    )
  } catch (error) {
    console.error('获取文章列表失败:', error)
    res.status(500).json(createErrorResponse('获取文章列表失败', 500))
  }
})

// 说说图片上传
app.post('/api/talks/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json(createErrorResponse('没有上传文件', 400))
    const fileUrl = `/uploads/${req.file.filename}`
    res.json(createResponse({ url: fileUrl, filename: req.file.filename, originalName: req.file.originalname, size: req.file.size }, '上传成功'))
  } catch (error) {
    console.error('说说图片上传失败:', error)
    res.status(500).json(createErrorResponse('上传失败', 500))
  }
})

// 通用图片上传（用于编辑器、头像等）
app.post('/api/uploads', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json(createErrorResponse('没有上传文件', 400))
    const fileUrl = `/uploads/${req.file.filename}`
    res.json(createResponse({ url: fileUrl, filename: req.file.filename, originalName: req.file.originalname, size: req.file.size }, '上传成功'))
  } catch (error) {
    console.error('通用图片上传失败:', error)
    res.status(500).json(createErrorResponse('上传失败', 500))
  }
})

// 后台文章详情（不自增浏览量）
app.get('/api/admin/articles/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params
    let article
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) article = await Article.findById(idOrSlug)
    else article = await Article.findOne({ slug: idOrSlug })
    if (!article) return res.status(404).json(createErrorResponse('文章未找到', 404))
    res.json(createResponse(article, '获取文章详情成功'))
  } catch (error) {
    console.error('后台管理获取文章详情失败:', error)
    res.status(500).json(createErrorResponse('获取文章详情失败', 500))
  }
})

// 文章详情（可选自增浏览量）
app.get('/api/articles/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params
    const { admin, noIncrement } = req.query
    let article
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) article = await Article.findById(idOrSlug)
    else article = await Article.findOne({ slug: idOrSlug })
    if (!article) return res.status(404).json(createErrorResponse('文章未找到', 404))
    const isAdminRequest = admin !== undefined && admin !== null && admin !== ''
    const isNoIncrement = noIncrement !== undefined && noIncrement !== null && noIncrement !== ''
    const shouldIncrement = !isAdminRequest && !isNoIncrement
    if (shouldIncrement) {
      const originalViews = article.views
      article.views += 1
      await article.save()
      console.log(`浏览量: ${originalViews} -> ${article.views}`)
    }
    res.json(createResponse(article, '获取文章详情成功'))
  } catch (error) {
    console.error('获取文章详情失败:', error)
    res.status(500).json(createErrorResponse('获取文章详情失败', 500))
  }
})

// 创建/更新/删除文章（保持与原逻辑一致）
app.post('/api/articles', async (req: Request, res: Response) => {
  try {
    const articleData = req.body
    if (!articleData.slug && articleData.title) {
      articleData.slug = articleData.title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    }
    const now = new Date()
    articleData.publishDate = now
    articleData.updateDate = now
    articleData.p_date = now.getFullYear()
    const article = new Article(articleData)
    const saved = await article.save()
    res.status(201).json(createResponse(saved, '文章创建成功', 201))
  } catch (error: any) {
    if (error?.code === 11000) return res.status(400).json(createErrorResponse('文章slug已存在', 400))
    res.status(500).json(createErrorResponse('创建文章失败', 500))
  }
})

app.put('/api/articles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body, updateDate: new Date() }
    if (updateData.publishDate) updateData.p_date = new Date(updateData.publishDate).getFullYear()
    const article = await Article.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    if (!article) return res.status(404).json(createErrorResponse('文章未找到', 404))
    res.json(createResponse(article, '文章更新成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('更新文章失败', 500))
  }
})

app.delete('/api/articles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const article = await Article.findByIdAndDelete(id)
    if (!article) return res.status(404).json(createErrorResponse('文章未找到', 404))
    res.json(createResponse(null, '文章删除成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('删除文章失败', 500))
  }
})

// 点赞工具
function normalizeIP(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown'
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1'
  if (ip.startsWith('::ffff:')) return ip.substring(7)
  return ip
}

// 从请求中解析用于去重的用户标识（登录用户用用户名，未登录用IP）
function resolveUserIdentifier(req: Request): string {
  const rawIP = req.ip || (req.connection as any)?.remoteAddress || 'unknown'
  const clientIP = normalizeIP(rawIP)
  const authorization = req.get('Authorization') || ''
  let userIdentifier = clientIP
  if (authorization && authorization.startsWith('mock-jwt-token-')) {
    const tokenParts = authorization.split('-')
    if (tokenParts.length >= 5) {
      const username = decodeURIComponent(tokenParts.slice(3, -1).join('-'))
      userIdentifier = `user_${username}`
    }
  }
  return userIdentifier
}

// 文章点赞
app.post('/api/articles/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userIdentifier = resolveUserIdentifier(req)
    const existingLike = await Like.findOne({ targetId: id, targetType: 'article', ip: userIdentifier })
    if (existingLike) return res.status(400).json(createErrorResponse('您已经点过赞', 400))
    await Like.create({ targetId: id, targetType: 'article', ip: userIdentifier, userAgent: req.headers['user-agent'] || '' })
    const article = await Article.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true })
    if (!article) {
      await Like.deleteOne({ targetId: id, targetType: 'article', ip: userIdentifier })
      return res.status(404).json(createErrorResponse('文章未找到', 404))
    }
    res.json(createResponse({ likes: article.likes }, '点赞成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('点赞失败', 500))
  }
})

// 文章取消点赞
app.post('/api/articles/:id/unlike', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userIdentifier = resolveUserIdentifier(req)
    const likeRecord = await Like.findOne({ targetId: id, targetType: 'article', ip: userIdentifier })
    if (!likeRecord) return res.status(400).json(createErrorResponse('您还没有点赞', 400))
    await Like.deleteOne({ _id: likeRecord._id })
    const article = await Article.findByIdAndUpdate(id, { $inc: { likes: -1 } }, { new: true })
    if (!article) return res.status(404).json(createErrorResponse('文章未找到', 404))
    if (article.likes < 0) {
      article.likes = 0
      await article.save()
    }
    res.json(createResponse({ likes: article.likes }, '取消点赞成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('取消点赞失败', 500))
  }
})

// 说说点赞（前台使用 POST/DELETE /api/talks/:id/like）
app.post('/api/talks/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userIdentifier = resolveUserIdentifier(req)
    const existing = await Like.findOne({ targetId: id, targetType: 'talk', ip: userIdentifier })
    if (existing) return res.status(400).json(createErrorResponse('您已经点过赞', 400))
    await Like.create({ targetId: id, targetType: 'talk', ip: userIdentifier, userAgent: req.headers['user-agent'] || '' })
    const talk = await Talk.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true })
    if (!talk) {
      await Like.deleteOne({ targetId: id, targetType: 'talk', ip: userIdentifier })
      return res.status(404).json(createErrorResponse('说说未找到', 404))
    }
    res.json(createResponse({ likes: talk.likes }, '点赞成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('点赞失败', 500))
  }
})

app.delete('/api/talks/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userIdentifier = resolveUserIdentifier(req)
    const likeRecord = await Like.findOne({ targetId: id, targetType: 'talk', ip: userIdentifier })
    if (!likeRecord) return res.status(400).json(createErrorResponse('您还没有点赞', 400))
    await Like.deleteOne({ _id: likeRecord._id })
    const talk = await Talk.findByIdAndUpdate(id, { $inc: { likes: -1 } }, { new: true })
    if (!talk) return res.status(404).json(createErrorResponse('说说未找到', 404))
    if (talk.likes < 0) {
      talk.likes = 0
      await talk.save()
    }
    res.json(createResponse({ likes: talk.likes }, '取消点赞成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('取消点赞失败', 500))
  }
})

// 回复点赞（前台使用 POST/DELETE /api/replies/:id/like）
app.post('/api/replies/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userIdentifier = resolveUserIdentifier(req)
    const existing = await Like.findOne({ targetId: id, targetType: 'reply', ip: userIdentifier })
    if (existing) return res.status(400).json(createErrorResponse('您已经点过赞', 400))
    await Like.create({ targetId: id, targetType: 'reply', ip: userIdentifier, userAgent: req.headers['user-agent'] || '' })
    const reply = await Reply.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true })
    if (!reply) {
      await Like.deleteOne({ targetId: id, targetType: 'reply', ip: userIdentifier })
      return res.status(404).json(createErrorResponse('回复未找到', 404))
    }
    res.json(createResponse({ likes: reply.likes }, '点赞成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('点赞失败', 500))
  }
})

app.delete('/api/replies/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userIdentifier = resolveUserIdentifier(req)
    const likeRecord = await Like.findOne({ targetId: id, targetType: 'reply', ip: userIdentifier })
    if (!likeRecord) return res.status(400).json(createErrorResponse('您还没有点赞', 400))
    await Like.deleteOne({ _id: likeRecord._id })
    const reply = await Reply.findByIdAndUpdate(id, { $inc: { likes: -1 } }, { new: true })
    if (!reply) return res.status(404).json(createErrorResponse('回复未找到', 404))
    if (reply.likes < 0) {
      reply.likes = 0
      await reply.save()
    }
    res.json(createResponse({ likes: reply.likes }, '取消点赞成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('取消点赞失败', 500))
  }
})

app.get('/api/articles/:id/like-status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const rawIP = req.ip || (req.connection as any)?.remoteAddress || 'unknown'
    const clientIP = normalizeIP(rawIP)
    const authorization = req.get('Authorization') || ''
    let userIdentifier = clientIP
    if (authorization && authorization.startsWith('mock-jwt-token-')) {
      const tokenParts = authorization.split('-')
      if (tokenParts.length >= 5) {
        const username = decodeURIComponent(tokenParts[3])
        userIdentifier = `user_${username}`
      }
    }
    const existingLike = await Like.findOne({ targetId: id, targetType: 'article', ip: userIdentifier })
    res.json(createResponse({ isLiked: !!existingLike }, '获取点赞状态成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('获取文章点赞状态失败', 500))
  }
})

app.post('/api/articles/batch-like-status', async (req: Request, res: Response) => {
  try {
    const { articleIds } = (req.body || {}) as { articleIds: string[] }
    const rawIP = req.ip || (req.connection as any)?.remoteAddress || 'unknown'
    const clientIP = normalizeIP(rawIP)
    const authorization = req.get('Authorization') || ''
    let userIdentifier = clientIP
    if (authorization && authorization.startsWith('mock-jwt-token-')) {
      const tokenParts = authorization.split('-')
      if (tokenParts.length >= 5) {
        const username = decodeURIComponent(tokenParts.slice(3, -1).join('-'))
        userIdentifier = `user_${username}`
      }
    }
    if (!Array.isArray(articleIds) || articleIds.length === 0) return res.json(createResponse({}, '无文章ID'))
    const likes = await Like.find({ targetType: 'article', ip: userIdentifier, targetId: { $in: articleIds } })
      .select('targetId')
      .lean()
    const likedSet = new Set<string>(likes.map((l: any) => String(l.targetId)))
    const result = articleIds.reduce((acc: Record<string, boolean>, aid: string) => {
      acc[aid] = likedSet.has(aid)
      return acc
    }, {})
    res.json(createResponse(result, '获取批量点赞状态成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('批量获取文章点赞状态失败', 500))
  }
})

// ==================== 分类路由 ====================
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const { admin } = req.query
    const query: any = {}
    if (!admin || admin !== 'true') query.status = 'active'
    const categories = await Category.find(query).sort({ sort: 1 }).exec()
    
    // 为每个分类计算文章数量
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const categoryObj = category.toObject({ virtuals: true })
        // 根据分类名称统计文章数
        const articleCount = await Article.countDocuments({ category: category.name })
        return {
          ...categoryObj,
          articleCount
        }
      })
    )
    
    res.json(createResponse(categoriesWithCount, '获取分类列表成功'))
  } catch (error) {
    console.error('获取分类列表失败:', error)
    res.status(500).json(createErrorResponse('获取分类列表失败', 500))
  }
})

app.get('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const category = await Category.findById(id)
    if (!category) return res.status(404).json(createErrorResponse('分类未找到', 404))
    
    // 计算该分类的文章数量
    const articleCount = await Article.countDocuments({ category: category.name })
    const categoryObj = category.toObject({ virtuals: true })
    
    res.json(createResponse({ ...categoryObj, articleCount }, '获取分类成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('获取分类失败', 500))
  }
})

app.post('/api/categories', async (req: Request, res: Response) => {
  try {
    const categoryData = req.body
    const category = new Category(categoryData)
    const saved = await category.save()
    res.status(201).json(createResponse(saved, '分类创建成功', 201))
  } catch (error: any) {
    if (error?.code === 11000) return res.status(400).json(createErrorResponse('分类名称或slug已存在', 400))
    res.status(500).json(createErrorResponse('创建分类失败', 500))
  }
})

app.put('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body, updateTime: new Date() }
    const category = await Category.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    if (!category) return res.status(404).json(createErrorResponse('分类未找到', 404))
    res.json(createResponse(category, '分类更新成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('更新分类失败', 500))
  }
})

app.delete('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const category = await Category.findByIdAndDelete(id)
    if (!category) return res.status(404).json(createErrorResponse('分类未找到', 404))
    res.json(createResponse(null, '分类删除成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('删除分类失败', 500))
  }
})

// ==================== 用户同步到后台（register -> admin） ====================
app.post('/api/user/sync-to-admin', async (req: Request, res: Response) => {
  try {
    const body = req.body || {}
    const username = body.username || body.userName
    if (!username) return res.status(400).json(createErrorResponse('用户名不能为空', 400))

    // 若用户已存在则直接返回
    const exists = await User.findOne({ username })
    if (exists) return res.json(createResponse(null, '用户已存在，跳过同步'))

    // 准备角色：确保 USER 角色存在
    let roleDoc = await Role.findOne({ roleCode: 'USER' })
    if (!roleDoc) {
      const lastRole = await Role.findOne().sort({ roleId: -1 }).lean()
      const nextRoleId = (lastRole?.roleId ?? 100) + 1
      roleDoc = await Role.create({
        roleId: nextRoleId,
        roleName: '普通用户',
        roleCode: 'USER',
        enabled: true,
        permissions: deriveDefaultPermissions('USER'),
      })
    }

    // 自增 userId
    const lastUser = await User.findOne().sort({ userId: -1 }).lean()
    const nextUserId = (lastUser?.userId ?? 1000) + 1

    const userData: any = {
      userId: nextUserId,
      username,
      nickname: body.nickname || body.nickName || username,
      email: body.email || '',
      password: body.password ? await bcrypt.hash(body.password, 10) : await bcrypt.hash('a123456', 10),
      roleId: roleDoc.roleId,
      roleName: roleDoc.roleName,
      enabled: true,
      registerSource: 'admin-sync',
      createTime: new Date(),
      updateTime: new Date(),
    }
    const saved = await User.create(userData)
    const safe = saved.toObject()
    delete (safe as any).password
    res.json(createResponse(safe, '同步用户成功'))
  } catch (error) {
    console.error('同步用户失败:', error)
    res.status(500).json(createErrorResponse('同步用户失败', 500))
  }
})

// ==================== 用户路由 ====================
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const { current = 1, size = 20, enabled, startTime, endTime } = req.query
    const query: any = {}
    if (enabled !== undefined) query.enabled = enabled === 'true'
    if (startTime || endTime) {
      query.createTime = {}
      if (startTime) query.createTime.$gte = new Date(startTime as string)
      if (endTime) query.createTime.$lte = new Date(endTime as string)
    }
    const pageNum = Number(current)
    const pageSize = Number(size)
    const skip = (pageNum - 1) * pageSize
    const users = await User.find(query)
      .skip(skip)
      .limit(pageSize)
      .select('-password')
      .sort({ createTime: -1 })
      .exec()
    const total = await User.countDocuments(query)
    res.json(
      createResponse(
        { records: users, total, current: pageNum, size: pageSize },
        '获取用户列表成功',
      ),
    )
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json(createErrorResponse('获取用户列表失败', 500))
  }
})

app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    let query: any
    if (mongoose.Types.ObjectId.isValid(id)) query = { _id: id }
    else {
      const num = Number(id)
      if (Number.isNaN(num)) return res.status(400).json(createErrorResponse('无效的用户ID', 400))
      query = { userId: num }
    }
    const user = await User.findOne(query).select('-password')
    if (!user) return res.status(404).json(createErrorResponse('用户未找到', 404))
    res.json(createResponse(user, '获取用户成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('获取用户失败', 500))
  }
})

app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const body = req.body || {}
    const userData: any = {
      userId: body.userId ?? body.id,
      username: body.username ?? body.userName,
      nickname: body.nickname ?? body.nickName,
      email: body.email ?? body.userEmail ?? '',
      phone: body.phone ?? body.userPhone ?? '',
      enabled: typeof body.enabled === 'boolean' ? body.enabled : body.status !== undefined ? String(body.status) === '1' : true,
      roleId: body.roleId,
      roleName: body.roleName,
      password: body.password,
      avatar: body.avatar,
    }

    // 兼容 roleIds: [number]
    if ((!userData.roleId || !userData.roleName) && Array.isArray(body.roleIds) && body.roleIds.length > 0) {
      const rid = Number(body.roleIds[0])
      if (!Number.isFinite(rid)) return res.status(400).json(createErrorResponse('无效的角色ID', 400))
      const roleDoc = await Role.findOne({ roleId: rid })
      if (!roleDoc) return res.status(400).json(createErrorResponse('角色不存在', 400))
      userData.roleId = rid
      userData.roleName = roleDoc.roleName
    }

    if (!userData.username) return res.status(400).json(createErrorResponse('用户名不能为空', 400))
    if (!userData.roleId || !userData.roleName) return res.status(400).json(createErrorResponse('角色不能为空', 400))

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10)
    }

    const user = new User(userData)
    const saved = await user.save()
    const result = saved.toObject()
    delete result.password
    res.status(201).json(createResponse(result, '用户创建成功', 201))
  } catch (error: any) {
    if (error?.code === 11000) return res.status(400).json(createErrorResponse('用户名已存在', 400))
    res.status(500).json(createErrorResponse('创建用户失败', 500))
  }
})

app.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const body = req.body || {}

    // 解析当前登录用户
    const authorization = req.get('Authorization') || ''
    let currentUser: any = null
    if (authorization.startsWith('mock-jwt-token-')) {
      const parts = authorization.split('-')
      if (parts.length >= 5) {
        const currentUsername = decodeURIComponent(parts[3])
        currentUser = await User.findOne({ username: currentUsername })
      }
    }

    // 目标查询条件（兼容 _id 与 userId）
    let query: any
    let targetUserIdNum: number | null = null
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id }
    } else {
      const num = Number(id)
      if (Number.isNaN(num)) return res.status(400).json(createErrorResponse('无效的用户ID', 400))
      query = { userId: num }
      targetUserIdNum = num
    }

    // 是否在修改自己的账号
    const isSelf = !!(
      currentUser && (
        (query._id && String(currentUser._id) === String(query._id)) ||
        (targetUserIdNum !== null && currentUser.userId === targetUserIdNum)
      )
    )

    const updateData: any = { updateTime: new Date() }

    if (body.username ?? body.userName) updateData.username = body.username ?? body.userName
    if (body.nickname ?? body.nickName) updateData.nickname = body.nickname ?? body.nickName
    if (body.email ?? body.userEmail) updateData.email = body.email ?? body.userEmail
    if (body.phone ?? body.userPhone) updateData.phone = body.phone ?? body.userPhone
    if (body.avatar) updateData.avatar = body.avatar

    if (body.status !== undefined) updateData.enabled = String(body.status) === '1'
    else if (body.enabled !== undefined) updateData.enabled = !!body.enabled

    // 角色修改限制：不允许用户修改自己的角色
    const wantChangeRole = (
      body.roleId !== undefined || body.roleName !== undefined ||
      (Array.isArray(body.roleIds) && body.roleIds.length > 0) ||
      body.roleCode !== undefined
    )
    if (isSelf && wantChangeRole) {
      return res.status(403).json(createErrorResponse('不允许修改自己的角色', 403))
    }

    if (!isSelf) {
      // 角色映射：优先 roleId/roleName；否则从 roleIds/roleCode 推断
      let targetRoleId: number | undefined = body.roleId
      let targetRoleName: string | undefined = body.roleName

      if ((!targetRoleId || !targetRoleName) && Array.isArray(body.roleIds) && body.roleIds.length > 0) {
        const rid = Number(body.roleIds[0])
        if (!Number.isNaN(rid)) targetRoleId = rid
      }
      if (!targetRoleId && body.roleCode) {
        const roleByCode = await Role.findOne({ roleCode: body.roleCode })
        if (roleByCode) {
          targetRoleId = roleByCode.roleId
          targetRoleName = roleByCode.roleName
        }
      }
      if (targetRoleId && !targetRoleName) {
        const roleDoc = await Role.findOne({ roleId: targetRoleId })
        if (roleDoc) targetRoleName = roleDoc.roleName
        else return res.status(400).json(createErrorResponse('角色不存在', 400))
      }
      if (targetRoleId) {
        updateData.roleId = targetRoleId
        updateData.roleName = targetRoleName
      }
    }

    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10)
    }

    // 清理无关字段（后端不接收）
    const omitFields = ['id','userName','nickName','userEmail','userPhone','status','roleIds','roles','roleCode','permissions','createBy','updateBy']
    for (const k of omitFields) delete (updateData as any)[k]

    const user = await User.findOneAndUpdate(query, updateData, { new: true, runValidators: true }).select('-password')
    if (!user) return res.status(404).json(createErrorResponse('用户未找到', 404))
    res.json(createResponse(user, '用户更新成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('更新用户失败', 500))
  }
})

app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    let query: any
    if (mongoose.Types.ObjectId.isValid(id)) query = { _id: id }
    else {
      const num = Number(id)
      if (Number.isNaN(num)) return res.status(400).json(createErrorResponse('无效的用户ID', 400))
      query = { userId: num }
    }
    const user = await User.findOneAndDelete(query)
    if (!user) return res.status(404).json(createErrorResponse('用户未找到', 404))
    res.json(createResponse(null, '用户删除成功'))
  } catch (error: any) {
    if (error?.name === 'CastError') return res.status(400).json(createErrorResponse('无效的用户ID', 400))
    res.status(500).json(createErrorResponse('删除用户失败', 500))
  }
})

// ==================== 角色路由 ====================
app.get('/api/roles', async (req: Request, res: Response) => {
  try {
    const { current = 1, size = 20 } = req.query
    const pageNum = Number(current)
    const pageSize = Number(size)
    const skip = (pageNum - 1) * pageSize
    const roles = await Role.find()
      .skip(skip)
      .limit(pageSize)
      .sort({ createTime: -1 })
      .exec()
    const total = await Role.countDocuments()
    res.json(
      createResponse(
        { records: roles, total, current: pageNum, size: pageSize },
        '获取角色列表成功',
      ),
    )
  } catch (error) {
    console.error('获取角色列表失败:', error)
    res.status(500).json(createErrorResponse('获取角色列表失败', 500))
  }
})

app.get('/api/roles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    let query: any
    if (mongoose.Types.ObjectId.isValid(id)) query = { _id: id }
    else {
      const num = Number(id)
      if (Number.isNaN(num)) return res.status(400).json(createErrorResponse('无效的角色ID', 400))
      query = { roleId: num }
    }
    const role = await Role.findOne(query)
    if (!role) return res.status(404).json(createErrorResponse('角色未找到', 404))
    res.json(createResponse(role, '获取角色成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('获取角色失败', 500))
  }
})

app.post('/api/roles', async (req: Request, res: Response) => {
  try {
    const roleData = req.body
    const role = new Role(roleData)
    const saved = await role.save()
    res.status(201).json(createResponse(saved, '角色创建成功', 201))
  } catch (error: any) {
    if (error?.code === 11000) return res.status(400).json(createErrorResponse('角色编码已存在', 400))
    res.status(500).json(createErrorResponse('创建角色失败', 500))
  }
})

app.put('/api/roles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const body = req.body || {}

    const updateData: any = { updateTime: new Date() }
    if (body.roleName !== undefined) updateData.roleName = body.roleName
    if (body.roleCode !== undefined) updateData.roleCode = body.roleCode
    if (body.description !== undefined) updateData.description = body.description
    if (body.permissions !== undefined) updateData.permissions = body.permissions
    if (body.enabled !== undefined) updateData.enabled = !!body.enabled
    if (body.status !== undefined) updateData.enabled = String(body.status) === '1'

    let query: any
    if (mongoose.Types.ObjectId.isValid(id)) query = { _id: id }
    else {
      const num = Number(id)
      if (Number.isNaN(num)) return res.status(400).json(createErrorResponse('无效的角色ID', 400))
      query = { roleId: num }
    }

    const role = await Role.findOneAndUpdate(query, updateData, { new: true, runValidators: true })
    if (!role) return res.status(404).json(createErrorResponse('角色未找到', 404))
    res.json(createResponse(role, '角色更新成功'))
  } catch (error: any) {
    if (error?.code === 11000) return res.status(400).json(createErrorResponse('角色编码已存在', 400))
    res.status(500).json(createErrorResponse('更新角色失败', 500))
  }
})

app.delete('/api/roles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const role = await Role.findByIdAndDelete(id)
    if (!role) return res.status(404).json(createErrorResponse('角色未找到', 404))
    res.json(createResponse(null, '角色删除成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('删除角色失败', 500))
  }
})

// ==================== 认证路由 ====================
// 登录：校验用户名/密码（兼容明文或bcrypt哈希），可选校验角色。
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password, roleId, roleName, roleCode } = (req.body || {}) as {
      username?: string
      password?: string
      roleId?: number
      roleName?: string
      roleCode?: string
    }
    if (!username || !password) return res.status(400).json(createErrorResponse('用户名和密码不能为空', 400))

    // 1) 查找用户
    const user = await User.findOne({ username })
    if (!user) return res.status(401).json(createErrorResponse('用户名或密码错误', 401))
    if (user.enabled === false) return res.status(403).json(createErrorResponse('用户已被禁用', 403))

    // 2) 可选：校验角色
    if (roleId !== undefined && user.roleId !== roleId) {
      return res.status(403).json(createErrorResponse('角色不匹配', 403))
    }
    if (roleName && user.roleName !== roleName) {
      return res.status(403).json(createErrorResponse('角色不匹配', 403))
    }
    if (roleCode) {
      const role = await Role.findOne({ roleCode })
      if (!role || role.roleId !== user.roleId) return res.status(403).json(createErrorResponse('角色不匹配', 403))
    }

    // 3) 校验密码：先尝试bcrypt.compare，失败时再与明文比较（兼容历史数据）
    let passOK = false
    try {
      passOK = await bcrypt.compare(password, user.password)
    } catch {
      passOK = false
    }
    if (!passOK) {
      // 如果库里存的是明文，直接比较
      if (user.password === password) passOK = true
    }
    if (!passOK) return res.status(401).json(createErrorResponse('用户名或密码错误', 401))

    // 4) 生成 mock token（前端按该格式读取用户名）
    const token = `mock-jwt-token-${encodeURIComponent(username)}-${Date.now()}`

    // 组装权限与角色码
    const roleDoc = await Role.findOne({ roleId: user.roleId }).lean()
    const safeUser = user.toObject() as any
    delete safeUser.password
    safeUser.roleCode = roleDoc?.roleCode || ''
    safeUser.roles = roleDoc?.roleCode ? Array.from(new Set([
      String(roleDoc.roleCode).toUpperCase(),
      String(roleDoc.roleCode).toLowerCase(),
      `R_${String(roleDoc.roleCode).toUpperCase()}`
    ])) : []
    safeUser.permissions = (Array.isArray(roleDoc?.permissions) && roleDoc!.permissions.length > 0)
      ? roleDoc!.permissions
      : deriveDefaultPermissions(roleDoc?.roleCode)

    res.json(createResponse({ token, user: safeUser }, '登录成功'))
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json(createErrorResponse('登录失败', 500))
  }
})

// 注册：创建新用户（默认角色 READER/VIEWER；若不存在则自动创建 READER）
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, confirmPassword } = (req.body || {}) as {
      username?: string
      email?: string
      password?: string
      confirmPassword?: string
    }

    if (!username || !password) return res.status(400).json(createErrorResponse('用户名和密码不能为空', 400))
    if (password.length < 6) return res.status(400).json(createErrorResponse('密码长度不能少于6位', 400))
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json(createErrorResponse('两次输入的密码不一致', 400))
    }

    // 用户名唯一
    const exists = await User.findOne({ username })
    if (exists) return res.status(400).json(createErrorResponse('用户名已存在', 400))

    // 准备角色：优先 READER -> VIEWER；若都不存在则创建一个 READER
        // 优先使用 USER 角色，其次 READER、VIEWER；若都不存在则创建 USER
    let roleDoc = await Role.findOne({ roleCode: 'USER' })
    if (!roleDoc) roleDoc = await Role.findOne({ roleCode: 'READER' })
    if (!roleDoc) roleDoc = await Role.findOne({ roleCode: 'VIEWER' })

    if (!roleDoc) {
      const lastRole = await Role.findOne().sort({ roleId: -1 }).lean()
      const nextRoleId = (lastRole?.roleId ?? 100) + 1
      roleDoc = await Role.create({
        roleId: nextRoleId,
        roleName: '普通用户',
        roleCode: 'USER',
        enabled: true,
        permissions: deriveDefaultPermissions('USER')
      })
    }

    // 生成自增 userId
    const lastUser = await User.findOne().sort({ userId: -1 }).lean()
    const nextUserId = (lastUser?.userId ?? 1000) + 1

    // 哈希密码
    const hashed = await bcrypt.hash(password, 10)

    const user = await User.create({
      userId: nextUserId,
      username,
      nickname: username,
      password: hashed,
      avatar: '',
      email: email || '',
      phone: '',
      roleId: roleDoc.roleId,
      roleName: roleDoc.roleName,
      enabled: true,
      registerSource: 'frontend',
      createTime: new Date(),
      updateTime: new Date(),
    })

    const safe = user.toObject()
    delete (safe as any).password

    res.json(createResponse({ id: safe.userId, username: safe.username }, '注册成功'))
  } catch (error) {
    console.error('注册失败:', error)
    res.status(500).json(createErrorResponse('注册失败', 500))
  }
})

app.get('/api/auth/user-info', async (req: Request, res: Response) => {
  try {
    const authorization = req.get('Authorization') || ''
    if (!authorization.startsWith('mock-jwt-token-')) {
      return res.status(401).json(createErrorResponse('未授权', 401))
    }
    // 从 token 中提取用户信息
    const tokenParts = authorization.split('-')
    if (tokenParts.length < 5) {
      return res.status(401).json(createErrorResponse('无效的token', 401))
    }
    const username = decodeURIComponent(tokenParts[3])
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(404).json(createErrorResponse('用户不存在', 404))
    }
    const roleDoc = await Role.findOne({ roleId: user.roleId }).lean()
    const safeUser = user.toObject() as any
    delete safeUser.password
    safeUser.roleCode = roleDoc?.roleCode || ''
    safeUser.roles = roleDoc?.roleCode ? Array.from(new Set([
      String(roleDoc.roleCode).toUpperCase(),
      String(roleDoc.roleCode).toLowerCase(),
      `R_${String(roleDoc.roleCode).toUpperCase()}`
    ])) : []
    safeUser.permissions = (Array.isArray(roleDoc?.permissions) && roleDoc!.permissions.length > 0)
      ? roleDoc!.permissions
      : deriveDefaultPermissions(roleDoc?.roleCode)
    res.json(createResponse(safeUser, '获取用户信息成功'))
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json(createErrorResponse('获取用户信息失败', 500))
  }
})

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    res.json(createResponse(null, '登出成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('登出失败', 500))
  }
})

// ==================== 说说路由 ====================
app.get('/api/talks', async (req: Request, res: Response) => {
  try {
    const { current = 1, size = 20, status, keyword } = req.query
    const pageNum = Number(current)
    const pageSize = Number(size)
    const skip = (pageNum - 1) * pageSize
    
    // 构建查询条件
    const query: any = {}
    
    // 状态过滤：如果指定了status且不是'all'，则按status过滤；否则只显示public状态
    if (status && status !== 'all') {
      query.status = status
      console.log(`[说说列表] 按状态过滤: ${status}`)
    } else {
      query.status = 'public'
      console.log('[说说列表] 显示public状态的说说')
    }
    
    // 关键词搜索
    if (keyword) {
      query.content = { $regex: keyword, $options: 'i' }
      console.log(`[说说列表] 按关键词搜索: ${keyword}`)
    }
    
    console.log('[说说列表] 查询条件:', query)
    
    const talks = await Talk.find(query)
      .skip(skip)
      .limit(pageSize)
      .sort({ isTop: -1, publishDate: -1 })
      .exec()
    const total = await Talk.countDocuments(query)
    
    console.log(`[说说列表] 返回${talks.length}条记录，总计${total}条`)
    
    res.json(
      createResponse(
        { records: talks, total, current: pageNum, size: pageSize },
        '获取说说列表成功',
      ),
    )
  } catch (error) {
    console.error('获取说说列表失败:', error)
    res.status(500).json(createErrorResponse('获取说说列表失败', 500))
  }
})

app.get('/api/talks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const talk = await Talk.findById(id)
    if (!talk) return res.status(404).json(createErrorResponse('说说未找到', 404))
    res.json(createResponse(talk, '获取说说成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('获取说说失败', 500))
  }
})

app.post('/api/talks', async (req: Request, res: Response) => {
  try {
    const talkData = req.body
    const talk = new Talk(talkData)
    const saved = await talk.save()
    res.status(201).json(createResponse(saved, '说说创建成功', 201))
  } catch (error) {
    res.status(500).json(createErrorResponse('创建说说失败', 500))
  }
})

app.put('/api/talks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body, updateDate: new Date() }
    const talk = await Talk.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    if (!talk) return res.status(404).json(createErrorResponse('说说未找到', 404))
    res.json(createResponse(talk, '说说更新成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('更新说说失败', 500))
  }
})

app.delete('/api/talks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const talk = await Talk.findByIdAndDelete(id)
    if (!talk) return res.status(404).json(createErrorResponse('说说未找到', 404))
    res.json(createResponse(null, '说说删除成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('删除说说失败', 500))
  }
})

// ==================== 回复路由 ====================
app.get('/api/replies', async (req: Request, res: Response) => {
  try {
    const { talkId, current = 1, size = 20 } = req.query
    const query: any = { status: 'approved' }
    if (talkId) query.talkId = talkId
    const pageNum = Number(current)
    const pageSize = Number(size)
    const skip = (pageNum - 1) * pageSize
    const replies = await Reply.find(query)
      .skip(skip)
      .limit(pageSize)
      .sort({ publishDate: -1 })
      .exec()
    const total = await Reply.countDocuments(query)
    res.json(
      createResponse(
        { records: replies, total, current: pageNum, size: pageSize },
        '获取回复列表成功',
      ),
    )
  } catch (error) {
    console.error('获取回复列表失败:', error)
    res.status(500).json(createErrorResponse('获取回复列表失败', 500))
  }
})

app.post('/api/replies', async (req: Request, res: Response) => {
  try {
    const replyData = req.body
    const reply = new Reply(replyData)
    const saved = await reply.save()
    res.status(201).json(createResponse(saved, '回复创建成功', 201))
  } catch (error) {
    res.status(500).json(createErrorResponse('创建回复失败', 500))
  }
})

app.delete('/api/replies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const reply = await Reply.findByIdAndDelete(id)
    if (!reply) return res.status(404).json(createErrorResponse('回复未找到', 404))
    res.json(createResponse(null, '回复删除成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('删除回复失败', 500))
  }
})

// ==================== 照片分类路由 ====================
app.get('/api/photo-categories', async (req: Request, res: Response) => {
  try {
    // 管理端数据实时性优先：禁用缓存
    res.set('Cache-Control', 'no-store')
    const { admin, status, keyword, page, size } = req.query as {
      admin?: string
      status?: 'active' | 'inactive'
      keyword?: string
      page?: any
      size?: any
    }

    const query: any = {}
    // 前台仅返回可见，后台(admin=true)返回全部
    if (!admin || admin !== 'true') query.isVisible = true
    // 显式状态筛选（active -> isVisible=true, inactive -> isVisible=false）
    if (status === 'active') query.isVisible = true
    if (status === 'inactive') query.isVisible = false

    // 关键词匹配 name/title
    if (keyword && String(keyword).trim()) {
      const kw = String(keyword).trim()
      query.$or = [{ name: { $regex: kw, $options: 'i' } }, { title: { $regex: kw, $options: 'i' } }]
    }

    const baseFind = PhotoCategory.find(query).sort({ sortOrder: 1, createdAt: -1 })

    const usePagination = page && size
    if (usePagination) {
      const pageNum = Number(page)
      const pageSize = Number(size)
      const skip = (pageNum - 1) * pageSize

      const [total, categories] = await Promise.all([
        PhotoCategory.countDocuments(query),
        baseFind.skip(skip).limit(pageSize).exec(),
      ])

      // 统计图片数量（聚合，避免 N+1）
      const ids = categories.map((c) => c.id).filter(Boolean)
      const objIds = categories.map((c) => String(c._id)).filter(Boolean)
      const matchIds = Array.from(new Set([...ids, ...objIds]))
      let countMap = new Map<string, number>()
      if (matchIds.length) {
        const photoMatch: any = { categoryId: { $in: matchIds } }
        if (!admin || admin !== 'true') photoMatch.isVisible = true
        const agg = await Photo.aggregate([
          { $match: photoMatch },
          { $group: { _id: '$categoryId', count: { $sum: 1 } } },
        ]).exec()
        countMap = new Map<string, number>(agg.map((d: any) => [String(d._id), Number(d.count)]))
      }

      const categoriesWithCount = categories.map((c) => {
        const obj = c.toObject()
        return { ...obj, photoCount: (countMap.get(c.id) ?? countMap.get(String(c._id)) ?? 0) }
      })

      return res.json(
        createResponse(
          { categories: categoriesWithCount, total, currentPage: pageNum, pageSize },
          '获取照片分类列表成功',
        ),
      )
    }

    // 不分页：返回数组
    const categories = await baseFind.exec()
    const ids = categories.map((c) => c.id).filter(Boolean)
    const objIds = categories.map((c) => String(c._id)).filter(Boolean)
    const matchIds = Array.from(new Set([...ids, ...objIds]))
    let countMap = new Map<string, number>()
    if (matchIds.length) {
      const photoMatch: any = { categoryId: { $in: matchIds } }
      if (!admin || admin !== 'true') photoMatch.isVisible = true
      const agg = await Photo.aggregate([
        { $match: photoMatch },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ]).exec()
      countMap = new Map<string, number>(agg.map((d: any) => [String(d._id), Number(d.count)]))
    }

    const categoriesWithCount = categories.map((c) => {
      const obj = c.toObject()
      return { ...obj, photoCount: (countMap.get(c.id) ?? countMap.get(String(c._id)) ?? 0) }
    })

    res.json(createResponse(categoriesWithCount, '获取照片分类列表成功'))
  } catch (error) {
    console.error('获取照片分类列表失败:', error)
    res.status(500).json(createErrorResponse('获取照片分类列表失败', 500))
  }
})

app.get('/api/photo-categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    // 同时支持通过 id 字段和 _id 字段查询
    let category
    if (mongoose.Types.ObjectId.isValid(id)) {
      // 如果是有效的 ObjectId，先尝试通过 _id 查询
      category = await PhotoCategory.findById(id)
    }
    // 如果没有找到或不是 ObjectId，尝试通过 id 字段查询
    if (!category) {
      category = await PhotoCategory.findOne({ id })
    }
    if (!category) return res.status(404).json(createErrorResponse('照片分类未找到', 404))
    res.json(createResponse(category, '获取照片分类成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('获取照片分类失败', 500))
  }
})

// 创建照片分类
app.post('/api/photo-categories', async (req: Request, res: Response) => {
  try {
    const body = req.body || {}
    if (!body.name && !body.title) return res.status(400).json(createErrorResponse('分类名称不能为空', 400))

    const categoryData: any = {
      id: body.id || new mongoose.Types.ObjectId().toString(),
      name: body.name || body.title,
      title: body.title || body.name,
      description: body.description || '',
      coverImage: body.coverImage || '',
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : (typeof body.sort === 'number' ? body.sort : 0),
      isVisible: typeof body.isVisible === 'boolean' ? body.isVisible : (typeof body.status === 'string' ? body.status === 'active' : true),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const exists = await PhotoCategory.findOne({ $or: [{ id: categoryData.id }, { name: categoryData.name }] })
    if (exists) return res.status(400).json(createErrorResponse('分类已存在', 400))

    const category = new PhotoCategory(categoryData)
    const saved = await category.save()
    res.status(201).json(createResponse(saved, '照片分类创建成功', 201))
  } catch (error) {
    console.error('创建照片分类失败:', error)
    res.status(500).json(createErrorResponse('创建照片分类失败', 500))
  }
})

// 更新照片分类（支持 _id 或 id）
app.put('/api/photo-categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateBody = req.body || {}
    const cond: any = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { id }] } : { id }

    const mapped: any = { ...updateBody }
    if (typeof updateBody.sortOrder === 'number') mapped.sortOrder = updateBody.sortOrder
    else if (typeof updateBody.sort === 'number') mapped.sortOrder = updateBody.sort
    if (typeof updateBody.status !== 'undefined') mapped.isVisible = updateBody.status === 'active'
    if (typeof updateBody.name === 'string' && !updateBody.title) mapped.title = updateBody.name
    mapped.updatedAt = new Date()

    const category = await PhotoCategory.findOneAndUpdate(cond, mapped, { new: true, runValidators: true })
    if (!category) return res.status(404).json(createErrorResponse('照片分类未找到', 404))
    res.json(createResponse(category, '照片分类更新成功'))
  } catch (error) {
    console.error('更新照片分类失败:', error)
    res.status(500).json(createErrorResponse('更新照片分类失败', 500))
  }
})

// 删除照片分类（支持 _id 或 id），如有图片则禁止删除
app.delete('/api/photo-categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const cond: any = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { id }] } : { id }
    const category = await PhotoCategory.findOne(cond)
    if (!category) return res.status(404).json(createErrorResponse('照片分类未找到', 404))

    const count = await Photo.countDocuments({ categoryId: category.id })
    if (count > 0) return res.status(400).json(createErrorResponse('该分类下还有图片，无法删除', 400))

    await PhotoCategory.deleteOne({ _id: category._id })
    res.json(createResponse(null, '照片分类删除成功'))
  } catch (error) {
    console.error('删除照片分类失败:', error)
    res.status(500).json(createErrorResponse('删除照片分类失败', 500))
  }
})

// 批量删除照片分类
app.delete('/api/photo-categories', async (req: Request, res: Response) => {
  try {
    const ids = (req.body?.ids || []).map((v: any) => String(v)).filter(Boolean)
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json(createErrorResponse('缺少要删除的分类ID', 400))

    const objectIds = ids.filter((s: string) => mongoose.Types.ObjectId.isValid(s))
    const byId = await PhotoCategory.find({ id: { $in: ids } })
    const byObjectId = objectIds.length ? await PhotoCategory.find({ _id: { $in: objectIds } }) : []
    const all = new Map<string, any>()
    ;[...byId, ...byObjectId].forEach((c: any) => all.set(String(c._id), c))

    if (!all.size) return res.status(404).json(createErrorResponse('未找到要删除的分类', 404))

    // 校验是否包含图片
    for (const [, c] of all) {
      const cnt = await Photo.countDocuments({ categoryId: c.id })
      if (cnt > 0) return res.status(400).json(createErrorResponse('选中的分类中有包含图片的分类，无法删除', 400))
    }

    await PhotoCategory.deleteMany({ _id: { $in: Array.from(all.keys()) } })
    res.json(createResponse({ deleted: Array.from(all.values()).map((c) => c.id) }, '批量删除成功'))
  } catch (error) {
    console.error('批量删除照片分类失败:', error)
    res.status(500).json(createErrorResponse('批量删除照片分类失败', 500))
  }
})

// 批量更新照片分类状态
app.patch('/api/photo-categories/status', async (req: Request, res: Response) => {
  try {
    const { ids = [], status } = req.body || {}
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json(createErrorResponse('缺少分类ID', 400))
    if (status !== 'active' && status !== 'inactive') return res.status(400).json(createErrorResponse('非法状态值', 400))

    const idStrs = ids.map((v: any) => String(v)).filter(Boolean)
    const objectIds = idStrs.filter((s: string) => mongoose.Types.ObjectId.isValid(s))
    const filter: any = { $or: [{ id: { $in: idStrs } }] }
    if (objectIds.length) filter.$or.push({ _id: { $in: objectIds } })

    const result = await PhotoCategory.updateMany(filter, { $set: { isVisible: status === 'active', updatedAt: new Date() } })
    res.json(createResponse({ matched: result.matchedCount ?? 0, modified: result.modifiedCount ?? 0 }, '批量更新状态成功'))
  } catch (error) {
    console.error('批量更新照片分类状态失败:', error)
    res.status(500).json(createErrorResponse('批量更新照片分类状态失败', 500))
  }
})

// ==================== 照片路由 ====================
app.get('/api/photos', async (req: Request, res: Response) => {
  try {
    const { categoryId, current = 1, size = 20, admin } = req.query as any
    const query: any = {}
    if (!admin || admin !== 'true') query.isVisible = true
    if (categoryId) {
      const ids: string[] = [String(categoryId)]
      try {
        // 若传入 _id，则补充其对应的自定义 id；若传入 id，则补充其 _id 字符串
        if (mongoose.Types.ObjectId.isValid(String(categoryId))) {
          const cat = await PhotoCategory.findById(String(categoryId)).select('_id id').lean()
          if (cat?.id) ids.push(String(cat.id))
        } else {
          const cat = await PhotoCategory.findOne({ id: String(categoryId) }).select('_id id').lean()
          if (cat?._id) ids.push(String(cat._id))
        }
      } catch {}
      query.categoryId = { $in: Array.from(new Set(ids)) }
    }
    const pageNum = Number(current)
    const pageSize = Number(size)
    const skip = (pageNum - 1) * pageSize
    const photos = await Photo.find(query)
      .skip(skip)
      .limit(pageSize)
      .sort({ sortOrder: 1, uploadDate: -1 })
      .exec()
    const total = await Photo.countDocuments(query)
    res.json(
      createResponse(
        { records: photos, total, current: pageNum, size: pageSize },
        '获取照片列表成功',
      ),
    )
  } catch (error) {
    console.error('获取照片列表失败:', error)
    res.status(500).json(createErrorResponse('获取照片列表失败', 500))
  }
})

app.get('/api/photos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const photo = await Photo.findById(id)
    if (!photo) return res.status(404).json(createErrorResponse('照片未找到', 404))
    res.json(createResponse(photo, '获取照片成功'))
  } catch (error) {
    res.status(500).json(createErrorResponse('获取照片失败', 500))
  }
})

// ==================== 标签路由 ====================
app.get('/api/tags', async (req: Request, res: Response) => {
  try {
    const { admin, limit, q } = req.query as { admin?: string; limit?: any; q?: string }
    const articleMatch: any = {}
    if (!admin || admin !== 'true') articleMatch.visible = { $ne: false }

    const pipeline: any[] = []
    if (Object.keys(articleMatch).length) pipeline.push({ $match: articleMatch })
    pipeline.push({ $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } })
    if (q && String(q).trim()) pipeline.push({ $match: { tags: { $regex: String(q).trim(), $options: 'i' } } })
    pipeline.push({ $group: { _id: '$tags', count: { $sum: 1 } } })
    pipeline.push({ $sort: { count: -1, _id: 1 } })
    if (limit) pipeline.push({ $limit: Number(limit) })

    const agg = await Article.aggregate(pipeline).exec()
    const tags = agg.map((it: any) => ({ name: it._id, count: it.count }))
    res.json(createResponse(tags, '获取标签列表成功'))
  } catch (error) {
    console.error('获取标签列表失败:', error)
    res.status(500).json(createErrorResponse('获取标签列表失败', 500))
  }
})

// 全局错误处理
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('服务器错误:', err)
  res.status(500).json(createErrorResponse('服务器内部错误', 500))
})

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json(createErrorResponse('接口不存在', 404))
})

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
  console.log('允许的CORS来源:', ALLOW_ORIGINS)
  console.log('上传目录:', uploadDir)
  console.log('MongoDB URI:', MONGODB_URI)
})

