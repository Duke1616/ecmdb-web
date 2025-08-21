<template>
  <div>
    <el-form
      ref="formRef"
      :model="propertyForm"
      :inline-message="true"
      :rules="formRules"
      label-position="top"
      :disabled="flowDetail.status == '2'"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="propertyForm.name" clearable />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="代码模版" prop="codebook_uid">
            <el-select
              v-model="propertyForm.codebook_uid"
              filterable
              placeholder="请选择代码模版"
              @change="handlerChangeCodebook()"
            >
              <el-option
                v-for="item in runnerTagsData"
                :key="item.codebook_uid"
                :label="item.codebook_name"
                :value="item.codebook_uid"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="标签" prop="tag">
            <el-select
              ref="tagSelect"
              v-model="propertyForm.tag"
              filterable
              placeholder="选择代码模版后可编辑"
              :disabled="!propertyForm.codebook_uid"
            >
              <el-option
                v-for="[tag, topic] of Array.from(tags_topic)"
                :key="`${topic}-${tag}`"
                :label="tag"
                :value="tag"
              />
              <template #footer>
                <el-button text bg size="small" type="primary" style="width: 100%" @click="setAutoTag">
                  自动发现
                </el-button>
              </template>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="定时执行" prop="is_timing">
            <el-select v-model="propertyForm.is_timing" placeholder="是否开启定时执行">
              <el-option v-for="item in is_timing" :key="item.label" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="执行方式" prop="rule">
            <el-select v-model="propertyForm.exec_method" clearable @change="handleChange">
              <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            v-if="propertyForm.exec_method === 'hand' && propertyForm.is_timing === true"
            label="单位"
            prop="unit"
          >
            <el-select v-model="propertyForm.unit" placeholder="执行单位">
              <el-option v-for="item in unit" :key="item.label" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            v-if="propertyForm.exec_method === 'hand' && propertyForm.is_timing === true"
            label="数值"
            prop="quantity"
          >
            <el-input-number v-model="propertyForm.quantity" :min="1" size="default" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            v-if="propertyForm.exec_method === 'template' && propertyForm.is_timing === true"
            label="模版名称"
            prop="leftValue"
          >
            <el-select v-model="propertyForm.template_id" placeholder="请选择模版" class="select-box">
              <el-option v-for="item in templateRules" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item
            v-if="propertyForm.exec_method === 'template' && propertyForm.is_timing === true"
            label="模版字段"
            prop="leftValue"
          >
            <el-select
              v-model="propertyForm.template_field"
              :disabled="!propertyForm.template_id"
              placeholder="请选择模版字段"
              class="input-box"
            >
              <el-option
                v-for="[title, field] in Array.from(getTemplateFieldOptions(propertyForm.template_id))"
                :key="field"
                :label="title"
                :value="field"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开启通知" prop="is_notify">
            <el-select v-model="propertyForm.is_notify" placeholder="是否开启消息通知">
              <el-option v-for="item in is_notify" :key="item.label" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发送方式" prop="notify_method">
            <el-select
              multiple
              collapse-tags
              collapse-tags-tooltip
              v-model="propertyForm.notify_method"
              placeholder="消息通知方式"
            >
              <el-option v-for="item in notify_method" :key="item.label" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div class="mt15" v-if="flowDetail.status != '2'">
      <el-button @click="cancelFunc"> 取消 </el-button>
      <el-button type="primary" @click="confirmFunc"> 确定 </el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { listRunnerTagsApi } from "@/api/runner"
import { runnerTags } from "@/api/runner/types/runner"
import { ElSelect, FormInstance, FormRules } from "element-plus"
import { ref, onMounted, reactive } from "vue"
import { cloneDeep } from "lodash-es"
import { useTemplateRules } from "@/hooks/useTemplateRules"

// 使用模板 Hook
const { templateRules, getTemplateFieldOptions, fetchTemplates } = useTemplateRules()

// 在需要获取模板的地方调用 fetchTemplates
const handleChange = async () => {
  if (propertyForm.exec_method !== "template") return
  if (props.id === undefined) return

  await fetchTemplates(props.id)
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
  template_id: 0,
  notify_method: [],
  unit: 1,
  quantity: 0,
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
const handlerChangeCodebook = () => {
  runnerTagsData.value.forEach((item) => {
    if (item.codebook_uid == propertyForm.codebook_uid) {
      tags_topic.value = new Map<string, string>(Object.entries(item.tags_topic))
    }
  })
}
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
        getTemplateFieldOptions(propertyForm.template_id)
      })
    }
  }
})
</script>
<style lang="scss" scoped>
.el-input-number {
  width: 100%;
}
</style>
