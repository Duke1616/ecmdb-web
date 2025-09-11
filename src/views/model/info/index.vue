<template>
  <div class="modern-container">
    <div class="merged-header-card">
      <div class="header-section">
        <div class="page-header">
          <button @click="goBack" class="back-button">
            <span class="back-icon">←</span>
          </button>
          <div class="header-content">
            <h1 class="page-title">模型详情</h1>
          </div>
        </div>
      </div>

      <div class="model-details">
        <div class="model-identity">
          <div class="identity-badge">
            <span class="badge-label">唯一标识</span>
            <code class="identity-code">{{ modelUid }}</code>
          </div>
          <div class="model-name-section">
            <h2 class="model-name">{{ modelName }}</h2>
          </div>
        </div>
        <!-- 按钮部分 -->
        <div class="action-buttons">
          <button class="action-btn disable-btn" @click="handleDisableModel">
            <el-icon class="btn-icon"><CircleClose /></el-icon>
            <span>禁用模型</span>
          </button>
          <button class="action-btn delete-btn" @click="handleDeleteModel">
            <el-icon class="btn-icon"><Delete /></el-icon>
            <span>删除模型</span>
          </button>
        </div>
      </div>
    </div>

    <div class="content-tabs">
      <CustomTabs :tabs="tabs" :default-active="activeName" @tab-change="handleTabChange">
        <template #default="{ activeTab }">
          <model-field v-if="activeTab === 'model-field'" :model-uid="modelUid" />
          <model-relation v-if="activeTab === 'model-relation'" :model-uid="modelUid" />
        </template>
      </CustomTabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import modelField from "./components/model-field/index.vue"
import modelRelation from "./components/model-relation/index.vue"
import router from "@/router"
import { useRoute } from "vue-router"
import { deleteModelApi } from "@/api/model"
import { ElMessageBox } from "element-plus"
import CustomTabs from "@/common/components/Tabs/CustomTabs.vue"

const route = useRoute()
const modelUid = route.query.uid as string
const modelName = route.query.name as string

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
  ElMessageBox({
    title: "禁用确认",
    message: h("p", null, [
      h("span", null, "确认要禁用模型: "),
      h("strong", { style: "color: warning" }, `${modelName}`),
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
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除模型: "),
      h("strong", { style: "color: red" }, `${modelName}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteModelApi(modelUid).then(() => {
      ElMessage.success("删除成功")
      goBack()
    })
  })
}
</script>

<style lang="scss" scoped>
.modern-container {
  padding: 16px;
  background: var(--background, #fafafa);
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.content-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-top: 16px;
}

.merged-header-card {
  background: var(--card, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  .header-section {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border, #e5e7eb);

    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0;

      .back-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: var(--muted, #f9fafb);
        border: 1px solid var(--border, #e5e7eb);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: var(--accent, #f3f4f6);
          border-color: var(--accent, #f3f4f6);
        }

        .back-icon {
          font-size: 16px;
          color: var(--muted-foreground, #6b7280);
        }
      }
    }

    .header-content {
      .page-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--foreground, #111827);
        margin: 0;
        line-height: 1.2;
      }
    }
  }

  .model-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .model-identity {
    flex: 1;
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
      .model-name {
        font-size: 18px;
        font-weight: 600;
        color: var(--foreground, #111827);
        margin: 0;
        line-height: 1.3;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 8px;

    @media (max-width: 768px) {
      justify-content: flex-end;
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
      }
    }
  }
}
</style>
