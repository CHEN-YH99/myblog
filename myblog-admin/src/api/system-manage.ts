import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'
import { asyncRoutes } from '@/views/dashboard/asyncRoutes'
import { menuDataToRouter } from '@/router/utils/menuToRouter'

// 获取用户列表
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/api/users',
    params
  })
}

// 创建用户
export function fetchCreateUser(data: Partial<Api.SystemManage.UserListItem>) {
  return request.post<Api.SystemManage.UserListItem>({
    url: '/api/users',
    data
  })
}

// 更新用户
export function fetchUpdateUser(id: number, data: Partial<Api.SystemManage.UserListItem>) {
  return request.put<Api.SystemManage.UserListItem>({
    url: `/api/users/${id}`,
    data
  })
}

// 删除用户
export function fetchDeleteUser(id: number) {
  return request.del({
    url: `/api/users/${id}`
  })
}

// 获取用户详情
export function fetchGetUserDetail(id: number) {
  return request.get<Api.SystemManage.UserListItem>({
    url: `/api/users/${id}`
  })
}

// 获取角色列表
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/api/roles',
    params
  })
}

// 创建角色
export function fetchCreateRole(data: Partial<Api.SystemManage.RoleListItem>) {
  return request.post<Api.SystemManage.RoleListItem>({
    url: '/role/create',
    data
  })
}

// 更新角色
export function fetchUpdateRole(id: number, data: Partial<Api.SystemManage.RoleListItem>) {
  return request.put<Api.SystemManage.RoleListItem>({
    url: `/role/update/${id}`,
    data
  })
}

// 删除角色
export function fetchDeleteRole(id: number) {
  return request.delete({
    url: `/role/delete/${id}`
  })
}

// 获取角色详情
export function fetchGetRoleDetail(id: number) {
  return request.get<Api.SystemManage.RoleListItem>({
    url: `/role/detail/${id}`
  })
}

interface MenuResponse {
  menuList: AppRouteRecord[]
}

// 获取菜单数据（模拟）
export async function fetchGetMenuList(delay = 300): Promise<MenuResponse> {
  try {
    // 模拟接口返回的菜单数据
    const menuData = asyncRoutes
    // 处理菜单数据
    const menuList = menuData.map((route) => menuDataToRouter(route))
    // 模拟接口延迟
    await new Promise((resolve) => setTimeout(resolve, delay))

    return { menuList }
  } catch (error) {
    throw error instanceof Error ? error : new Error('获取菜单失败')
  }
}
