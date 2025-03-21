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
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开启通知" prop="is_notify">
            <el-select v-model="propertyForm.is_notify" placeholder="是否开启消息通知">
              <el-option v-for="item in is_notify" :key="item.label" :label="item.label" :value="item.value" />
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
import { FormInstance, FormRules } from "element-plus"
import { ref, onMounted, reactive } from "vue"

const props = defineProps({
  nodeData: Object,
  lf: Object || String,
  //详情
  flowDetail: {
    type: Object,
    default: () => {
      return {}
    }
  }
})

const emits = defineEmits(["closed"])
const propertyForm = reactive({
  is_notify: true,
  assignList: []
})

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [
    { required: true, message: "名称不能为空" },
    {
      max: 50,
      message: "最大50字符"
    }
  ],
  is_notify: [{ required: true, message: "不能为空" }],
  desc: [
    {
      max: 50,
      message: "最大50字符"
    }
  ]
}

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

//更新节点属性
const setProperties = () => {
  props.lf?.setProperties(props.nodeData?.id, {
    is_notify: propertyForm.is_notify
  })
}

//确定
const confirmFunc = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      setProperties()
      emits("closed")
    }
  })
}

//取消
const cancelFunc = () => {
  emits("closed")
}

onMounted(() => {
  propertyForm.is_notify = props.nodeData?.properties.is_notify ?? true
})
</script>
<style scoped></style>
