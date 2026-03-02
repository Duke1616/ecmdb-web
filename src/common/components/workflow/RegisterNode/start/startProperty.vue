<template>
  <el-form :model="propertyForm" label-position="top" :disabled="flowDetail.status == '2'" class="property-form">
    <!-- 通知设置 -->
    <FormSection title="节点通知" tooltip="开启后工单发起时将发送即时通知给相关人员" theme-color="green">
      <template #icon>
        <el-icon><Bell /></el-icon>
      </template>
      <template #extra>
        <el-switch
          v-model="propertyForm.is_notify"
          active-color="#6366f1"
          inactive-color="#e2e8f0"
          :disabled="flowDetail.status == '2'"
        />
      </template>
    </FormSection>
  </el-form>
</template>

<script setup lang="ts">
import { Bell } from "@element-plus/icons-vue"
import { onMounted, reactive } from "vue"
import { FormSection } from "../../PropertySetting"

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
// 移除冗余逻辑
const propertyForm = reactive({
  is_notify: false
})

//更新节点属性
const setProperties = () => {
  props.lf?.setProperties(props.nodeData?.id, {
    is_notify: propertyForm.is_notify
  })
}

//确定
const confirmFunc = () => {
  setProperties()
  emits("closed")
}

onMounted(() => {
  propertyForm.is_notify = props.nodeData?.properties.is_notify ? props.nodeData.properties.is_notify : false
})

// 暴露方法给父组件
defineExpose({
  confirmFunc
})
</script>

<style scoped lang="scss">
.property-form {
  padding: 4px 12px;
  background: transparent;
  min-height: 100%;
}
</style>
