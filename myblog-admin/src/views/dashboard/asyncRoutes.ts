import { RoutesAlias } from '../../router/routesAlias'
import { AppRouteRecord } from '@/types/router'
// import { WEB_LINKS } from '@/utils/constants'  // 暂时不使用

/**
 * 菜单列表、异步路由
 *
 * 支持两种模式:
 * 前端静态配置 - 直接使用本文件中定义的路由配置
 * 后端动态配置 - 后端返回菜单数据，前端解析生成路由
 *
 * 菜单标题（title）:
 * 可以是 i18n 的 key，也可以是字符串，比如：'用户列表'
 *
 * 注意事项：
 * 1、RoutesAlias.Layout 指向的是布局容器，后端返回的菜单数据中，component 字段需要指向 /index/index
 * 2、path、name 不要和动态路由冲突，否则会导致路由冲突无法访问
 */
export const asyncRoutes: AppRouteRecord[] = [
  // 主页一级菜单配置示例：
  // {
  //   name: 'Home',
  //   path: '/home',
  //   component: RoutesAlias.Dashboard,
  //   meta: {
  //     title: 'menus.dashboard.console',
  //     icon: '&#xe733;',
  //     keepAlive: false
  //   }
  // },
  {
    name: 'Dashboard',
    path: '/',
    component: RoutesAlias.Dashboard,
    meta: {
      title: 'menus.dashboard.title',
      icon: '&#xe7ae;',
      keepAlive: false
    }
  },

  {
    path: '/system',
    name: 'System',
    component: RoutesAlias.Layout,
    meta: {
      title: 'menus.system.title',
      icon: '&#xe7b9;',
      roles: ['R_SUPER', 'R_ADMIN']
    },
    children: [
      {
        path: 'user',
        name: 'UserManagement',
        component: RoutesAlias.User,
        meta: {
          title: 'menus.system.user',
          keepAlive: true
        }
      },
      {
        path: 'role',
        name: 'RoleManagement',
        component: RoutesAlias.Role,
        meta: {
          title: 'menus.system.role',
          keepAlive: true
        }
      },
      {
        path: 'user-center',
        name: 'UserCenter',
        component: RoutesAlias.UserCenter,
        meta: {
          title: 'menus.system.userCenter',
          isHide: true,
          keepAlive: true,
          isHideTab: true
        }
      }
    ]
  },
  {
    path: '/article',
    name: 'Article',
    component: RoutesAlias.Layout,
    meta: {
      title: 'menus.article.title',
      icon: '&#xe7ae;',
      roles: ['R_SUPER', 'R_ADMIN']
    },
    children: [
      {
        path: 'article-list',
        name: 'ArticleList',
        component: RoutesAlias.ArticleList,
        meta: {
          title: 'menus.article.articleList',
          keepAlive: true,
          authList: [
            {
              title: '新增',
              authMark: 'add'
            },
            {
              title: '编辑',
              authMark: 'edit'
            }
          ]
        }
      },

      {
        path: 'detail/:id',
        name: 'ArticleDetail',
        component: RoutesAlias.ArticleDetail,
        meta: {
          title: 'menus.article.articleDetail',
          isHide: true,
          keepAlive: true,
          activePath: '/article/article-list' // 激活菜单路径
        }
      },
      {
        path: 'publish',
        name: 'ArticlePublish',
        component: RoutesAlias.ArticlePublish,
        meta: {
          title: 'menus.article.articlePublish',
          keepAlive: true,
          authList: [
            {
              title: '发布',
              authMark: 'add'
            }
          ]
        }
      },
      {
        path: 'category',
        name: 'ArticleCategory',
        component: RoutesAlias.ArticleCategory,
        meta: {
          title: 'menus.article.articleCategory',
          keepAlive: true,
          authList: [
            {
              title: '文章分类',
              authMark: 'add'
            }
          ]
        }
      },
      {
        path: 'tags',
        name: 'ArticleTags',
        component: RoutesAlias.ArticleTags,
        meta: {
          title: 'menus.article.articleTags',
          keepAlive: true,
          authList: [
            {
              title: '标签管理',
              authMark: 'add'
            }
          ]
        }
      }
    ]
  },
  {
    path: '/talk',
    name: 'Talk',
    component: RoutesAlias.Layout,
    meta: {
      title: 'menus.talk.title',
      icon: '&#xe715;'
    },
    children: [
      {
        path: 'publishtalk',
        name: 'PublishTalk',
        component: RoutesAlias.PublishTalk,
        meta: {
          title: 'menus.talk.publishTalk',
          keepAlive: true,
          roles: ['R_SUPER', 'R_ADMIN']
        }
      },
      {
        path: 'talklist',
        name: 'TalkList',
        component: RoutesAlias.TalkList,
        meta: {
          title: 'menus.talk.talkList',
          keepAlive: true
        }
      }
    ]
  },
  {
    path: '/site',
    name: 'Site',
    component: RoutesAlias.Layout,
    meta: {
      title: 'menus.site.title',
      icon: '&#xe820;',
      roles: ['R_SUPER', 'R_ADMIN']
    },
    children: [
      {
        path: 'sitemanagement',
        name: 'SiteManagement',
        component: RoutesAlias.SiteManagement,
        meta: {
          title: 'menus.site.siteManagement',
          keepAlive: true,
          isFullPage: true
        }
      },
      {
        path: 'backgroundmanagement',
        name: 'BackgroundManagement',
        component: RoutesAlias.BackgroundManagement,
        meta: {
          title: 'menus.site.backgroundManagement',
          keepAlive: true,
          isFullPage: true
        }
      },
      {
        path: 'friendlinkmanagement',
        name: 'FriendLinkManagement',
        component: RoutesAlias.friendLinkManagement,
        meta: {
          title: 'menus.site.friendLinkManagement',
          keepAlive: true,
          isFullPage: true
        }
      }
    ]
  },

  {
    path: '/photoalbum',
    name: 'PhotoAlbum',
    component: RoutesAlias.PhotoAlbum,
    meta: {
      title: 'menus.photoAlbum.title',
      icon: '&#xe816;',
      keepAlive: false,
      roles: ['R_SUPER', 'R_ADMIN']
    }
  },
  // 一级菜单
  {
    name: 'Personal',
    path: '/personal',
    component: RoutesAlias.Personal,
    meta: {
      title: 'menus.personal.title',
      showTextBadge: `v${__APP_VERSION__}`,
      icon: '&#xe712;',
      keepAlive: false
    }
  }
]
