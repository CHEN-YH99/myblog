const mongoose = require('mongoose');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/my-blog')
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
  visible: { type: Boolean, default: true }
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
});
const Category = mongoose.model('Category', CategorySchema);

// 角色模型
const RoleSchema = new mongoose.Schema({
  roleId: { type: Number, unique: true, required: true },
  roleName: { type: String, required: true },
  roleCode: { type: String, required: true, unique: true },
  description: String,
  enabled: { type: Boolean, default: true },
  permissions: [String],
  createTime: { type: Date, default: Date.now },
  updateTime: { type: Date, default: Date.now }
});
const Role = mongoose.model('Role', RoleSchema);

// 用户模型
const UserSchema = new mongoose.Schema({
  userId: { type: Number, unique: true, required: true },
  username: { type: String, required: true, unique: true },
  nickname: String,
  password: { type: String, required: true },
  avatar: String,
  email: String,
  phone: String,
  roleId: { type: Number, required: true },
  roleName: String,
  enabled: { type: Boolean, default: true },
  lastLoginTime: Date,
  lastLoginIp: String,
  registerIp: String,
  createTime: { type: Date, default: Date.now },
  updateTime: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const roles = [
  { roleId: 1, roleName: '超级管理员', roleCode: 'SUPER_ADMIN', description: '系统超级管理员，拥有所有权限', enabled: true, permissions: ['*'] },
  { roleId: 2, roleName: '管理员', roleCode: 'ADMIN', description: '系统管理员，拥有大部分管理权限', enabled: true, permissions: ['user:read', 'user:write', 'article:read', 'article:write', 'category:read', 'category:write'] },
  { roleId: 3, roleName: '编辑', roleCode: 'EDITOR', description: '内容编辑，可以管理文章和分类', enabled: true, permissions: ['article:read', 'article:write', 'category:read'] },
  { roleId: 4, roleName: '普通用户', roleCode: 'USER', description: '普通用户，只能查看内容', enabled: true, permissions: ['article:read', 'category:read'] }
];

const users = [
  { userId: 1, username: 'admin', nickname: '超级管理员', password: '123456', avatar: '', email: 'admin@example.com', phone: '13800138000', roleId: 1, roleName: '超级管理员', enabled: true, registerIp: '127.0.0.1' },
  { userId: 2, username: 'manager', nickname: '管理员', password: '123456', avatar: '', email: 'manager@example.com', phone: '13800138001', roleId: 2, roleName: '管理员', enabled: true, registerIp: '127.0.0.1' },
  { userId: 3, username: 'editor', nickname: '编辑', password: '$2b$10$N.zmdr9k7uOCQb376NoUnuTJ8iKWTnZmz0p6hjjmgqNweCmjn4tPe', avatar: '', email: 'editor@example.com', phone: '13800138002', roleId: 3, roleName: '编辑', enabled: true, registerIp: '127.0.0.1' },
  { userId: 4, username: 'user1', nickname: '普通用户1', password: '$2b$10$N.zmdr9k7uOCQb376NoUnuTJ8iKWTnZmz0p6hjjmgqNweCmjn4tPe', avatar: '', email: 'user1@example.com', phone: '13800138003', roleId: 4, roleName: '普通用户', enabled: true, registerIp: '127.0.0.1' },
  { userId: 5, username: 'user2', nickname: '普通用户2', password: '$2b$10$N.zmdr9k7uOCQb376NoUnuTJ8iKWTnZmz0p6hjjmgqNweCmjn4tPe', avatar: '', email: 'user2@example.com', phone: '13800138004', roleId: 4, roleName: '普通用户', enabled: false, registerIp: '127.0.0.1' }
];

const categories = [
  { name: '技术分享', slug: 'tech', description: '技术相关的文章分类', color: '#409eff', sort: 1, status: 'active' },
  { name: '生活随笔', slug: 'life', description: '生活感悟和随笔', color: '#67c23a', sort: 2, status: 'active' },
  { name: '学习笔记', slug: 'study', description: '学习过程中的笔记和总结', color: '#e6a23c', sort: 3, status: 'active' }
];

const articles = [
  { title: 'Vue 3 组合式API详解', slug: 'vue3-composition-api', content: '# Vue 3 组合式API详解...', contentFormat: 'markdown', author: '管理员', category: '技术分享', tags: ['Vue', 'JavaScript', '前端开发'], excerpt: '本文将详细介绍Vue 3中的组合式API的使用方法和最佳实践。', views: 156, likes: 23, p_date: 2024, visible: true },
  { title: 'MongoDB数据库基础教程', slug: 'mongodb-basics', content: '# MongoDB数据库基础教程...', contentFormat: 'markdown', author: '管理员', category: '技术分享', tags: ['MongoDB', '数据库', 'NoSQL'], excerpt: 'MongoDB是一个基于分布式文件存储的数据库，本文介绍其基础用法。', views: 89, likes: 12, p_date: 2024, visible: true }
];

async function seedData() {
  try {
    await Article.deleteMany({});
    await Category.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    await Role.insertMany(roles);
    await User.insertMany(users);
    await Category.insertMany(categories);
    await Article.insertMany(articles);

    console.log('测试数据创建完成！');

    const articleCount = await Article.countDocuments();
    const categoryCount = await Category.countDocuments();
    const roleCount = await Role.countDocuments();
    const userCount = await User.countDocuments();

    console.log(`文章数量: ${articleCount}`);
    console.log(`分类数量: ${categoryCount}`);
    console.log(`角色数量: ${roleCount}`);
    console.log(`用户数量: ${userCount}`);
  } catch (error) {
    console.error('创建测试数据失败:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedData();

