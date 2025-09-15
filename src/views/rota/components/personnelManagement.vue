<template>
  <div class="settings-group">
    <!-- 标题区域 -->
    <div class="personnel-header">
      <div class="header-title">
        <el-icon><User /></el-icon>
        <span>排班人员</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="addNewGroup" class="add-group-btn"> 添加组 </el-button>
    </div>

    <div class="personnel-content">
      <div v-for="group in rotaGroupsForm" :key="group.id" class="group-container" :data-group-id="group.id">
        <div class="group-header">
          <span class="group-title">{{ `组 ${group.name}` }}</span>
          <div class="group-actions">
            <span class="group-count">{{ group.members.length }} 人</span>
            <el-button
              size="small"
              type="primary"
              plain
              :icon="Plus"
              @click="addMemberToGroup(group.id, $event)"
              class="action-btn"
            >
              添加成员
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              :icon="Delete"
              @click="removeGroup(group.id)"
              class="action-btn"
            >
              删除组
            </el-button>
          </div>
        </div>

        <div class="members-container">
          <VueDraggable
            v-model="group.members"
            :animation="200"
            group="rotaGroup"
            ghostClass="ghost"
            chosenClass="chosen"
            handle=".handle"
            @start="onDragStart"
            @end="onDragEnd"
            @change="handleDragChange"
            :forceFallback="true"
            class="members-list"
            :class="{ 'empty-group': group.members.length === 0 }"
          >
            <div v-for="(member, itemIndex) in group.members" :key="member" class="member-item" :data-member="member">
              <div class="member-info">
                <el-icon class="member-avatar">
                  <User />
                </el-icon>
                <span class="member-name">{{ getUserByUsername(member) }}</span>
              </div>
              <div class="member-actions">
                <el-icon @click="removeUserFromGroup(group.id, itemIndex)" class="action-btn remove-btn">
                  <Close />
                </el-icon>
                <el-icon class="action-btn handle-btn handle cursor-move">
                  <Grid />
                </el-icon>
              </div>
            </div>

            <!-- 空组时的提示 -->
            <div v-if="group.members.length === 0" class="empty-group">
              <span class="empty-text">暂无成员，可拖拽用户到此区域</span>
            </div>
          </VueDraggable>
        </div>
      </div>

      <div v-if="rotaGroupsForm.length === 0" class="empty-personnel">
        <el-icon class="empty-icon">
          <User />
        </el-icon>
        <span class="empty-text">暂无组，点击"添加组"创建</span>
      </div>
    </div>

    <!-- 用户选择器 -->
    <UserPopover ref="userPopoverRef" :add-rota-group="addRotaGroup" :existing-users="existingUsers" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import { User, Close, Grid, Plus, Delete } from "@element-plus/icons-vue"
import type { rotaGroup } from "@/api/rota/types/rota"
import { user as userInfo } from "@/api/user/types/user"
import UserPopover from "./userPopover.vue"
import { useUserToolsStore } from "@/pinia/stores/user-tools"
import { useGroupManagement } from "../composables/useGroupManagement"

const rotaGroupsForm = defineModel<rotaGroup[]>("rotaGroupsForm", { default: () => [] })
const userToolsStore = useUserToolsStore()

// 渲染键
const renderKey = ref(0)

// 使用 composables
const { currentAddingGroupId, existingUsers, addNewGroup, removeGroup, addUserToGroup, removeUserFromGroup } =
  useGroupManagement(rotaGroupsForm, renderKey)

const userPopoverRef = ref()

const getUserByUsername = (username: string) => {
  return userToolsStore.getUsername(username)
}

// 添加成员到指定组
const addMemberToGroup = (groupId: number, event: Event) => {
  currentAddingGroupId.value = groupId
  const buttonElement = event.target as HTMLElement
  userPopoverRef.value?.show(buttonElement)
}

// 添加用户到当前组
const addRotaGroup = (user: userInfo) => {
  if (!currentAddingGroupId.value) return

  const success = addUserToGroup(currentAddingGroupId.value, user)
  if (success) {
    userToolsStore.setToMap(user.username, user.display_name + " [" + user.username + "] ")
  }
  currentAddingGroupId.value = null
}

// 拖拽状态
const draggedMember = ref("")
const sourceGroupId = ref(0)

// 拖拽开始
const onDragStart = (evt: any) => {
  draggedMember.value = evt.item.dataset.member || ""
  sourceGroupId.value = parseInt(evt.from.closest(".group-container")?.dataset.groupId || "0")
}

// 拖拽结束
const onDragEnd = () => {
  draggedMember.value = ""
  sourceGroupId.value = 0
  renderKey.value++
}

// 处理拖拽变化 - 修复重复用户检查
const handleDragChange = (evt: any) => {
  if (evt.added && draggedMember.value) {
    const targetGroupId = parseInt(evt.to.closest(".group-container")?.dataset.groupId || "0")

    if (targetGroupId && sourceGroupId.value && targetGroupId !== sourceGroupId.value) {
      // 检查目标组是否已存在该用户
      const targetGroup = rotaGroupsForm.value.find((group) => group.id === targetGroupId)
      if (targetGroup && targetGroup.members.includes(draggedMember.value)) {
        ElMessage.warning(`该用户已存在于目标组中，无法重复添加`)

        // 恢复源组数据，取消拖拽
        const newGroups = rotaGroupsForm.value.map((group) => {
          if (group.id === sourceGroupId.value) {
            return {
              ...group,
              members: [...group.members, draggedMember.value]
            }
          }
          return group
        })
        rotaGroupsForm.value = newGroups
        return
      }

      // 从源组移除该用户（只移除一个）
      const newGroups = rotaGroupsForm.value.map((group) => {
        if (group.id === sourceGroupId.value) {
          const newMembers = [...group.members]
          const index = newMembers.indexOf(draggedMember.value)
          if (index > -1) {
            newMembers.splice(index, 1)
          }
          return {
            ...group,
            members: newMembers
          }
        }
        return group
      })

      rotaGroupsForm.value = newGroups
    }
  }
}
</script>

<style scoped lang="scss">
.settings-group {
  display: flex;
  flex-direction: column;
  min-height: 0; // 确保可以收缩
}

.personnel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;

  .el-icon {
    font-size: 16px;
    color: #3b82f6;
  }
}

.personnel-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 4px;
  margin-bottom: 16px;
}

.group-container {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  }
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  min-width: 0; /* 允许内容收缩 */
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  flex-shrink: 1; /* 允许标题收缩 */
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-count {
  font-size: 12px;
  color: #6b7280;
  margin-right: 8px;
}

// 移除 action-btn 样式，使用默认样式

.members-container {
  padding: 12px;
  min-height: 60px;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 40px;

  &.empty-group {
    min-height: 80px;
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      border-color: #3b82f6;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      transform: scale(1.02);
    }
  }
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }
}

.member-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.member-avatar {
  font-size: 16px;
  color: #6b7280;
}

.member-name {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
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

.empty-group {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  color: #9ca3af;
  min-height: 60px;
}

/* 拖拽样式 */
.ghost {
  opacity: 0.5;
  background: #eff6ff;
  transform: rotate(5deg);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.chosen {
  background: #eff6ff;
  border-color: #3b82f6;
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

/* 拖拽时的过渡效果 */
.member-item {
  transition: all 0.2s ease;
}

.member-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 禁用拖拽时的文字选择 */
.members-list {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.member-item {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.members-list.dragging {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.members-list.dragging * {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 自定义滚动条样式 */
.personnel-content::-webkit-scrollbar {
  width: 6px;
}

.personnel-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.personnel-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.personnel-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
