<template>
  <Drawer
    v-model="visible"
    title="添加角色成员"
    subtitle="将用户关联到当前角色，使其继承该角色所拥有的全部权限集"
    :header-icon="Plus"
    size="50%"
    class="add-member-drawer"
    @confirm="handleSubmit"
    :confirm-loading="loading"
    show-confirm-button
  >
    <div class="drawer-body">
      <SubjectSelectCard
        ref="subjectSelectRef"
        v-model:selection="selectedUsers"
        title="选择要添加的用户"
        flat
        initial-type="user"
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
  (e: "confirm", usernames: string[]): void
}>()

const visible = defineModel<boolean>({ default: false })
const selectedUsers = ref<Subject[]>([])
const subjectSelectRef = ref<InstanceType<typeof SubjectSelectCard>>()

const handleSubmit = () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning("请至少选择一个用户")
    return
  }

  const usernames = selectedUsers.value.filter((s) => s.type === "user").map((s) => s.id)

  emit("confirm", usernames)
}

// 每次打开时，自动请求列表
watch(visible, async (val) => {
  if (val) {
    await nextTick()
    // 强制先重置并重新拉取列表，确保数据是最新的且 drawer 动画结束后台显示
    subjectSelectRef.value?.fetchList()
  } else {
    selectedUsers.value = []
  }
})
</script>

<style lang="scss" scoped>
.drawer-body {
  padding: 16px 20px;
  background: #ffffff;
}
</style>
