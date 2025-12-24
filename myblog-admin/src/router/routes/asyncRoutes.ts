import { RoutesAlias } from '../routesAlias'
import { AppRouteRecord } from '@/types/router'

/**
 * 异步路由 - 菜单路由
 * 说明：大部分后台页面都应走这里的配置，保持 path、name 不与静态路由冲突
 */
export const asyncRoutes: AppRouteRecord[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    component: RoutesAlias.Layout,
    meta: {
      title: 'menus.dashboard.title',
      icon: '&#xe721;',
      roles: ['R_SUPER', 'R_ADMIN', 'R_EDITOR']
    },
    children: [
      {
        path: 'console',
        name: 'Console',
        component: RoutesAlias.Dashboard,
        meta: {
          title: 'menus.dashboard.console',
          keepAlive: false,
          fixedTab: true
        }
      }
    ]
  },
  // 系统管理
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
  // 文章管理
  {
    path: '/article',
    name: 'Article',
    component: RoutesAlias.Layout,
    meta: {
      title: 'menus.article.title',
      icon: '&#xe715;',
      roles: ['R_SUPER', 'R_ADMIN']
    },
    children: [
      {
        path: 'list',
        name: 'ArticleList',
        component: RoutesAlias.ArticleList,
        meta: {
          title: 'menus.article.list',
          keepAlive: true
        }
      },
      {
        path: 'publish',
        name: 'ArticlePublish',
        component: RoutesAlias.ArticlePublish,
        meta: {
          title: 'menus.article.publish',
          keepAlive: false
        }
      },
      {
        path: 'category',
        name: 'ArticleCategory',
        component: RoutesAlias.ArticleCategory,
        meta: {
          title: 'menus.article.category',
          keepAlive: true
        }
      },
      {
        path: 'tags',
        name: 'ArticleTags',
        component: RoutesAlias.ArticleTags,
        meta: {
          title: 'menus.article.tags',
          keepAlive: true
        }
      }
    ]
  },
  // 说说管理
  {
    path: '/talk',
    name: 'Talk',
    component: RoutesAlias.Layout,
    meta: {
      title: 'menus.talk.title',
      icon: '&#xe7e0;',
      roles: ['R_SUPER', 'R_ADMIN']
    },
    children: [
      {
        path: 'talklist',
        name: 'TalkList',
        component: RoutesAlias.TalkList,
        meta: {
          title: 'menus.talk.list',
          keepAlive: true
        }
      },
      {
        path: 'publishtalk',
        name: 'PublishTalk',
        component: RoutesAlias.PublishTalk,
        meta: {
          title: 'menus.talk.publish',
          keepAlive: false
        }
      }
    ]
  },
  // 相册
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
  // 个人中心
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
