<template>
  <div class="container-app">
    <el-page-header @back="goBack" class="header">
      <template #content>
        <span class="text-large font-400 mr-3"> 模型详情 </span>
      </template>
      <div class="mt-0.1 text-sm font-bold">
        <!-- Your additional content can be added with default slot, You may put as many content as you want here. -->
      </div>
    </el-page-header>
    <div class="model-info">
      <div class="model-name">
        <span class="model-uid">唯一标识: {{ $route.query.uid }}</span>
        <span>名称: {{ $route.query.name }}</span>
      </div>
      <div class="model-button">
        <el-button text size="large" type="danger" icon="RemoveFilled">禁用</el-button>
        <el-button text size="large" type="danger" icon="DeleteFilled">删除</el-button>
      </div>
    </div>
    <div class="model-tabs">
      <el-tabs stretchv-model="activeName" v-model="activeName" @tab-click="handleClick">
        <el-tab-pane label="模型字段" name="model-field">
          <model-field :model-uid="$route.query.uid as string" />
        </el-tab-pane>
        <el-tab-pane label="模型关联" name="model-relation">
          <model-relation />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import type { TabsPaneContext } from "element-plus"
import modelField from "./c-cnps/model-field.vue"
import modelRelation from "./c-cnps/model-relation.vue"

const goBack = () => {
  console.log("go back")
}

const activeName = ref("model-field")

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}
</script>

<style lang="scss" scoped>
.container-app {
  margin: 20px;
}
.model-uid {
  margin-right: 20px;
}
.model-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
