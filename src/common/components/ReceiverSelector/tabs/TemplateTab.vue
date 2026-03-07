<template>
  <div class="template-tab-container">
    <div class="template-header">
      <div class="header-icon">
        <el-icon><Document /></el-icon>
      </div>
      <div class="header-text">
        <div class="header-title">通过工单模板解析人员</div>
        <div class="header-desc">选择关联的流程模板和对应的人员字段</div>
      </div>
    </div>

    <div class="template-form">
      <div class="form-group">
        <label class="form-label">Agent 发版</label>
        <el-select
          v-model="templateConfig.id"
          placeholder="选择关联流程"
          filterable
          @change="templateConfig.field = ''"
          class="form-select"
        >
          <el-option v-for="t in templateRules" :key="t.id" :label="t.name" :value="t.id.toString()" />
        </el-select>
      </div>

      <div class="form-group" v-if="templateConfig.id">
        <label class="form-label">对应的人员变量字段</label>
        <el-select v-model="templateConfig.field" placeholder="名称" class="form-select">
          <el-option
            v-for="[title, field] in Array.from(getTemplateFieldOptions(Number(templateConfig.id)))"
            :key="field"
            :label="title"
            :value="field"
          />
        </el-select>
      </div>

      <el-button type="primary" class="submit-button" :disabled="!templateConfig.field" @click="addTemplateRule">
        添加至策略列表
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue"
import { Document } from "@element-plus/icons-vue"

interface Props {
  templateRules: any[]
  getTemplateFieldOptions: (id: number) => Map<string, string>
}

withDefaults(defineProps<Props>(), {
  templateRules: () => [],
  getTemplateFieldOptions: () => new Map()
})

const emits = defineEmits<{
  (e: "add", values: [string, string]): void
}>()

const templateConfig = reactive({ id: "", field: "" })

const addTemplateRule = () => {
  emits("add", [templateConfig.id, templateConfig.field])
}
</script>

<style lang="scss" scoped>
.template-tab-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.template-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e0e7ff;

  .header-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #3b82f6;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .el-icon {
      font-size: 20px;
      color: #fff;
    }
  }

  .header-text {
    flex: 1;
    padding-top: 2px;

    .header-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .header-desc {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
  }
}

.template-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .form-label {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      padding-left: 2px;
    }

    .form-select {
      :deep(.el-input__wrapper) {
        background: #f8fafc;
        border-radius: 8px;
        box-shadow: none;
        border: 1px solid #e2e8f0;
        transition: all 0.2s;

        &:hover {
          border-color: #cbd5e1;
          background: #fff;
        }

        &.is-focus {
          border-color: #3b82f6;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }
    }
  }

  .submit-button {
    margin-top: 8px;
    height: 40px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s;

    &:not(.is-disabled) {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}
</style>
