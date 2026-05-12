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
        :initial-type="AuthorizationSubType.USER"
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
}>()

const emit = defineEmits<{
  confirm: [usernames: string[]]
}>()

const visible = defineModel<boolean>({ default: false })
const selectedUsers = ref<Subject[]>([])
const subjectSelectRef = ref<InstanceType<typeof SubjectSelectCard>>()

const handleSubmit = () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning("请至少选择一个用户")
    return
  }

  const usernames = selectedUsers.value.filter((s) => s.type === AuthorizationSubType.USER).map((s) => s.id)

  if (usernames.length === 0) {
    ElMessage.warning("请选择有效用户类型")
    return
  }

  emit("confirm", usernames)
}

// 监听弹窗显示，自动加载数据
watch(visible, async (val) => {
  if (val) {
    await nextTick()
    subjectSelectRef.value?.fetchList()
  } else {
    selectedUsers.value = []
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
