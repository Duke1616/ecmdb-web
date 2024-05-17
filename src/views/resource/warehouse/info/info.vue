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
      <el-tabs v-model="activeName" @tab-click="handleTabClick">
        <el-tab-pane lazy v-for="(item, index) in tabList" :key="index" :label="item.title" :name="item.value">
          <resourceDesc
            v-if="item.active && activeName === 'resource-desc'"
            :resource-id="resourceId"
            :model-uid="modelUid"
          />
          <resourceList
            v-if="item.active && activeName === 'resource-list'"
            :model-uid="modelUid"
            :resource-id="resourceId"
          />
          <resourceRelation
            v-if="item.active && activeName === 'resource-relation'"
            :model-uid="modelUid"
            :resource-id="resourceId"
          />
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
interface TabItem {
  title: string
  value: string
  active: boolean
}

const tabList = ref<TabItem[]>([
  { title: "资源详情", value: "resource-desc", active: true },
  { title: "关系列表", value: "resource-list", active: false },
  { title: "关联拓扑图", value: "resource-relation", active: false }
])

const handleTabClick = (tab: { index: any }) => {
  console.log("index", tab.index)
  tabList.value = tabList.value.map((v, i) => ({
    ...v,
    active: Number(tab.index) === i
  }))
}

const goBack = () => {
  router.go(-1)
}
</script>
