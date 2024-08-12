<template>
  <div>
    <el-tabs v-model="activeName" type="card" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane lazy label="已分配" name="assigned">
        <Assigned ref="assignedRef" :codes="codes" :userId="props.userId" @set-codes="setCodes" />
      </el-tab-pane>
      <el-tab-pane lazy label="未分配" name="unallocated">
        <Unallocated ref="unallocatedRef" :codes="codes" :userId="props.userId" @set-codes="setCodes" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from "vue"
import type { TabsPaneContext } from "element-plus"
import Assigned from "./assigned.vue"
import Unallocated from "./unallocated.vue"
import { isEqual } from "lodash-es"

const activeName = ref("assigned")

interface Props {
  roleCodes: string[]
  userId?: number
}

const props = defineProps<Props>()
const emits = defineEmits(["listUsersData"])
const codes = ref<string[]>([])
const assignedRef = ref<InstanceType<typeof Assigned>>()
const unallocatedRef = ref<InstanceType<typeof Unallocated>>()

const handleClick = (tab: TabsPaneContext) => {
  if (tab.paneName === "assigned") {
    assignedRef.value?.listRolesData()
  } else if (tab.paneName === "unallocated") {
    unallocatedRef.value?.listRolesData()
  }
}

const setCodes = (c: string[]) => {
  codes.value = c
}

const onClosed = () => {
  // 判断如果是修改了，那么重新获取数据
  if (!isEqual(codes.value, props.roleCodes)) {
    emits("listUsersData")
  }

  reset()
}

const reset = () => {
  activeName.value = "assigned"
  codes.value = []
}

defineExpose({
  setCodes,
  onClosed
})

watch(
  () => props.userId,
  async (newVal, oldVal) => {
    if (newVal !== oldVal) {
      codes.value = props.roleCodes ?? []
      await nextTick()

      // 重新获取 tab 数据
      if (activeName.value === "assigned") {
        assignedRef.value?.listRolesData()
      }
    }
  },
  { immediate: true }
)
</script>
<style></style>
