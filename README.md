# My Blog - 统一后端API博客系统

这是一个基于 **Vue3 + TypeScript + Express + MongoDB** 的全栈博客系统，包含前台展示和后台管理功能，使用统一的后端API服务。该项目采用 **monorepo** 架构，实现前后端分离，支持实时数据同步和高效的开发工作流。

## 🌟 项目特色

- ✨ **统一API架构** - 前台和后台共享同一套API接口，实现数据实时同步
- 🚀 **现代技术栈** - Vue3 + TypeScript + Vite，享受最新的开发体验
- 📱 **响应式设计** - 完美适配桌面端、平板和移动设备
- 🎨 **现代化UI** - 使用Element Plus组件库，支持暗黑模式
- 🔐 **安全可靠** - 完善的身份验证、权限控制和数据验证
- 📊 **数据可视化** - 丰富的图表和统计功能
- 🔍 **全文搜索** - 支持文章内容全文搜索和关键词高亮
- 🖼️ **媒体管理** - 完整的图片上传、相册管理功能
- ⚡ **性能优化** - 代码分割、图片懒加载、缓存策略
- 📚 **完整文档** - 详细的API文档和开发指南

## 📸 项目预览
 ### 客户端
  ![首页](https://i.imgur.com/BRPE5ic.png)
  - 文章详情
  ![文章详情](https://i.imgur.com/zEYIekr.png)
  - 其他
  ![其他](https://i.imgur.com/uxrlDOs.png) 
         ![1](https://i.imgur.com/PbYWMEj.png)    
         ![2](https://i.imgur.com/EwA12VW.png) 
         ![3](https://i.imgur.com/d1r8L8h.png)
         ![4](https://i.imgur.com/nGaTwmr.png)
         ![5](https://i.imgur.com/EEScWQa.png)
         ![6](https://i.imgur.com/GPfyAwu.png)
### 管理端
 。。。
### 前台博客展示
- 🌐 **访问地址**: [https://www.xhui886.online](生产环境);[http://localhost:5173] (开发环境)
- 📱 **响应式设计**: 支持桌面端和移动端访[object Object]**现代化UI**: 简洁美观的用户界面，支持暗黑模式
- ✨ **动画效果**: 流畅的页面过渡和交互动画
- 🔍 **全文搜索**: 支持文章内容全文搜索和关键词高亮
- 💬 **互动功能**: 文章点赞、浏览量统计、评论功能

### 后台管理系统
- 🔧 **访问地址**: [https://www.xiaohui88.site](生产环境);[http://localhost:5174] (开发环境)
- 📊 **数据统计**: 文章、访问量、用户等数据可视化
- ✏️ **内容管理**: 富文本编辑器，支持Markdown和可视化编辑
- 🖼️ **媒体管理**: 图片上传、相册管理、图片分类
- [object Object] 用户信息管理、权限控制、角色分[object Object]数据分析**: 访问统计、热门文章排行、用户行为分析

## 📁 项目结构

```
myblog/
├── myblog/                         # 前台博客展示
│   ├── src/
│   │   ├── api/                   # API接口定义
│   │   │   ├── articles.ts        # 文章API
│   │   │   ├── auth.ts            # 认证API
│   │   │   ├── photos.ts          # 图片API
│   │   │   ├── talks.ts           # 动态API
│   │   │   └── user.ts            # 用户API
│   │   ├── assets/                # 静态资源
│   │   │   ├── images/            # 图片资源
│   │   │   └── style/             # 全局样式
│   │   ├── components/            # Vue可复用组件
│   │   │   ├── NavBar.vue         # 导航栏
│   │   │   ├── Footer.vue         # 页脚
│   │   │   ├── ReadingProgress.vue # 阅读进度
│   │   │   └── ...
│   │   ├── composables/           # 组合式函数
│   │   │   ├── useArticles.ts     # 文章相关逻辑
│   │   │   ├── usePhotos.ts       # 图片相关逻辑
│   │   │   └── ...
│   │   ├── directives/            # 自定义指令
│   │   ├── router/                # 路由配置
│   │   │   ├── index.ts           # 路由定义
│   │   │   └── guards.ts          # 路由守卫
│   │   ├── stores/                # Pinia状态管理
│   │   │   ├── user.ts            # 用户状态
│   │   │   ├── articles.ts        # 文章状态
│   │   │   └── talks.ts           # 动态状态
│   │   ├── types/                 # TypeScript类型定义
│   │   │   ├── api.d.ts           # API类型
│   │   │   ├── http.d.ts          # HTTP类型
│   │   │   └── index.ts           # 通用类型
│   │   ├── utils/                 # 工具函数
│   │   │   ├── http/              # HTTP请求工具
│   │   │   ├── format.ts          # 格式化工具
│   │   │   ├── storage.ts         # 本地存储工具
│   │   │   └── ...
│   │   ├── views/                 # 页面组件
│   │   │   ├── Home.vue           # 首页
│   │   │   ├── ArticleDetail.vue  # 文章详情
│   │   │   ├── Login.vue          # 登录页
│   │   │   ├── PhotoAlbum.vue     # 相册页
│   │   │   └── ...
│   │   ├── App.vue                # 根组件
│   │   └── main.ts                # 应用入口
│   ├── uploads/                   # 文件上传目录
│   ├── public/                    # 公共资源
│   ├── index.html                 # HTML模板
│   ├── package.json               # 前台依赖配置
│   ├── vite.config.ts             # Vite构建配置
│   ├── tsconfig.json              # TypeScript配置
│   └── README.md                  # 前台项目说明
│
├── myblog-admin/                  # 后台管理系统
│   ├── src/
│   │   ├── api/                   # API接口
│   │   ├── assets/                # 静态资源
│   │   ├── components/            # 管理组件
│   │   │   ├── core/              # 核心组件
│   │   │   └── custom/            # 自定义组件
│   │   ├── composables/           # 组合式函数
│   │   ├── config/                # 配置文件
│   │   ├── directives/            # 自定义指令
│   │   ├── enums/                 # 枚举定义
│   │   ├── locales/               # 国际化配置
│   │   ├── router/                # 路由配置
│   │   │   ├── index.ts           # 路由定义
│   │   │   ├── routes/            # 路由模块
│   │   │   └── guards/            # 路由守卫
│   │   ├── store/                 # 状态管理
│   │   │   └── modules/           # 状态模块
│   │   ├── types/                 # 类型定义
│   │   ├── utils/                 # 工具函数
│   │   │   ├── http/              # HTTP工具
│   │   │   ├── browser/           # 浏览器工具
│   │   │   └── ...
│   │   ├── views/                 # 管理页面
│   │   │   ├── article/           # 文章管理
│   │   │   ├── dashboard/         # 仪表板
│   │   │   ├── user/              # 用户管理
│   │   │   └── ...
│   │   ├── App.vue                # 根组件
│   │   └── main.ts                # 应用入口
│   ├── public/                    # 公共资源
│   ├── index.html                 # HTML模板
│   ├── package.json               # 后台依赖配置
│   ├── vite.config.ts             # Vite构建配置
│   ├── tsconfig.json              # TypeScript配置
│   └── README.md                  # 后台项目说明
│
├── shared/                        # 共享配置和工具
│   ├── config/                    # 共享配置文件
│   │   ├── tsconfig.base.json     # TypeScript基础配置
│   │   ├── vite.config.base.ts    # Vite基础配置
│   │   ├── eslint.config.mjs      # ESLint配置
│   │   └── .prettierrc.json       # Prettier配置
│   └── utils/                     # 共享工具函数
│       └── http/                  # HTTP请求工具
│
├── api/                           # 后端API服务 (Express + MongoDB)
│   ├── src/
│   │   ├── models/                # 数据模型
│   │   ├── routes/                # 路由定义
│   │   ├── controllers/           # 控制器
│   │   ├── middleware/            # 中间件
│   │   ├── services/              # 业务逻辑
│   │   ├── utils/                 # 工具函数
│   │   └── server.ts              # 服务器入口
│   ├── package.json               # 后端依赖配置
│   ├── tsconfig.json              # TypeScript配置
│   └── README.md                  # 后端项目说明
│
├── package.json                   # 根项目配置
├── pnpm-workspace.yaml            # pnpm工作区配置
├── pnpm-lock.yaml                 # 依赖锁定文件
├── start-dev.bat                  # Windows开发环境启动脚本
└── README.md                      # 项目说明文档
```

## ⭐ 功能特性

### 前台功能
- ✅ **文章展示** - 文章列表、详情页面、分页浏览、分类筛选
- ✅ **互动功能** - 文章点赞、浏览量统计、评论功能
- ✅ **内容组织** - 标签云展示、分类筛选、时间线展示
- ✅ **搜索功能** - 全文搜索、关键词高亮、搜索建议
- ✅ **响应式设计** - 完美适配桌面端和移动端
- ✅ **SEO优化** - 友好的URL结构和元数据
- ✅ **用户认证** - 登录、注册、密码重置、七天免登录
- ✅ **个人中心** - 用户信息管理、点赞记录、浏览历史
- ✅ **相册功能** - 图片分类、相册展示、图片预览
- ✅ **动态功能** - 发布动态、点赞、评论、分享

### 后台管理功能
- ✅ **文章管理** - 发布、编辑、删除、批量操作文章
- ✅ **富文本编辑** - 支持Markdown和可视化编辑、代码高亮
- ✅ **媒体管理** - 图片上传、文件管理、相册分类
- ✅ **分类标签** - 分类和标签的增删改查、关联管理
- ✅ **数据统计** - 文章数量、访问统计、热门排行
- ✅ **用户管理** - 用户信息管理、权限控制、角色分配
- ✅ **评论管理** - 评论审核、删除、回复管理
- ✅ **系统设置** - 网站配置、主题设置、备份恢复
- ✅ **用户界面** - 现代化的管理界面、暗黑模式、国际化

### 统一API功能
- ✅ **RESTful设计** - 标准的REST API接口
- ✅ **数据持久化** - MongoDB数据存储
- ✅ **统一响应** - 标准化的API响应格式
- ✅ **错误处理** - 完善的错误处理机制
- ✅ **跨域支持** - CORS配置
- ✅ **实时同步** - 前后台数据实时同步
- ✅ **身份验证** - JWT令牌认证
- ✅ **权限控制** - 基于角色的访问控制
- ✅ **请求限流** - API访问频率限制
- ✅ **日志记录** - 完整的操作日志

## 🛠️ 技术栈

### 前端技术
| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5+ | 渐进式JavaScript框架 |
| TypeScript | 5.8+ | 类型安全的JavaScript超集 |
| Vite | 7.1+ | 下一代前端构建工具 |
| Vue Router | 4.5+ | Vue.js官方路由管理器 |
| Pinia | 3.0+ | Vue状态管理库 |
| Element Plus | 2.10+ | Vue 3组件库 |
| Axios | 1.11+ | HTTP客户端库 |
| Markdown-it | 14.1+ | Markdown解析器 |
| Highlight.js | 11.11+ | 代码语法高亮 |
| DOMPurify | 3.2+ | HTML净化工具 |
| Animate.css | 4.1+ | CSS动画库 |

### 后端技术
| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | JavaScript运行时环境 |
| Express | 5.1+ | Web应用框架 |
| MongoDB | 5.0+ | NoSQL文档数据库 |
| Mongoose | 8.18+ | MongoDB对象建模工具 |
| TypeScript | 5.8+ | 类型安全的JavaScript超集 |
| CORS | 2.8+ | 跨域资源共享中间件 |
| Morgan | - | HTTP请求日志中间件 |
| Multer | - | 文件上传处理中间件 |
| Bcrypt | - | 密码加密工具 |
| Jsonwebtoken | - | JWT令牌生成和验证 |

### 开发工具
| 工具 | 版本 | 说明 |
|------|------|------|
| ESLint | 9.9+ | 代码质量检查工具 |
| Prettier | 3.5+ | 代码格式化工具 |
| Stylelint | - | CSS代码检查工具 |
| Husky | - | Git钩子工具 |
| Commitizen | - | 规范化提交工具 |
| Sass | - | CSS预处理器 |
| Concurrently | - | 并发运行多个命令 |

## 🚀 快速开始

### 环境要求
- **Node.js** >= 18.0.0
- **MongoDB** >= 5.0
- **pnpm** >= 8.0.0 (推荐) 或 **npm** >= 9.0.0

### 1. 克隆项目

```bash
git clone <repository-url>
cd myblog
```

### 2. 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
# API服务地址
VITE_API_URL=http://localhost:3001

# MongoDB连接
MONGODB_URI=mongodb://localhost:27017/my-blog

# 服务端口
PORT=3001

# JWT密钥
JWT_SECRET=your-secret-key-here

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp
```

### 4. 启动开发环境

#### 方式一：使用启动脚本（推荐）

```bash
# Windows
start-dev.bat

# Linux/Mac
./start-dev.sh
```

#### 方式二：手动启动

```bash
# 启动前台博客 (端口 5173)
cd myblog
pnpm dev

# 启动后台管理 (端口 5174)
cd ../myblog-admin
pnpm dev

# 启动API服务 (端口 3001)
cd ../api
pnpm dev
```

### 5. 访问应用

- 前台博客：http://localhost:5173
- 后台管理：http://localhost:5174
- API服务：http://localhost[object Object] API文档

### 基础信息
- **API基础URL**: `http://localhost:3001/api`
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: JWT Bearer Token

### 统一响应格式

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "code": 200
}
```

### 错误响应格式

```json
{
  "success": false,
  "message": "错误信息描述",
  "code": 400,
  "errors": []
}
```

### 文章相关接口

#### 获取文章列表
```http
GET /api/articles?page=1&limit=10&category=技术&tag=Vue
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |
| category | string | 否 | 分类筛选 |
| tag | string | 否 | 标签筛选 |
| search | string | 否 | 搜索关键词 |
| sort | string | 否 | 排序方式，默认-publishDate |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "文章标题",
        "slug": "article-slug",
        "excerpt": "文章摘要",
        "author": "作者名称",
        "category": "技术分享",
        "tags": ["Vue", "TypeScript"],
        "publishDate": "2025-01-13T10:00:00.000Z",
        "likes": 10,
        "views": 100,
        "image": "/uploads/cover.jpg"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### 获取文章详情
```http
GET /api/articles/:id
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 文章ID或slug |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "文章标题",
    "slug": "article-slug",
    "content": "文章内容（Markdown）",
    "contentHtml": "<p>文章内容（HTML）</p>",
    "contentFormat": "markdown",
    "author": "作者名称",
    "category": "技术分享",
    "tags": ["Vue", "TypeScript"],
    "publishDate": "2025-01-13T10:00:00.000Z",
    "updateDate": "2025-01-13T12:00:00.000Z",
    "likes": 10,
    "views": 100,
    "excerpt": "文章摘要",
    "image": "/uploads/cover.jpg"
  }
}
```

#### 创建文章
```http
POST /api/articles
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "title": "文章标题",
  "content": "文章内容",
  "contentFormat": "markdown",
  "author": "作者名称",
  "category": "技术分享",
  "tags": ["Vue", "TypeScript"],
  "excerpt": "文章摘要",
  "image": "/uploads/cover.jpg"
}
```

#### 更新文章
```http
PUT /api/articles/:id
Authorization: Bearer <token>
Content-Type: application/json
```

#### 删除文章
```http
DELETE /api/articles/:id
Authorization: Bearer <token>
```

#### 文章点赞
```http
POST /api/articles/:id/like
Authorization: Bearer <token>
```

#### 取消点赞
```http
POST /api/articles/:id/unlike
Authorization: Bearer <token>
```

### 用户认证接口

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "用户名或邮箱",
  "password": "密码",
  "rememberMe": true
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "用户名",
      "email": "user@example.com",
      "avatar": "/uploads/avatar.jpg",
      "role": "user"
    }
  }
}
```

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "用户名",
  "email": "user@example.com",
  "password": "密码",
  "confirmPassword": "确认密码"
}
```

#### 获取用户信息
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### 更新用户信息
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "新用户名",
  "email": "new@example.com",
  "avatar": "/uploads/avatar.jpg"
}
```

#### 修改密码
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "oldPassword": "旧密码",
  "newPassword": "新密码",
  "confirmPassword": "确认新密码"
}
```

### 分类和标签接口

#### 获取分类列表
```http
GET /api/categories
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "技术分享",
      "slug": "tech-share",
      "count": 15
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "生活随笔",
      "slug": "life-notes",
      "count": 8
    }
  ]
}
```

#### 获取标签列表
```http
GET /api/tags
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Vue",
      "slug": "vue",
      "count": 12
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "TypeScript",
      "slug": "typescript",
      "count": 8
    }
  ]
}
```

### 图片和媒体接口

#### 获取相册列表
```http
GET /api/photo-categories
```

#### 获取相册内的图片
```http
GET /api/photos?categoryId=<id>&page=1&limit=20
```

#### 上传图片
```http
POST /api/uploads
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 上传的文件 |
| categoryId | string | 否 | 相册分类ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "filename": "file-1758000037525-305473683.jpg",
    "originalname": "image.jpg",
    "mimetype": "image/jpeg",
    "size": 102400,
    "url": "/uploads/file-1758000037525-305473683.jpg"
  }
}
```

### 动态接口

#### 获取动态列表
```http
GET /api/talks?page=1&limit=10
```

#### 发布动态
```http
POST /api/talks
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "content": "动态内容",
  "images": ["/uploads/image1.jpg"],
  "visibility": "public"
}
```

#### 删除动态
```http
DELETE /api/talks/:id
Authorization: Bearer <token>
```

#### 动态点赞
```http
POST /api/talks/:id/like
Authorization: Bearer <token>
```

## 📊 数据库设计

### Article 文章模型
```javascript
{
  _id: ObjectId,
  title: String,              // 标题
  slug: String,               // URL别名
  content: String,            // 内容
  contentFormat: String,      // 内容格式 (markdown/html)
  contentHtml: String,        // HTML内容
  author: String,             // 作者
  category: ObjectId,         // 分类ID
  tags: [ObjectId],          // 标签ID数组
  publishDate: Date,          // 发布时间
  updateDate: Date,           // 更新时间
  likes: Number,              // 点赞数
  views: Number,              // 浏览量
  excerpt: String,            // 摘要
  image: String,              // 封面图片
  status: String,             // 状态 (draft/published)
  isTop: Boolean,             // 是否置顶
  createdAt: Date,            // 创建时间
  updatedAt: Date             // 更新时间
}
```

### User 用户模型
```javascript
{
  _id: ObjectId,
  username: String,           // 用户名
  email: String,              // 邮箱
  password: String,           // 密码（加密）
  avatar: String,             // 头像
  bio: String,                // 个人简介
  role: String,               // 角色 (user/admin)
  status: String,             // 状态 (active/inactive)
  lastLoginDate: Date,        // 最后登录时间
  createdAt: Date,            // 创建时间
  updatedAt: Date             // 更新时间
}
```

### Category 分类模型
```javascript
{
  _id: ObjectId,
  name: String,               // 分类名称
  slug: String,               // URL别名
  description: String,        // 分类描述
  icon: String,               // 分类图标
  order: Number,              // 排序
  createdAt: Date,            // 创建时间
  updatedAt: Date             // 更新时间
}
```

### Tag 标签模型
```javascript
{
  _id: ObjectId,
  name: String,               // 标签名称
  slug: String,               // URL别名
  description: String,        // 标签描述
  color: String,              // 标签颜色
  createdAt: Date,            // 创建时间
  updatedAt: Date             // 更新时间
}
```

## 👨‍💻 开发规范

### 代码风格

项目使用统一的代码风格配置，确保代码的一致性和可读性。

#### ESLint 配置
- 基于 `@eslint/js` 和 `typescript-eslint`
- 支持 Vue 3 组件检查
- 集成 Prettier 格式化规则
- 配置文件：`shared/config/eslint.config.mjs`

#### Prettier 配置
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "trailingComma": "none",
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

#### TypeScript 配置
- 严格模式启用
- 基于 `shared/config/tsconfig.base.json`
- 路径别名配置：`@/*` 指向 `src/*`
- 支持 Vue SFC 和 JSX

### Git 工作流

#### 提交规范
使用 Conventional Commits 规范：

```bash
# 功能开发
git commit -m "feat: 添加文章搜索功能"

# 问题修复
git commit -m "fix: 修复文章列表分页问题"

# 文档更新
git commit -m "docs: 更新API文档"

# 样式调整
git commit -m "style: 调整文章卡片样式"

# 重构代码
git commit -m "refactor: 重构文章服务层代码"

# 性能优化
git commit -m "perf: 优化文章列表加载性能"

# 测试
git commit -m "test: 添加文章API单元测试"
```

#### Git Hooks
- **pre-commit**: 运行 ESLint 和 Prettier 检查
- **commit-msg**: 验证提交信息格式
- 使用 Husky 管理 Git 钩子

### 命名规范

#### 文件命名
- **组件文件**: PascalCase (如 `ArticleCard.vue`)
- **页面文件**: PascalCase (如 `ArticleList.vue`)
- **工具文件**: camelCase (如 `formatDate.ts`)
- **类型文件**: camelCase (如 `article.types.ts`)
- **API文件**: camelCase (如 `articles.ts`)

#### 变量命名
- **变量和函数**: camelCase
- **常量**: UPPER_SNAKE_CASE
- **组件名**: PascalCase
- **CSS类名**: kebab-case
- **数据库字段**: camelCase

#### API接口命名
- **RESTful风格**: `/api/articles`, `/api/articles/:id`
- **动作接口**: `/api/articles/:id/like`
- **搜索接口**: `/api/articles/search`
- **列表接口**: `/api/articles?page=1&limit=10`

### 组件开发规范

#### Vue 组件结构
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
// 1. 导入依赖
import { ref, computed } from 'vue'
import type { Article } from '@/types/article'

// 2. 定义 Props
interface Props {
  article: Article
}
const props = defineProps<Props>()

// 3. 定义 Emits
const emit = defineEmits<{
  like: [id: string]
}>()

// 4. 响应式数据
const isLiked = ref(false)

// 5. 计算属性
const formattedDate = computed(() => {
  return new Date(props.article.publishDate).toLocaleDateString()
})

// 6. 方法
const handleLike = () => {
  emit('like', props.article._id)
}
</script>

<style scoped>
/* 组件样式 */
</style>
```

#### 组合式函数规范
```typescript
// composables/useArticle.ts
import { ref, computed, readonly } from 'vue'
import type { Article } from '@/types/article'

export function useArticle() {
  const articles = ref<Article[]>([])
  const loading = ref(false)
  
  const fetchArticles = async () => {
    loading.value = true
    try {
      // API调用逻辑
    } finally {
      loading.value = false
    }
  }
  
  return {
    articles: readonly(articles),
    loading: readonly(loading),
    fetchArticles
  }
}
```

## 🚀 部署说明

### 开发环境部署

#### 快速启动
```bash
# 1. 克隆项目
git clone <repository-url>
cd myblog

# 2. 安装依赖
pnpm install

# 3. 启动开发环境
# Windows
start-dev.bat

# 或手动启动
pnpm dev
```

### 生产环境部署

#### 1. 构建项目

```bash
# 构建前台
cd myblog
pnpm build

# 构建后台
cd ../myblog-admin
pnpm build

# 构建后端
cd ../api
pnpm build
```

#### 2. 使用 PM2 部署

```bash
# 全局安装 PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs

# 重启应用
pm2 restart all

# 停止应用
pm2 stop all
```

#### 3. 使用 Docker 部署

```bash
# 构建镜像
docker build -t myblog:latest .

# 运行容器
docker run -d \
  -p 3001:3001 \
  -p 5173:5173 \
  -p 5174:5174 \
  -e MONGODB_URI=mongodb://mongo:27017/my-blog \
  --name myblog \
  myblog:latest

# 查看容器日志
docker logs -f myblog
```

#### 4. Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前台静态文件
    location / {
        root /path/to/myblog/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后台静态文件
    location /admin {
        alias /path/to/myblog-admin/dist;
        try_files $uri $uri/ /admin/index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 文件上传
    location /uploads {
        alias /path/to/myblog/uploads;
    }
}
```

## ❓ 常见问题 FAQ

### 开发环境问题

#### Q: 启动项目时提示端口被占用怎么办？
**A:** 
```bash
# 查看端口占用情况
netstat -ano | findstr :3001

# 杀死占用端口的进程
taskkill /PID <进程ID> /F

# 或者修改端口配置
# 在 vite.config.ts 中修改前端端口
# 在 api/src/server.ts 中修改后端端口
```

#### Q: MongoDB连接失败怎么办？
**A:** 
1. 确保MongoDB服务已启动
2. 检查连接字符串是否正确
3. 确保数据库权限配置正确
4. 使用MongoDB Compass检查连接

#### Q: 依赖安装失败怎么办？
**A:** 
```bash
# 清除缓存
pnpm store prune

# 删除 node_modules 重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 使用淘宝镜像
pnpm config set registry https://registry.npmmirror.com/
```

#### Q: TypeScript编译错误怎么解决？
**A:** 
1. 检查 `tsconfig.json` 配置
2. 确保所有依赖的类型定义已安装
3. 重启TypeScript服务

### 功能使用问题

#### Q: 文章图片上传失败？
**A:** 
1. 检查上传文件大小是否超限
2. 确保 `uploads` 目录有写入权限
3. 检查文件格式是否支持
4. 查看浏览器控制台错误信息

#### Q: 前台和后台数据不同步？
**A:** 
1. 确保前台和后台使用相同的API地址
2. 检查浏览器缓存，尝试强制刷新
3. 查看网络请求是否正常
4. 检查API服务是否正常运行

### 部署相关问题

#### Q: 生产环境构建失败？
**A:** 
```bash
# 检查Node.js版本
node --version  # 需要 >= 18.0.0

# 清理并重新构建
pnpm clean
pnpm build

# 检查内存使用情况
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm build
```

#### Q: Docker部署时容器启动失败？
**A:** 
1. 检查Docker镜像是否构建成功
2. 确保环境变量配置正确
3. 检查端口映射是否冲突
4. 验证MongoDB连接字符串

## 🔧 故障排除指南

### 系统环境检查

```bash
# 检查Node.js版本
node --version

# 检查pnpm版本
pnpm --version

# 检查MongoDB状态
mongosh --eval "db.runCommand('ping')"

# 检查端口占用
netstat -tulpn | grep :3001
```

### 日志查看

```bash
# 开发环境日志
npm run dev  # 直接在控制台查看

# 生产环境日志
pm2 logs myblog-api

# MongoDB日志
# Windows: C:\Program Files\MongoDB\Server\5.0\log\mongod.log
# Linux: /var/log/mongodb/mongod.log
```

## 📝 更新日志

### v1.0.0 (2025-01-13)
- ✅ 实现统一的后端API服务
- ✅ 前台博客展示功能
- ✅ 后台管理系统
- ✅ 数据实时同步
- ✅ 文章增删改查
- ✅ 点赞功能
- ✅ 搜索功能
- ✅ 分页功能
- ✅ 用户认证系统
- ✅ 相册管理功能
- ✅ 完整API文档

## 📄 许可证

MIT License

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- 📝 提交 GitHub Issue
- 💬 发送邮件至：support@example.com
- 🐛 报告Bug：[Bug Report](https://github.com/yourname/myblog/issues)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**最后更新**: 2025-01-13

**项目维护者**: Your Name

**项目链接**: [GitHub Repository](https://github.com/yourname/myblog)

