<template>
  <div>
    <el-drawer
      :wrapperClosable="false"
      v-model="showNodeAttribute"
      direction="rtl"
      size="550px"
      append-to-body
      :close-on-click-modal="false"
      @closed="closed"
    >
      <template #header>
        <div class="unit">{{ getLabelByValue(props.nodeData?.type, pixelOption, "value", "label") }}</div>
      </template>
      <div>
        <startProperty
          v-if="props.nodeData?.type === 'start'"
          :nodeData="nodeData"
          :lf="lf"
          :flowDetail="flowDetail"
          @closed="closed"
        />
        <userProperty
          v-if="props.nodeData?.type === 'user'"
          :nodeData="nodeData"
          :lf="lf"
          :flowDetail="flowDetail"
          @closed="closed"
        />
        <conditionProperty
          v-if="props.nodeData?.type === 'condition'"
          :nodeData="nodeData"
          :lf="lf"
          :flowDetail="flowDetail"
          @closed="closed"
        />
        <automationProperty
          v-if="props.nodeData?.type === 'automation'"
          :nodeData="nodeData"
          :lf="lf"
          :flowDetail="flowDetail"
          @closed="closed"
        />
        <!-- 连线 -->
        <edge
          v-if="nodeData?.type === 'polyline'"
          :nodeData="nodeData"
          :lf="lf"
          :id="props.id"
          :flowDetail="flowDetail"
          @closed="closed"
        />
      </div>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue"
import { pixelOption } from "./options"
import startProperty from "../RegisterNode/start/startProperty.vue"
import userProperty from "../RegisterNode/user/userProperty.vue"
import conditionProperty from "../RegisterNode/condition/conditionProperty.vue"
import automationProperty from "../RegisterNode/automation/automationProperty.vue"
import edge from "../RegisterEdge/edge.vue"
const props = defineProps({
  //标题
  title: {
    type: String,
    default: ""
  },
  nodeData: Object,
  lf: Object,
  //详情
  flowDetail: {
    type: Object,
    default: () => {
      return {}
    }
  },
  id: Number
})
const emits = defineEmits(["closed"])

const showNodeAttribute = ref(true)

//弹窗关闭
const closed = () => {
  emits("closed", true)
}

const getLabelByValue = (value: any, arr: any[], typeValue: string | number, typeLabel: string | number) => {
  let label = ""
  arr.forEach((i) => {
    if (i[typeValue] == value) {
      label = i[typeLabel]
    }
  })
  return label
}

onMounted(() => {})
</script>
<style></style>
