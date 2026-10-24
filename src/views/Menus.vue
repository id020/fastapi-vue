<template>
  <div class="page-heading">
    <div>
      <div class="eyebrow muted">ACCESS MANAGEMENT</div>
      <h1>菜单管理</h1>
      <p>维护页面导航、按钮权限及权限标识。</p>
    </div>
    <el-button v-if="canWrite" type="primary" class="primary-action" @click="openCreate()">＋ 新建菜单</el-button>
  </div>

  <div class="table-card">
    <div class="table-toolbar">
      <div><b>菜单与权限项</b><span class="count-chip">{{ rows.length }}</span></div>
      <el-button text :loading="loading" @click="loadRows">↻ 刷新</el-button>
    </div>
    <el-table
      :data="treeRows"
      row-key="id"
      default-expand-all
      v-loading="loading"
      stripe
      class="resource-table"
      :tree-props="{ children: 'children' }"
    >
      <el-table-column prop="name" label="名称" min-width="180" />
      <el-table-column label="类型" width="110">
        <template #default="{ row }"><el-tag :type="row.menu_type === 'menu' ? 'primary' : 'info'" effect="plain">{{ row.menu_type === 'menu' ? '页面菜单' : '按钮权限' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="permission" label="权限标识" min-width="190" />
      <el-table-column prop="path" label="路由路径" min-width="150"><template #default="{ row }">{{ row.path || '—' }}</template></el-table-column>
      <el-table-column prop="component" label="页面组件" min-width="140"><template #default="{ row }">{{ row.component || '—' }}</template></el-table-column>
      <el-table-column prop="sort_order" label="排序" width="90" />
      <el-table-column v-if="canWrite" label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.menu_type === 'menu'" link type="primary" @click="openCreate(row.id)">新增子项</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="removeRow(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty><div class="empty-state"><b>暂无菜单</b></div></template>
    </el-table>
    <div class="table-foot">共 {{ rows.length }} 个菜单/权限项<span>被角色授权或含有子项的数据不能删除</span></div>
  </div>

  <el-dialog v-model="dialogOpen" :title="editingId ? '编辑菜单/权限' : '新建菜单/权限'" width="650px" destroy-on-close @closed="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="edit-form">
      <el-form-item label="名称" prop="name"><el-input v-model="form.name" maxlength="100" /></el-form-item>
      <el-form-item label="类型" prop="menu_type">
        <el-select v-model="form.menu_type" class="full-width" @change="onTypeChange">
          <el-option label="页面菜单" value="menu" />
          <el-option label="按钮权限" value="button" />
        </el-select>
      </el-form-item>
      <el-form-item label="权限标识" prop="permission"><el-input v-model="form.permission" maxlength="160" placeholder="例如 users:view" /></el-form-item>
      <el-form-item label="父级菜单">
        <el-tree-select
          v-model="form.parent_id"
          :data="parentOptions"
          node-key="id"
          :props="{ label: 'name', children: 'children' }"
          check-strictly
          clearable
          class="full-width"
          placeholder="不选择则设为顶级项"
        />
      </el-form-item>
      <template v-if="form.menu_type === 'menu'">
        <el-form-item label="路由路径" prop="path"><el-input v-model="form.path" maxlength="160" placeholder="例如 /roles" /></el-form-item>
        <el-form-item label="页面组件" prop="component"><el-input v-model="form.component" maxlength="100" placeholder="例如 Roles" /></el-form-item>
      </template>
      <el-form-item label="排序值" prop="sort_order"><el-input-number v-model="form.sort_order" :min="0" :max="99999" class="full-width" /></el-form-item>
      <div v-if="form.menu_type === 'button'" class="span-two form-tip">按钮权限不配置路由路径和页面组件。</div>
    </el-form>
    <template #footer>
      <el-button @click="dialogOpen = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { createMenu, deleteMenu, getMenuList, updateMenu } from '@/api/menu'

const auth = useAuthStore()
const canWrite = computed(() => auth.hasPermission('menus:write'))
const rows = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const editingId = ref(null)
const formRef = ref(null)
const form = reactive({ name: '', permission: '', menu_type: 'menu', path: '', component: '', parent_id: null, sort_order: 0 })
const rules = computed(() => ({
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  permission: [{ required: true, message: '请输入权限标识', trigger: 'blur' }],
  menu_type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  ...(form.menu_type === 'menu' ? {
    path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }],
    component: [{ required: true, message: '请输入页面组件名称', trigger: 'blur' }],
  } : {}),
}))

function makeTree(items, excludedId = null) {
  const nodes = items.filter(item => item.id !== excludedId).map(item => ({ ...item, children: [] }))
  const byId = new Map(nodes.map(item => [item.id, item]))
  const roots = []
  for (const node of nodes) {
    const parent = byId.get(node.parent_id)
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

const treeRows = computed(() => makeTree(rows.value))
const parentOptions = computed(() => makeTree(rows.value.filter(item => item.menu_type === 'menu'), editingId.value))

async function loadRows() {
  loading.value = true
  try {
    const { data } = await getMenuList()
    rows.value = Array.isArray(data) ? data : []
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.response?.data?.detail || '加载菜单失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { name: '', permission: '', menu_type: 'menu', path: '', component: '', parent_id: null, sort_order: 0 })
  editingId.value = null
  formRef.value?.clearValidate()
}

function openCreate(parentId = null) {
  if (!canWrite.value) return
  resetForm()
  form.parent_id = parentId
  dialogOpen.value = true
}

function openEdit(row) {
  if (!canWrite.value) return
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    permission: row.permission,
    menu_type: row.menu_type,
    path: row.path || '',
    component: row.component || '',
    parent_id: row.parent_id,
    sort_order: row.sort_order,
  })
  dialogOpen.value = true
}

function onTypeChange(type) {
  if (type === 'button') {
    form.path = ''
    form.component = ''
  }
  formRef.value?.clearValidate(['path', 'component'])
}

async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      permission: form.permission.trim(),
      menu_type: form.menu_type,
      path: form.menu_type === 'menu' ? form.path.trim() : '',
      component: form.menu_type === 'menu' ? form.component.trim() : '',
      parent_id: form.parent_id ?? null,
      sort_order: form.sort_order,
    }
    if (editingId.value) await updateMenu(editingId.value, payload)
    else await createMenu(payload)
    ElMessage.success(editingId.value ? '菜单更新成功' : '菜单创建成功')
    dialogOpen.value = false
    await loadRows()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.response?.data?.detail || '保存菜单失败')
  } finally {
    saving.value = false
  }
}

async function removeRow(row) {
  if (!canWrite.value) return
  try {
    await ElMessageBox.confirm(`确定删除“${row.name}”吗？`, '删除菜单/权限', { type: 'warning' })
    await deleteMenu(row.id)
    ElMessage.success('菜单/权限删除成功')
    await loadRows()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.response?.data?.message || error.response?.data?.detail || '删除菜单失败')
    }
  }
}

onMounted(loadRows)
</script>


<style scoped>
/* ================= 角色页面样式 ================= */
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

</style>