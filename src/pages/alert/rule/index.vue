<template>
  <PageContainer>
    <!-- 页面头部 -->
    <ManagerHeader title="告警规则" subtitle="管理告警规则和规则组" @refresh="handleRefresh">
      <template #actions>
        <el-button type="info" @click="handleManageGroups">
          <el-icon><Setting /></el-icon>
          管理规则组
        </el-button>
      </template>
    </ManagerHeader>

    <!-- 左右布局 -->
    <div class="rule-layout">
      <!-- 左侧：规则组列表 -->
      <div class="left-panel">
        <div class="panel-header">
          <h3>规则组</h3>
          <el-button type="primary" size="small" @click="handleAddGroup">
            <el-icon><Plus /></el-icon>
            新增
          </el-button>
        </div>
        <div class="group-list">
          <!-- 全部选项 -->
          <div class="group-item" :class="{ active: selectedGroup?.id === 0 }" @click="selectAllGroups">
            <div class="group-name" title="全部规则组">全部</div>
          </div>

          <!-- 规则组列表 -->
          <div
            v-for="group in ruleGroups"
            :key="group.id"
            class="group-item"
            :class="{ active: selectedGroup?.id === group.id }"
            @click="selectGroup(group)"
          >
            <div class="group-content">
              <div class="group-name" :title="group.name">{{ group.name }}</div>
            </div>
            <div class="group-actions" @click.stop>
              <el-button type="primary" :icon="Edit" size="small" circle @click="handleEditGroup(group)" />
              <el-button type="danger" :icon="Delete" size="small" circle @click="handleDeleteGroup(group)" />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：告警规则列表 -->
      <div class="right-panel">
        <div class="panel-header">
          <h3>{{ selectedGroup ? selectedGroup.name : "请选择规则组" }}</h3>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索规则"
              size="small"
              clearable
              style="width: 200px; margin-right: 10px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" size="small" @click="handleAddRule">
              <el-icon><Plus /></el-icon>
              新增规则
            </el-button>
          </div>
        </div>

        <DataTable
          :data="filteredRules"
          :columns="columns"
          :loading="loading"
          :show-pagination="true"
          :total="paginationData.total"
          :page-size="paginationData.pageSize"
          :current-page="paginationData.currentPage"
          :page-sizes="paginationData.pageSizes"
          :pagination-layout="paginationData.layout"
          @selection-change="handleSelectionChange"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        >
          <template #enabled="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? "启用" : "禁用" }}
            </el-tag>
          </template>

          <template #level="{ row }">
            <el-tooltip :content="getLevelDescription(row.level)" placement="top">
              <el-tag :type="getLevelTagType(row.level)">
                {{ getLevelPriority(row.level) }}
              </el-tag>
            </el-tooltip>
          </template>

          <template #datasource_type="{ row }">
            <el-tag type="info">{{ row.datasource_type }}</el-tag>
          </template>

          <template #eval_interval="{ row }">
            {{ formatEvalInterval(row.eval_interval) }}
          </template>

          <template #actions="{ row }">
            <OperateBtn
              :items="[
                {
                  name: '编辑',
                  code: 'edit',
                  type: 'primary',
                  icon: 'Edit'
                },
                {
                  name: '删除',
                  code: 'delete',
                  type: 'danger',
                  icon: 'Delete'
                }
              ]"
              :operate-item="row"
              :max-length="2"
              @route-event="handleOperateEvent"
            />
          </template>
        </DataTable>
      </div>
    </div>

    <!-- 规则组弹窗 -->
    <FormDialog
      v-model="groupDialogVisible"
      :title="isEditGroup ? '编辑规则组' : '新增规则组'"
      subtitle="配置规则组的基本信息"
      width="500px"
      header-icon="Setting"
      confirm-text="保存"
      @confirm="handleGroupSubmit"
      @cancel="handleGroupDialogClosed"
      @closed="handleGroupDialogClosed"
    >
      <RuleGroupForm
        ref="groupFormRef"
        :edit-data="currentGroup"
        @success="handleGroupSuccess"
        @closed="handleGroupDialogClosed"
      />
    </FormDialog>

    <!-- 规则抽屉 - 暂时注释 -->
    <!-- <RuleDrawer
      v-model="drawerVisible"
      :rule="currentRule"
      :rule-groups="ruleGroups"
      @success="handleFormSuccess"
    /> -->

    <!-- 规则组抽屉 - 暂时注释 -->
    <!-- <RuleGroupDrawer
      v-model="groupDrawerVisible"
      @success="handleGroupSuccess"
    /> -->
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus, Search, Edit, Delete, Setting } from "@element-plus/icons-vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import PageContainer from "@@/components/PageContainer/index.vue"
// import RuleDrawer from "./components/RuleDrawer.vue"
// import RuleGroupDrawer from "./components/RuleGroupDrawer.vue"
import {
  listRulesApi,
  listRuleGroupsApi,
  createRuleGroupApi,
  updateRuleGroupApi,
  deleteRuleGroupApi
} from "@/api/alert/rule"
import { ALERT_LEVEL_OPTIONS } from "@/api/alert/rule/types/rule"
import { FormDialog } from "@@/components/Dialogs"
import RuleGroupForm from "./components/RuleGroupForm.vue"
import type { Rule, RuleGroup } from "@/api/alert/rule/types/rule"
import { usePagination } from "@@/composables/usePagination"
import router from "@/router"

// 响应式数据
const loading = ref(false)
const rules = ref<Rule[]>([])
const ruleGroups = ref<RuleGroup[]>([])
const selectedRows = ref<Rule[]>([])
const selectedGroup = ref<RuleGroup | null>(null)
const searchKeyword = ref("")

// 规则组弹窗相关
const groupDialogVisible = ref(false)
const isEditGroup = ref(false)
const currentGroup = ref<RuleGroup | null>(null)
const groupFormRef = ref<InstanceType<typeof RuleGroupForm>>()

// 分页
const { paginationData } = usePagination()

// 分页事件处理
const handlePageChange = (page: number) => {
  paginationData.currentPage = page
  loadRules()
}

const handlePageSizeChange = (size: number) => {
  paginationData.pageSize = size
  paginationData.currentPage = 1
  loadRules()
}

// 表格列配置
const columns = [
  { type: "selection", width: 50, prop: "", label: "" },
  { prop: "name", label: "规则名称", flex: 2, showOverflowTooltip: true },
  { prop: "enabled", label: "状态", flex: 0.8, slot: "enabled" },
  { prop: "level", label: "告警级别", flex: 1, slot: "level" },
  { prop: "datasource_type", label: "数据源类型", flex: 1.2, slot: "datasource_type" },
  { prop: "description", label: "描述", flex: 3, showOverflowTooltip: true }
]

// 规则数据（分页和搜索都在服务端处理）
const filteredRules = computed(() => {
  return rules.value
})

// 获取告警级别描述
const getLevelDescription = (level: number) => {
  const option = ALERT_LEVEL_OPTIONS.find((item) => item.value === level)
  return option?.description || ""
}

// 获取告警级别优先级
const getLevelPriority = (level: number) => {
  const option = ALERT_LEVEL_OPTIONS.find((item) => item.value === level)
  return option?.priority || ""
}

// 获取告警级别 el-tag 类型
const getLevelTagType = (level: number) => {
  switch (level) {
    case 1: // P0 紧急
      return "danger"
    case 2: // P1 严重
      return "danger"
    case 3: // P2 错误
      return "warning"
    case 4: // P3 警告
      return "warning"
    case 5: // P4 提示
      return "info"
    default:
      return "info"
  }
}

// 格式化检测频率
const formatEvalInterval = (interval: number) => {
  if (interval < 60) {
    return `${interval}秒`
  } else if (interval < 3600) {
    return `${Math.floor(interval / 60)}分钟`
  } else {
    return `${Math.floor(interval / 3600)}小时`
  }
}

// 加载规则列表
const loadRules = async () => {
  try {
    loading.value = true
    if (!selectedGroup.value) {
      rules.value = []
      return
    }

    // 构建请求参数
    const params: any = {
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    }
    if (selectedGroup.value.id !== 0) {
      params.group_id = selectedGroup.value.id
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }

    const response = await listRulesApi(params)
    paginationData.total = response.data.total
    rules.value = response.data.rules
  } catch (error) {
    console.error("加载规则列表失败:", error)
  } finally {
    loading.value = false
  }
}

// 加载规则组列表
const loadRuleGroups = async () => {
  try {
    const response = await listRuleGroupsApi({ limit: 1000 })
    ruleGroups.value = response.data.rule_groups
    // 默认选择第一个规则组
    if (response.data.rule_groups.length > 0 && !selectedGroup.value) {
      selectedGroup.value = response.data.rule_groups[0]
    }
  } catch (error) {
    console.error("加载规则组列表失败:", error)
  }
}

// 选择规则组
const selectGroup = (group: RuleGroup) => {
  selectedGroup.value = group
  loadRules() // 选择规则组时自动加载对应的规则
}

// 选择全部规则组
const selectAllGroups = () => {
  selectedGroup.value = { id: 0, name: "全部", description: "显示所有规则组" } as RuleGroup
  loadRules()
}

// 新增规则组
const handleAddGroup = () => {
  isEditGroup.value = false
  currentGroup.value = null
  groupDialogVisible.value = true
}

// 编辑规则组
const handleEditGroup = (group: RuleGroup) => {
  isEditGroup.value = true
  currentGroup.value = group
  groupDialogVisible.value = true
  // 延迟设置表单数据，确保组件已渲染
  nextTick(() => {
    groupFormRef.value?.setFormData(group)
  })
}

// 删除规则组
const handleDeleteGroup = async (group: RuleGroup) => {
  try {
    await ElMessageBox.confirm(`确定要删除规则组"${group.name}"吗？删除后该组下的所有规则也将被删除。`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    await deleteRuleGroupApi(group.id)
    ElMessage.success("删除成功")
    loadRuleGroups()

    // 如果删除的是当前选中的规则组，切换到全部
    if (selectedGroup.value?.id === group.id) {
      selectAllGroups()
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败")
    }
  }
}

// 提交规则组表单
const handleGroupSubmit = async () => {
  if (!groupFormRef.value) return

  const isValid = await groupFormRef.value.submitForm()
  if (!isValid) return

  try {
    const formData = groupFormRef.value.getFormData()

    if (isEditGroup.value && currentGroup.value) {
      await updateRuleGroupApi({ id: currentGroup.value.id, ...formData })
      ElMessage.success("更新成功")
    } else {
      await createRuleGroupApi(formData)
      ElMessage.success("创建成功")
    }

    handleGroupSuccess()
  } catch (error) {
    ElMessage.error(isEditGroup.value ? "更新失败" : "创建失败")
  }
}

// 关闭规则组弹窗
const handleGroupDialogClosed = () => {
  groupDialogVisible.value = false
  isEditGroup.value = false
  currentGroup.value = null
  // 延迟重置表单，确保组件已渲染
  nextTick(() => {
    groupFormRef.value?.resetForm()
  })
}

// 规则组表单成功回调
const handleGroupSuccess = () => {
  groupDialogVisible.value = false
  loadRuleGroups()
}

// 刷新
const handleRefresh = () => {
  loadRules()
  loadRuleGroups()
}

// 新增规则
const handleAddRule = () => {
  if (!selectedGroup.value) {
    ElMessage.warning("请先选择规则组")
    return
  }

  // 跳转到新增规则页面，携带规则组信息
  router.push({
    path: "/alert/manager/rule/create",
    query: {
      groupId: selectedGroup.value.id.toString(),
      groupName: selectedGroup.value.name
    }
  })
}

// 管理规则组
const handleManageGroups = () => {
  ElMessage.info("管理规则组功能开发中...")
}

// 编辑规则
const handleEdit = (rule: Rule) => {
  router.push(`/alert/manager/rule/edit/${rule.id}`)
}

// 切换规则状态 - 暂时注释
// const handleToggle = async (rule: Rule) => {
//   try {
//     await ruleApi.toggleRule(rule.id, !rule.enabled)
//     ElMessage.success(`${rule.enabled ? '禁用' : '启用'}成功`)
//     loadRules()
//   } catch (error) {
//     console.error("切换规则状态失败:", error)
//     ElMessage.error("操作失败")
//   }
// }

// 删除规则 - 暂时注释
// const handleDelete = async (rule: Rule) => {
//   try {
//     await ElMessageBox.confirm(
//       `确定要删除规则 "${rule.name}" 吗？`,
//       "确认删除",
//       {
//         confirmButtonText: "确定",
//         cancelButtonText: "取消",
//         type: "warning"
//       }
//     )
//     await ruleApi.deleteRule(rule.id)
//     ElMessage.success("删除成功")
//     loadRules()
//   } catch (error) {
//     if (error !== "cancel") {
//       console.error("删除规则失败:", error)
//       ElMessage.error("删除失败")
//     }
//   }
// }

// 选择变化
const handleSelectionChange = (selection: Rule[]) => {
  selectedRows.value = selection
}

// 操作事件处理
const handleOperateEvent = (row: Rule, action: string) => {
  switch (action) {
    case "edit":
      handleEdit(row)
      break
    case "toggle":
      ElMessage.info(`切换规则 "${row.name}" 状态功能开发中...`)
      break
    case "delete":
      ElMessage.info(`删除规则 "${row.name}" 功能开发中...`)
      break
  }
}

// 表单成功回调 - 暂时注释
// const handleFormSuccess = () => {
//   drawerVisible.value = false
//   loadRules()
// }

// 规则组成功回调 - 暂时注释
// const handleGroupSuccess = () => {
//   groupDrawerVisible.value = false
//   loadRuleGroups()
// }

// 监听搜索关键词变化
watch(searchKeyword, () => {
  loadRules()
})

// 初始化
onMounted(() => {
  loadRuleGroups()
  // 默认选择"全部"
  selectAllGroups()
})
</script>

<style lang="scss" scoped>
.rule-layout {
  display: flex;
  height: 100%;
  gap: 1rem;
  flex-wrap: nowrap;
}

.left-panel {
  flex: 0 0 15%;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 0.125rem solid #e5e7eb;

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
    }
  }

  .group-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    width: 100%;
    min-width: 0;

    .group-item {
      padding: 0.75rem;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 0.5rem;
      border: 0.125rem solid transparent;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 2.5rem;

      &:hover {
        background: #f3f4f6;
        border-color: #d1d5db;

        .group-actions {
          opacity: 1;
        }
      }

      &.active {
        background: #eff6ff;
        border-color: #3b82f6;
        box-shadow: 0 0.125rem 0.5rem rgba(59, 130, 246, 0.15);
      }

      .group-content {
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }

      .group-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        display: block;
        word-break: break-all;
        line-height: 1.4;
      }

      .group-actions {
        display: flex;
        gap: 0.25rem;
        opacity: 0;
        transition: opacity 0.3s ease;
        flex-shrink: 0;
        margin-left: 0.5rem;
      }
    }
  }
}

.right-panel {
  flex: 1;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.content-card) {
    border-radius: 0;
    box-shadow: none;
    border: none;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 0.125rem solid #e5e7eb;

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
    }

    .header-actions {
      display: flex;
      align-items: center;
    }
  }
}
</style>
