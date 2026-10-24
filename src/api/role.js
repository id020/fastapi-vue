import {request} from '@/utils/request'

// 获取角色列表
export function getRoleList(params = {}) {
    return request({
        url: '/role/roles',
        method: 'get',
        params,
    })
}

// 获取角色详情
export function getRoleDetail(id) {
    return request({
        url: `/role/roles/${id}`,
        method: 'get',
    })
}

// 新增角色
export function createRole(data) {
    return request({
        url: '/role/roles',
        method: 'post',
        data,
    })
}

// 更新角色
export function updateRole(id, data) {
    return request({
        url: `/role/roles/${id}`,
        method: 'put',
        data,
    })
}

// 删除角色
export function deleteRole(id) {
    return request({
        url: `/role/roles/${id}`,
        method: 'delete',
    })
}
