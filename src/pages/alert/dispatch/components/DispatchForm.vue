<template>
  <div class="dispatch-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      label-width="auto"
      class="dispatch-form"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>基本信息</span>
        </div>

        <div class="form-row">
          <el-form-item prop="name" label="规则名称" class="form-item">
            <el-input v-model="formData.name" placeholder="请输入规则名称" />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="description" label="规则描述" class="form-item">
            <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入规则描述（可选）" />
          </el-form-item>
        </div>
      </div>

      <!-- 分发配置 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Share /></el-icon>
          <span>分发配置</span>
        </div>

        <div class="form-row form-row-inline">
          <el-form-item prop="scope" label="作用域" class="form-item form-item-flex">
            <el-select v-model="formData.scope" placeholder="请选择作用域">
              <el-option label="全局" value="global" />
              <el-option label="规则" value="rule" />
            </el-select>
            <div class="form-tip">全局对所有告警生效，规则仅对指定告警规则生效</div>
          </el-form-item>
          <el-form-item
            v-if="formData.scope === 'rule'"
            prop="rule_id"
            label="关联告警规则"
            class="form-item form-item-flex"
          >
            <RuleSelector v-model="formData.rule_id" placeholder="请选择告警规则" variant="simple" />
          </el-form-item>
        </div>

        <div class="form-row form-row-inline">
          <el-form-item prop="match_type" label="分发类型" class="form-item form-item-flex">
            <el-select v-model="formData.match_type" placeholder="请选择分发类型">
              <el-option label="路由分发" value="routing" />
              <el-option label="创建工单" value="ticket" />
            </el-select>
            <div class="form-tip">路由分发：将告警分发到指定工作空间。创建工单：将告警创建为工单</div>
          </el-form-item>
          <el-form-item
            v-if="formData.match_type === 'routing'"
            prop="workspace_id"
            label="目标工作空间"
            class="form-item form-item-flex"
          >
            <el-select v-model="formData.workspace_id" placeholder="请选择目标工作空间" style="width: 100%">
              <el-option
                v-for="workspace in workspaces"
                :key="workspace.id"
                :label="workspace.name"
                :value="workspace.id"
              />
            </el-select>
          </el-form-item>
        </div>
      </div>

      <!-- 匹配条件 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Filter /></el-icon>
          <span>匹配条件</span>
        </div>

        <div class="form-row">
          <el-form-item prop="label_matchers" label="标签匹配器" class="form-item">
            <div class="matcher-config">
              <div v-for="(matcher, index) in formData.label_matchers" :key="index" class="matcher-item">
                <el-input v-model="matcher.name" placeholder="标签名" size="default" />
                <el-select v-model="matcher.type" placeholder="类型" size="default">
                  <el-option label="等于" :value="1" />
                  <el-option label="不等于" :value="2" />
                  <el-option label="正则" :value="3" />
                  <el-option label="非正则" :value="4" />
                </el-select>
                <el-input v-model="matcher.value" placeholder="标签值" size="default" />
                <el-button type="text" @click="removeMatcher(index)" class="matcher-remove"> 删除 </el-button>
              </div>
              <el-button type="text" @click="addMatcher" class="add-matcher-btn">
                <el-icon><Plus /></el-icon>
                添加标签匹配器
              </el-button>
            </div>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="levels" label="告警级别" class="form-item">
            <el-select v-model="formData.levels" multiple placeholder="请选择告警级别" style="width: 100%">
              <el-option label="P0-紧急" :value="1" />
              <el-option label="P1-严重" :value="2" />
              <el-option label="P2-错误" :value="3" />
              <el-option label="P3-警告" :value="4" />
              <el-option label="P4-提示" :value="5" />
            </el-select>
          </el-form-item>
        </div>

        <div v-if="formData.match_type === 'routing'" class="form-row form-row-inline">
          <el-form-item prop="duration" label="持续时间（秒）" class="form-item form-item-flex">
            <el-input-number v-model="formData.duration" placeholder="请输入持续时间" style="width: 100%" :min="0" />
          </el-form-item>
          <el-form-item prop="firing_count" label="触发次数" class="form-item form-item-flex">
            <el-input-number
              v-model="formData.firing_count"
              placeholder="请输入触发次数"
              style="width: 100%"
              :min="1"
            />
          </el-form-item>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { Setting, Share, Filter, Plus } from "@element-plus/icons-vue"
import type { FormInstance } from "element-plus"
import type { SaveDispatchRuleReq } from "@/api/alert/dispatch/types"
import type { Workspace } from "@/api/alert/workspace/types"
import { listWorkspacesApi } from "@/api/alert/workspace"
import { useDispatchForm } from "../composables/useDispatchForm"
import { clearZeroValues } from "@@/utils"
import RuleSelector from "@@/components/RuleSelector/index.vue"

// Props
const props = defineProps<{
  formRules?: any
}>()

// 使用 defineModel 简化双向绑定
const formData = defineModel<SaveDispatchRuleReq>("formData", { required: true })

// 使用 form composable 获取默认表单验证规则
const { formRules: defaultFormRules } = useDispatchForm()

// 使用传入的 formRules 或默认的
const formRules = props.formRules || defaultFormRules

const formRef = ref<FormInstance>()

// 工作空间列表
const workspaces = ref<Workspace[]>([])

// 加载工作空间列表
const loadWorkspaces = async () => {
  try {
    const response = await listWorkspacesApi({ offset: 0, limit: 0 })
    workspaces.value = response.data.workspaces
  } catch (error) {
    console.error("加载工作空间列表失败:", error)
  }
}

// 添加匹配器
const addMatcher = () => {
  formData.value.label_matchers.push({
    type: 1, // MatchType.Equal
    name: "",
    value: ""
  })
}

// 删除匹配器
const removeMatcher = (index: number) => {
  formData.value.label_matchers.splice(index, 1)
}

// 组件挂载时的初始化
onMounted(async () => {
  await loadWorkspaces()
})

// 获取清理后的表单数据
const getCleanedFormData = () => {
  return clearZeroValues(formData.value)
}

// 暴露 formRef 和清理函数给父组件
defineExpose({
  formRef,
  getCleanedFormData
})
</script>

<style lang="scss" scoped>
.dispatch-form-container {
  padding: 20px;
}

.dispatch-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 16px;
    padding: 10px 14px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;

    .section-icon {
      margin-right: 6px;
      font-size: 16px;
      color: #3b82f6;
    }

    span {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
  }

  .form-row {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    &.form-row-inline {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
  }

  .form-item {
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
      font-size: 13px;
    }

    &.form-item-flex {
      flex: 1;
      min-width: 0;
    }

    :deep(.el-input__wrapper) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }

    :deep(.el-select__wrapper) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }
  }

  .switch-container {
    display: flex;
    align-items: center;
    gap: 8px;

    .form-tip {
      font-size: 12px;
      color: #6b7280;
    }
  }

  .form-tip {
    font-size: 12px;
    color: #6b7280;
    margin-top: 6px;
  }

  .matcher-config {
    width: 100%;

    .matcher-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      margin-bottom: 6px;
      width: 100%;

      &:last-child {
        margin-bottom: 0;
      }

      .el-input {
        &:first-child {
          flex: 0 0 140px;
          min-width: 140px;
        }

        &:last-child {
          flex: 1;
          min-width: 150px;
        }
      }

      .el-select {
        flex: 0 0 100px;
        min-width: 100px;
      }

      .matcher-remove {
        flex: 0 0 auto;
        margin-left: auto;
        color: #ef4444;

        &:hover {
          color: #dc2626;
        }
      }
    }

    .add-matcher-btn {
      width: 100%;
      margin-top: 8px;
      color: #3b82f6;
      border: 1px dashed #3b82f6;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      &:hover {
        color: #1d4ed8;
        background: #dbeafe;
      }
    }
  }
}
</style>
