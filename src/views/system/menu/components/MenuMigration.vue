<template>
  <FormDialog
    :model-value="visible"
    title="迁移菜单"
    subtitle="将菜单迁移到其他平台"
    height="auto"
    header-icon="Switch"
    confirm-text="确认迁移"
    cancel-text="取消"
    :loading="loading"
    @confirm="handleConfirm"
    @cancel="handleCancel"
    @closed="handleCancel"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="migration-content">
      <div class="migration-info">
        <div class="current-menu">
          <h4>当前菜单：</h4>
          <p v-if="menuTitle">
            {{ menuTitle }}
          </p>
        </div>

        <div class="platform-selection">
          <h4>选择目标平台：</h4>
          <el-select v-model="targetPlatform" placeholder="请选择目标平台" class="platform-select" clearable>
            <el-option
              v-for="platform in platforms"
              :key="platform.id"
              :label="platform.name"
              :value="platform.id"
              :disabled="platform.id === currentPlatform"
            />
          </el-select>
        </div>

        <div class="migration-tips">
          <el-alert title="迁移说明" type="info" :closable="false" show-icon>
            <template #default>
              <ul>
                <li>迁移后，菜单将从当前平台移动到目标平台</li>
                <li>子菜单也会一并迁移</li>
                <li>迁移操作不可撤销，请谨慎操作</li>
              </ul>
            </template>
          </el-alert>
        </div>
      </div>
    </div>
  </FormDialog>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { FormDialog } from "@@/components/Dialogs"
import { getPlatformsForMenu, getPlatformName } from "@/common/constants/platforms"

interface Props {
  visible: boolean
  menuTitle?: string
  currentPlatform: string
}

interface Emits {
  (e: "update:visible", value: boolean): void
  (e: "confirm", targetPlatform: string): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  menuTitle: "",
  currentPlatform: ""
})

const emit = defineEmits<Emits>()

const platforms = ref(getPlatformsForMenu())
const targetPlatform = ref<string>("")
const loading = ref<boolean>(false)

// 监听 visible 变化，重置表单
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      targetPlatform.value = ""
      loading.value = false
    }
  }
)

// 确认迁移
const handleConfirm = async () => {
  if (!targetPlatform.value) {
    ElMessage.warning("请选择目标平台")
    return
  }

  if (targetPlatform.value === props.currentPlatform) {
    ElMessage.warning("目标平台不能与当前平台相同")
    return
  }

  try {
    loading.value = true

    // 这里需要调用迁移API，暂时用模拟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    ElMessage.success(`菜单已成功迁移到 ${getPlatformName(targetPlatform.value)}`)

    // 触发确认事件
    emit("confirm", targetPlatform.value)

    // 关闭对话框
    emit("update:visible", false)
  } catch (error) {
    ElMessage.error("迁移失败，请重试")
  } finally {
    loading.value = false
  }
}

// 取消迁移
const handleCancel = () => {
  emit("update:visible", false)
}
</script>

<style lang="scss" scoped>
/* 迁移对话框样式 */
.migration-content {
  padding: 20px 0;
}

.migration-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.current-menu {
  h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  p {
    margin: 0;
    padding: 12px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    color: #1f2937;
    font-weight: 500;
  }
}

.platform-selection {
  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .platform-select {
    width: 100%;
  }
}

.migration-tips {
  .el-alert {
    border-radius: 8px;

    ul {
      margin: 8px 0 0 0;
      padding-left: 20px;

      li {
        margin: 4px 0;
        font-size: 13px;
        line-height: 1.5;
        color: #6b7280;
      }
    }
  }
}
</style>
