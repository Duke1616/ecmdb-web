<template>
  <div class="automation-property-dialog">
    <!-- 弹窗头部 -->
    <div class="dialog-header">
      <div class="header-icon">
        <div class="icon-circle">
          <SvgIcon name="automation" icon-class="automation" />
        </div>
      </div>
      <div class="header-content">
        <h3 class="header-title">自动化节点配置</h3>
        <p class="header-subtitle">配置自动化任务的执行参数和通知设置</p>
      </div>
    </div>

    <!-- 表单内容 -->
    <div class="dialog-content">
      <el-form
        ref="formRef"
        :model="propertyForm"
        :inline-message="true"
        :rules="formRules"
        label-position="top"
        :disabled="flowDetail.status == '2'"
        class="property-form"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-icon">📝</span>
            <span>基本信息</span>
          </div>

          <el-form-item label="节点名称" prop="name" class="form-item">
            <el-input
              v-model="propertyForm.name"
              clearable
              placeholder="请输入节点名称"
              class="modern-input"
              :disabled="flowDetail.status == '2'"
            />
            <div class="form-help">名称必须以"自动化-"开头，最大50个字符</div>
          </el-form-item>
        </div>

        <!-- 执行配置 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-icon">⚙️</span>
            <span>执行配置</span>
          </div>

          <div class="form-row">
            <el-form-item label="代码模版" prop="codebook_uid" class="form-item">
              <el-select
                v-model="propertyForm.codebook_uid"
                filterable
                placeholder="请选择代码模版"
                @change="handlerChangeCodebook()"
                class="modern-select"
                :disabled="flowDetail.status == '2'"
              >
                <el-option
                  v-for="item in runnerTagsData"
                  :key="item.codebook_uid"
                  :label="item.codebook_name"
                  :value="item.codebook_uid"
                  class="modern-option"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="标签" prop="tag" class="form-item">
              <el-select
                ref="tagSelect"
                v-model="propertyForm.tag"
                filterable
                placeholder="选择代码模版后可编辑"
                :disabled="!propertyForm.codebook_uid || flowDetail.status == '2'"
                class="modern-select"
              >
                <el-option
                  v-for="[tag, topic] of Array.from(tags_topic)"
                  :key="`${topic}-${tag}`"
                  :label="tag"
                  :value="tag"
                  class="modern-option"
                />
                <template #footer>
                  <el-button
                    text
                    bg
                    size="small"
                    type="primary"
                    style="width: 100%"
                    @click="setAutoTag"
                    class="auto-tag-btn"
                  >
                    自动发现
                  </el-button>
                </template>
              </el-select>
            </el-form-item>
          </div>
        </div>

        <!-- 定时设置 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-icon">⏰</span>
            <span>定时设置</span>
          </div>

          <div class="form-row">
            <el-form-item label="定时执行" prop="is_timing" class="form-item">
              <el-select
                v-model="propertyForm.is_timing"
                placeholder="是否开启定时执行"
                class="modern-select"
                :disabled="flowDetail.status == '2'"
                @change="handleTimingChange"
              >
                <el-option
                  v-for="item in is_timing"
                  :key="item.label"
                  :label="item.label"
                  :value="item.value"
                  class="modern-option"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="执行方式" prop="rule" class="form-item">
              <el-select
                v-model="propertyForm.exec_method"
                clearable
                @change="handleChange"
                placeholder="请选择执行方式"
                class="modern-select"
                :disabled="flowDetail.status == '2'"
              >
                <el-option
                  v-for="item in options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  class="modern-option"
                />
              </el-select>
            </el-form-item>
          </div>

          <!-- 手动设置定时 -->
          <div
            v-if="propertyForm.exec_method === 'hand' && propertyForm.is_timing === true"
            class="conditional-section"
          >
            <div class="form-row">
              <el-form-item label="执行单位" prop="unit" class="form-item">
                <el-select
                  v-model="propertyForm.unit"
                  placeholder="执行单位"
                  class="modern-select"
                  :disabled="flowDetail.status == '2'"
                >
                  <el-option
                    v-for="item in unit"
                    :key="item.label"
                    :label="item.label"
                    :value="item.value"
                    class="modern-option"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="执行数值" prop="quantity" class="form-item">
                <el-input-number
                  v-model="propertyForm.quantity"
                  :min="1"
                  size="default"
                  class="modern-input-number"
                  :disabled="flowDetail.status == '2'"
                />
              </el-form-item>
            </div>
          </div>

          <!-- 模板字段定时 -->
          <div
            v-if="propertyForm.exec_method === 'template' && propertyForm.is_timing === true"
            class="conditional-section"
          >
            <div class="form-row">
              <el-form-item label="模版名称" prop="leftValue" class="form-item">
                <el-select
                  v-model="propertyForm.template_id"
                  placeholder="请选择模版"
                  class="modern-select"
                  :disabled="flowDetail.status == '2'"
                >
                  <el-option
                    v-for="item in templateRules"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                    class="modern-option"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="模版字段" prop="leftValue" class="form-item">
                <el-select
                  v-model="propertyForm.template_field"
                  :disabled="!propertyForm.template_id || flowDetail.status == '2'"
                  placeholder="请选择模版字段"
                  class="modern-select"
                >
                  <el-option
                    v-for="[title, field] in Array.from(getTemplateFieldOptions(propertyForm.template_id || 0))"
                    :key="field"
                    :label="title"
                    :value="field"
                    class="modern-option"
                  />
                </el-select>
              </el-form-item>
            </div>
          </div>
        </div>

        <!-- 通知设置 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-icon">🔔</span>
            <span>通知设置</span>
          </div>

          <div class="form-row">
            <el-form-item label="开启通知" prop="is_notify" class="form-item">
              <el-select
                v-model="propertyForm.is_notify"
                placeholder="是否开启消息通知"
                class="modern-select"
                :disabled="flowDetail.status == '2'"
              >
                <el-option
                  v-for="item in is_notify"
                  :key="item.label"
                  :label="item.label"
                  :value="item.value"
                  class="modern-option"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="发送方式" prop="notify_method" class="form-item">
              <el-select
                multiple
                collapse-tags
                collapse-tags-tooltip
                v-model="propertyForm.notify_method"
                placeholder="消息通知方式"
                class="modern-select"
                :disabled="flowDetail.status == '2'"
              >
                <el-option
                  v-for="item in notify_method"
                  :key="item.label"
                  :label="item.label"
                  :value="item.value"
                  class="modern-option"
                />
              </el-select>
            </el-form-item>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 弹窗底部按钮 -->
    <div class="dialog-footer" v-if="flowDetail.status != '2'">
      <el-button @click="cancelFunc" class="footer-btn footer-btn-cancel"> 取消 </el-button>
      <el-button type="primary" @click="confirmFunc" class="footer-btn footer-btn-confirm"> 确定 </el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { listRunnerTagsApi } from "@/api/runner"
import { runnerTags } from "@/api/runner/types/runner"
import { ElSelect, FormInstance, FormRules } from "element-plus"
import { ref, onMounted, reactive } from "vue"
import { cloneDeep } from "lodash-es"
import { useTemplateRules } from "@/common/composables/useTemplateRules"
import SvgIcon from "@@/components/SvgIcon/index.vue"

// 使用模板 Hook
const { templateRules, getTemplateFieldOptions, fetchTemplates } = useTemplateRules()

// 在需要获取模板的地方调用 fetchTemplates
const handleChange = async () => {
  // 根据新的执行方式清除相关数据
  if (propertyForm.exec_method === "template") {
    // 如果选择模板方式，清除手动设置相关数据
    propertyForm.unit = null
    propertyForm.quantity = null
  } else if (propertyForm.exec_method === "hand") {
    // 如果选择手动方式，清除模板相关数据
    propertyForm.template_id = null
    propertyForm.template_field = ""
  } else {
    // 如果没有选择执行方式，清除所有相关数据
    propertyForm.template_id = null
    propertyForm.template_field = ""
    propertyForm.unit = null
    propertyForm.quantity = null
  }

  // 只有在选择了模板方式且有流程ID时才获取模板
  if (propertyForm.exec_method === "template" && props.id !== undefined) {
    await fetchTemplates(props.id)
  }
}

// 监听定时执行变更
const handleTimingChange = () => {
  if (!propertyForm.is_timing) {
    // 如果关闭定时执行，清除所有定时相关数据
    propertyForm.exec_method = ""
    propertyForm.template_id = null
    propertyForm.template_field = ""
    propertyForm.unit = null
    propertyForm.quantity = null
  } else {
    // 如果开启定时执行，确保执行方式为空，让用户重新选择
    if (!propertyForm.exec_method) {
      // 如果执行方式为空，清除所有相关数据
      propertyForm.template_id = null
      propertyForm.template_field = ""
      propertyForm.unit = null
      propertyForm.quantity = null
    }
  }
}

// 监听代码模版变更
const handlerChangeCodebook = () => {
  // 清除之前的标签选择
  propertyForm.tag = ""

  runnerTagsData.value.forEach((item) => {
    if (item.codebook_uid == propertyForm.codebook_uid) {
      tags_topic.value = new Map<string, string>(Object.entries(item.tags_topic))
    }
  })
}

const props = defineProps({
  nodeData: Object,
  lf: Object || String,
  id: Number,
  //详情
  flowDetail: {
    type: Object,
    default: () => {
      return {}
    }
  }
})

const emits = defineEmits(["closed"])

const DEFAULT_FORM_DATA = reactive({
  name: "自动化-",
  codebook_uid: "",
  topic: "",
  is_notify: false,
  is_timing: false,
  exec_method: "",
  template_field: "",
  template_id: null as number | null,
  notify_method: [],
  unit: null as number | null,
  quantity: null as number | null,
  tag: ""
})

const options = [
  {
    label: "手动设置",
    value: "hand"
  },
  {
    label: "模版字段提取",
    value: "template"
  }
]

const is_notify = [
  {
    value: true,
    label: "开启"
  },
  {
    value: false,
    label: "关闭"
  }
]

const unit = [
  {
    value: 1,
    label: "分钟"
  },
  {
    value: 2,
    label: "小时"
  },
  {
    value: 3,
    label: "天"
  }
]

const is_timing = [
  {
    value: true,
    label: "开启"
  },
  {
    value: false,
    label: "关闭"
  }
]

const notify_method = [
  {
    value: 1,
    label: "工单结束后合并发送"
  },
  {
    value: 2,
    label: "当前节点完成立即发送"
  }
]

const tagSelect = ref<InstanceType<typeof ElSelect> | null>(null)
function setAutoTag() {
  propertyForm.tag = "auto"
  tagSelect.value?.blur?.()
}

const propertyForm = reactive(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [
    { required: true, message: "名称不能为空" },
    {
      max: 50,
      message: "最大50字符"
    },
    {
      validator: (rule, value, callback) => {
        if (!value.startsWith("自动化-")) {
          callback(new Error("名称必须以'自动化-'开头"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ]
}

//确定
const confirmFunc = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      setProperties()
      props.lf?.updateText(props.nodeData?.id, propertyForm.name)
      emits("closed")
    }
  })
}

const runnerTagsData = ref<runnerTags[]>([])
const tags_topic = ref<Map<string, string>>(new Map())
const listRunnerTags = () => {
  listRunnerTagsApi()
    .then((res) => {
      runnerTagsData.value = res.data.runner_tags
      handlerChangeCodebook()
    })
    .catch((error) => {
      console.log(error)
    })
}

//取消
const cancelFunc = () => {
  emits("closed")
}

//更新节点属性
const setProperties = () => {
  props.lf?.setProperties(props.nodeData?.id, {
    name: propertyForm.name,
    codebook_uid: propertyForm.codebook_uid,
    is_notify: propertyForm.is_notify,
    template_field: propertyForm.template_field,
    template_id: propertyForm.template_id,
    is_timing: propertyForm.is_timing,
    notify_method: propertyForm.notify_method,
    tag: propertyForm.tag,
    topic: tags_topic.value.get(propertyForm.tag) || "",
    unit: propertyForm.unit,
    exec_method: propertyForm.exec_method,
    quantity: propertyForm.quantity
  })
}

onMounted(() => {
  listRunnerTags()
  propertyForm.name = props.nodeData?.properties.name || "自动化-"
  propertyForm.codebook_uid = props.nodeData?.properties.codebook_uid
  propertyForm.is_notify = props.nodeData?.properties.is_notify
  propertyForm.is_timing = props.nodeData?.properties.is_timing
  propertyForm.notify_method = Array.isArray(props.nodeData?.properties.notify_method)
    ? props.nodeData?.properties.notify_method
    : [props.nodeData?.properties.notify_method].filter(Boolean) // 过滤掉 undefined 或 null

  propertyForm.template_field = props.nodeData?.properties.template_field
  propertyForm.template_id = props.nodeData?.properties.template_id
  propertyForm.tag = props.nodeData?.properties.tag
  propertyForm.exec_method = props.nodeData?.properties.exec_method
  propertyForm.unit = props.nodeData?.properties.unit
  propertyForm.quantity = props.nodeData?.properties.quantity
  propertyForm.topic = props.nodeData?.properties.topic

  // 如果执行方式是模板，加载模板数据
  if (propertyForm.exec_method === "template" && propertyForm.template_id) {
    if (props.id !== undefined) {
      fetchTemplates(props.id).then(() => {
        getTemplateFieldOptions(propertyForm.template_id || 0)
      })
    }
  }
})
</script>
<style scoped lang="scss">
.automation-property-dialog {
  background: transparent;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-width: 520px;
  width: 100%;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ffffff;
    border-radius: 24px;
    z-index: -1;
  }
}

.dialog-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  padding: 24px 28px;
  color: white;
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 24px 24px 0 0;
  position: relative;
  z-index: 1;

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
  }
}

.header-icon {
  .icon-circle {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    position: relative;

    &::after {
      content: "";
      position: absolute;
      top: 4px;
      left: 4px;
      right: 4px;
      bottom: 4px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border-radius: 12px;
      pointer-events: none;
    }

    :deep(.svg-icon) {
      width: 28px;
      height: 28px;
      color: white;
      position: relative;
      z-index: 1;
    }
  }
}

.header-content {
  flex: 1;
}

.header-title {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 700;
  color: white;
  line-height: 1.3;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  line-height: 1.4;
}

.dialog-content {
  padding: 20px 24px 16px;
  background: #ffffff;
  position: relative;
  z-index: 1;
  border-radius: 0 0 24px 24px;
}

.form-section {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;

  .title-icon {
    font-size: 15px;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }
}

.conditional-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
}

.modern-input {
  width: 100%;

  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px 18px;
    height: 52px;
    transition: all 0.3s ease;

    &:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
      transform: translateY(-1px);
    }

    &.is-focus {
      border-color: #8b5cf6;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
      transform: translateY(-2px);
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
  }
}

.modern-select {
  width: 100%;

  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px 18px;
    height: 52px;
    transition: all 0.3s ease;

    &:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
      transform: translateY(-1px);
    }

    &.is-focus {
      border-color: #8b5cf6;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
      transform: translateY(-2px);
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
  }
}

.modern-input-number {
  width: 100%;

  :deep(.el-input-number) {
    width: 100%;

    .el-input__wrapper {
      background: #f8fafc !important;
      border: 2px solid #e2e8f0 !important;
      border-radius: 10px !important;
      padding: 12px 16px !important;
      height: 48px !important;
      transition: all 0.3s ease !important;
      box-shadow: none !important;
      min-height: 48px !important;
      max-height: 48px !important;

      &:hover {
        border-color: #cbd5e1 !important;
        background: #f1f5f9 !important;
      }

      &.is-focus {
        border-color: #8b5cf6 !important;
        background: #ffffff !important;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
      }
    }

    .el-input__inner {
      font-size: 14px !important;
      color: #1e293b !important;
      font-weight: 500 !important;
      text-align: center !important;
      height: 24px !important;
      line-height: 24px !important;
    }
  }

  :deep(.el-input-number__decrease),
  :deep(.el-input-number__increase) {
    display: none !important;
  }
}

.modern-option {
  :deep(.el-select-dropdown__item) {
    padding: 12px 16px;
    font-size: 14px;

    &.selected {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
    }

    &:hover {
      background: #f1f5f9;
    }
  }
}

.form-help {
  margin-top: 12px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #8b5cf6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.auto-tag-btn {
  color: #8b5cf6 !important;
  font-weight: 600;

  &:hover {
    background: rgba(139, 92, 246, 0.1) !important;
  }
}

.dialog-footer {
  padding: 16px 24px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.footer-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.footer-btn-cancel {
  background: #ffffff;
  color: #64748b;
  border-color: #e2e8f0;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #475569;
  }
}

.footer-btn-confirm {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border-color: #8b5cf6;

  &:hover {
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    border-color: #7c3aed;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }
}
</style>
