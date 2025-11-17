<template>
  <PageContainer>
    <ManagerHeader title="模型详情" subtitle="" :show-back-button="true" @back="goBack">
      <template #details>
        <div class="model-identity">
          <div class="identity-badge">
            <span class="badge-label">唯一标识</span>
            <code class="identity-code">{{ modelUid }}</code>
          </div>
          <div class="model-name-section">
            <div class="model-name-wrapper">
              <h2 class="model-name">{{ modelName }}</h2>
              <el-tag v-if="isBuiltin" size="small" type="warning" class="builtin-tag">内置</el-tag>
            </div>
          </div>
        </div>
      </template>

      <template #actions>
        <button class="action-btn disable-btn" @click="handleDisableModel">
          <el-icon class="btn-icon"><CircleClose /></el-icon>
          <span>禁用模型</span>
        </button>
        <button class="action-btn delete-btn" :disabled="isBuiltin" @click="handleDeleteModel">
          <el-icon class="btn-icon"><Delete /></el-icon>
          <span>删除模型</span>
        </button>
      </template>
    </ManagerHeader>

    <CustomTabs :tabs="tabs" :default-active="activeName" @tab-change="handleTabChange">
      <template #default="{ activeTab }">
        <model-field v-if="activeTab === 'model-field'" :model-uid="modelUid" />
        <model-relation v-if="activeTab === 'model-relation'" :model-uid="modelUid" />
      </template>
    </CustomTabs>
  </PageContainer>
</template>

<script lang="ts" setup>
import { ref, h, computed, onMounted } from "vue"
import modelField from "./components/model-field/index.vue"
import modelRelation from "./components/model-relation/index.vue"
import router from "@/router"
import { useRoute } from "vue-router"
import { deleteModelApi, getModelDetailApi } from "@/api/model"
import type { Model } from "@/api/model/types/model"
import { ElMessage, ElMessageBox } from "element-plus"
import CustomTabs from "@/common/components/Tabs/CustomTabs.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"

const route = useRoute()
const id = route.query.id ? Number(route.query.id) : undefined

const modelInfo = ref<Model | null>(null)

// 统一出口：完全依赖详情接口返回的数据
const modelUid = computed(() => modelInfo.value?.uid ?? "")
const modelName = computed(() => modelInfo.value?.name ?? "")
const isBuiltin = computed(() => Boolean(modelInfo.value?.builtin))

const fetchModelInfo = () => {
  if (!id) return

  getModelDetailApi(id)
    .then((resp) => {
      // 兼容后端可能返回 { model: {...} } 或直接返回模型对象两种结构
      const rawData: any = resp.data
      modelInfo.value = rawData?.model ?? rawData ?? null
    })
    .catch(() => {
      modelInfo.value = null
    })
}

const goBack = () => {
  router.go(-1)
}

const activeName = ref("model-field")

// tabs 配置
const tabs = [
  { name: "model-field", label: "模型字段" },
  { name: "model-relation", label: "模型关联" }
]

// 处理 tab 切换
const handleTabChange = (tabName: string) => {
  activeName.value = tabName
}

const handleDisableModel = () => {
  if (!modelUid.value) return
  ElMessageBox({
    title: "禁用确认",
    message: h("p", null, [
      h("span", null, "确认要禁用模型: "),
      h("strong", { style: "color: warning" }, `${modelName.value}`),
      h("span", null, " 吗？")
    ]),
    confirmButtonText: "确认禁用",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    ElMessage.success("模型已禁用")
  })
}

const handleDeleteModel = () => {
  if (!modelUid.value) {
    ElMessage.warning("数据加载中，请稍后再试")
    return
  }
  if (isBuiltin.value) {
    ElMessage.warning("内置模型不可删除")
    return
  }
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除模型: "),
      h("strong", { style: "color: red" }, `${modelName.value}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteModelApi(modelUid.value).then(() => {
      ElMessage.success("删除成功")
      goBack()
    })
  })
}

onMounted(() => {
  fetchModelInfo()
})
</script>

<style lang="scss" scoped>
// 移除自定义容器样式，使用 PageContainer

.model-identity {
  display: flex;
  align-items: center;
  gap: 16px;

  .identity-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--muted, #f9fafb);
    padding: 4px 8px;
    border-radius: 6px;

    .badge-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--muted-foreground, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .identity-code {
      font-family: var(--font-mono, "Monaco", "Menlo", "Ubuntu Mono", monospace);
      font-size: 12px;
      font-weight: 600;
      color: var(--primary, #3b82f6);
      background: var(--background, #ffffff);
      padding: 2px 6px;
      border-radius: 3px;
    }
  }

  .model-name-section {
    .model-name-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .model-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground, #111827);
      margin: 0;
      line-height: 1.3;
    }

    .builtin-tag {
      border-radius: 8px;
      font-weight: 600;
      color: #a16207;
      background: #fef3c7;
      border-color: #fcd34d;
    }
  }
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;

  .btn-icon {
    font-size: 14px;
  }

  &.disable-btn {
    background: var(--muted, #f9fafb);
    color: var(--muted-foreground, #6b7280);
    border-color: var(--border, #e5e7eb);

    &:hover {
      background: var(--accent, #f3f4f6);
      color: var(--accent-foreground, #374151);
      border-color: var(--accent, #f3f4f6);
    }
  }

  &.delete-btn {
    background: var(--destructive, #ef4444);
    color: var(--destructive-foreground, #ffffff);
    border-color: var(--destructive, #ef4444);

    &:hover {
      background: #dc2626;
      border-color: #dc2626;
    }

    &:disabled {
      background: #fee2e2;
      border-color: #fecaca;
      color: #f87171;
      box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.2);
    }
  }

  &:disabled,
  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>
