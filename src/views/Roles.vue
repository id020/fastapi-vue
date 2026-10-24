<template>
  <div class="page-heading">
    <div>
      <div class="eyebrow muted">ACCESS MANAGEMENT</div>
      <h1>角色管理</h1>
      <p>配置角色权限、数据范围及可访问部门。</p>
    </div>
    <el-button v-if="canWrite" type="primary" class="primary-action" @click="openCreate">＋ 新建角色</el-button>
  </div>

  <div class="table-card">
    <div class="table-toolbar">
      <div><b>角色列表</b><span class="count-chip">{{ rows.length }}</span></div>
      <el-button text :loading="loading" @click="loadRows">↻ 刷新</el-button>
    </div>
    <el-table :data="rows" row-key="id" v-loading="loading" stripe class="resource-table">
      <el-table-column prop="id" label="编号" width="82" />
      <el-table-column prop="name" label="角色名称" min-width="150" />
      <el-table-column prop="code" label="角色编码" min-width="150" />
      <el-table-column label="数据范围" min-width="150">
        <template #default="{ row }">{{ scopeLabels[row.data_scope] || row.data_scope }}</template>
      </el-table-column>
      <el-table-column label="权限项" min-width="100"><template #default="{ row }">{{ row.menu_ids?.length || 0 }} 项</template></el-table-column>
      <el-table-column prop="description" label="角色说明" min-width="220" show-overflow-tooltip />
      <el-table-column v-if="canWrite" label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="removeRow(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty><div class="empty-state"><b>暂无角色</b></div></template>
    </el-table>
    <div class="table-foot">共 {{ rows.length }} 个角色<span>被用户使用的角色不能删除</span></div>
  </div>

  <el-dialog v-model="dialogOpen" :title="editingId ? '编辑角色' : '新建角色'" width="760px" destroy-on-close @closed="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="edit-form">
      <el-form-item label="角色名称" prop="name"><el-input v-model="form.name" maxlength="100" /></el-form-item>
      <el-form-item label="角色编码" prop="code"><el-input v-model="form.code" maxlength="100" /></el-form-item>
      <el-form-item label="数据范围" prop="data_scope">
        <el-select v-model="form.data_scope" class="full-width">
          <el-option v-for="(label, value) in scopeLabels" :key="value" :label="label" :value="value" />
        </el-select>
      </el-form-item>
      <el-form-item label="角色说明"><el-input v-model="form.description" maxlength="255" /></el-form-item>
      <el-form-item label="菜单及按钮权限" class="span-two">
        <div class="tree-panel">
          <el-tree ref="menuTreeRef" :data="menuTree" node-key="id" show-checkbox check-strictly default-expand-all :props="treeProps" empty-text="暂无菜单权限项" />
        </div>
      </el-form-item>
      <el-form-item v-if="form.data_scope === 'custom'" label="自定义数据部门" class="span-two">
        <div class="tree-panel">
          <el-tree ref="departmentTreeRef" :data="departmentTree" node-key="id" show-checkbox check-strictly default-expand-all :props="treeProps" empty-text="暂无部门" />
        </div>
      </el-form-item>
      <div v-else class="span-two form-tip">选择“自选部门”后，可配置角色的数据部门范围。</div>
    </el-form>
    <template #footer>
      <el-button @click="dialogOpen = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { getDepartmentList } from '@/api/department'
import { getMenuList } from '@/api/menu'
import { createRole, deleteRole, getRoleList, updateRole } from '@/api/role'

const auth = useAuthStore()
const canWrite = computed(() => auth.hasPermission('roles:write'))
const scopeLabels = { self: '本人', department: '本部门', department_tree: '本部门及下级', custom: '自选部门', all: '全部' }
const treeProps = { label: 'name', children: 'children' }
const rows = ref([])
const menuTree = ref([])
const departmentTree = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const editingId = ref(null)
const formRef = ref(null)
const menuTreeRef = ref(null)
const departmentTreeRef = ref(null)
const form = reactive({ name: '', code: '', description: '', data_scope: 'self', menu_ids: [], department_ids: [] })
const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  data_scope: [{ required: true, message: '请选择数据范围', trigger: 'change' }],
}

function makeTree(items) {
  const nodes = items.map(item => ({ ...item, children: [] }))
  const byId = new Map(nodes.map(item => [item.id, item]))
  const roots = []
  for (const node of nodes) {
    const parent = byId.get(node.parent_id)
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

async function loadRows() {
  loading.value = true
  try {
    const { data } = await getRoleList()
    rows.value = Array.isArray(data) ? data : []
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.response?.data?.detail || '加载角色失败')
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  const [menusRes, departmentsRes] = await Promise.all([getMenuList(), getDepartmentList()])
  menuTree.value = makeTree(menusRes.data || [])
  departmentTree.value = makeTree(departmentsRes.data || [])
}

function resetForm() {
  Object.assign(form, { name: '', code: '', description: '', data_scope: 'self', menu_ids: [], department_ids: [] })
  editingId.value = null
  menuTreeRef.value?.setCheckedKeys([])
  departmentTreeRef.value?.setCheckedKeys([])
  formRef.value?.clearValidate()
}

async function openCreate() {
  if (!canWrite.value) return
  resetForm()
  try {
    if (!menuTree.value.length || !departmentTree.value.length) await loadOptions()
    dialogOpen.value = true
    await nextTick()
    menuTreeRef.value?.setCheckedKeys([])
    departmentTreeRef.value?.setCheckedKeys([])
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.response?.data?.detail || '加载权限选项失败')
  }
}

async function openEdit(row) {
  if (!canWrite.value) return
  try {
    if (!menuTree.value.length || !departmentTree.value.length) await loadOptions()
    editingId.value = row.id
    Object.assign(form, {
      name: row.name,
      code: row.code,
      description: row.description || '',
      data_scope: row.data_scope,
      menu_ids: row.menu_ids || [],
      department_ids: row.department_ids || [],
    })
    dialogOpen.value = true
    await nextTick()
    menuTreeRef.value?.setCheckedKeys(form.menu_ids)
    departmentTreeRef.value?.setCheckedKeys(form.department_ids)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.response?.data?.detail || '加载权限选项失败')
  }
}

async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim(),
      data_scope: form.data_scope,
      menu_ids: menuTreeRef.value?.getCheckedKeys(false) || [],
      department_ids: form.data_scope === 'custom' ? departmentTreeRef.value?.getCheckedKeys(false) || [] : [],
    }
    if (editingId.value) await updateRole(editingId.value, payload)
    else await createRole(payload)
    ElMessage.success(editingId.value ? '角色更新成功' : '角色创建成功')
    dialogOpen.value = false
    await loadRows()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.response?.data?.detail || '保存角色失败')
  } finally {
    saving.value = false
  }
}

async function removeRow(row) {
  if (!canWrite.value) return
  try {
    await ElMessageBox.confirm(`确定删除角色“${row.name}”吗？`, '删除角色', { type: 'warning' })
    await deleteRole(row.id)
    ElMessage.success('角色删除成功')
    await loadRows()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.response?.data?.message || error.response?.data?.detail || '删除角色失败')
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