<template>
  <div class="form-section">
    <div class="section-header">
      <div class="section-title">
        <el-icon><User /></el-icon>
        <span>班排人员</span>
      </div>
      <UserPopover :add-rota-group="addRotaGroup" />
    </div>

    <div class="personnel-content">
      <div v-for="group in rotaGroups" :key="group.id" class="group-container">
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
      <div v-if="rotaGroups.length === 0" class="empty-personnel">
        <el-icon class="empty-icon">
          <User />
        </el-icon>
        <div class="empty-text">暂无人员，请添加成员</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import { User, Close, Grid } from "@element-plus/icons-vue"
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
    emits("update:modelValue", newValue)
  },
  { deep: true }
)

const getUserByUsername = (username: string) => {
  return userToolsStore.getUsername(username)
}

// 添加用户并创建新组
const addRotaGroup = (user: userInfo) => {
  const newGroupName = `${String.fromCharCode(65 + rotaGroups.value.length)}`
  const newGroup = {
    id: Date.now(),
    name: newGroupName,
    members: [user.username]
  }

  userToolsStore.setToMap(user.username, user.display_name + " [" + user.username + "] ")
  rotaGroups.value.push(newGroup)
}

// 处理拖拽开始事件
const onStart = () => {
  console.log("当前值班组:", rotaGroups.value)
}

// 处理拖拽结束事件
const onEnd = () => {
  rotaGroups.value.forEach((group, index) => {
    if (group.members.length === 0) {
      rotaGroups.value.splice(index, 1)
    }
  })

  rotaGroups.value.forEach((group, index) => {
    group.name = `${String.fromCharCode(65 + index)}`
  })
}

// 将成员从当前组移到另一组（或者做其他操作）
const removeAndToLeftList = (index: number, member: string, group: rotaGroup) => {
  // 从当前组中移除成员
  group.members.splice(index, 1)

  // 检查组是否为空，若为空则删除该组
  if (group.members.length === 0) {
    const groupIndex = rotaGroups.value.findIndex((g) => g.id === group.id)
    if (groupIndex !== -1) {
      rotaGroups.value.splice(groupIndex, 1)
    }
  }
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
