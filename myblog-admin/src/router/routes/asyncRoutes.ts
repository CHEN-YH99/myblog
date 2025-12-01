import { RoutesAlias } from '../routesAlias'
import { AppRouteRecord } from '@/types/router'

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
 * RoutesAlias.Layout 指向的是布局组件，后端返回的菜单数据中，component 字段需要指向 /index/index
 * 路由元数据（meta）：异步路由在 asyncRoutes 中配置，静态路由在 staticRoutes 中配置
 */
export const asyncRoutes: AppRouteRecord[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    component: RoutesAlias.Layout,
    meta: {
      title: 'menus.dashboard.title',
      icon: '&#xe721;',
      roles: ['R_SUPER', 'R_ADMIN']
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
  {
    path: '/user',
    name: 'User',
    component: RoutesAlias.Layout,
    meta: {
      title: 'menus.user.title',
      icon: '&#xe7b9;',
      roles: ['R_SUPER', 'R_ADMIN']
    },
    children: [
      {
        path: 'management',
        name: 'UserManagement',
        component: RoutesAlias.User,
        meta: {
          title: 'menus.user.title',
          keepAlive: true
        }
      }
    ]
  },
  {
    path: '/user-center',
    name: 'UserCenter',
    component: RoutesAlias.UserCenter,
    meta: {
      title: 'menus.system.userCenter',
      isHide: true,
      keepAlive: true,
      isHideTab: true
    }
  },
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
  {
    path: '/exception',
    name: 'Exception',
    component: RoutesAlias.Layout,
    meta: {
      title: 'menus.exception.title',
      icon: '&#xe820;'
    },
    children: [
      {
        path: '403',
        name: '403',
        component: RoutesAlias.ArticleList,
        meta: {
          title: 'menus.exception.forbidden',
          keepAlive: true
        }
      },
      {
        path: '404',
        name: '404',
        component: RoutesAlias.ArticleList,
        meta: {
          title: 'menus.exception.notFound',
          keepAlive: true
        }
      },
      {
        path: '500',
        name: '500',
        component: RoutesAlias.ArticleList,
        meta: {
          title: 'menus.exception.serverError',
          keepAlive: true
        }
      }
    ]
  }
]
