<template>
  <div class="app-container">
    <el-page-header @back="goBack" class="header">
      <template #content>
        <span class="text-large font-400 mr-3" style="font-size: 16px"> {{ resourceName }} </span>
      </template>
      <div class="mt-0.1 text-sm font-bold">
        <!-- Your additional content can be added with default slot, You may put as many content as you want here. -->
      </div>
    </el-page-header>

    <div class="model-tabs">
      <el-tabs v-model="activeName">
        <el-tab-pane lazy label="资源详情" name="resource-desc">
          <resourceDesc :resource-id="resourceId" :model-uid="modelUid" />
        </el-tab-pane>
        <el-tab-pane lazy label="关系列表" name="resource-list">
          <resourceList :model-uid="modelUid" :resource-id="resourceId" />
        </el-tab-pane>
        <el-tab-pane lazy label="关联拓扑图" name="resource-relation">
          <resourceRelation :model-uid="modelUid" :resource-id="resourceId" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { useRoute } from "vue-router"
import resourceDesc from "./c-cnps/desc.vue"
import resourceRelation from "./c-cnps/relation-graph.vue"
import resourceList from "./c-cnps/relation-list.vue"
import router from "@/router"

const route = useRoute()
const modelUid = route.query.model_uid as string
const resourceName = route.query.name as string
const resourceId = route.query.id as string

const activeName = ref<string>("resource-desc")
const goBack = () => {
  router.go(-1)
}
</script>
