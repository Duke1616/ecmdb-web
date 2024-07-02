<template>
  <el-card v-show="visible" height="1000px">
    <div class="steps-container">
      <el-steps class="steps" align-center :active="active">
        <el-step title="填写流程信息" :icon="Edit" />
        <el-step title="定义配置流程" :icon="Ticket" />
        <el-step title="配置启动设置" :icon="Tools" />
      </el-steps>
    </div>
    <div class="flow-info-container" v-if="active === 1">
      <FlowInfo @next="next" @close="onClosed" />
    </div>
    <div v-if="active === 2">
      <Lf />
      <div class="lf-button">
        <el-button @click="previous">上一步</el-button>
        <el-button @click="next" type="primary">下一步</el-button>
        <el-button @click="onClosed">取消</el-button>
      </div>
    </div>
    <div v-if="active === 3">
      <div class="setting-button">
        <el-button @click="previous">上一步</el-button>
        <el-button @click="save" type="primary">保存</el-button>
        <el-button @click="onClosed">取消</el-button>
      </div>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { Edit, Tools, Ticket } from "@element-plus/icons-vue"
import { ref, watch } from "vue"
import FlowInfo from "./flowInfo.vue"
import Lf from "./lf.vue"
interface Props {
  dialogVisible: boolean
}

const props = defineProps<Props>()
const visible = ref<boolean>(false)
const active = ref(1)
const next = () => {
  if (active.value++ > 2) active.value = 1
}

const previous = () => {
  if (active.value-- === 0) active.value = 1
}

const save = () => {}

const emits = defineEmits(["close", "list-templates"])
const onClosed = () => {
  emits("close", false)
}

watch(
  () => props.dialogVisible,
  (val: boolean) => {
    visible.value = val
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.steps-container {
  display: flex;
  justify-content: center;
  height: 100%;
  align-items: center;
}
.lf-button {
  margin-left: 50px;
  margin-top: 12px;
}

.setting-button {
  margin-left: 50px;
  margin-top: 12px;
}
.steps {
  min-width: 700px;
  margin-bottom: 20px;
}

.flow-info-container {
  display: flex;
  flex: 1;
  justify-content: center;
}
</style>
