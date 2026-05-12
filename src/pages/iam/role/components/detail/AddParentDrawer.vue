<template>
  <Drawer
    v-model="visible"
    title="添加父角色"
    subtitle="继承父级角色的全部权限，实现权限的层级结构管理"
    :header-icon="Plus"
    size="50%"
    class="add-parent-drawer"
    @confirm="handleSubmit"
    :confirm-loading="loading"
    show-confirm-button
  >
    <div class="drawer-body">
      <SubjectSelectCard
        ref="subjectSelectRef"
        v-model:selection="selectedRoles"
        title="选择要继承的父角色"
        flat
        :initial-type="AuthorizationSubType.ROLE"
        hide-type-selector
      />
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue"
import { Plus } from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import SubjectSelectCard from "@/pages/iam/authorization/components/SubjectSelectCard.vue"
import { AuthorizationSubType, type Subject } from "@/api/iam/permission/type"
import { ElMessage } from "element-plus"

defineProps<{
  loading?: boolean
  excludeCodes?: string[]
}>()

const emit = defineEmits<{
  confirm: [roleCodes: string[]]
}>()

const visible = defineModel<boolean>({ default: false })
const selectedRoles = ref<Subject[]>([])
const subjectSelectRef = ref<InstanceType<typeof SubjectSelectCard>>()

const handleSubmit = () => {
  if (selectedRoles.value.length === 0) {
    ElMessage.warning("请至少选择一个角色")
    return
  }

  // 过滤出角色类型的 ID (即 role_code)
  const roleCodes = selectedRoles.value.filter((s) => s.type === AuthorizationSubType.ROLE).map((s) => s.id)

  if (roleCodes.length === 0) {
    ElMessage.warning("请选择有效角色类型")
    return
  }

  emit("confirm", roleCodes)
}

// 监听弹窗显示，自动加载数据
watch(visible, async (val) => {
  if (val) {
    await nextTick()
    subjectSelectRef.value?.fetchList()
  } else {
    selectedRoles.value = []
    subjectSelectRef.value?.reset()
  }
})
</script>

<style lang="scss" scoped>
.drawer-body {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
