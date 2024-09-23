<template>
  <div>
    <el-form-item prop="name" label="流程名称">
      <el-input v-model="localFormData.name" @input="updateFormData" />
    </el-form-item>
    <el-form-item prop="owner" label="负责人">
      <el-select
        v-model="localFormData.owner"
        reserve-keyword
        placeholder="输入关键字选择"
        :remote-method="remoteMethod"
        :loading="loading"
        clearable
        filterable
        remote
        @change="updateFormData"
      >
        <el-option v-for="item in usersData" :key="item.id" :label="item.display_name" :value="item.username" />
        <template #footer>
          <el-pagination
            class="justify-center h-10 p-2 bg-white"
            background
            :layout="paginationData.layout"
            :page-sizes="paginationData.pageSizes"
            :total="paginationData.total"
            :page-size="paginationData.pageSize"
            :currentPage="paginationData.currentPage"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </template>
        <template #loading>
          <div v-loading="loading" element-loading-text="加载中" class="h-20" />
        </template>
      </el-select>
    </el-form-item>
    <el-form-item prop="desc" label="流程说明">
      <el-input v-model="localFormData.desc" type="textarea" @input="updateFormData" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleNext">下一步</el-button>
      <el-button @click="handleClose">取消</el-button>
    </el-form-item>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onMounted } from "vue"
import { findByUsernameApi, listUsersByUsernameRegexApi } from "@/api/user"
import { usePagination } from "@/hooks/usePagination"
import { user } from "@/api/user/types/user"

const init = {
  total: 0,
  currentPage: 1,
  pageSizes: [10, 20, 50],
  pageSize: 5,
  layout: "prev, pager, next"
}
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination(init)

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
})

const localFormData = ref({ ...props.formData })
const emits = defineEmits(["update:formData", "next", "close"])
const handleClose = () => {
  emits("close")
}

const handleNext = () => {
  emits("next")
}

const loading = ref<boolean>(false)
const keyword = ref<string>("")
const remoteMethod = (query: string) => {
  if (query) {
    keyword.value = query

    nextTick(() => {
      setTimeout(() => {
        listUsersData()
      }, 500)
    })
  } else {
    usersData.value = []
  }
}

const usersData = ref<user[]>([])
const listUsersData = () => {
  listUsersByUsernameRegexApi({
    username: keyword.value,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      usersData.value = data.users
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

const getUserData = () => {
  findByUsernameApi(localFormData.value.owner)
    .then(({ data }) => {
      usersData.value = [data]
      // 给定默认负责人
      if (localFormData.value.owner === "") {
        localFormData.value.owner = data.username
        updateFormData()
      }
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

const updateFormData = () => {
  emits("update:formData", localFormData.value)
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listUsersData, { immediate: false })

/** 监听消息是否变更 */
watch(
  () => props.formData,
  (newFormData) => {
    localFormData.value = { ...newFormData }

    getUserData()
  },
  { deep: true }
)

onMounted(() => {
  if (localFormData.value.owner) {
    getUserData()
  }
})
</script>

<style lang="scss" scoped>
.flow-info {
  width: 1000px;
}
</style>
