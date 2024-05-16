<template>
  <el-descriptions class="margin-top" title="详情信息" :column="3" border>
    <el-descriptions-item label="名称">
      {{ resourceData?.name }}
    </el-descriptions-item>
    <el-descriptions-item v-for="item in attributeFiledsData" :key="item.id" :label="item.field_name">
      {{ resourceData?.data[item.field_uid] || "null" }}
    </el-descriptions-item>
  </el-descriptions>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { ListAttributeFieldApi } from "@/api/attribute"
import { type Attribute } from "@/api/attribute/types/attribute"
import { detailResourceApi } from "@/api/resource"
import { type Resource } from "@/api/resource/types/resource"

interface Props {
  modelUid: string
  resourceId: string
}
const props = defineProps<Props>()
const attributeFiledsData = ref<Attribute[]>([])
const resourceData = ref<Resource>()

// ** 获取资产字段信息 */
const listAttributeFields = () => {
  ListAttributeFieldApi(props.modelUid)
    .then(({ data }) => {
      attributeFiledsData.value = data.attribute_fields
    })
    .catch(() => {
      attributeFiledsData.value = []
    })
    .finally(() => {
      // ...
    })
}

// ** 获取资产详细信息 */
const descResource = () => {
  detailResourceApi({
    id: parseInt(props.resourceId, 10),
    model_uid: props.modelUid
  })
    .then(({ data }) => {
      resourceData.value = data
    })
    .catch(() => {
      resourceData.value = undefined
    })
    .finally(() => {
      // ...
    })
}

onMounted(() => {
  listAttributeFields()
})

descResource()
</script>
