import { request } from '@/utils/request'

export function getMenuList() {
  return request({ url: '/menu/menus', method: 'get' })
}

export function getMenuDetail(id) {
  return request({ url: `/menu/menus/${id}`, method: 'get' })
}

export function createMenu(data) {
  return request({ url: '/menu/menus', method: 'post', data })
}

export function updateMenu(id, data) {
  return request({ url: `/menu/menus/${id}`, method: 'put', data })
}

export function deleteMenu(id) {
  return request({ url: `/menu/menus/${id}`, method: 'delete' })
}
