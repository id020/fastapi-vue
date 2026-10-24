<template>
  <div class="page-heading">
    <div>
      <div class="eyebrow muted">ORGANIZATION</div>
      <h1>部门管理</h1>
      <p>维护组织层级及部门说明。</p>
    </div>
    <el-button v-if="canWrite" type="primary" class="primary-action" @click="openCreate()">
      ＋ 新建部门
    </el-button>
  </div>

  <div class="table-card">
    <div class="table-toolbar">
      <div><b>部门列表</b><span class="count-chip">{{ rows.length }}</span></div>
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
      <el-table-column prop="name" label="部门名称" min-width="220" />
      <el-table-column prop="description" label="部门说明" min-width="240" show-overflow-tooltip />
      <el-table-column prop="id" label="编号" width="90" />
      <el-table-column v-if="canWrite" label="操作" width="190" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openCreate(row.id)">新增下级</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="removeRow(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty><div class="empty-state"><b>暂无部门</b></div></template>
    </el-table>
    <div class="table-foot">共 {{ rows.length }} 个部门<span>删除前需先移除成员、下级部门和角色授权</span></div>
  </div>

  <el-dialog v-model="dialogOpen" :title="editingId ? '编辑部门' : '新建部门'" width="520px" destroy-on-close @closed="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="edit-form">
      <el-form-item label="部门名称" prop="name"><el-input v-model="form.name" maxlength="100" /></el-form-item>
      <el-form-item label="上级部门">
        <el-tree-select
          v-model="form.parent_id"
          :data="parentOptions"
          node-key="id"
          :props="{ label: 'name', children: 'children' }"
          check-strictly
          clearable
          class="full-width"
          placeholder="不选择则设为顶级部门"
        />
      </el-form-item>
      <el-form-item label="部门说明" class="span-two"><el-input v-model="form.description" type="textarea" :rows="3" maxlength="255" /></el-form-item>
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
import { createDepartment, deleteDepartment, getDepartmentList, updateDepartment } from '@/api/department'

const auth = useAuthStore()
const canWrite = computed(() => auth.hasPermission('departments:write'))
const rows = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const editingId = ref(null)
const formRef = ref(null)
const form = reactive({ name: '', parent_id: null, description: '' })
const rules = { name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }] }

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
const parentOptions = computed(() => makeTree(rows.value, editingId.value))

async function loadRows() {
  loading.value = true
  try {
    const { data } = await getDepartmentList()
    rows.value = Array.isArray(data) ? data : []
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.response?.data?.detail || '加载部门失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { name: '', parent_id: null, description: '' })
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
  Object.assign(form, { name: row.name, parent_id: row.parent_id, description: row.description || '' })
  dialogOpen.value = true
}

async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  saving.value = true
  try {
    const payload = { name: form.name.trim(), parent_id: form.parent_id ?? null, description: form.description.trim() }
    if (editingId.value) await updateDepartment(editingId.value, payload)
    else await createDepartment(payload)
    ElMessage.success(editingId.value ? '部门更新成功' : '部门创建成功')
    dialogOpen.value = false
    await loadRows()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.response?.data?.detail || '保存部门失败')
  } finally {
    saving.value = false
  }
}

async function removeRow(row) {
  if (!canWrite.value) return
  try {
    await ElMessageBox.confirm(`确定删除部门“${row.name}”吗？`, '删除部门', { type: 'warning' })
    await deleteDepartment(row.id)
    ElMessage.success('部门删除成功')
    await loadRows()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.response?.data?.message || error.response?.data?.detail || '删除部门失败')
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
