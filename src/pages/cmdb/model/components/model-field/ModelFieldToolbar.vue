<template>
  <div class="field-toolbar">
    <el-input v-model="keyword" placeholder="搜索属性..." :suffix-icon="Search" class="field-search" clearable />

    <div class="toolbar-actions">
      <AuthButton
        type="primary"
        :icon="CirclePlus"
        :capability="CMDB_CAPABILITIES.Attribute.GroupAdd"
        disable-mode
        @click="emit('create-group')"
      >
        新增分组
      </AuthButton>
      <AuthButton
        :type="dragMode ? 'warning' : 'default'"
        :icon="dragMode ? CircleCheck : Rank"
        plain
        :capability="CMDB_CAPABILITIES.Attribute.Sort"
        disable-mode
        @click="toggleDragMode"
      >
        {{ dragMode ? "完成排序" : "开启排序" }}
      </AuthButton>
      <el-button :icon="expanded ? Expand : ArrowUp" @click="emit('toggle-expand')">
        {{ expanded ? "全部收起" : "全部展开" }}
      </el-button>
      <AuthButton
        :icon="Setting"
        :capability="CMDB_CAPABILITIES.Attribute.ViewCustomFields"
        disable-mode
        @click="emit('custom-columns')"
      >
        自定义列展示
      </AuthButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowUp, CircleCheck, CirclePlus, Expand, Rank, Search, Setting } from "@element-plus/icons-vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"

const keyword = defineModel<string>("keyword", { default: "" })
const dragMode = defineModel<boolean>("dragMode", { default: false })

defineProps<{
  expanded: boolean
}>()

const emit = defineEmits<{
  "create-group": []
  "toggle-expand": []
  "custom-columns": []
}>()

const toggleDragMode = () => {
  dragMode.value = !dragMode.value
}
</script>

<style lang="scss" scoped>
.field-toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  margin-bottom: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.field-search {
  width: 300px;
  flex: 0 0 300px;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;

  :deep(.el-button) {
    height: 34px;
    border-radius: 8px;
    font-weight: 600;
  }
}

@media (max-width: 900px) {
  .field-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .field-search {
    width: 100%;
    flex: none;
  }

  .toolbar-actions {
    justify-content: flex-start;
  }
}
</style>
