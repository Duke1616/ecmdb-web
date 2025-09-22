<template>
  <div class="rule-edit-page">
    <PageContainer>
      <!-- 页面头部 -->
      <ManagerHeader
        title="编辑告警规则"
        subtitle="修改告警规则配置"
        :show-back-button="true"
        :show-add-button="false"
        :show-refresh-button="false"
        :sticky="true"
        @back="handleCancel"
      >
        <template #actions>
          <el-button type="primary" @click="handleSave" class="action-btn" :loading="saving">
            <el-icon><Check /></el-icon>
            保存规则
          </el-button>
        </template>
      </ManagerHeader>

      <!-- 可滚动内容区域 -->
      <div class="scrollable-content">
        <!-- 表单内容 -->
        <div class="rule-form-container">
          <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top"  size="large">
            <!-- 基本信息 -->
            <div class="form-section">
              <h3 class="section-title">基本信息</h3>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="规则名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入规则名称" clearable />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="规则组" prop="group_id">
                    <el-select v-model="formData.group_id" placeholder="请选择规则组" style="width: 100%">
                      <el-option v-for="group in ruleGroups" :key="group.id" :label="group.name" :value="group.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="告警级别" prop="level">
                    <el-select v-model="formData.level" placeholder="请选择告警级别" style="width: 100%">
                      <el-option
                        v-for="option in ALERT_LEVEL_OPTIONS"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="检测频率" prop="eval_interval">
                    <el-select v-model="formData.eval_interval" placeholder="请选择检测频率" style="width: 100%">
                      <el-option
                        v-for="option in EVAL_INTERVAL_OPTIONS"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="规则描述" prop="description">
                <el-input
                  v-model="formData.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入规则描述"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>
            </div>

            <!-- 数据源配置 -->
            <div class="form-section">
              <h3 class="section-title">数据源配置</h3>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="数据源类型" prop="datasource_type">
                    <el-select
                      v-model="formData.datasource_type"
                      placeholder="请选择数据源类型"
                      style="width: 100%"
                      @change="handleDatasourceTypeChange"
                    >
                      <el-option label="Prometheus" value="PROMETHEUS" />
                      <el-option label="Loki" value="LOKI" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="数据源" prop="datasource_ids">
                    <el-select
                      v-model="formData.datasource_ids"
                      placeholder="请选择数据源"
                      style="width: 100%"
                      multiple
                      clearable
                      filterable
                    >
                      <el-option
                        v-for="datasource in datasources"
                        :key="datasource.id"
                        :label="datasource.name"
                        :value="datasource.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- 规则配置 -->
            <div class="form-section">
              <h3 class="section-title">规则配置</h3>
              <el-form-item label="PromQL查询" prop="prom_ql">
                <el-input v-model="formData.prom_ql" type="textarea" :rows="4" placeholder="请输入PromQL查询语句" />
              </el-form-item>

              <el-form-item label="外部标签" prop="external_labels">
                <el-input
                  v-model="externalLabelsInput"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入外部标签，格式：key1=value1,key2=value2"
                  @blur="handleExternalLabelsChange"
                />
              </el-form-item>
            </div>

            <!-- 状态配置 -->
            <div class="form-section">
              <h3 class="section-title">状态配置</h3>
              <el-form-item label="启用状态" prop="enabled">
                <el-switch v-model="formData.enabled" active-text="启用" inactive-text="禁用" />
              </el-form-item>
            </div>
          </el-form>
        </div>
      </div>
    </PageContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { Check } from "@element-plus/icons-vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import { getRuleApi, updateRuleApi, listRuleGroupsApi } from "@/api/alert/rule"
import { listDataSourceByTypeApi } from "@/api/alert/datasource"
import {
  ALERT_LEVEL_OPTIONS,
  EVAL_INTERVAL_OPTIONS,
  type RuleGroup,
  type UpdateRuleReq
} from "@/api/alert/rule/types/rule"
import type { Datasource, DatasourceTypeEnum } from "@/api/alert/datasource/types/datasource"
import type { FormInstance, FormRules } from "element-plus"

const route = useRoute()
const router = useRouter()

// 表单引用
const formRef = ref<FormInstance>()
const saving = ref(false)
const loading = ref(false)

// 规则组列表
const ruleGroups = ref<RuleGroup[]>([])

// 数据源列表
const datasources = ref<Datasource[]>([])

// 输入框数据
const externalLabelsInput = ref("")

// 表单数据
const formData = reactive<UpdateRuleReq>({
  id: 0,
  name: "",
  group_id: 0,
  level: 1,
  description: "",
  datasource_type: "PROMETHEUS",
  datasource_ids: [],
  workspace_ids: [],
  prom_ql: "",
  eval_interval: 60,
  enabled: true,
  external_labels: {}
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: "请输入规则名称", trigger: "blur" },
    { min: 2, max: 50, message: "规则名称长度在 2 到 50 个字符", trigger: "blur" }
  ],
  group_id: [{ required: true, message: "请选择规则组", trigger: "change" }],
  level: [{ required: true, message: "请选择告警级别", trigger: "change" }],
  datasource_type: [{ required: true, message: "请选择数据源类型", trigger: "change" }],
  datasource_ids: [{ required: true, message: "请选择数据源", trigger: "change" }],
  prom_ql: [{ required: true, message: "请输入PromQL查询语句", trigger: "blur" }],
  eval_interval: [{ required: true, message: "请选择检测频率", trigger: "change" }]
}

// 处理外部标签输入
const handleExternalLabelsChange = () => {
  if (externalLabelsInput.value) {
    const labels: Record<string, string> = {}
    externalLabelsInput.value.split(",").forEach((pair) => {
      const [key, value] = pair.split("=").map((s) => s.trim())
      if (key && value) {
        labels[key] = value
      }
    })
    formData.external_labels = labels
  } else {
    formData.external_labels = {}
  }
}

// 加载规则组列表
const loadRuleGroups = async () => {
  try {
    const response = await listRuleGroupsApi({ limit: 1000 })
    ruleGroups.value = response.data.rule_groups
  } catch (error) {
    console.error("加载规则组列表失败:", error)
    ElMessage.error("加载规则组列表失败")
  }
}

// 加载数据源列表
const loadDatasources = async (type: DatasourceTypeEnum) => {
  try {
    const response = await listDataSourceByTypeApi({ type })
    datasources.value = response.data
  } catch (error) {
    console.error("加载数据源列表失败:", error)
    ElMessage.error("加载数据源列表失败")
  }
}

// 处理数据源类型变化
const handleDatasourceTypeChange = (type: DatasourceTypeEnum) => {
  // 清空已选择的数据源
  formData.datasource_ids = []
  // 加载对应类型的数据源
  loadDatasources(type)
}

// 加载规则详情
const loadRuleDetail = async (ruleId: number) => {
  try {
    loading.value = true
    const response = await getRuleApi(ruleId)
    const rule = response.data

    // 填充表单数据
    formData.id = rule.id
    formData.name = rule.name
    formData.group_id = rule.group_id
    formData.level = rule.level
    formData.description = rule.description || ""
    formData.datasource_type = rule.datasource_type
    formData.datasource_ids = rule.datasource_ids || []
    formData.workspace_ids = rule.workspace_ids || []
    formData.prom_ql = rule.prom_ql
    formData.eval_interval = rule.eval_interval
    formData.enabled = rule.enabled
    formData.external_labels = rule.external_labels || {}

    // 处理外部标签显示
    if (rule.external_labels && Object.keys(rule.external_labels).length > 0) {
      externalLabelsInput.value = Object.entries(rule.external_labels)
        .map(([key, value]) => `${key}=${value}`)
        .join(",")
    }

    // 加载对应类型的数据源
    await loadDatasources(rule.datasource_type as DatasourceTypeEnum)
  } catch (error) {
    console.error("加载规则详情失败:", error)
    ElMessage.error("加载规则详情失败")
  } finally {
    loading.value = false
  }
}

// 保存规则
const handleSave = async () => {
  if (!formRef.value) return

  try {
    const isValid = await formRef.value.validate()
    if (!isValid) return

    saving.value = true
    await updateRuleApi(formData)
    ElMessage.success("规则更新成功")

    // 返回规则列表页面
    router.push("/alert/rule")
  } catch (error) {
    ElMessage.error("规则更新失败")
  } finally {
    saving.value = false
  }
}

// 取消操作
const handleCancel = () => {
  ElMessageBox.confirm("确定要离开吗？未保存的数据将丢失。", "确认离开", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      router.push("/alert/rule")
    })
    .catch(() => {
      // 用户取消
    })
}

// 页面初始化
onMounted(() => {
  const ruleId = route.params.id
  if (ruleId) {
    loadRuleGroups()
    loadRuleDetail(Number(ruleId))
  } else {
    ElMessage.error("规则ID不存在")
    router.push("/alert/rule")
  }
})
</script>

<style lang="scss" scoped>
.rule-edit-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.page-container) {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: calc(1rem + 0.4vw);
  }
}

.rule-form-container {
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1);
  // margin-bottom: 2rem;
}

.form-section {
  margin-bottom: 2rem;

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
}

:deep(.el-form-item) {
  margin-bottom: 1.5rem;

  .el-form-item__label {
    font-weight: 500;
    color: #374151;
  }

  .el-input__wrapper {
    border-radius: 0.5rem;
  }

  .el-textarea__inner {
    border-radius: 0.5rem;
    resize: none;
  }

  .el-select {
    .el-input__wrapper {
      border-radius: 0.5rem;
    }
  }
}
</style>
