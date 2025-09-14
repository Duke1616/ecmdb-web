<template>
  <div class="rule-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="rule-form"
      label-position="left"
    >
      <div class="form-layout">
        <!-- 左侧：时间和轮换设置 -->
        <div class="left-section">
          <div class="form-section">
            <div class="section-title">
              <el-icon><Calendar /></el-icon>
              <span>时间设置</span>
            </div>

            <el-form-item prop="start_time" label="开始时间" class="form-item required">
              <el-date-picker
                v-model="formData.rota_rule.start_time"
                type="datetime"
                placeholder="选择开始时间"
                format="YYYY-MM-DD HH:mm"
                @change="handleStartDateTimeChange"
                class="form-input"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item prop="end_time" label="结束时间" class="form-item">
              <div class="end-time-container">
                <el-switch
                  v-model="isEndTimeVisible"
                  @change="handleSwitchChange"
                  size="default"
                  :active-text="isEndTimeVisible ? '设置结束时间' : '无结束时间'"
                  class="end-switch"
                />
                <el-date-picker
                  v-if="isEndTimeVisible"
                  v-model="formData.rota_rule.end_time"
                  type="datetime"
                  placeholder="选择结束时间"
                  format="YYYY-MM-DD HH:mm"
                  @change="handleEndDateTimeChange"
                  class="form-input end-time-picker"
                  style="width: 100%"
                />
              </div>
            </el-form-item>
          </div>

          <div class="form-section">
            <div class="section-title">
              <el-icon><RefreshRight /></el-icon>
              <span>轮换设置</span>
            </div>

            <!-- 轮换设置 -->
            <div class="rotation-settings">
              <!-- 轮换周期 -->
              <div class="rotation-period">
                <div class="period-label">轮换周期</div>
                <div class="period-controls">
                  <div class="period-slider-container">
                    <div class="period-value-display">
                      <span class="period-number">{{ formData.rota_rule.rotate.time_duration }}</span>
                      <span class="period-unit">
                        {{ formData.rota_rule.rotate.time_unit === 4 ? "天" : "小时" }}
                      </span>
                    </div>
                    <el-slider
                      v-model="formData.rota_rule.rotate.time_duration"
                      :min="1"
                      :max="30"
                      :step="1"
                      :show-tooltip="false"
                      class="period-slider"
                    />
                  </div>
                </div>
                <div class="period-presets">
                  <el-button
                    v-for="preset in [1, 3, 7, 14, 30]"
                    :key="preset"
                    size="small"
                    :type="formData.rota_rule.rotate.time_duration === preset ? 'primary' : 'default'"
                    @click="selectDuration(preset)"
                    class="preset-btn"
                  >
                    {{ preset }}
                  </el-button>
                </div>
              </div>

              <!-- 时间单位 -->
              <div class="rotation-unit">
                <div class="unit-label">时间单位</div>
                <div class="unit-options">
                  <div
                    class="unit-option"
                    :class="{ active: formData.rota_rule.rotate.time_unit === 4 }"
                    @click="selectUnit(4)"
                  >
                    <el-icon><Calendar /></el-icon>
                    <span>天</span>
                  </div>
                  <div
                    class="unit-option"
                    :class="{ active: formData.rota_rule.rotate.time_unit === 5 }"
                    @click="selectUnit(5)"
                  >
                    <el-icon><Clock /></el-icon>
                    <span>小时</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：排班人员 -->
        <div class="right-section">
          <div class="form-section">
            <div class="section-title">
              <el-icon><User /></el-icon>
              <span>班排人员</span>
              <UserPopover :add-rota-group="addRotaGroup" />
            </div>

            <div class="personnel-content">
              <div v-for="group in formData.rota_rule.rota_groups" :key="group.id" class="group-container">
                <div v-if="group.members.length > 0">
                  <div class="group-header">
                    <span class="group-title">{{ `组 ${group.name}` }}</span>
                    <span class="group-count">{{ group.members.length }} 人</span>
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
                    class="members-list"
                  >
                    <div v-for="(member, itemIndex) in group.members" :key="member" class="member-item">
                      <div class="member-info">
                        <el-icon class="member-avatar">
                          <User />
                        </el-icon>
                        <span class="member-name">{{ getUserByUsername(member) }}</span>
                      </div>
                      <div class="member-actions">
                        <el-icon @click="removeAndToLeftList(itemIndex, member, group)" class="action-btn remove-btn">
                          <Close />
                        </el-icon>
                        <el-icon class="action-btn handle-btn handle cursor-move">
                          <Grid />
                        </el-icon>
                      </div>
                    </div>
                  </VueDraggable>
                </div>
              </div>
              <div v-if="formData.rota_rule.rota_groups.length === 0" class="empty-personnel">
                <el-icon class="empty-icon">
                  <User />
                </el-icon>
                <div class="empty-text">暂无人员，请添加成员</div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
import { useUserToolsStore } from "@/pinia/stores/user-tools"
import { Calendar, Clock, Close, Grid, RefreshRight, User } from "@element-plus/icons-vue"
const userToolsStore = useUserToolsStore()

const emits = defineEmits(["closed", "callback"])
const getUserByUsername = (username: string) => {
  return userToolsStore.getUsername(username)
}

// 添加用户并创建新组
const addRotaGroup = (user: userInfo) => {
  const newGroupName = `${String.fromCharCode(65 + formData.value.rota_rule.rota_groups.length)}`
  const newGroup = {
    id: Date.now(),
    name: newGroupName,
    members: [user.username]
  }

  userToolsStore.setToMap(user.username, user.display_name + " [" + user.username + "] ")
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
    group.name = `${String.fromCharCode(65 + index)}`
  })
}

// 将成员从当前组移到另一组（或者做其他操作）
const removeAndToLeftList = (index: number, member: string, group: rotaGroup) => {
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

const rotaGroups = ref<rotaGroup[]>([]) // 组列表
const DEFAULT_FORM_DATA: addRuleReq = {
  id: 0,
  rota_rule: {
    start_time: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
    end_time: 0,
    rota_groups: rotaGroups.value,
    rotate: {
      time_unit: 4,
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
  if (!isEndTimeVisible.value) {
    formData.value.rota_rule.end_time = 0
  }
}

// 选择单位
const selectUnit = (unit: number) => {
  formData.value.rota_rule.rotate.time_unit = unit
}

// 选择周期
const selectDuration = (duration: number) => {
  formData.value.rota_rule.rotate.time_duration = duration
}

const setFrom = (row: addRuleReq) => {
  formData.value = cloneDeep(row)

  if (row.rota_rule.end_time !== 0) {
    isEndTimeVisible.value = true
  }

  // 获取所有的成员
  const members = ref<string[]>([])

  row.rota_rule.rota_groups.forEach((group) => {
    group.members.forEach((member) => {
      members.value.push(member)
    })
  })

  // 获取所有的用户信息
  userToolsStore.setByUsernames(members.value)
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

.cursor-pointer {
  cursor: pointer;
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

.rule-form-container {
  height: 60vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.rule-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;

  .form-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    align-items: start;
    flex: 1;
    min-height: 0;
  }

  .left-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
    height: 100%;
  }

  .right-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
    height: 100%;
  }

  .form-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: #f8fafc;
      border-radius: 6px;
      border-left: 3px solid #3b82f6;

      .el-icon {
        font-size: 14px;
        color: #3b82f6;
      }

      span {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }
    }
  }

  .right-section .form-section {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .form-item {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    :deep(.el-form-item__label) {
      font-weight: 600;
      color: #1f2937;
      font-size: 14px;
      position: relative;
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      &::before {
        content: "";
        display: inline-block;
        width: 16px;
        flex-shrink: 0;
      }
    }

    &.required {
      :deep(.el-form-item__label) {
        &::before {
          content: "*";
          color: #ef4444;
          font-size: 16px;
          font-weight: 700;
          margin-right: 0;
          display: inline-block;
          width: 16px;
          text-align: center;
        }
      }
    }

    .form-input {
      width: 100%;

      :deep(.el-input__wrapper) {
        width: 100%;
        border-radius: 8px;
        border: 1px solid #d1d5db;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;

        &:hover {
          border-color: #9ca3af;
        }

        &.is-focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }

      :deep(.el-input__inner) {
        font-size: 13px;
        color: #374151;
      }

      :deep(.el-input__prefix) {
        color: #9ca3af;
      }
    }
  }
}

/* 结束时间容器 */
.end-time-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.end-time-picker {
  width: 100% !important;
  margin-top: 0 !important;

  :deep(.el-input__wrapper) {
    width: 100% !important;
  }
}

/* 轮换设置 */
.rotation-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rotation-period {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.period-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.period-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.period-slider-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.period-value-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.period-number {
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
  min-width: 40px;
  text-align: center;
}

.period-unit {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  padding: 4px 8px;
  background: #e5e7eb;
  border-radius: 4px;
}

.period-slider {
  :deep(.el-slider__runway) {
    background: #e5e7eb;
    height: 6px;
    border-radius: 3px;
  }

  :deep(.el-slider__bar) {
    background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 3px;
  }

  :deep(.el-slider__button) {
    width: 18px;
    height: 18px;
    border: 2px solid #3b82f6;
    background: white;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
    }
  }
}

.period-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.preset-btn {
  min-width: 28px;
  height: 24px;
  font-size: 11px;
  border-radius: 3px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
  }

  &.el-button--primary {
    background: #3b82f6;
    border-color: #3b82f6;
  }
}

.rotation-unit {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.unit-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.unit-options {
  display: flex;
  gap: 8px;
}

.unit-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  &.active {
    border-color: #3b82f6;
    background: #eff6ff;

    .el-icon {
      color: #3b82f6;
    }

    span {
      color: #3b82f6;
      font-weight: 600;
    }
  }

  .el-icon {
    font-size: 14px;
    color: #6b7280;
    transition: color 0.2s ease;
  }

  span {
    font-size: 12px;
    color: #374151;
    transition: all 0.2s ease;
  }
}

/* 人员内容 */
.personnel-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
}

/* 自定义滚动条样式 */
.rule-form::-webkit-scrollbar,
.personnel-content::-webkit-scrollbar {
  width: 6px;
}

.rule-form::-webkit-scrollbar-track,
.personnel-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.rule-form::-webkit-scrollbar-thumb,
.personnel-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.rule-form::-webkit-scrollbar-thumb:hover,
.personnel-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.group-container {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.group-title {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.group-count {
  font-size: 11px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 3px;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  background: white;
  border-radius: 4px;
  margin-bottom: 4px;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  &:hover {
    background: #f8fafc;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

.member-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.member-avatar {
  font-size: 14px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 4px;
  border-radius: 50%;
  flex-shrink: 0;
}

.member-name {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px;
}

.action-btn {
  font-size: 14px;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;

  &.remove-btn {
    color: #ef4444;
    background: #fef2f2;
    border: 1px solid #fecaca;

    &:hover {
      background: #fee2e2;
      color: #dc2626;
      border-color: #fca5a5;
      transform: scale(1.05);
    }
  }

  &.handle-btn {
    color: #6b7280;
    background: #f8fafc;
    border: 1px solid #e2e8f0;

    &:hover {
      background: #e2e8f0;
      color: #3b82f6;
      border-color: #cbd5e1;
      transform: scale(1.05);
    }
  }
}

.empty-personnel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
}

.empty-icon {
  font-size: 24px;
  margin-bottom: 8px;
  color: #d1d5db;
}

.empty-text {
  font-size: 12px;
  color: #9ca3af;
}

/* 拖拽样式 */
.ghost {
  opacity: 0.5;
  background: #eff6ff;
}

.chosen {
  background: #eff6ff;
  border-color: #3b82f6;
}
</style>
