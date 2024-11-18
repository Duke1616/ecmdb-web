<template>
  <div>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" label-position="top">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item prop="desc" label="开始时间">
            <el-date-picker
              v-model="formData.rota_rule.start_time"
              type="datetime"
              placeholder="选择日期和时间"
              format="YYYY-MM-DD HH:mm"
              @change="handleStartDateTimeChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="desc">
            <!-- 使用 template 来包裹内容 -->
            <template #label>
              <div class="end-form-item">
                <span style="margin-right: 10px">结束时间</span>
                <el-switch size="small" v-model="isEndTimeVisible" @change="handleSwitchChange" />
              </div>
            </template>

            <span v-if="!isEndTimeVisible" style="color: #888">无结束时间</span>
            <!-- 当开关为 true 时显示日期选择器 -->
            <el-date-picker
              v-if="isEndTimeVisible"
              v-model="formData.rota_rule.end_time"
              type="datetime"
              placeholder="选择日期和时间"
              format="YYYY-MM-DD HH:mm"
              @change="handleEndDateTimeChange"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item prop="desc" label="轮换周期">
            <el-select v-model="formData.rota_rule.rotate.time_duration" placeholder="Select" style="width: 100%">
              <el-option v-for="num in 30" :key="num" :label="num.toString()" :value="num" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="desc" label="单位">
            <el-select v-model="formData.rota_rule.rotate.time_unit" placeholder="选择单位" style="width: 100%">
              <el-option label="小时" :value="5" />
              <el-option label="天" :value="4" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <div>
        <div class="group-header">
          <span>班排人员</span>
          <UserPopover :add-rota-group="addRotaGroup" />
        </div>
        <div>
          <div v-for="group in formData.rota_rule.rota_groups" :key="group.id">
            <div v-if="group.members.length > 0">
              <div class="empty-group">
                <span>{{ group.name }}</span>
              </div>
              <VueDraggable
                v-model="group.members"
                :animation="200"
                group="rotaGroup"
                ghostClass="ghost"
                chosenClass="chosen"
                handle=".handle"
                @start="onStart"
                @end="onEnd"
                itemKey="id"
                class="flex flex-col gap-4 p-0 rounded"
              >
                <div
                  v-for="(member, itemIndex) in group.members"
                  :key="member"
                  class="h-40px bg-gray-500/5 px-2 rounded flex items-center"
                >
                  <div class="flex-1 flex">
                    <el-text truncated class="sort-text">{{ getUserById(member) }}</el-text>
                  </div>

                  <div class="flex items-center space-x-2">
                    <el-icon @click="removeAndToLeftList(itemIndex, member, group)">
                      <Close />
                    </el-icon>
                    <el-icon name="sort" class="handle cursor-move">
                      <Grid />
                    </el-icon>
                  </div>
                </div>
              </VueDraggable>
            </div>
          </div>
        </div>
      </div>
      <el-divider style="margin: 10px 10px" />
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { addRuleReq, rotaGroup } from "@/api/rota/types/rota"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import { VueDraggable } from "vue-draggable-plus"
import { ref } from "vue"
import { user as userInfo } from "@/api/user/types/user"
import UserPopover from "./user-popover.vue"
import { addShifSchedulingRuleApi } from "@/api/rota"
import { findByIdsApi } from "@/api/user"

const emits = defineEmits(["closed", "callback"])
// 存储所有用户数据的 Map
const userMap = ref(new Map<number, string>())

// 渲染时，使用 computed 来从 userMap 获取用户信息
const getUserById = (id: number) => {
  return userMap.value.get(id)
}

// 添加用户并创建新组
const addRotaGroup = (user: userInfo) => {
  const newGroupName = `组 ${String.fromCharCode(65 + formData.value.rota_rule.rota_groups.length)}`
  const newGroup = {
    id: Date.now(),
    name: newGroupName,
    members: [user.id]
  }

  userMap.value.set(user.id, user.display_name + " [" + user.username + "] ")
  formData.value.rota_rule.rota_groups.push(newGroup)
}

// 处理拖拽开始事件
const onStart = () => {
  console.log("当前值班组:", formData.value.rota_rule.rota_groups)
}

// 处理拖拽结束事件
const onEnd = () => {
  formData.value.rota_rule.rota_groups.forEach((group, index) => {
    if (group.members.length === 0) {
      formData.value.rota_rule.rota_groups.splice(index, 1)
    }
  })

  formData.value.rota_rule.rota_groups.forEach((group, index) => {
    group.name = `组 ${String.fromCharCode(65 + index)}`
  })
}

// 将成员从当前组移到另一组（或者做其他操作）
const removeAndToLeftList = (index: number, member: number, group: rotaGroup) => {
  // 从当前组中移除成员
  group.members.splice(index, 1)

  // 检查组是否为空，若为空则删除该组
  if (group.members.length === 0) {
    const groupIndex = formData.value.rota_rule.rota_groups.findIndex((g) => g.id === group.id)
    if (groupIndex !== -1) {
      formData.value.rota_rule.rota_groups.splice(groupIndex, 1)
    }
  }
}

const handleStartDateTimeChange = (date: Date | null) => {
  if (date) {
    formData.value.rota_rule.start_time = date.getTime()
  }
}

const handleEndDateTimeChange = (date: Date | null) => {
  if (date) {
    formData.value.rota_rule.end_time = date.getTime()
  }
}

const rotaGroups = ref<rotaGroup[]>([]) // 组列表
const DEFAULT_FORM_DATA: addRuleReq = {
  id: 0,
  rota_rule: {
    start_time: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
    end_time: 0,
    rota_groups: rotaGroups.value,
    rotate: {
      time_unit: 1,
      time_duration: 1
    }
  }
}

const formData = ref<addRuleReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入值班名称", trigger: "blur" }],
  owner: [{ required: true, message: "必须输入值班管理人员", trigger: "blur" }]
}

const isEndTimeVisible = ref<boolean>(false)
const handleSwitchChange = () => {
  if (isEndTimeVisible.value) {
    formData.value.rota_rule.end_time = new Date(new Date().setHours(0, 0, 0, 0)).setDate(new Date().getDate() + 1)
  } else {
    formData.value.rota_rule.end_time = 0
  }
}

const setFrom = (row: addRuleReq) => {
  formData.value = cloneDeep(row)

  // 获取所有的成员
  const members = ref<number[]>([])

  row.rota_rule.rota_groups.forEach((group) => {
    group.members.forEach((member) => {
      members.value.push(member)
    })
  })

  console.log(members, "123")
  // 获取所有的用户信息
  findByIdsData(members.value)
}

const findByIdsData = (members: number[]) => {
  findByIdsApi(members)
    .then((data) => {
      userMap.value = new Map(data.data.users.map((user) => [user.id, user.display_name + " [" + user.username + "] "]))
    })
    .catch((error) => {
      console.log("catch", error)
    })
    .finally(() => {})
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

const submitForm = (rotaId: number) => {
  formData.value.id = rotaId
  if (formData.value.id === 0) {
    ElMessage.error("值班不存在，无法保存")
    return
  }

  addShifSchedulingRuleApi(formData.value)
    .then(() => {
      onClosed()
      ElMessage.success("保存成功")
    })
    .catch((error) => {
      console.log("catch", error)
    })
    .finally(() => {})
}

defineExpose({
  submitForm,
  setFrom,
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

.group-header {
  display: flex;
  justify-content: space-between;
  justify-items: center;
  align-items: center;
}
.empty-group {
  padding: 10px;
  text-align: center;
}
</style>
