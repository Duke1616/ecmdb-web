<template>
  <div>
    <el-divider content-position="left">基础属性</el-divider>
    <el-form ref="formRef" :model="formData" :inline-message="true" hide-required-asterisk :rules="formRules">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="部门名称" prop="name">
            <el-input v-model="formData.name" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上级部门" prop="pid">
            <el-tree-select
              v-model="formData.pid"
              :data="props.departmentData"
              node-key="id"
              :render-after-expand="false"
              :expand-on-click-node="false"
              show-checkbox
              check-strictly
              check-on-click-node
              :props="defaultProps"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="部门主管" prop="leaders">
            <el-select
              v-model="formData.leaders"
              reserve-keyword
              placeholder="输入关键字选择"
              :remote-method="remoteMethod"
              :loading="loading"
              clearable
              multiple
              filterable
              remote
            >
              <el-option v-for="item in usersData" :key="item.id" :label="item.display_name" :value="item.id" />
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
        </el-col>
        <el-col :span="12">
          <el-form-item label="分管领导" prop="main_leader">
            <el-select
              v-model="formData.main_leader"
              reserve-keyword
              placeholder="输入关键字选择"
              :remote-method="remoteMethod"
              :loading="loading"
              clearable
              filterable
              remote
            >
              <el-option v-for="item in usersData" :key="item.id" :label="item.display_name" :value="item.id" />
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
        </el-col>
      </el-row>

      <el-divider content-position="left">功能设置</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="部门排序" prop="sort">
            <el-input v-model="formData.sort" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="部门状态" prop="enabled">
            <el-radio-group v-model="formData.enabled" is-button>
              <el-radio-button
                v-for="(item, index) in statusOptions"
                :key="index"
                :name="item.name"
                :value="item.label"
                :disabled="item.disabled"
              >
                {{ item.name }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { ref, watch } from "vue"
import { cloneDeep } from "lodash-es"
import { createOrUpdateDepartment, department } from "@/api/department/types/department"
import { createDepartmentApi, updateDepartmentApi } from "@/api/department"
import { user } from "@/api/user/types/user"
import { findByIdsApi, listUsersByKeywordApi } from "@/api/user"
import { usePagination } from "@/hooks/usePagination"

const init = {
  total: 0,
  currentPage: 1,
  pageSizes: [10, 20, 50],
  pageSize: 5,
  layout: "prev, pager, next"
}
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination(init)

const defaultProps = ref<any>({
  children: "children",
  label: (node: department) => node.name,
  key: "id"
})

const emits = defineEmits(["listDepartmentTreeData", "closed"])
interface Props {
  departmentData: department[]
}
const props = defineProps<Props>()

const DEFAULT_FORM_DATA: createOrUpdateDepartment = {
  name: "",
  sort: 0,
  enabled: true,
  main_leader: undefined
}

const statusOptions = ref([
  { label: true, name: "开启", disabled: false },
  { label: false, name: "停用", disabled: true }
])

const formData = ref<createOrUpdateDepartment>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {}

const submitUpdateForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    updateDepartmentApi(formData.value)
      .then(() => {
        ElMessage.success("保存成功")
        resetForm()
        emits("listDepartmentTreeData")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

const submitCreateForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    console.log("formData", formData.value)
    createDepartmentApi(formData.value)
      .then((data) => {
        ElMessage.success("保存成功")
        resetForm()

        emits("closed", data.data)
        emits("listDepartmentTreeData")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

// 重置表单
const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

// 设置菜单数据
const setDepartmentData = (form: department) => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(form)

  // 清空空值
  Object.keys(formData.value).forEach((key) => {
    const typedKey = key as keyof typeof formData.value
    if (formData.value[typedKey] === 0 || formData.value[typedKey] === null || formData.value[typedKey] === "") {
      delete formData.value[typedKey]
    }
  })

  // 将 main_leader 和 leaders 组合成一个数组
  const leaders = Array.isArray(form.leaders) ? form.leaders : []
  const combinedLeaders = [form.main_leader, ...leaders]

  // 使用 Set 去除重复数据，并转换回数组
  const uniqueLeaders = [...new Set(combinedLeaders)]

  // 解析当前用户信息
  findByIdsApi(uniqueLeaders)
    .then((data) => {
      usersData.value = data.data.users
    })
    .catch((error) => {
      console.log("catch", error)
    })
    .finally(() => {})
}

// 设置上级目录
const setFromForPid = (pid: number | null) => {
  if (pid === null) {
    return
  }
  formData.value.pid = pid
}

const loading = ref<boolean>(false)
const keyword = ref<string>("")
const remoteMethod = (query: string) => {
  if (query) {
    keyword.value = query
    setTimeout(() => {
      listUsersData()
    }, 500)
  } else {
    usersData.value = []
  }
}

const usersData = ref<user[]>([])
const listUsersData = () => {
  listUsersByKeywordApi({
    keyword: keyword.value,
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

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listUsersData, { immediate: true })

defineExpose({
  submitCreateForm,
  submitUpdateForm,
  resetForm,
  setDepartmentData,
  setFromForPid
})
</script>

<style lang="scss" scoped>
.divider .el-divider__text {
  font-size: 20px; /* 您可以根据需要调整这个值 */
}
</style>
