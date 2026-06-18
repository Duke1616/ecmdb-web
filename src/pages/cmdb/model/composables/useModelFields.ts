import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue"
import { type FormRules, ElMessage, ElMessageBox } from "element-plus"
import {
  DeleteAttributeApi,
  SortAttributeApi,
  SortAttributeGroupApi,
  createAttributeGroupApi,
  deleteAttributeGroupApi,
  getModelAttributesWithGroupsApi,
  renameAttributeGroupApi
} from "@/api/attribute"
import type { Attribute } from "@/api/attribute/types/attribute"
import { createAttributeListView, type AttributeGroupView } from "@/common/utils/attribute"
import { useCrudAttributeGroup } from "./useCrudAttributeGroup"

export const useModelFields = (modelUid: MaybeRefOrGetter<string>) => {
  const searchInput = ref("")
  const isDragMode = ref(false)
  const attributeGroups = ref<AttributeGroupView[]>([])
  const allExpanded = ref(false)
  const isGroupDragging = ref(false)

  const groupId = ref<number>()
  const attrFieldVisible = ref(false)
  const activeAttribute = ref<Attribute | null>(null)
  const isReadonly = ref(false)
  const sortFieldVisible = ref(false)

  const attrGroupRules: FormRules = {
    group_name: [{ required: true, message: "必须输入分组名称", trigger: "blur" }]
  }

  const currentModelUid = () => toValue(modelUid)

  const visibleGroups = computed(() => {
    const query = searchInput.value.trim().toLowerCase()
    if (!query) return attributeGroups.value

    return attributeGroups.value
      .map((group) => {
        const attributes = (group.attributes || []).filter((attribute) => {
          return attribute.field_uid.toLowerCase().includes(query) || attribute.field_name.toLowerCase().includes(query)
        })

        return { ...group, attributes, expanded: true }
      })
      .filter((group) => group.attributes.length > 0)
  })

  const getAttributesData = () => {
    const uid = currentModelUid()
    if (!uid) return

    getModelAttributesWithGroupsApi(uid)
      .then(({ data }) => {
        attributeGroups.value = createAttributeListView(data).groups
      })
      .catch(() => {
        attributeGroups.value = []
      })
  }

  const openCreateField = (targetGroupId: number) => {
    groupId.value = targetGroupId
    activeAttribute.value = null
    isReadonly.value = false
    attrFieldVisible.value = true
  }

  const openEditField = (targetGroupId: number, attribute: Attribute) => {
    groupId.value = targetGroupId
    activeAttribute.value = attribute
    isReadonly.value = false
    attrFieldVisible.value = true
  }

  const toggleGroup = (group: AttributeGroupView) => {
    group.expanded = !group.expanded
  }

  const updateGroupAttributes = (targetGroupId: number, attributes: Attribute[]) => {
    const group = attributeGroups.value.find((item) => item.group_id === targetGroupId)
    if (group) group.attributes = attributes
  }

  const deleteField = (attribute: Attribute) => {
    if (attribute.builtin) {
      ElMessage.warning("内置属性不可删除")
      return
    }

    ElMessageBox.confirm(`正在删除属性: ${attribute.field_name} 确认删除？`, "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      dangerouslyUseHTMLString: true,
      message: `<p>正在删除属性: <span style="color: red">${attribute.field_name}</span> 确认删除？</p>`
    }).then(() => {
      DeleteAttributeApi(attribute.id).then(() => {
        ElMessage.success("删除成功")
        getAttributesData()
      })
    })
  }

  const sortAttribute = (evt: any) => {
    const { newIndex, to, item } = evt
    if (newIndex === undefined || !to || !item) return

    const targetGroupId = Number(to.dataset.groupId)
    const itemId = Number(item.dataset.id)
    if (!targetGroupId || !itemId) return

    SortAttributeApi({
      id: itemId,
      target_group_id: targetGroupId,
      target_position: newIndex
    })
      .then(() => {
        ElMessage.success("排序更新成功")
      })
      .catch(() => {
        getAttributesData()
      })
  }

  const startGroupDrag = () => {
    isGroupDragging.value = true
  }

  const sortGroup = (evt: any) => {
    isGroupDragging.value = false

    const { newIndex } = evt
    if (newIndex === undefined) return

    const group = attributeGroups.value[newIndex]
    if (!group) return

    SortAttributeGroupApi({
      id: group.group_id,
      target_position: newIndex
    })
      .then(() => {
        ElMessage.success("分组排序更新成功")
      })
      .catch(() => {
        getAttributesData()
      })
  }

  const {
    dialogVisible: dialogAttrGroupVisible,
    isEditMode: isEditGroup,
    formRef: attrGroupRef,
    formData: attrGroup,
    openCreateDialog: openCreateGroupDialog,
    openEditDialog: openRenameGroupDialog,
    handleDelete: deleteGroup,
    handleSubmit: submitAttributeGroup
  } = useCrudAttributeGroup<AttributeGroupView>({
    createApi: (data) => createAttributeGroupApi({ ...data, model_uid: currentModelUid() }),
    updateApi: renameAttributeGroupApi,
    deleteApi: deleteAttributeGroupApi,
    refreshData: getAttributesData,
    checkDeleteable: (item) => (item.attributes && item.attributes.length > 0 ? "分组下存在属性，无法删除" : true),
    confirmDeleteText: (item) => `确认删除分组 "${item.group_name}" 吗？`
  })

  const handleGroupCommand = (command: string, group: AttributeGroupView) => {
    if (command === "rename") {
      openRenameGroupDialog(group)
      return
    }

    if (command === "delete") {
      deleteGroup(group)
    }
  }

  const openSortDrawer = () => {
    sortFieldVisible.value = true
  }

  const toggleAllGroups = () => {
    allExpanded.value = !allExpanded.value
    visibleGroups.value.forEach((group) => {
      group.expanded = allExpanded.value
    })
  }

  watch(
    currentModelUid,
    (newVal) => {
      if (newVal) getAttributesData()
    },
    { immediate: true }
  )

  return {
    searchInput,
    isDragMode,
    attributeGroups,
    visibleGroups,
    allExpanded,
    isGroupDragging,
    groupId,
    attrFieldVisible,
    activeAttribute,
    isReadonly,
    sortFieldVisible,
    dialogAttrGroupVisible,
    isEditGroup,
    attrGroupRef,
    attrGroup,
    attrGroupRules,
    getAttributesData,
    openCreateField,
    openEditField,
    deleteField,
    toggleGroup,
    toggleAllGroups,
    updateGroupAttributes,
    sortAttribute,
    startGroupDrag,
    sortGroup,
    openCreateGroupDialog,
    submitAttributeGroup,
    handleGroupCommand,
    openSortDrawer
  }
}
