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
        <span class="model-uid">唯一标识: {{ modelUid }}</span>
        <span>名称: {{ modelName }}</span>
      </div>
      <div class="model-button">
        <el-button text size="large" type="danger" icon="RemoveFilled">禁用</el-button>
        <el-button text size="large" type="danger" icon="DeleteFilled" @click="handleDeleteModel">删除</el-button>
      </div>
    </div>
    <div class="model-tabs">
      <el-tabs stretchv-model="activeName" v-model="activeName" @tab-click="handleClick">
        <el-tab-pane lazy label="模型字段" name="model-field">
          <model-field :model-uid="modelUid" />
        </el-tab-pane>
        <el-tab-pane lazy label="模型关联" name="model-relation">
          <model-relation :model-uid="modelUid" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, ref } from "vue"
import { ElMessage, ElMessageBox, type TabsPaneContext } from "element-plus"
import modelField from "./c-cnps/model-field.vue"
import modelRelation from "./c-cnps/model-relation.vue"
import router from "@/router"
import { useRoute } from "vue-router"
import { deleteModelApi } from "@/api/model"

const route = useRoute()
const modelUid = route.query.uid as string
const modelName = route.query.name as string

const goBack = () => {
  router.go(-1)
}

const activeName = ref("model-field")
const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}

const handleDeleteModel = () => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除模型: "),
      h("i", { style: "color: red" }, `${modelName}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
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
