<template>
  <el-descriptions class="margin-top" title="详情信息" :column="3" border>
    <el-descriptions-item v-for="item in attributeFiledsData" :key="item.id" :label="item.field_name">
      <template v-if="item.field_type === 'string' || item.field_type === 'list'">
        <span>
          {{ resourceData?.data[item.field_uid] || "null" }}
        </span>
      </template>
      <template v-else-if="item.field_type === 'file'">
        <span v-for="(resource, index) in resourceData?.data[item.field_uid]" :key="index" style="display: block">
          {{ resource.name }}
        </span>
      </template>
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
