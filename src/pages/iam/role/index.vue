<template>
  <PageContainer>
    <ManagerHeader title="角色管理" subtitle="定义系统角色及其权限边界，支持多维度的授权治理">
      <template #actions>
        <el-button type="primary" :icon="Plus">新建角色</el-button>
      </template>
    </ManagerHeader>

    <div class="placeholder-content">
      <el-empty description="角色管理模块正在建设中..." />
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
