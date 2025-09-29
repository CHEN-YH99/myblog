/**
 * 路由别名，方便快速找到页面，同时可以用作路由跳转
 */

/** 路由别名 */
export enum RoutesAlias {
  Layout = '/index/index', // 布局容器
  Login = '/auth/login', // 登录
  Register = '/auth/register', // 注册
  ForgetPassword = '/auth/forget-password', // 忘记密码
  SiteManagement = '/site/sitemanagement',
  BackgroundManagement = '/site/backgroundmanagement',
  friendLinkManagement = '/site/friendLinkmanagement', // 友链管理
  PublishTalk = '/talk/publishtalk', // 发布话题
  TalkList = '/talk/talklist', // 话题列表
  Dashboard = '/dashboard', // 工作台
  Analysis = '/dashboard/analysis', // 分析页
  Ecommerce = '/dashboard/ecommerce', // 电子商务
  ArticleList = '/article/list', // 文章列表
  ArticleDetail = '/article/detail', // 文章详情
  ArticleTags = '/article/tags', // 文章标签管理
  ArticleCategory = '/article/category', // 文章分类
  Comment = '/article/comment', // 评论
  ArticlePublish = '/article/publish', // 文章发布
  User = '/system/user', // 账户
  Role = '/system/role/index', // 角色
  UserCenter = '/system/user-center', // 用户中心
  PhotoAlbum = '/photoalbum', // 相册列表
  PhotoCategoryDetail = '/photoalbum/category', // 分类图片详情
  Personal = '/personal' // 个人中心
}
