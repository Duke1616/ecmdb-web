<template>
  <div>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" label-position="top">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item prop="desc" label="开始时间">
            <el-date-picker
              disabled
              v-model="formData.rota_rule.start_time"
              type="datetime"
              placeholder="选择日期和时间"
              format="YYYY-MM-DD HH:mm"
              @change="handleStartDateTimeChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="desc" label="结束时间">
            <el-date-picker
              disabled
              v-model="formData.rota_rule.end_time"
              type="datetime"
              placeholder="选择日期和时间"
              format="YYYY-MM-DD HH:mm"
              @change="handleEndDateTimeChange"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <div>
        <div class="group-header">
          <span>班排人员</span>
          <UserPopover :add-rota-group="addRotaGroup" />
        </div>
        <div>
          <VueDraggable
            v-model="formData.rota_rule.rota_group.members"
            :animation="200"
            group="rotaGroup"
            ghostClass="ghost"
            chosenClass="chosen"
            handle=".handle"
            itemKey="id"
            class="flex flex-col gap-4 p-0 rounded"
          >
            <div
              v-for="(member, itemIndex) in formData.rota_rule.rota_group.members"
              :key="member"
              class="h-40px bg-gray-500/5 px-2 rounded flex items-center"
            >
              <div class="flex-1 flex">
                <el-text truncated class="sort-text">{{ getUserById(member) }}</el-text>
              </div>

              <div class="flex items-center space-x-2">
                <el-icon @click="removeAndToLeftList(itemIndex)" class="cursor-pointer">
                  <Close />
                </el-icon>
              </div>
            </div>
          </VueDraggable>
        </div>
      </div>
      <el-divider style="margin-bottom: 10px" />
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { addOrUpdateAdjustmentRuleReq, rotaGroup } from "@/api/rota/types/rota"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import { VueDraggable } from "vue-draggable-plus"
import { ref } from "vue"
import { user as userInfo } from "@/api/user/types/user"
import UserPopover from "./user-popover.vue"
import { addShifAdjustmentRuleApi, updateShifAdjustmentRuleApi } from "@/api/rota"
import { useUserToolsStore } from "@/store/modules/user-tools"
const userToolsStore = useUserToolsStore()

const emits = defineEmits(["closed", "callback"])

const getUserById = (id: number) => {
  return userToolsStore.getUsernme(id)
}

// 添加用户并创建新组
const addRotaGroup = (user: userInfo) => {
  // 只需要一个组即可
  const existingGroup = formData.value.rota_rule.rota_group
  existingGroup.members.push(user.id)

  // 更新用户映射
  userToolsStore.setToMap(user.id, user.display_name + " [" + user.username + "] ")
}

const removeAndToLeftList = (index: number) => {
  formData.value.rota_rule.rota_group.members.splice(index, 1)
}

const handleStartDateTimeChange = (date: Date | null) => {
  if (date) {
    formData.value.rota_rule.start_time = date.getTime()
  }
}

const handleEndDateTimeChange = (date: Date | null) => {
  if (date) {
    const endTime = date.getTime()
    const startTime = formData.value.rota_rule.start_time

    if (startTime && endTime < startTime) {
      ElMessage.error("结束时间不能小于开始时间")
      formData.value.rota_rule.end_time = 0
    } else {
      formData.value.rota_rule.end_time = endTime
    }
  } else {
    formData.value.rota_rule.end_time = 0
  }
}

const rotaGroups = ref<rotaGroup>({ id: 0, name: "", members: [] }) // 组列表
const DEFAULT_FORM_DATA: addOrUpdateAdjustmentRuleReq = {
  id: 0,
  group_id: 0,
  rota_rule: {
    start_time: 0,
    end_time: 0,
    rota_group: rotaGroups.value
  }
}

const formData = ref<addOrUpdateAdjustmentRuleReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入值班名称", trigger: "blur" }],
  owner: [{ required: true, message: "必须输入值班管理人员", trigger: "blur" }]
}

const getFrom = () => {
  return formData
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

const onClosed = () => {
  emits("closed")
}

const setStartDate = (startTime: Date | null) => {
  if (!startTime) return
  formData.value.rota_rule.start_time = startTime.getTime()
}

const setEndDate = (endTime: Date | null) => {
  if (!endTime) return
  formData.value.rota_rule.end_time = endTime.getTime()
}

const setGroupId = (groupId: number) => {
  formData.value.rota_rule.rota_group.name = "TEMP"
  // 修改逻辑处理时需要知道上次生成的 group_id
  formData.value.group_id = groupId

  if (formData.value.rota_rule.rota_group.members.length === 0) {
    formData.value.rota_rule.rota_group.id = Date.now()
  } else {
    formData.value.rota_rule.rota_group.id = groupId
  }

  // 根据是否传有传入成员来判断是新增还是编辑
  memberLen.value = formData.value.rota_rule.rota_group.members.length
}

const setMembers = (members: number[]) => {
  formData.value.rota_rule.rota_group.members = members

  // 获取所有的用户信息
  userToolsStore.setByUserIds(members)
}

const memberLen = ref<number>(0)
const submitForm = (rotaId: number) => {
  if (rotaId === 0) {
    ElMessage.error("值班不存在，无法保存")
    return
  }

  if (formData.value.rota_rule.rota_group.members.length === 0) {
    ElMessage.error("值班人员不能为空")
    return
  }

  formData.value.id = rotaId
  const api = memberLen.value === 0 ? addShifAdjustmentRuleApi : updateShifAdjustmentRuleApi
  api(formData.value)
    .then(() => {
      onClosed()
      ElMessage.success("操作成功")
      emits("callback")
    })
    .catch((error: any) => {
      console.log("catch", error)
    })
    .finally(() => {})
}

defineExpose({
  submitForm,
  setStartDate,
  setGroupId,
  setMembers,
  setEndDate,
  getFrom,
  resetForm
})
</script>

<style scoped>
/* 自定义样式 */
.sort-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
}

.end-form-item {
  display: flex;
  align-items: center;
  width: 100%;
  .el-switch--small {
    height: 22px;
  }
}

.cursor-pointer {
  cursor: pointer;
}

.group-header {
  display: flex;
  justify-content: space-between;
  justify-items: center;
  align-items: center;
  margin-bottom: 10px;
}
.empty-group {
  padding: 10px;
  text-align: center;
}
</style>
