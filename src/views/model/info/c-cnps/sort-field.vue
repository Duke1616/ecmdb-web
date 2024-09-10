<template>
  <div class="sort-card-container">
    <el-card class="sort-card">
      <VueDraggable
        v-model="leftList"
        dragClass="drag"
        :animation="animationDuration"
        group="cmdb"
        ghostClass="ghost"
        chosenClass="chosen"
        @start="onStart"
        @end="onEnd"
        itemKey="id"
        class="flex flex-col gap-4 p-0 rounded"
      >
        <div v-for="(item, index) in leftList" :key="item.id">
          <div class="sort-item">
            <div>
              <el-text truncated>{{ item.name }}</el-text>
            </div>
            <div>
              <el-icon @click="removeAndToRightList(index, item)"><Right /></el-icon>
            </div>
          </div>
        </div>
      </VueDraggable>
    </el-card>
    <el-card class="sort-card">
      <VueDraggable
        v-model="rightList"
        dragClass="drag"
        :animation="animationDuration"
        group="cmdb"
        ghostClass="ghost"
        chosenClass="chosen"
        handle=".handle"
        @start="onStart"
        @end="onEnd"
        itemKey="id"
        class="flex flex-col gap-4 p-0 rounded"
      >
        <div v-for="(item, index) in rightList" :key="item.id">
          <div class="sort-item">
            <div>
              <el-icon name="sort" class="handle cursor-move"><Grid /></el-icon>
              <el-text truncated class="sort-text">{{ item.name }}</el-text>
            </div>
            <div>
              <el-icon @click="removeAndToLeftList(index, item)"><Close /></el-icon>
            </div>
          </div>
        </div>
      </VueDraggable>
    </el-card>
  </div>

  <el-form size="large" label-width="auto" ref="formRef">
    <el-form-item class="text-right">
      <el-button type="primary" @click="handlerCustomAttributeFieldColumns()"> 保存 </el-button>
      <el-button @click="onClosed()">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { VueDraggable } from "vue-draggable-plus"
import { CustomAttributeFieldColumnsApi } from "@/api/attribute"
import { type CustomField, type CustomAttributeFieldColumnsReq, AttributeGroup } from "@/api/attribute/types/attribute"
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"

// 接收父组建传递
interface Props {
  modelUid: string
  attributesData: AttributeGroup[]
}

const props = defineProps<Props>()
const attrData = ref<AttributeGroup[]>([])

const emits = defineEmits(["close", "getAttributesData"])
const onClosed = () => {
  emits("close", false)
}

const animationDuration = ref<number>(150)

//** 获取自定义列表信息 */
const leftList = ref<CustomField[]>([])
const rightList = ref<CustomField[]>([])

const handleSortDrawer = () => {
  const attributesData = attrData?.value
  if (!attributesData || !Array.isArray(attributesData)) {
    return
  }

  rightList.value = []
  leftList.value = []

  attributesData.forEach((item) => {
    item.attributes.forEach((attr) => {
      const list = attr.display ? rightList : leftList
      list.value.push({ name: attr.field_name, id: attr.id, index: attr.index || 0 })
    })
  })

  rightList.value.sort((a, b) => a.index - b.index)
}

const handlerCustomAttributeFieldColumns = () => {
  const req: CustomAttributeFieldColumnsReq = {
    model_uid: props.modelUid,
    custom_field_name: rightList.value.map((item) => item.name)
  }

  CustomAttributeFieldColumnsApi(req)
    .then(() => {
      ElMessage.success("操作成功")
      emits("close", false)
      emits("getAttributesData")
    })
    .catch(() => {})
}

function removeAndToLeftList(index: number, item: any) {
  leftList.value.push(item)
  rightList.value.splice(index, 1)
}

function removeAndToRightList(index: number, item: any) {
  leftList.value.splice(index, 1)
  rightList.value.push(item)
}

const drag = ref(false)
const onStart = () => {
  drag.value = true
}

const onEnd = () => {
  drag.value = false
}

watch(
  () => props.attributesData,
  (val: AttributeGroup[]) => {
    attrData.value = val
    handleSortDrawer()
  },
  { immediate: true }
)
</script>

<style lang="scss">
.sort-card-container {
  display: flex;
  width: 100%;
  height: 95%;
  padding-bottom: 20px;
}

.sort-drawer {
  .el-drawer__body {
    padding: 0px;
    display: flex; /* 使用 Flexbox 布局 */
    justify-content: flex-end;
    flex-direction: column; /* 子元素垂直排列 */
    height: 100%; /* 确保填充整个抽屉高度 */
  }
}

.sort-card {
  flex: 1;
  overflow-y: auto;
}

.sort-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
  border-radius: 0.25rem;
  .sort-text {
    padding-left: 8px;
  }
}

.text-right {
  padding-left: 15px;
}
</style>
