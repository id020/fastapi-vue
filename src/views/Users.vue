<template>
  <div class="page-heading">
    <div>
      <div class="eyebrow muted">ACCESS MANAGEMENT</div>
      <h1>用户管理</h1>
      <p>管理登录账号、所属部门与角色关联。</p>
    </div>

    <!-- 只有具有写入权限的用户才能新建用户 -->
    <el-button
        v-if="canWrite"
        type="primary"
        class="primary-action"
        @click="openCreate"
    >
      <span>＋</span> 新建用户
    </el-button>
  </div>

  <!-- 搜索区域 -->
  <div class="search-card">
    <div class="search-title">
      <b>筛选用户</b>
      <span>按用户名、昵称或账号状态快速查找</span>
    </div>
    <el-form class="search-form" @submit.prevent="applySearch">
      <el-input
        v-model="searchForm.keyword"
        clearable
        placeholder="搜索用户名或昵称"
        class="keyword-input"
        @keyup.enter="applySearch"
      />
      <el-select v-model="searchForm.status" clearable placeholder="全部状态" class="status-select">
        <el-option label="启用" value="1" />
        <el-option label="停用" value="0" />
      </el-select>
      <el-button type="primary" @click="applySearch">搜索</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </el-form>
  </div>

  <!-- 用户列表 -->
  <div class="table-card">
    <!-- 表格工具栏 -->
    <div class="table-toolbar">
      <div>
        <b>用户列表</b>
        <span class="count-chip">{{ rows.length }}</span>
      </div>

      <el-button text :loading="loading" @click="loadRows">↻ 刷新</el-button>
    </div>

    <!-- 用户数据表格 -->
    <el-table
        :data="rows"
        :row-key="row => row.id"
        v-loading="loading"
        stripe
        class="resource-table"
    >
      <el-table-column prop="id" label="编号" width="82"/>
      <el-table-column prop="username" label="用户名" min-width="130"/>
      <el-table-column prop="nickname" label="昵称" min-width="130"/>
      <el-table-column label="所属部门" min-width="140">
        <template #default="{ row }">
          {{ displayValue(row, 'department') }}
        </template>
      </el-table-column>

      <el-table-column label="用户角色" min-width="160">
        <template #default="{ row }">
          {{ displayValue(row, 'roles') }}
        </template>
      </el-table-column>

      <el-table-column label="数据范围" min-width="140">
        <template #default="{ row }">
          {{
            row.roles?.map(role => ({
              self: '本人',
              department: '本部门',
              department_tree: '本部门及下级',
              custom: '自选部门',
              all: '全部',
            })[role.data_scope] ?? role.data_scope).join('、') || '—'
          }}
        </template>
      </el-table-column>

      <el-table-column label="账号状态" width="110">
        <template #default="{ row }">
          <span
              class="state-pill"
              :class="row.status ? 'active' : 'inactive'"
          >
            {{ row.status ? '启用' : '停用' }}
          </span>
        </template>
      </el-table-column>

      <!-- 仅具有写入权限时显示操作列 -->
      <el-table-column v-if="canWrite" label="操作" width="145" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row.id)">编辑</el-button>
          <el-button link type="danger" @click="removeRow(row)">删除</el-button>
        </template>
      </el-table-column>

      <!-- 暂无数据时的显示内容 -->
      <template #empty>
        <div class="empty-state">
          <b>暂无数据</b>
          <small>当前权限范围内没有记录</small>
        </div>
      </template>
    </el-table>

    <!-- 表格底部信息 -->
    <div class="table-foot">
      共 {{ rows.length }} 条记录
      <span>数据由后端权限规则过滤</span>
    </div>
  </div>


  <!-- 新增/编辑对话框 -->
  <el-dialog
      v-model="dialogOpen"
      :title="editingId ? '编辑用户' : '新建用户'"
      width="600px"
      destroy-on-close
      @closed="resetForm"
  >
    <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="edit-form"
    >
      <!-- 用户名 -->
      <el-form-item label="用户名" prop="username">
        <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :disabled="!!editingId"
        />
      </el-form-item>

      <!-- 昵称 -->
      <el-form-item label="昵称" prop="nickname">
        <el-input
            v-model="form.nickname"
            placeholder="请输入昵称"
        />
      </el-form-item>

      <!-- 密码：编辑时允许留空 -->
      <el-form-item label="密码" prop="password">
        <el-input
            v-model="form.password"
            type="password"
            show-password
            autocomplete="new-password"
            :placeholder="editingId ? '留空表示不修改密码' : '请输入密码'"
        />
      </el-form-item>

      <!-- 所属部门 -->
      <el-form-item label="所属部门" prop="department_id">
        <el-select
            v-model="form.department_id"
            clearable
            filterable
            class="full-width"
            placeholder="请选择部门"
        >
          <el-option
              v-for="item in departments"
              :key="item.id"
              :label="item.name"
              :value="item.id"
          />
        </el-select>
      </el-form-item>

      <!-- 用户角色：支持多选 -->
      <el-form-item label="用户角色" prop="roles">
        <el-select
            v-model="form.roles"
            multiple
            filterable
            clearable
            class="full-width"
            placeholder="请选择角色"
        >
          <el-option
              v-for="item in roles"
              :key="item.id"
              :label="item.name"
              :value="item.id"
          />
        </el-select>
      </el-form-item>

      <!-- 用户启用状态 -->
      <el-form-item label="账号状态">
        <el-switch
            v-model="form.status"
            active-text="启用"
            inactive-text="停用"
        />
      </el-form-item>
    </el-form>

    <!-- 对话框底部操作按钮 -->
    <template #footer>
      <el-button @click="dialogOpen = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import {computed, nextTick, onMounted, reactive, ref} from "vue";
import { ElMessage } from 'element-plus'
import {useAuthStore} from '@/stores/auth'

import { getDepartmentList } from '@/api/department'
import { getRoleList } from '@/api/role'
import {
  createUser,
  updateUser,
  getUserDetail, getUserList,
} from '@/api/user'

// ============================================================
// 一、权限与页面状态
// ============================================================

// 获取当前用户的认证和权限信息
const auth = useAuthStore()

// 是否具有用户管理写入权限
const canWrite = computed(() => auth.hasPermission('users:write'))

// 新增/编辑对话框是否显示
const dialogOpen = ref(false)

// 当前编辑用户的 ID；null 表示新增
const editingId = ref(null)

// 保存按钮的加载状态
const saving = ref(false)

// 表单组件引用，用于调用 validate、resetFields 等方法
const formRef = ref(null)

// 搜索表单数据
const searchForm = reactive({ keyword: '', status: '' })

// 搜索
function applySearch() {
  loadRows(searchForm)
}

// 重置搜索
function resetSearch() {
  searchForm.keyword = ''
  searchForm.status = ''
  applySearch()
}

// ============================================================
// 二、部门与角色选项
// ============================================================

// 部门下拉选项
const departments = ref([])

// 角色下拉选项
const roles = ref([])

/**
 * 预加载部门和角色数据。
 *
 * Promise.all 并行请求两个接口，
 * 两个请求都成功后再更新选项。
 */
async function loadOptions() {

  try {
    const [departmentRes, roleRes] = await Promise.all([
      getDepartmentList(),
      getRoleList(),
    ])

    departments.value = departmentRes.data
    roles.value = roleRes.data
  } catch (error) {
    console.error('加载部门和角色失败：', error)
    ElMessage.error('部门或角色数据加载失败，请重试')
    throw error
  }
}

// ============================================================
// 三、用户表单
// ============================================================

// 表单初始数据。
const initialForm = () => ({
  username: '',
  nickname: '',
  password: '',
  department_id: null,
  roles: [],
  status: true,
})

// 使用 reactive，使表单字段能够直接通过 form.xxx 访问
const form = reactive(initialForm())

// 用户列表数据
const rows = ref([])

// 用户列表加载状态
const loading = ref(false)

// 用户列表加载函数：支持搜索和刷新
async function loadRows(params = searchForm) {
  loading.value = true

  try {
    // 构造查询参数，避免传递响应式对象
    const query = {
      keyword: params.keyword?.trim() || '',
      status: params.status ?? '',
    }

    // 请求后端用户列表，并传递搜索条件
    const res = await getUserList(query)

    // 返回数组
    const result = res?.data ?? res

    if (Array.isArray(result)) {
      rows.value = result
    } else {
      rows.value = []
      console.error('用户列表返回格式不正确：', result)
      ElMessage.error('用户列表数据格式异常')
    }
  } catch (error) {
    console.error('加载用户列表失败：', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

function displayValue(row, key) {
  const value = row[key]

  // 账号状态
  if (key === 'status') {
    return value === true ? '启用' : value === false ? '停用' : '—'
  }

  // 部门对象
  if (key === 'department') {
    return row.department?.name ?? '—'
  }

  // 角色列表
  if (key === 'roles') {
    return row.roles?.map(role => role.name).join('、') || '—'
  }

  // 角色数据权限范围
  if (key === 'data_scope') {
    const scopes = {
      self: '本人',
      department: '本部门',
      department_tree: '本部门及下级',
      custom: '自选部门',
      all: '全部',
    }
    return scopes[value] ?? value ?? '—'
  }

  // 其他空值
  return value ?? '—'
}

// ============================================================
// 四、表单校验规则
// ============================================================

const rules = computed(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
  ],
  password: editingId.value
      ? []
      : [{ required: true, message: '请输入密码', trigger: 'blur' }],
}))

// ============================================================
// 五、重置表单
// ============================================================

/**
 * 重置表单数据和校验状态。
 *
 * 注意：先重置数据，再清除校验提示。
 */
function resetForm() {
  Object.assign(form, initialForm())

  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// ============================================================
// 六、新建用户
// ============================================================

/**
 * 打开新建用户对话框。
 *
 * 如果部门和角色尚未加载，先加载选项。
 */
async function openCreate() {
  if (!canWrite.value) {
    ElMessage.warning('你没有新增用户的权限')
    return
  }

  editingId.value = null
  resetForm()

  try {
    // 确保部门和角色选项已加载
    if (departments.value.length === 0 || roles.value.length === 0) {
      await loadOptions()
    }

    dialogOpen.value = true

    // 等待表单渲染后清除校验状态
    await nextTick()
    formRef.value?.clearValidate()
  } catch {
    // loadOptions 已显示错误提示，不重复提示
  }
}

// ============================================================
// 七、编辑用户
// ============================================================

/**
 * 打开编辑用户对话框。
 *
 * 调用前需要提供用户 ID。
 */
async function openEdit(userId) {
  if (!canWrite.value) {
    ElMessage.warning('你没有编辑用户的权限')
    return
  }

  editingId.value = userId
  resetForm()

  try {
    // 先准备下拉选项，再加载用户详情
    if (departments.value.length === 0 || roles.value.length === 0) {
      await loadOptions()
    }

    const res = await getUserDetail(userId)

    // 兼容 { data: {...} } 和直接返回对象的格式
    const detail = res?.data ?? res

    Object.assign(form, {
      username: detail.username ?? '',
      nickname: detail.nickname ?? '',
      password: '',
      department_id: detail.department_id ?? null,

      // 假设后端返回 roles 为角色对象数组，
      // 例如 [{ id: 1, name: '管理员' }]。
      // 如果后端返回的是 role_ids 数组，请改成 detail.role_ids。
      roles: Array.isArray(detail.role_ids)
          ? detail.role_ids
          : Array.isArray(detail.roles)
              ? detail.roles.map(role =>
                  typeof role === 'object' ? role.id : role
              )
              : [],

      // 按照后端实际状态类型调整
      status: detail.status === true ||
          detail.status === 1 ||
          detail.status === 'active',
    })

    dialogOpen.value = true

    await nextTick()
    formRef.value?.clearValidate()
  } catch (error) {
    console.error('获取用户详情失败：', error)
    ElMessage.error('获取用户详情失败')
  }
}

// ============================================================
// 八、保存用户
// ============================================================

/**
 * 新增或更新用户。
 *
 * 新增：调用 createUser
 * 编辑：调用 updateUser
 */
async function save() {
  if (!canWrite.value) {
    ElMessage.warning('你没有保存用户的权限')
    return
  }

  if (!formRef.value) return

  // 先校验表单
  const valid = await formRef.value.validate().catch(() => false)

  if (!valid) return

  saving.value = true

  try {
  // 生成独立的提交对象，避免直接修改表单数据
    const payload = {
      username: form.username.trim(),
      nickname: form.nickname.trim(),
      department_id: form.department_id,
      role_ids: [...form.roles],
      status: form.status,
    }

    // 密码非空时才提交。
    // 编辑时密码为空，后端应保留原密码。
    if (form.password) {
      payload.password = form.password
    }

    if (editingId.value) {
      // 编辑用户
      await updateUser(editingId.value, payload)
      ElMessage.success('用户更新成功')
    } else {
      // 新建用户
      await createUser(payload)
      ElMessage.success('用户创建成功')
    }

    // 保存成功后关闭对话框
    dialogOpen.value = false

    // 刷新用户列表
    await loadRows()
  } catch (error) {
    console.error('保存用户失败：', error)

    // 如果 Axios 拦截器已经统一处理错误提示，
    // 可删除这里的 ElMessage，避免重复提示。
    const message =
        error?.response?.data?.detail ||
        error?.message ||
        '保存用户失败'

    ElMessage.error(
        typeof message === 'string' ? message : '保存用户失败'
    )
  } finally {
    saving.value = false
  }
}

// ============================================================
// 九、页面初始化
// ============================================================

onMounted(async () => {
  // 并行加载用户列表、部门列表和角色列表
  await Promise.all([
    loadRows(),
    loadOptions().catch(() => {
      // loadOptions 已经显示错误提示，这里不重复提示
    }),
  ])
})

// 如果页面用户列表的编辑按钮需要调用 openEdit，
// 请在列表中使用 @click="openEdit(row.id"。
</script>

<style scoped>
/* ================= User页面样式 ================= */
.table-card {
  background: #fff;
  border: 1px solid #edf0f5;
  border-radius: 12px;
  box-shadow: 0 3px 14px #25375a05;
  padding: 0 21px
}

.table-toolbar {
  height: 61px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f2f6;
  color: #33435c;
  font-size: 12px
}

.table-toolbar>div {
  display: flex;
  align-items: center;
  gap: 10px
}

.count-chip {
  min-width: 22px;
  height: 19px;
  border-radius: 5px;
  background: #f0f2ff;
  color: #6170dc;
  font-size: 10px;
  display: grid;
  place-items: center;
  padding: 0 6px
}

.table-toolbar .el-button {
  font-size: 11px;
  color: #8591a4
}

.table-foot {
  height: 47px;
  border-top: 1px solid #f2f3f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #9ca6b5;
  font-size: 10px
}

.empty-state {
  padding: 43px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  color: #a0aabc
}

.empty-state>span {
  font-size: 25px;
  color: #c7cde0
}

.empty-state b {
  font-size: 12px;
  font-weight: 500;
  color: #68778e
}

.empty-state small {
  font-size: 10px
}

.state-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px
}

.state-pill:before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #27b889
}

.state-pill.inactive:before {
  background: #c4cad4
}

.state-pill.inactive {
  color: #9ca5b2
}


/* ================= 搜索卡片样式 ================= */
.search-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin: -8px 0 18px;
  padding: 17px 21px;
  background: #fff;
  border: 1px solid #edf0f5;
  border-radius: 12px;
  box-shadow: 0 3px 14px #25375a05
}

.search-title {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #33435c;
  font-size: 12px;
  white-space: nowrap
}

.search-title span {
  color: #9ca6b5;
  font-size: 11px
}

.search-form {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: flex-end
}

.keyword-input {
  max-width: 280px
}

.status-select {
  width: 140px
}

.created-time {
  color: #77849a;
  font-size: 12px;
  font-variant-numeric: tabular-nums
}

@media (max-width: 760px) {
  .search-card {
    align-items: stretch;
    flex-direction: column;
    gap: 14px
  }

  .search-form {
    flex-wrap: wrap;
    justify-content: flex-start
  }

  .keyword-input {
    max-width: none;
    flex: 1 1 100%
  }
}
</style>