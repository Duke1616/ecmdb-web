<template>
  <div class="form-section">
    <div class="section-header">
      <div class="section-title">
        <el-icon><User /></el-icon>
        <span>班排人员</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="addNewGroup"> 添加组 </el-button>
    </div>

    <div class="personnel-content">
      <div v-for="group in rotaGroups" :key="group.id" class="group-container" :data-group-id="group.id">
        <div class="group-header">
          <span class="group-title">{{ `组 ${group.name}` }}</span>
          <div class="group-actions">
            <span class="group-count">{{ group.members.length }} 人</span>
            <el-button size="small" type="primary" plain :icon="Plus" @click="addMemberToGroup(group.id, $event)">
              添加成员
            </el-button>
            <el-button size="small" type="danger" plain :icon="Delete" @click="removeGroup(group.id)">
              删除组
            </el-button>
          </div>
        </div>

        <div class="members-container">
          <VueDraggable
            :model-value="group.members"
            :key="`${group.id}-${renderKey}`"
            :animation="200"
            group="rotaGroup"
            ghostClass="ghost"
            chosenClass="chosen"
            handle=".handle"
            @start="onStart"
            @end="onEnd"
            @change="onDragChange"
            @move="onMove"
            @update:model-value="(newMembers: string[]) => updateGroupMembers(group.id, newMembers)"
            :forceFallback="true"
            class="members-list"
            :class="{ 'empty-group': group.members.length === 0 }"
          >
            <div v-for="(member, itemIndex) in group.members" :key="member" class="member-item">
              <div class="member-info">
                <el-icon class="member-avatar">
                  <User />
                </el-icon>
                <span class="member-name">{{ getUserByUsername(member) }}</span>
              </div>
              <div class="member-actions">
                <el-icon @click="removeMemberFromGroup(group.id, itemIndex)" class="action-btn remove-btn">
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

      <div v-if="rotaGroups.length === 0" class="empty-personnel">
        <el-icon class="empty-icon">
          <User />
        </el-icon>
        <div class="empty-text">暂无组，请添加组</div>
      </div>
    </div>

    <!-- 用户选择器 -->
    <UserPopover ref="userPopoverRef" :add-rota-group="addRotaGroup" :existing-users="existingUsers" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import { User, Close, Grid, Plus, Delete } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { rotaGroup } from "@/api/rota/types/rota"
import { user as userInfo } from "@/api/user/types/user"
import UserPopover from "../user-popover.vue"
import { useUserToolsStore } from "@/pinia/stores/user-tools"

interface Props {
  modelValue: rotaGroup[]
}

interface Emits {
  (e: "update:modelValue", value: rotaGroup[]): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

const userToolsStore = useUserToolsStore()
const rotaGroups = ref<rotaGroup[]>([...props.modelValue])

// 当前添加成员的组ID
const currentAddingGroupId = ref<number | null>(null)
const userPopoverRef = ref()
const renderKey = ref(0)

// 计算当前组已存在的用户列表（只检查当前正在添加成员的组）
const existingUsers = computed(() => {
  if (!currentAddingGroupId.value) return []

  const currentGroup = rotaGroups.value.find((g) => g.id === currentAddingGroupId.value)
  return currentGroup ? currentGroup.members : []
})

// 监听外部数据变化
watch(
  () => props.modelValue,
  (newValue) => {
    rotaGroups.value = [...newValue]
  },
  { deep: true }
)

// 监听内部数据变化
watch(
  rotaGroups,
  (newValue) => {
    console.log(
      "rotaGroups 数据变化:",
      newValue.map((g) => ({ id: g.id, name: g.name, members: g.members }))
    )
    emits("update:modelValue", newValue)
  },
  { deep: true }
)

// 监听 renderKey 变化，强制重新渲染
watch(renderKey, (newValue) => {
  console.log("renderKey 变化:", newValue)
})

const getUserByUsername = (username: string) => {
  return userToolsStore.getUsername(username)
}

// 更新组内成员
const updateGroupMembers = (groupId: number, newMembers: string[]) => {
  console.log("更新组成员:", groupId, newMembers)
  const groupIndex = rotaGroups.value.findIndex((g) => g.id === groupId)
  if (groupIndex !== -1) {
    // 直接创建新的数组，不修改原数组
    const newGroups = rotaGroups.value.map((group, index) => {
      if (index === groupIndex) {
        return {
          ...group,
          members: [...newMembers]
        }
      }
      return group
    })

    rotaGroups.value = newGroups
    renderKey.value++
    console.log("组成员已更新:", rotaGroups.value[groupIndex])
  }
}

// 添加新组
const addNewGroup = () => {
  const newGroupName = `${String.fromCharCode(65 + rotaGroups.value.length)}`
  const newGroup = {
    id: Date.now(),
    name: newGroupName,
    members: []
  }
  rotaGroups.value.push(newGroup)
}

// 添加成员到指定组
const addMemberToGroup = (groupId: number, event: Event) => {
  console.log("addMemberToGroup 被调用，groupId:", groupId)
  currentAddingGroupId.value = groupId
  console.log("设置 currentAddingGroupId 为:", currentAddingGroupId.value)
  // 传递按钮元素给用户选择器
  const buttonElement = event.target as HTMLElement
  userPopoverRef.value?.show(buttonElement)
}

// 添加用户到当前组
const addRotaGroup = (user: userInfo) => {
  console.log("addRotaGroup 被调用:", user, "currentAddingGroupId:", currentAddingGroupId.value)

  if (!currentAddingGroupId.value) {
    console.log("没有 currentAddingGroupId，跳过添加")
    return
  }

  const groupIndex = rotaGroups.value.findIndex((g) => g.id === currentAddingGroupId.value)
  console.log("找到组索引:", groupIndex)

  if (groupIndex !== -1) {
    const group = rotaGroups.value[groupIndex]

    // 检查当前组内是否已存在该用户
    if (!group.members.includes(user.username)) {
      // 创建新的组成员数组
      const newMembers = [...group.members, user.username]

      // 更新整个 rotaGroups 数组
      rotaGroups.value = rotaGroups.value.map((g, index) => {
        if (index === groupIndex) {
          return {
            ...g,
            members: newMembers
          }
        }
        return g
      })

      userToolsStore.setToMap(user.username, user.display_name + " [" + user.username + "] ")
      console.log("用户添加成功，当前组成员:", newMembers)

      // 强制重新渲染
      renderKey.value++
    } else {
      console.log("用户已在该组中存在")
    }
  } else {
    console.log("未找到对应的组")
  }
  currentAddingGroupId.value = null
}

// 从组中移除成员
const removeMemberFromGroup = (groupId: number, memberIndex: number) => {
  const groupIndex = rotaGroups.value.findIndex((g) => g.id === groupId)
  if (groupIndex !== -1) {
    const group = rotaGroups.value[groupIndex]
    // 创建新的组成员数组
    const newMembers = group.members.filter((_, index) => index !== memberIndex)

    // 更新整个 rotaGroups 数组
    rotaGroups.value = rotaGroups.value.map((g, index) => {
      if (index === groupIndex) {
        return {
          ...g,
          members: newMembers
        }
      }
      return g
    })
  }
}

// 删除组
const removeGroup = (groupId: number) => {
  rotaGroups.value = rotaGroups.value.filter((g) => g.id !== groupId)
}

// 处理拖拽开始事件
const onStart = () => {
  console.log("当前值班组:", rotaGroups.value)
  // 重置拖拽检测状态
  dragCheckState.value = {
    lastCheckTime: 0,
    lastDraggedUser: "",
    lastTargetGroup: null,
    hasShownWarning: false
  }

  // 添加拖拽类，禁用文字选择
  const allMembersLists = document.querySelectorAll(".members-list")
  allMembersLists.forEach((list) => list.classList.add("dragging"))
}

// 拖拽检测状态
const dragCheckState = ref({
  lastCheckTime: 0,
  lastDraggedUser: "",
  lastTargetGroup: null as number | null,
  hasShownWarning: false
})

// 处理拖拽移动事件（在拖拽之前检查）
const onMove = (evt: any) => {
  const now = Date.now()

  // 获取被拖拽的元素
  const draggedElement = evt.dragged
  const draggedText = draggedElement.textContent || draggedElement.innerText

  // 从文本中提取用户名，格式如 "张三 [zhangs]"
  const usernameMatch = draggedText.match(/\[([^\]]+)\]/)
  const draggedUsername = usernameMatch ? usernameMatch[1] : draggedText.split(" ")[0]

  // 获取目标组
  const targetContainer = evt.to
  const targetGroupElement = targetContainer.closest(".group-container")

  if (targetGroupElement) {
    const targetGroupId = parseInt(targetGroupElement.dataset.groupId)
    const targetGroup = rotaGroups.value.find((g) => g.id === targetGroupId)

    if (targetGroup) {
      // 检查是否是相同的用户和组组合，避免重复检测
      const isSameCheck =
        dragCheckState.value.lastDraggedUser === draggedUsername &&
        dragCheckState.value.lastTargetGroup === targetGroupId

      // 如果距离上次检测不到500ms，且是相同的检查，跳过
      if (isSameCheck && now - dragCheckState.value.lastCheckTime < 500) {
        return !dragCheckState.value.hasShownWarning
      }

      // 更新检测状态
      dragCheckState.value.lastCheckTime = now
      dragCheckState.value.lastDraggedUser = draggedUsername
      dragCheckState.value.lastTargetGroup = targetGroupId

      // 检查目标组是否已经有该用户
      const userAlreadyInGroup = targetGroup.members.includes(draggedUsername)

      if (userAlreadyInGroup) {
        // 只在第一次检测到重复时显示警告
        if (!dragCheckState.value.hasShownWarning) {
          ElMessage.warning("该用户已在此组中，不能重复添加")
          dragCheckState.value.hasShownWarning = true
        }
        return false // 阻止拖拽
      } else {
        // 如果用户不在组中，重置警告状态
        dragCheckState.value.hasShownWarning = false
      }
    }
  }

  return true // 允许拖拽
}

// 处理拖拽变化事件
const onDragChange = async (evt: any) => {
  console.log("拖拽变化:", evt)
  console.log(
    "拖拽前所有组:",
    rotaGroups.value.map((g) => ({ id: g.id, name: g.name, members: g.members }))
  )

  // 检查组内重复用户
  if (evt.added) {
    const addedElement = evt.added.element
    const targetGroupIndex = rotaGroups.value.findIndex((group) => group.members.includes(addedElement))

    if (targetGroupIndex !== -1) {
      const targetGroup = rotaGroups.value[targetGroupIndex]

      // 检查组内重复（计算重复数量，如果超过1个就是重复）
      const userCount = targetGroup.members.filter((member) => member === addedElement).length

      if (userCount > 1) {
        // 有重复用户，移除多余的
        const newGroups = rotaGroups.value.map((group, index) => {
          if (index === targetGroupIndex) {
            // 只保留第一个出现的用户，移除其他重复的
            let foundFirst = false
            return {
              ...group,
              members: group.members.filter((member) => {
                if (member === addedElement) {
                  if (!foundFirst) {
                    foundFirst = true
                    return true
                  }
                  return false
                }
                return true
              })
            }
          }
          return group
        })

        rotaGroups.value = newGroups
        renderKey.value++
        ElMessage.warning("该用户已在此组中，不能重复添加")
        console.log("组内重复用户已移除:", addedElement)
      }
    }
  }

  console.log("拖拽变化后界面已更新")
}

// 处理拖拽结束事件
const onEnd = async () => {
  console.log("拖拽结束")
  console.log(
    "结束前所有组:",
    rotaGroups.value.map((g) => ({ id: g.id, name: g.name, members: g.members }))
  )

  // 移除拖拽类，恢复文字选择
  const allMembersLists = document.querySelectorAll(".members-list")
  allMembersLists.forEach((list) => list.classList.remove("dragging"))

  // 重新命名组（不移除空组，让用户手动删除）
  rotaGroups.value.forEach((group, index) => {
    group.name = `${String.fromCharCode(65 + index)}`
  })

  // 强制触发响应式更新 - 创建全新的数组引用
  const newGroups = rotaGroups.value.map((group) => ({
    ...group,
    members: [...group.members]
  }))

  rotaGroups.value = newGroups
  renderKey.value++

  await nextTick()
  console.log(
    "结束后的组:",
    rotaGroups.value.map((g) => ({ id: g.id, name: g.name, members: g.members }))
  )
}
</script>

<style scoped lang="scss">
.form-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 10px 14px;
    background: #f8fafc;
    border-radius: 6px;
    border-left: 3px solid #3b82f6;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;

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

/* 人员内容 */
.personnel-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.group-container {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.members-container {
  padding: 12px;
  background: #f9fafb;
}

.empty-group {
  padding: 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  background: #f9fafb;
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

.group-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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

/* 空组拖拽区域样式 */
.members-list.empty-group {
  min-height: 60px;
  border: 2px dashed #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }
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
}

.chosen {
  background: #eff6ff;
  border-color: #3b82f6;
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

/* 拖拽过程中禁用文字选择 */
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
