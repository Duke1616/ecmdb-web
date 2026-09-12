<template>
  <div class="empty-results-container">
    <el-empty description="未检索到匹配的资产数据">
      <template #extra>
        <div class="empty-tips">
          <p>建议您：</p>
          <ul>
            <li>检查关键词拼写是否正确</li>
            <li>尝试缩短关键词或使用更通用的资产标识（如 IP、主机名、序列号）</li>
            <li>确认当前租户空间是否具备对应模型资产的访问权限</li>
          </ul>
          <el-button type="primary" plain :icon="Refresh" @click="emit('reset')">清空并重新检索</el-button>
        </div>
      </template>
    </el-empty>
  </div>
</template>

<script lang="ts" setup>
import { Refresh } from "@element-plus/icons-vue"

const emit = defineEmits<{
  (e: "reset"): void
}>()
</script>

<style scoped lang="scss">
.empty-results-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  border-radius: 12px;
  margin: 0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);

  .empty-tips {
    max-width: 460px;
    text-align: left;
    margin-top: 16px;
    color: #64748b;
    font-size: 13px;

    p {
      margin: 0 0 8px;
      font-weight: 600;
      color: #334155;
    }

    ul {
      margin: 0 0 16px;
      padding-left: 20px;
      line-height: 1.8;
    }
  }
}
</style>
