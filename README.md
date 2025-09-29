# My Blog - 统一后端API博客系统

这是一个基于 Vue3 + TypeScript + Express + MongoDB 的全栈博客系统，包含前台展示和后台管理功能，使用统一的后端API服务。

## 项目结构

```
my-blog/
├── myblog/                 # 前台博客展示
│   ├── src/
│   │   ├── api/           # API接口
│   │   ├── components/    # 组件
│   │   ├── composables/   # 组合式函数
│   │   ├── service/       # 后端服务
│   │   ├── stores/        # 状态管理
│   │   └── views/         # 页面
│   └── package.json
├── myblog-admin/          # 后台管理系统
│   ├── src/
│   │   ├── api/           # API接口
│   │   ├── components/    # 组件
│   │   ├── views/         # 页面
│   │   └── utils/         # 工具函数
│   └── package.json
├── start-dev.bat          # 开发环境启动脚本
└── README.md
```

## 功能特性

### 前台功能
- ✅ 文章列表展示
- ✅ 文章详情查看
- ✅ 文章点赞功能
- ✅ 标签云展示
- ✅ 分页功能
- ✅ 响应式设计

### 后台管理功能
- ✅ 文章列表管理
- ✅ 文章发布/编辑
- ✅ 文章删除
- ✅ 分类管理
- ✅ 富文本编辑器
- ✅ 图片上传

### 统一API功能
- ✅ RESTful API设计
- ✅ MongoDB数据存储
- ✅ 统一响应格式
- ✅ 错误处理
- ✅ CORS支持
- ✅ 搜索功能
- ✅ 分页支持

## 技术栈

### 前端技术
- **Vue 3** - 前端框架
- **TypeScript** - 类型安全
- **Element Plus** - UI组件库
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Vite** - 构建工具

### 后端技术
- **Express** - Web框架
- **MongoDB** - 数据库
- **Mongoose** - ODM工具
- **CORS** - 跨域支持

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- MongoDB >= 5.0

### 安装依赖

```bash
# 安装前台依赖
cd myblog
npm install

# 安装后台依赖
cd ../myblog-admin
npm install
```

### 启动开发环境

#### 方式一：使用启动脚本（推荐）
```bash
# Windows
start-dev.bat
```

#### 方式二：手动启动
```bash
# 1. 启动API服务器
cd myblog
npm run dev:server

# 2. 启动前台（新终端）
cd myblog
npm run dev

# 3. 启动后台管理（新终端）
cd myblog-admin
npm run dev
```

### 访问地址
- 前台博客：http://localhost:5173
- 后台管理：http://localhost:5174
- API服务：http://localhost:3001

## API文档

### 文章相关接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/articles` | 获取文章列表 |
| GET | `/api/articles/:id` | 获取文章详情 |
| POST | `/api/articles` | 创建文章 |
| PUT | `/api/articles/:id` | 更新文章 |
| DELETE | `/api/articles/:id` | 删除文章 |
| POST | `/api/articles/:id/like` | 点赞文章 |
| POST | `/api/articles/:id/unlike` | 取消点赞 |

### 分类和标签接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/categories` | 获取分类列表 |
| GET | `/api/tags` | 获取标签列表 |

### 其他接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/articles/popular` | 获取热门文章 |
| GET | `/api/articles/search` | 搜索文章 |
| POST | `/api/uploads` | 文件上传 |

## 数据库设计

### Article 文章模型
```javascript
{
  title: String,           // 标题
  slug: String,           // URL别名
  content: String,        // 内容
  contentFormat: String,  // 内容格式 (markdown/html)
  contentHtml: String,    // HTML内容
  author: String,         // 作者
  category: String,       // 分类
  tags: [String],        // 标签
  publishDate: Date,      // 发布时间
  updateDate: Date,       // 更新时间
  likes: Number,          // 点赞数
  views: Number,          // 浏览量
  excerpt: String,        // 摘要
  image: String          // 封面图片
}
```

## 核心特性说明

### 1. 统一API架构
- 前台和后台共享同一套API接口
- 统一的响应格式和错误处理
- 支持实时数据同步

### 2. 数据实时同步
- 后台管理修改文章后，前台立即可以看到更新
- 使用相同的数据源和API接口
- 无需手动刷新或重新部署

### 3. 响应式设计
- 前台支持移动端和桌面端
- 后台管理系统响应式布局
- 良好的用户体验

### 4. 开发体验
- TypeScript类型安全
- 热更新开发环境
- 统一的代码规范

## 部署说明

### 生产环境部署

1. **构建前端项目**
```bash
# 构建前台
cd myblog
npm run build

# 构建后台
cd ../myblog-admin
npm run build
```

2. **部署后端服务**
```bash
# 启动API服务器
cd myblog
npm run dev:server
```

3. **配置Web服务器**
- 将构建好的静态文件部署到Web服务器
- 配置反向代理到API服务器

### 环境变量配置

```bash
# .env
VITE_API_URL=http://localhost:3001
MONGODB_URI=mongodb://localhost:27017/my-blog
```

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 更新日志

### v1.0.0 (2025-01-13)
- ✅ 实现统一的后端API服务
- ✅ 前台博客展示功能
- ✅ 后台管理系统
- ✅ 数据实时同步
- ✅ 文章增删改查
- ✅ 点赞功能
- ✅ 搜索功能
- ✅ 分页功能

## 联系方式

如有问题或建议，请提交 Issue 或联系开发者。