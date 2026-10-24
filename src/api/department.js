// 获取部门列表
import {request} from "@/utils/request.js";

export function getDepartmentList() {
    return request({
        url: '/department/departments',
        method: 'get',
    })
}

// 获取部门详情
export function getDepartmentDetail(id) {
    return request({
        url: `/departments/${id}`,
        method: 'get',
    })
}

// 新增部门
export function createDepartment(data) {
    return request({
        url: '/departments',
        method: 'post',
        data,
    })
}

// 更新部门
export function updateDepartment(id, data) {
    return request({
        url: `/departments/${id}`,
        method: 'put',
        data,
    })
}

// 删除部门
export function deleteDepartment(id) {
    return request({
        url: `/departments/${id}`,
        method: 'delete',
    })
}
