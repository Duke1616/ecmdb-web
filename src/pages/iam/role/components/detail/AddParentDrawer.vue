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
        initial-type="role"
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
import type { Subject } from "@/api/iam/permission/type"
import { ElMessage } from "element-plus"

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: "confirm", parentCodes: string[]): void
}>()

const visible = defineModel<boolean>({ default: false })
const selectedRoles = ref<Subject[]>([])
const subjectSelectRef = ref<InstanceType<typeof SubjectSelectCard>>()

const handleSubmit = () => {
  if (selectedRoles.value.length === 0) {
    ElMessage.warning("请至少选择一个角色")
    return
  }

  // 提取角色编码 (在 Subject 中，id 可能就是编码或者数据库 ID，取决于接口返回)
  // Backend RoleInheritanceReq requires RoleCode (string)
  const codes = selectedRoles.value.filter((s) => s.type === "role").map((s) => s.id)

  emit("confirm", codes)
}

watch(visible, async (val) => {
  if (val) {
    await nextTick()
    // 强制触发拉取，且默认过滤为角色
    subjectSelectRef.value?.fetchList()
  } else {
    selectedRoles.value = []
  }
})
</script>

<style lang="scss" scoped>
.drawer-body {
  padding: 16px 20px;
  background: #ffffff;
}
</style>
