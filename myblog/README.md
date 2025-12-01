# myblog（前台站点）

一个基于 Vue 3 + TypeScript + Vite 的个人博客前台项目，支持文章列表/详情、分类与标签、时间轴、相册、说说、登录与个人中心、点赞与浏览统计等功能。

> 管理后台在 `myblog-admin/`（独立项目），请参考对应的 README。

---

## 技术栈

- 构建与语言：Vite + Vue 3 + TypeScript
- 路由与状态：Vue Router 4 + Pinia（持久化）
- UI 与交互：Element Plus、Animate.css
- Markdown 与高亮：markdown-it + highlight.js（Atom One Dark）
- 其它：请求封装（Axios）、组合式函数（Composables）、指令系统（Typing）

## 功能概览

- 首页文章瀑布卡片列表（分页、点赞、统计）
- 文章详情（目录生成、代码高亮、相关推荐、阅读进度）
- 分类页 / 标签文章页（统计、分页）
- 时间轴、前端推荐/后端推荐
- 相册与相册分类
- 说说（点赞、浏览量、内容/图片）
- 登录/个人中心（我的点赞等）

## 快速开始

> 需要 Node.js ≥ 18 与 pnpm。

```bash
# 安装依赖
pnpm install

# 开发启动（默认 http://localhost:5173/）
pnpm dev

# 生产构建
pnpm build

# 本地预览（构建后）
pnpm preview
```

### 可选：本地 Mock/简易服务端

项目提供了一份 Express（Node）示例服务端（仅开发演示用）：`src/service/server.ts`

```bash
# 在另一个终端中运行（需要自行编译/运行，或按需调整）
# 建议将其拆分为独立 Node 项目后再使用
```

> 线上请接入真实后端服务，本文档不包含部署后端的步骤。

## 目录结构（简要）

```
myblog/
├── src/
│   ├── api/                # 接口封装
│   ├── assets/             # 静态资源与全局样式
│   ├── components/         # 通用组件（NavBar、Footer、目录、阅读进度等）
│   ├── composables/        # 组合式函数（文章/分类/点赞/令牌检查等）
│   ├── router/             # 路由与守卫
│   ├── stores/             # Pinia 仓库（文章/用户/说说等）
│   ├── utils/              # 工具函数（SEO、HTTP、性能等）
│   └── views/              # 页面视图
└── index.html
```

## 环境变量

默认使用 Vite 的环境变量机制（`.env*` 文件）。常见变量：

- `VITE_API_BASE`：接口基础路径（若有网关/代理，可在开发代理中配置）。

## 性能与体验优化（已内置）

以下优化已在不改变业务的前提下落地：

1. 首屏/LCP
   - 首页主图使用 `<img>` 并设置 `fetchpriority="high"`、`decoding="async"`、`sizes="100vw"` 与固定 `width/height`，降低 CLS、加速 LCP。
   - 头图/顶部容器采用 `dvh/svh` 等动态视口单位，移动端视口更稳定。
2. 滚动与重排
   - 导航栏滚动监听切换为 `window` + `requestAnimationFrame` 节流，并启用 `{ passive: true }`，降低强制重排与滚动卡顿。
3. 列表渲染与主线程占用
   - 文章卡片启用 `content-visibility: auto` 与 `contain-intrinsic-size`，对未进入视口的内容延后布局/绘制，显著降低主线程负载（Chrome 特性）。
   - 右侧信息栏延迟/空闲渲染（`requestIdleCallback` 回退定时），平滑首屏。
4. 图片与占位
   - 列表图片懒加载，错误占位/骨架优化，避免布局抖动。
5. 路由返回空白问题的处理
   - 文章详情返回时优先依据 `fromPath`（或 `from`）定向到稳定路径，并在 URL 上追加 `_r=时间戳` 强制重建视图。
   - App 路由视图 `:key` 使用 `route.fullPath`，确保路径或查询参数变化时重新挂载，规避过渡/挂起竞态引起的白屏。

> 如需更进一步：可增加图片 `srcset`/`webp/avif`、在 `index.html` 使用 `preconnect/preload` 等。

## 常见脚本

- `pnpm dev`：开发启动
- `pnpm build`：生产构建
- `pnpm preview`：本地预览

## 注意事项与兼容建议

- 若从外部深链直接进入文章详情，返回上一页时没有 `fromPath` 的情况下会退回历史或首页；可在更多入口跳转时附带 `fromPath`，以获得更优返回体验。
- 如在低配移动设备上仍感受卡顿，建议：
  - 减少首屏文章数量（`useArticles` 的 `defaultPageSize`）。
  - 进一步降低图片分辨率或开启服务端压缩。

## 许可

本项目仅用于个人学习与演示，不保证生产可用性。实际生产请完善安全、鉴权与异常处理等细节。
