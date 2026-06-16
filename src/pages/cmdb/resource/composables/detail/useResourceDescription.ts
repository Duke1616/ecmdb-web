import { computed, onMounted, ref } from "vue"
import { ElMessage } from "element-plus"
import { getModelAttributesWithGroupsApi } from "@/api/attribute"
import type { Attribute } from "@/api/attribute/types/attribute"
import { detailResourceApi, findSecureData } from "@/api/resource"
import type { Resource } from "@/api/resource/types/resource"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import { useFileDownload } from "@/common/composables/useFileDownload"
import { usePermission } from "@/common/composables/usePermission"
import { createAttributeListView, type AttributeGroupView } from "@/common/utils/attribute"

type UseResourceDescriptionOptions = {
  modelUid: string
  resourceId: string
}

export const useResourceDescription = (options: UseResourceDescriptionOptions) => {
  const { hasPermission } = usePermission()
  const { downloadMinioFile } = useFileDownload()

  const attributeFields = ref<Attribute[]>([])
  const attributeGroups = ref<AttributeGroupView[]>([])
  const resourceData = ref<Resource>()
  const loading = ref(false)

  const canGetSecure = computed(() => hasPermission(CMDB_CAPABILITIES.Resource.GetSecure))

  const getNonFileFields = (fields: Attribute[]) => {
    return fields.filter((item) => item.field_type !== "file" && item.field_type !== "multiline")
  }

  const getFileFields = (fields: Attribute[]) => {
    return fields.filter((item) => item.field_type === "file")
  }

  const getMultilineFields = (fields: Attribute[]) => {
    return fields.filter((item) => item.field_type === "multiline")
  }

  const listAttributeFields = () => {
    getModelAttributesWithGroupsApi(options.modelUid)
      .then(({ data }) => {
        const schema = createAttributeListView(data)
        attributeFields.value = schema.fields
        attributeGroups.value = schema.groups
      })
      .catch(() => {
        attributeFields.value = []
        attributeGroups.value = []
      })
  }

  const descResource = () => {
    loading.value = true
    detailResourceApi({
      id: parseInt(options.resourceId, 10),
      model_uid: options.modelUid
    })
      .then(({ data }) => {
        resourceData.value = data
      })
      .catch(() => {
        resourceData.value = undefined
      })
      .finally(() => {
        loading.value = false
      })
  }

  const refreshData = () => {
    listAttributeFields()
    descResource()
  }

  const handleSecureClick = (item: Attribute) => {
    if (!resourceData.value) return

    if (!canGetSecure.value) {
      ElMessage.warning("暂无查看加密字段权限")
      return
    }

    findSecureData({
      id: resourceData.value.id,
      field_uid: item.field_uid
    })
      .then((data) => {
        resourceData.value!.data[item.field_uid] = data.data
        resourceData.value!.data[`${item.field_uid}_secure_display`] = true
      })
      .catch(() => {
        ElMessage.error("获取安全数据失败")
      })
  }

  const handleSecureDisplayChange = (item: Attribute, isDisplaying: boolean) => {
    if (resourceData.value) {
      resourceData.value.data[`${item.field_uid}_secure_display`] = isDisplaying
    }
  }

  const handleCopySecureContent = (_content?: string) => {
    // SecureFieldView 内部已完成复制反馈，这里保留事件出口。
  }

  const handleDownload = (file: any) => {
    if (!file?.url) {
      ElMessage.error("文件链接无效")
      return
    }

    downloadMinioFile(file.url, file.name)
  }

  const openNewPage = (url: string) => {
    if (url) window.open(url, "_blank")
  }

  onMounted(refreshData)

  return {
    attributeFields,
    attributeGroups,
    loading,
    resourceData,
    getFileFields,
    getMultilineFields,
    getNonFileFields,
    handleCopySecureContent,
    handleDownload,
    handleSecureClick,
    handleSecureDisplayChange,
    openNewPage,
    refreshData
  }
}
