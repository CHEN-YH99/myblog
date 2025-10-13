# My Blog - 统一后端API博客系统

这是一个基于 Vue3 + TypeScript + Express + MongoDB 的全栈博客系统，包含前台展示和后台管理功能，使用统一的后端API服务。

## 📸 项目预览

### 前台博客展示
- 🌐 **在线演示**: [http://localhost:5175](http://localhost:5175) (开发环境)
- 📱 **响应式设计**: 支持桌面端和移动端访问
- 🎨 **现代化UI**: 简洁美观的用户界面

### 后台管理系统
- 🔧 **管理后台**: [http://localhost:5174](http://localhost:5174) (开发环境)
- 📊 **数据统计**: 文章、访问量等数据可视化
- ✏️ **内容管理**: 富文本编辑器，支持Markdown

## 📁 项目结构

```
my-blog/
├── myblog/                    # 前台博客展示
│   ├── src/
│   │   ├── api/              # API接口定义
│   │   ├── assets/           # 静态资源
│   │   ├── components/       # Vue组件
│   │   ├── composables/      # 组合式函数
│   │   ├── router/           # 路由配置
│   │   ├── service/          # 后端服务 (Express + MongoDB)
│   │   ├── stores/           # Pinia状态管理
│   │   ├── types/            # TypeScript类型定义
│   │   ├── utils/            # 工具函数
│   │   └── views/            # 页面组件
│   ├── uploads/              # 文件上传目录
│   ├── package.json          # 前台依赖配置
│   └── vite.config.ts        # Vite构建配置
├── myblog-admin/             # 后台管理系统
│   ├── src/
│   │   ├── api/              # API接口
│   │   ├── assets/           # 静态资源
│   │   ├── components/       # 管理组件
│   │   ├── composables/      # 组合式函数
│   │   ├── config/           # 配置文件
│   │   ├── directives/       # 自定义指令
│   │   ├── enums/            # 枚举定义
│   │   ├── locales/          # 国际化配置
│   │   ├── router/           # 路由配置
│   │   ├── store/            # 状态管理
│   │   ├── types/            # 类型定义
│   │   ├── utils/            # 工具函数
│   │   └── views/            # 管理页面
│   ├── package.json          # 后台依赖配置
│   └── vite.config.ts        # Vite构建配置
├── shared/                   # 共享配置和工具
│   ├── config/               # 共享配置文件
│   │   ├── .prettierrc.json  # 代码格式化配置
│   │   ├── eslint.config.mjs # ESLint配置
│   │   ├── tsconfig.base.json # TypeScript基础配置
│   │   └── vite.config.base.ts # Vite基础配置
│   └── utils/                # 共享工具函数
│       └── http/             # HTTP请求工具
├── package.json              # 根项目配置
├── pnpm-lock.yaml           # 依赖锁定文件
├── start-dev.bat            # Windows开发环境启动脚本
└── README.md                # 项目说明文档
```

## ⭐ 功能特性

### 前台功能
- ✅ **文章展示**: 文章列表、详情页面、分页浏览
- ✅ **互动功能**: 文章点赞、浏览量统计
- ✅ **内容组织**: 标签云展示、分类筛选
- ✅ **搜索功能**: 全文搜索、关键词高亮
- ✅ **响应式设计**: 完美适配桌面端和移动端
- ✅ **SEO优化**: 友好的URL结构和元数据

### 后台管理功能
- ✅ **文章管理**: 发布、编辑、删除文章
- ✅ **富文本编辑**: 支持Markdown和可视化编辑
- ✅ **媒体管理**: 图片上传、文件管理
- ✅ **分类标签**: 分类和标签的增删改查
- ✅ **数据统计**: 文章数量、访问统计
- ✅ **用户界面**: 现代化的管理界面

### 统一API功能
- ✅ **RESTful设计**: 标准的REST API接口
- ✅ **数据持久化**: MongoDB数据存储
- ✅ **统一响应**: 标准化的API响应格式
- ✅ **错误处理**: 完善的错误处理机制
- ✅ **跨域支持**: CORS配置
- ✅ **实时同步**: 前后台数据实时同步

## 🛠️ 技术栈

### 前端技术
- **Vue 3.5+** - 渐进式JavaScript框架
- **TypeScript 5.8+** - 类型安全的JavaScript超集
- **Vite 7.1+** - 下一代前端构建工具
- **Vue Router 4.5+** - Vue.js官方路由管理器
- **Pinia 3.0+** - Vue状态管理库
- **Element Plus 2.10+** - Vue 3组件库
- **@vueuse/core** - Vue组合式API工具集
- **Animate.css** - CSS动画库

### 后端技术
- **Node.js 18+** - JavaScript运行时环境
- **Express 5.1+** - Web应用框架
- **MongoDB 5.0+** - NoSQL文档数据库
- **Mongoose 8.18+** - MongoDB对象建模工具
- **CORS 2.8+** - 跨域资源共享中间件
- **Morgan** - HTTP请求日志中间件
- **Multer** - 文件上传处理中间件

### 开发工具
- **ESLint 9.9+** - 代码质量检查工具
- **Prettier 3.5+** - 代码格式化工具
- **Stylelint** - CSS代码检查工具
- **Husky** - Git钩子工具
- **Commitizen** - 规范化提交工具
- **TypeScript ESLint** - TypeScript代码检查
- **Sass** - CSS预处理器
- **Concurrently** - 并发运行多个命令

### 编辑器和工具
- **Markdown-it** - Markdown解析器
- **Highlight.js** - 代码语法高亮
- **DOMPurify** - HTML净化工具
- **Slugify** - URL友好字符串生成
- **Nanoid** - 唯一ID生成器
- **Bcrypt** - 密码加密工具

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

## 📚 API文档

### 基础信息
- **API基础URL**: `http://localhost:3001/api`
- **数据格式**: JSON
- **字符编码**: UTF-8

### 统一响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "code": 200
}
```

### 文章相关接口

#### 获取文章列表
```http
GET /api/articles
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |
| category | string | 否 | 分类筛选 |
| tag | string | 否 | 标签筛选 |
| search | string | 否 | 搜索关键词 |

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
```

#### 删除文章
```http
DELETE /api/articles/:id
```

#### 文章点赞
```http
POST /api/articles/:id/like
```

#### 取消点赞
```http
POST /api/articles/:id/unlike
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
      "name": "技术分享",
      "count": 15
    },
    {
      "name": "生活随笔",
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
      "name": "Vue",
      "count": 12
    },
    {
      "name": "TypeScript",
      "count": 8
    }
  ]
}
```

### 其他接口

#### 获取热门文章
```http
GET /api/articles/popular
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | number | 否 | 数量限制，默认5 |

#### 搜索文章
```http
GET /api/articles/search
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键词 |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |

#### 文件上传
```http
POST /api/uploads
```

**请求格式**: `multipart/form-data`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 上传的文件 |

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
```

#### Git Hooks
- **pre-commit**: 运行 ESLint 和 Prettier 检查
- **commit-msg**: 验证提交信息格式
- 使用 Husky 管理 Git 钩子

### 目录结构规范

#### 前台项目 (myblog)
```
src/
├── api/              # API接口定义
├── assets/           # 静态资源
├── components/       # 可复用组件
├── composables/      # 组合式函数
├── router/           # 路由配置
├── service/          # 后端服务
├── stores/           # 状态管理
├── types/            # 类型定义
├── utils/            # 工具函数
└── views/            # 页面组件
```

#### 后台项目 (myblog-admin)
```
src/
├── api/              # API接口
├── components/       # 管理组件
├── config/           # 配置文件
├── locales/          # 国际化
├── router/           # 路由配置
├── store/            # 状态管理
├── utils/            # 工具函数
└── views/            # 管理页面
```

### 命名规范

#### 文件命名
- **组件文件**: PascalCase (如 `ArticleCard.vue`)
- **页面文件**: PascalCase (如 `ArticleList.vue`)
- **工具文件**: camelCase (如 `formatDate.ts`)
- **类型文件**: camelCase (如 `article.types.ts`)

#### 变量命名
- **变量和函数**: camelCase
- **常量**: UPPER_SNAKE_CASE
- **组件名**: PascalCase
- **CSS类名**: kebab-case

#### API接口命名
- **RESTful风格**: `/api/articles`, `/api/articles/:id`
- **动作接口**: `/api/articles/:id/like`
- **搜索接口**: `/api/articles/search`

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
import { ref, computed } from 'vue'
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

### 测试规范

#### 单元测试
- 使用 Vitest 作为测试框架
- 测试文件命名：`*.test.ts` 或 `*.spec.ts`
- 测试覆盖率要求：核心功能 > 80%

#### E2E测试
- 使用 Playwright 进行端到端测试
- 测试关键用户流程
- 测试文件位置：`tests/e2e/`

### 性能优化规范

#### 前端优化
- 使用 `v-memo` 优化列表渲染
- 图片懒加载和压缩
- 路由懒加载
- 组件按需导入

#### 后端优化
- 数据库查询优化
- 接口响应缓存
- 图片上传压缩
- API分页处理

### 安全规范

#### 前端安全
- XSS防护：使用 DOMPurify 净化HTML
- CSRF防护：使用CSRF令牌
- 敏感信息不在前端存储

#### 后端安全
- 输入验证和过滤
- SQL注入防护
- 文件上传安全检查
- API访问频率限制

## 🌟 核心特性说明

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

## 🚀 部署说明

### 开发环境部署

#### 环境要求
- **Node.js**: >= 18.0.0
- **MongoDB**: >= 5.0
- **pnpm**: >= 8.0.0 (推荐) 或 npm >= 9.0.0

#### 快速启动
```bash
# 1. 克隆项目
git clone <repository-url>
cd my-blog

# 2. 安装依赖
pnpm install:all
# 或者
npm run install:all

# 3. 启动开发环境
# Windows
start-dev.bat

# 或手动启动
pnpm dev
# 或
npm run dev
```

### 生产环境部署

#### 1. 传统部署方式

**构建前端项目**
```bash
# 构建前台
cd myblog
npm run build

# 构建后台
cd ../myblog-admin
npm run build
```

**部署后端服务**
```bash
# 启动API服务器
cd myblog
npm run dev:server
```

**配置Web服务器 (Nginx)**
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
    }

    # 文件上传
    location /uploads {
        alias /path/to/myblog/uploads;
    }
}
```

#### 2. Docker部署

**创建 Dockerfile**
```dockerfile
# 前端构建阶段
FROM node:18-alpine AS frontend-build
WORKDIR /app

# 复制前台项目
COPY myblog/package*.json ./myblog/
RUN cd myblog && npm ci

COPY myblog ./myblog
RUN cd myblog && npm run build

# 复制后台项目
COPY myblog-admin/package*.json ./myblog-admin/
RUN cd myblog-admin && npm ci

COPY myblog-admin ./myblog-admin
RUN cd myblog-admin && npm run build

# 生产阶段
FROM node:18-alpine AS production
WORKDIR /app

# 安装生产依赖
COPY myblog/package*.json ./
RUN npm ci --only=production

# 复制构建结果和源码
COPY --from=frontend-build /app/myblog/dist ./public/frontend
COPY --from=frontend-build /app/myblog-admin/dist ./public/admin
COPY myblog/src ./src
COPY myblog/uploads ./uploads

EXPOSE 3001
CMD ["npm", "run", "dev:server"]
```

**创建 docker-compose.yml**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: myblog-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  app:
    build: .
    container_name: myblog-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/my-blog?authSource=admin
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
    volumes:
      - ./uploads:/app/uploads

  nginx:
    image: nginx:alpine
    container_name: myblog-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  mongodb_data:
```

**启动Docker服务**
```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 3. 云平台部署

**Vercel部署 (前端)**
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署前台
cd myblog
vercel --prod

# 部署后台
cd ../myblog-admin
vercel --prod
```

**Railway/Heroku部署 (后端)**
```bash
# 创建 Procfile
echo "web: cd myblog && npm run dev:server" > Procfile

# 推送到平台
git push heroku main
```

### 环境变量配置

#### 前台环境变量 (.env)
```bash
# API服务地址
VITE_API_URL=http://localhost:3001

# 应用标题
VITE_APP_TITLE=My Blog

# 上传文件大小限制 (MB)
VITE_MAX_FILE_SIZE=10
```

#### 后台环境变量 (.env)
```bash
# 数据库连接
MONGODB_URI=mongodb://localhost:27017/my-blog

# 服务端口
PORT=3001

# JWT密钥 (如果使用认证)
JWT_SECRET=your-secret-key

# 文件上传路径
UPLOAD_PATH=./uploads

# 允许的文件类型
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp

# 最大文件大小 (bytes)
MAX_FILE_SIZE=10485760
```

### 性能优化

#### 前端优化
- 启用Gzip压缩
- 配置CDN加速
- 图片懒加载
- 代码分割

#### 后端优化
- 数据库索引优化
- Redis缓存
- 负载均衡
- API限流

### 监控和日志

#### 应用监控
```bash
# 使用PM2管理进程
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 监控状态
pm2 monit
```

#### 日志配置
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'myblog-api',
    script: 'src/service/server.ts',
    cwd: './myblog',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}
```

## ❓ 常见问题 FAQ

### 开发环境问题

#### Q: 启动项目时提示端口被占用怎么办？
**A:** 
```bash
# 查看端口占用情况
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# 杀死占用端口的进程
taskkill /PID <进程ID> /F

# 或者修改端口配置
# 在 myblog/vite.config.ts 中修改前端端口
# 在 myblog/src/service/server.ts 中修改后端端口
```

#### Q: MongoDB连接失败怎么办？
**A:** 
1. 确保MongoDB服务已启动
```bash
# Windows
net start MongoDB

# 或使用MongoDB Compass检查连接
```
2. 检查连接字符串是否正确
3. 确保数据库权限配置正确

#### Q: 依赖安装失败怎么办？
**A:** 
```bash
# 清除缓存
npm cache clean --force
# 或
pnpm store prune

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install

# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com/
```

#### Q: TypeScript编译错误怎么解决？
**A:** 
1. 检查 `tsconfig.json` 配置
2. 确保所有依赖的类型定义已安装
3. 重启TypeScript服务：`Ctrl+Shift+P` → `TypeScript: Restart TS Server`

### 功能使用问题

#### Q: 文章图片上传失败？
**A:** 
1. 检查上传文件大小是否超限（默认10MB）
2. 确保 `uploads` 目录有写入权限
3. 检查文件格式是否支持（jpg, jpeg, png, gif, webp）
4. 查看浏览器控制台错误信息

#### Q: 前台和后台数据不同步？
**A:** 
1. 确保前台和后台使用相同的API地址
2. 检查浏览器缓存，尝试强制刷新（Ctrl+F5）
3. 查看网络请求是否正常
4. 检查API服务是否正常运行

#### Q: 富文本编辑器无法正常使用？
**A:** 
1. 检查网络连接，编辑器可能需要加载外部资源
2. 确保浏览器支持现代JavaScript特性
3. 查看浏览器控制台是否有JavaScript错误
4. 尝试清除浏览器缓存

### 部署相关问题

#### Q: 生产环境构建失败？
**A:** 
```bash
# 检查Node.js版本
node --version  # 需要 >= 18.0.0

# 清理并重新构建
npm run clean
npm run build

# 检查内存使用情况，可能需要增加内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### Q: Docker部署时容器启动失败？
**A:** 
1. 检查Docker镜像是否构建成功
```bash
docker images
docker logs <container-id>
```
2. 确保环境变量配置正确
3. 检查端口映射是否冲突
4. 验证MongoDB连接字符串

#### Q: Nginx反向代理配置问题？
**A:** 
```nginx
# 常见配置问题解决
server {
    # 确保正确的根目录
    root /correct/path/to/dist;
    
    # API代理添加必要的头信息
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 处理SPA路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 性能优化问题

#### Q: 页面加载速度慢怎么优化？
**A:** 
1. **前端优化**
   - 启用Gzip压缩
   - 使用CDN加速静态资源
   - 实现图片懒加载
   - 代码分割和按需加载

2. **后端优化**
   - 添加数据库索引
   - 实现Redis缓存
   - 优化API查询逻辑
   - 使用分页加载

#### Q: 数据库查询慢怎么优化？
**A:** 
```javascript
// 添加索引
db.articles.createIndex({ "title": "text", "content": "text" })
db.articles.createIndex({ "category": 1, "createdAt": -1 })
db.articles.createIndex({ "tags": 1 })

// 优化查询
// 使用投影减少数据传输
db.articles.find({}, { title: 1, summary: 1, createdAt: 1 })

// 使用聚合管道优化复杂查询
db.articles.aggregate([
  { $match: { status: "published" } },
  { $sort: { createdAt: -1 } },
  { $limit: 10 }
])
```

### 安全相关问题

#### Q: 如何防止XSS攻击？
**A:** 
1. 前端使用Vue的模板语法自动转义
2. 后端对用户输入进行验证和清理
3. 设置适当的CSP头
4. 使用HTTPS传输敏感数据

#### Q: 如何保护API接口？
**A:** 
```javascript
// 添加请求频率限制
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 100次请求
});

// 添加CORS配置
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));

// 输入验证
const { body, validationResult } = require('express-validator');
app.post('/api/articles', [
  body('title').isLength({ min: 1, max: 200 }),
  body('content').isLength({ min: 1 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // 处理请求...
});
```

## 🔧 故障排除指南

### 1. 系统环境检查

```bash
# 检查Node.js版本
node --version

# 检查npm/pnpm版本
npm --version
pnpm --version

# 检查MongoDB状态
mongosh --eval "db.runCommand('ping')"

# 检查端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
```

### 2. 日志查看

```bash
# 查看应用日志
# 开发环境
npm run dev  # 直接在控制台查看

# 生产环境
pm2 logs myblog-api

# 查看MongoDB日志
# Windows: C:\Program Files\MongoDB\Server\5.0\log\mongod.log
# Linux: /var/log/mongodb/mongod.log
```

### 3. 数据库问题诊断

```javascript
// 连接MongoDB并检查状态
const { MongoClient } = require('mongodb');

async function checkDatabase() {
  try {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    
    // 检查数据库连接
    const admin = client.db().admin();
    const status = await admin.serverStatus();
    console.log('MongoDB状态:', status.ok);
    
    // 检查集合
    const db = client.db('my-blog');
    const collections = await db.listCollections().toArray();
    console.log('集合列表:', collections.map(c => c.name));
    
    await client.close();
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
}
```

### 4. 网络问题诊断

```bash
# 检查API服务是否正常
curl -I http://localhost:3001/api/articles

# 检查前端服务是否正常
curl -I http://localhost:3000

# 测试数据库连接
telnet localhost 27017
```

### 5. 性能问题诊断

```bash
# 使用Node.js性能分析
node --inspect src/service/server.ts

# 监控内存使用
node --trace-gc src/service/server.ts

# 使用PM2监控
pm2 monit
```

### 6. 常用调试命令

```bash
# 清理项目
npm run clean
rm -rf node_modules package-lock.json
npm install

# 重置数据库
mongosh my-blog --eval "db.dropDatabase()"

# 重启服务
pm2 restart all

# 查看进程
ps aux | grep node
```

### 7. 联系支持

如果以上方法都无法解决问题，请：

1. 收集错误日志和系统信息
2. 描述问题复现步骤
3. 提供环境配置信息
4. 通过以下方式联系：
   - 提交GitHub Issue
   - 发送邮件至：support@example.com
   - 加入技术交流群：123456789

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