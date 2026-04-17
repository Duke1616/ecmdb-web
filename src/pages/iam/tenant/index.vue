<template>
  <PageContainer>
    <ManagerHeader title="空间管理" subtitle="管理系统多租户隔离空间，配置独立的域名与资源配额">
      <template #actions>
        <el-button type="primary" :icon="Plus">新建空间</el-button>
      </template>
    </ManagerHeader>

    <div class="placeholder-content">
      <el-empty description="空间管理模块正在建设中..." />
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
</script>

<style scoped>
.placeholder-content {
  background: white;
  border-radius: 8px;
  padding: 40px;
  margin-top: 20px;
}
</style>
