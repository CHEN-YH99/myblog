interface UpgradeLog {
  version: string // 版本号
  title: string // 更新标题
  date: string // 更新日期
  detail?: string[] // 更新内容
  requireReLogin?: boolean // 是否需要重新登录
  remark?: string // 备注
}

export const upgradeLogList: UpgradeLog[] = [
  {
    version: 'v1.2.0',
    title: '用户管理功能优化',
    date: '2024-01-15',
    detail: [
      '新增用户头像更换功能',
      '优化用户删除逻辑，增加确认提示',
      '修复用户列表分页显示问题',
      '增强用户搜索功能'
    ],
    remark: '本次更新主要针对用户管理模块进行了全面优化'
  },
  {
    version: 'v1.1.5',
    title: '登录注册系统上线',
    date: '2024-01-10',
    detail: [
      '新增用户登录注册页面',
      '实现七天免登录功能',
      '添加图形验证码校验',
      '完善用户信息验证机制',
      '优化登录界面UI设计'
    ],
    requireReLogin: true,
    remark: '首次发布登录注册功能，用户需要重新注册账号'
  },
  {
    version: 'v1.1.0',
    title: '博客系统基础功能',
    date: '2024-01-05',
    detail: [
      '完成文章发布和管理功能',
      '实现分类和标签系统',
      '添加评论功能',
      '优化响应式布局',
      '完善SEO优化'
    ],
    remark: '博客核心功能正式上线'
  },
  {
    version: 'v1.0.0',
    title: '项目初始化',
    date: '2024-01-01',
    detail: [
      '搭建项目基础架构',
      '配置开发环境',
      '设计数据库结构',
      '实现基础页面布局'
    ],
    remark: '项目正式启动，完成基础框架搭建'
  }
]
