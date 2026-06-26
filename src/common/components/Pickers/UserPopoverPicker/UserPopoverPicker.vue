<template>
  <UserPopoverPicker
    :search-api="searchApi"
    :resolve-api="resolveApi"
    key-field="username"
    label-field="nickname"
    :disabled-keys="disabledKeys"
    :page-size="pageSize"
    @select="handleSelect"
    ref="pickerRef"
  />
</template>

<script setup lang="ts">
import { ref } from "vue"
import { listUsersApi } from "@/api/iam/user"
import type { User as IIamUser } from "@/api/iam/user/type"
import { useUserStore } from "@/pinia/stores/user"
import UserPopoverPicker from "./index.vue"

interface Props {
  disabledKeys?: string[]
  pageSize?: number
}

const _props = withDefaults(defineProps<Props>(), {
  pageSize: 5,
  disabledKeys: () => []
})

const emit = defineEmits<{
  select: [user: IIamUser]
}>()

const pickerRef = ref<{ show: (targetElement?: HTMLElement) => void }>()
const userStore = useUserStore()

const searchApi = async (params: { keyword: string; offset: number; limit: number }) => {
  const { data } = await listUsersApi({
    keyword: params.keyword,
    offset: params.offset,
    limit: params.limit
  })
  return {
    total: data.total || 0,
    data: (data.users || []) as IIamUser[]
  }
}

const resolveApi = async (username: string): Promise<IIamUser | null> => {
  return (await userStore.getUserByUsername(username)) as IIamUser | null
}

const handleSelect = (user: IIamUser) => {
  emit("select", user)
}

const show = (targetElement?: HTMLElement) => {
  pickerRef.value?.show(targetElement)
}

defineExpose({ show })
</script>
