<template>
  <div class="app-container">
    <div class="layout">
      <div class="menu">
        <el-card>
          <el-button size="default" type="primary" @click="addDepartment"> 添加部门</el-button>
          <el-button size="default" type="primary" :disabled="!currentNodeKey" @click="addSubMenu">
            添加子部门</el-button
          >
          <el-button size="default" type="primary" @click="handleCheckedTreeExpand">
            {{ isExpand ? "全部收起" : "全部展开" }}
          </el-button>
        </el-card>
        <el-card class="menu-tree">
          <div class="input-tree-container">
            <el-input v-model="filterInput" size="default" placeholder="输入部门名称搜索" :suffix-icon="Search" />
            <el-tree
              ref="treeRef"
              :data="treeData"
              show-checkbox
              node-key="id"
              :highlight-current="true"
              :expand-on-click-node="false"
              @node-click="handleNodeClick"
              :current-node-key="currentNodeKey"
              :props="defaultProps"
              :filter-node-method="filterNode"
            />
          </div>
        </el-card>
      </div>
      <div class="control">
        <el-card>
          <div v-if="empty">
            <el-tabs v-model="activeName" type="card" class="demo-tabs" @tab-click="handleClick">
              <el-tab-pane lazy label="详情信息" name="detail">
                <DepartmentForm
                  ref="departmentUpdateRef"
                  :departmentData="treeData"
                  @listDepartmentTreeData="listDepartmentTreeData"
                />
                <div class="form-bottom" style="margin-top: 20px">
                  <el-form-item>
                    <el-button type="primary" size="large" @click="handleUpdate">修改</el-button>
                    <el-button type="danger" size="large" @click="handleDelete">删除</el-button>
                  </el-form-item>
                </div>
              </el-tab-pane>
              <el-tab-pane lazy label="用户列表" name="user">
                <User ref="userRef" :departmentId="currentNodeKey" />
              </el-tab-pane>
            </el-tabs>
          </div>
          <div>
            <Tip :empty="empty" />
          </div>
        </el-card>
      </div>
    </div>
    <div>
      <el-dialog v-model="dialogVisible" title="添加部门" @closed="resetForm">
        <DepartmentForm
          ref="departmentCreateRef"
          :departmentData="treeData"
          @listDepartmentTreeData="listDepartmentTreeData"
          @closed="onClosed"
        />
        <template #footer>
          <el-button @click="resetForm">取消</el-button>
          <el-button type="primary" @click="handlerCreate">确认</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, nextTick, onMounted, ref, watch } from "vue"
import { Search } from "@element-plus/icons-vue"
import DepartmentForm from "./form.vue"
import Tip from "./tip.vue"
import User from "./user.vue"
import { ElMessage, ElMessageBox, ElTree, TabsPaneContext } from "element-plus"
import { deleteDepartmentApi, listDepartmentTreeApi } from "@/api/department"
import { department } from "@/api/department/types/department"
const filterInput = ref("")

const dialogVisible = ref<boolean>(false)
const defaultProps = ref<any>({
  children: "children",
  label: (node: department) => node.name,
  key: "id"
})

const empty = ref<boolean>(false)
const treeRef = ref<InstanceType<typeof ElTree>>() as any
const departmentCreateRef = ref<InstanceType<typeof DepartmentForm>>()
const departmentUpdateRef = ref<InstanceType<typeof DepartmentForm>>()
const userRef = ref<InstanceType<typeof User>>()
const handleUpdate = () => {
  departmentUpdateRef.value?.submitUpdateForm()
}

const addDepartment = async () => {
  dialogVisible.value = true
  await nextTick(() => {
    departmentCreateRef.value?.resetForm()
  })
}

const handlerCreate = () => {
  departmentCreateRef.value?.submitCreateForm()
}

const onClosed = (id: number) => {
  // 关闭弹窗
  dialogVisible.value = false

  // 避免触发 update 获取逻辑
  currentNodeKey.value = id
  empty.value = true
}

const resetForm = () => {
  dialogVisible.value = false
}

const currentNodeKey = ref<any>(null)
const handleNodeClick = async (node: department) => {
  activeName.value = "detail"
  if (currentNodeKey.value === node.id) {
    // 如果点击的节点已经是当前高亮节点，则取消高亮
    currentNodeKey.value = null
    empty.value = false
  } else {
    // 否则设置当前点击的节点为高亮
    currentNodeKey.value = node.id
    empty.value = true

    console.log(node)
    await nextTick(() => {
      updateDepartmentData(node)
    })
  }
}

const updateDepartmentData = (node: department | null) => {
  if (node === null) {
    return
  }

  departmentUpdateRef.value?.setDepartmentData(node)
}

interface Tree {
  [key: string]: any
}

const filterNode = (value: string, data: Tree) => {
  if (!value) return true

  // 确保data.label存在且是字符串
  return typeof data.meta.title === "string" && data.meta.title.includes(value)
}

/** 查询模版列表 */
const treeData = ref<department[]>([])
const listDepartmentTreeData = () => {
  listDepartmentTreeApi()
    .then(async ({ data }) => {
      if (data.length === 0) {
        return
      }

      treeData.value = data

      await nextTick(() => {
        if (currentNodeKey.value) {
          treeRef.value!.setCurrentKey(currentNodeKey.value)
          const node = findDepartmentById(data, currentNodeKey.value)
          updateDepartmentData(node)
          return
        }
      })
    })
    .catch(() => {
      treeData.value = []
    })
    .finally(() => {})
}

const handleDelete = () => {
  const node = findDepartmentById(treeData.value, currentNodeKey.value)
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除部门: "),
      h("i", { style: "color: red" }, `${node?.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteDepartmentApi(currentNodeKey.value).then(() => {
      ElMessage.success("删除成功")
      isExpand.value = false
      listDepartmentTreeData()

      if (treeData.value.length === 1) {
        empty.value = false
        currentNodeKey.value = null
      }
    })
  })
}

const findDepartmentById = (departments: department[], id: number): department | null => {
  for (const department of departments) {
    if (department.id === id) {
      return department
    }

    if (department.children.length > 0) {
      const found = findDepartmentById(department.children, id)
      if (found) {
        return found
      }
    }
  }
  return null
}

const recursionFn = (arr: department[]) => {
  const nodes = treeRef.value?.store?.nodesMap
  if (arr.length > 0) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]?.children?.length > 0) {
        nodes[arr[i].id].expanded = isExpand.value
        recursionFn(arr[i]?.children)
      }
    }
  }
}

const isExpand = ref(false)
const handleCheckedTreeExpand = () => {
  isExpand.value = !isExpand.value
  const treeList = treeData.value
  recursionFn(treeList)
}

const addSubMenu = async () => {
  dialogVisible.value = true
  await nextTick()
  departmentCreateRef.value?.resetForm()

  // 插入特性数据
  departmentCreateRef.value?.setFromForPid(currentNodeKey.value)
}

const activeName = ref("detail")
const handleClick = (tab: TabsPaneContext) => {
  if (tab.paneName === "detail") {
    console.log("detail")
  } else if (tab.paneName === "user") {
    userRef.value?.listUsersData()
  }
}

onMounted(() => {
  listDepartmentTreeData()
})

watch(filterInput, (val: string) => {
  treeRef.value!.filter(val)
})
</script>

<style lang="scss" scoped>
.layout {
  display: flex;
  height: 100%;
  align-items: stretch;
  gap: 12px;
}
.input-tree-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.menu {
  flex: 0 0 28%;
}

.menu-tree {
  overflow-y: auto;
  max-height: 78vh;
}

.control {
  flex: 1;
}

.divider {
  margin: 10px;
}
</style>
