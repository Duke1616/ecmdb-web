<template>
  <ProGovernanceLayout
    title="部门治理"
    subtitle="管理系统部门和人员组织架构，支持树形关系治理与关联成员分派"
    :show-refresh="true"
    @refresh="handleRefresh"
  >
    <div class="content">
      <!-- 左侧面板 - 部门树 -->
      <DepartmentTree
        ref="deptTreeComponentRef"
        :tree-data="treeData"
        :loading="treeLoading"
        :current-node-key="currentNodeKey"
        @node-click="handleNodeClick"
        @add-dept="addDepartment"
        @add-sub-dept="handleCreateSubDepartment"
        @node-drop="handleNodeDrop"
      />

      <!-- 右侧内容区域 - 详情与成员 -->
      <div class="department-details">
        <div v-if="currentNodeKey" class="department-content-wrapper">
          <CustomTabs :tabs="tabs" :default-active="activeName" @tab-change="handleTabChange" class="department-tabs">
            <template #default="{ activeTab }">
              <!-- 详情表单：直连 DepartmentDetailForm，移除多余包装层 -->
              <DepartmentDetailForm
                v-if="activeTab === 'detail'"
                ref="detailFormRef"
                :form-data="formData"
                :department-data="treeData"
              />
              <DepartmentUser v-slot="{}" v-if="activeTab === 'user'" ref="userRef" :department-id="currentNodeKey" />
            </template>
          </CustomTabs>
          <div v-if="activeName === 'detail'" class="department-actions-footer">
            <el-button type="primary" :loading="saving" @click="handleUpdate">
              <el-icon><Edit /></el-icon>
              修改
            </el-button>
            <el-button type="danger" @click="handleDelete">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
        <div v-else class="department-empty">
          <el-empty description="选择左侧部门以查看其详情与成员" />
        </div>
      </div>
    </div>

    <!-- 添加/创建自治弹窗 -->
    <DepartmentDialog v-model="dialogVisible" :id="dialogId" :parent-id="dialogParentId" @success="handleFormSuccess" />
  </ProGovernanceLayout>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from "vue"
import { Edit, Delete } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { useDepartmentTree } from "./composables/useDepartmentTree"
import { useDepartmentForm } from "./composables/useDepartmentForm"
import { deleteDepartmentApi } from "@/api/iam/department"
import type { IDepartmentNode } from "@/api/iam/department/type"

// 引入子组件
import DepartmentTree from "./components/DepartmentTree.vue"
import DepartmentDetailForm from "./components/DepartmentDetailForm.vue"
import DepartmentUser from "./user.vue"
import DepartmentDialog from "./components/DepartmentDialog.vue"

import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import CustomTabs from "@/common/components/Tabs/CustomTabs.vue"

// 选项卡配置
const activeName = ref("detail")
const tabs = [
  { name: "detail", label: "详情信息" },
  { name: "user", label: "用户列表" }
]

// 对话框控制状态
const dialogVisible = ref(false)
const dialogId = ref<number | undefined>(undefined)
const dialogParentId = ref<number | undefined>(undefined)

const detailFormRef = ref<InstanceType<typeof DepartmentDetailForm> | null>(null)
const userRef = ref<InstanceType<typeof DepartmentUser> | null>(null)
const deptTreeComponentRef = ref<InstanceType<typeof DepartmentTree> | null>(null)

// 引入树数据管理
const {
  treeData,
  loading: treeLoading,
  currentNodeKey,
  refreshTreeData,
  findDepartmentById,
  saveTreeLayout
} = useDepartmentTree()

// 引入表单数据管理
const { formData, saving, setDepartmentData, submitUpdateForm } = useDepartmentForm(() => {
  ElMessage.success("修改成功")
  refreshTreeData()
})

/**
 * 节点点击事件
 */
const handleNodeClick = async (node: IDepartmentNode) => {
  activeName.value = "detail"

  if (currentNodeKey.value === node.id) {
    currentNodeKey.value = null
  } else {
    currentNodeKey.value = node.id
    await nextTick()
    setDepartmentData(node)
  }
}

/**
 * 点击修改按钮触发
 */
const handleUpdate = async () => {
  const form = detailFormRef.value?.formRef
  if (!form) return
  await submitUpdateForm(form)
}

/**
 * 点击删除按钮触发
 */
const handleDelete = () => {
  if (!currentNodeKey.value) return
  const node = findDepartmentById(treeData.value, currentNodeKey.value)
  if (!node) return

  ElMessageBox.confirm(`确定要删除部门 "${node.name}" 吗？此操作不可逆。`, "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await deleteDepartmentApi(currentNodeKey.value!)
      ElMessage.success("删除成功")
      currentNodeKey.value = null
      refreshTreeData()
    } catch (error) {
      console.error("删除部门失败:", error)
    }
  })
}

/**
 * 点击添加部门按钮
 */
const addDepartment = () => {
  dialogId.value = undefined
  dialogParentId.value = undefined
  dialogVisible.value = true
}

/**
 * 点击添加子部门按钮
 */
const handleCreateSubDepartment = () => {
  if (!currentNodeKey.value) return
  dialogId.value = undefined
  dialogParentId.value = currentNodeKey.value
  dialogVisible.value = true
}

/**
 * 刷新数据
 */
const handleRefresh = async () => {
  await refreshTreeData()
  ElMessage.success("数据已刷新")
}

/**
 * 标签页切换事件
 */
const handleTabChange = (tabName: string) => {
  activeName.value = tabName
  if (tabName === "detail" && currentNodeKey.value) {
    const node = findDepartmentById(treeData.value, currentNodeKey.value)
    if (node) {
      nextTick(() => {
        setDepartmentData(node)
      })
    }
  }
}

/**
 * 弹窗表单保存成功后回调
 */
const handleFormSuccess = () => {
  dialogVisible.value = false
  refreshTreeData()
}

/**
 * 处理树节点拖拽完成事件，同步更新后端关系
 */
const handleNodeDrop = async (eventData: { parentId: number }) => {
  await saveTreeLayout(eventData.parentId)
}

onMounted(() => {
  refreshTreeData()
})
</script>

<style lang="scss" scoped>
.content {
  display: flex;
  flex: 1;
  gap: calc(0.8rem + 0.2vw);
  overflow: hidden;
  min-height: 0;
  height: calc(100vh - 7.5rem);
  max-height: calc(100vh - 7.5rem);
  position: relative;
}

.department-details {
  flex: 1;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.department-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  flex: 1;
}

.department-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: white;
  border-radius: calc(0.4rem + 0.1vw);
  border: 1px solid #e5e7eb;
}

.department-actions-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: calc(0.8rem + 0.2vw);
  padding: calc(1rem + 0.3vw) calc(1.2rem + 0.3vw);
  margin-top: auto;
  background: white;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 calc(0.6rem + 0.1vw) calc(0.6rem + 0.1vw);

  .el-button {
    height: calc(2rem + 0.3vw);
    padding: 0 calc(1.2rem + 0.3vw);
    border-radius: calc(0.4rem + 0.1vw);
    font-size: calc(0.7rem + 0.1vw);
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.2rem + 0.1vw) rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(calc(-0.1rem + 0.05vw));
      box-shadow: 0 calc(0.2rem + 0.1vw) calc(0.6rem + 0.2vw) rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.2rem + 0.1vw) rgba(0, 0, 0, 0.1);
    }

    .el-icon {
      margin-right: calc(0.3rem + 0.1vw);
      font-size: calc(0.8rem + 0.1vw);
    }

    &[type="primary"] {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
      color: #ffffff;

      &:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }

      &:active {
        background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
      }
    }

    &[type="danger"] {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border: none;
      color: #ffffff;

      &:hover {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      }

      &:active {
        background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
      }
    }
  }
}

.department-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: white;
  border: 1px solid #e5e7eb;
  border-bottom: none;
  border-radius: calc(0.6rem + 0.1vw) calc(0.6rem + 0.1vw) 0 0;
}
</style>
