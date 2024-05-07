<template>
  <div class="app-container">
    <div class="header">
      <div class="button">
        <el-button type="primary" :icon="CirclePlus">新增模型</el-button>
        <el-button type="primary" :icon="CirclePlus">新建分组</el-button>
      </div>
      <div class="search">
        <div class="search-container">
          <el-input
            v-model="searchInput"
            style="width: 240px"
            placeholder="模型信息"
            :suffix-icon="Search"
            class="search-input"
            @input="search"
          />
          <el-radio-group v-model="modelStatus" label="size control" class="search-radio" @change="search">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="open">启用中</el-radio-button>
            <el-radio-button value="close">已停用</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </div>
    <div class="model-groups">
      <div v-for="group in ModelsData" :key="group.group_id" class="model-group">
        <h3>{{ group.group_name }}</h3>
        <div class="model-cards">
          <el-row :gutter="20">
            <el-col
              v-for="model in group.models"
              :key="model.id"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="6"
              :xl="4"
              style="margin-bottom: 4px"
            >
              <!-- <router-link :to="`/model/info`" class="model-card" @click="handleModelClick()"> -->
              <el-card class="model-card" @click="handleModelClick(model)">
                <div class="model-content">
                  <div class="model-image">
                    <img :src="model.icon" style="width: 100%" />
                  </div>
                  <div class="model-info">
                    <div class="model-name">{{ model.name }}</div>
                    <div class="model-unique-name">{{ model.uid }}</div>
                  </div>
                </div>
              </el-card>
              <!-- </router-link> -->
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { CirclePlus, Search } from "@element-plus/icons-vue"
import { listModelsApi } from "@/api/model"
import { type Models, type Model } from "@/api/model/types/model"
import { usePagination } from "@/hooks/usePagination"

// import { type listModelsResponseData } from "@/api/model/types/model"
const searchInput = ref("")
import { useRouter } from "vue-router"
const modelStatus = ref<"all" | "open" | "close">("all")
const loading = ref<boolean>(false)
const { paginationData } = usePagination()
const router = useRouter()

// function handleModelClick(model: any) {
//   // Handle model click here
//   console.log("Model clicked:", model)
// }

const ModelsData = ref<Models[]>([])
// ** 获取数据 */
const getModelsData = () => {
  loading.value = true
  listModelsApi()
    .then(({ data }) => {
      console.log(data)
      ModelsData.value = data.data.mgs
    })
    .catch(() => {
      ModelsData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

const handleModelClick = (model: Model) => {
  console.log(model)
  router.push({
    path: "/model/info",
    query: { uid: model.uid, name: model.name }
  })
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], getModelsData, { immediate: true })

function search() {
  // 调用搜索接口
  console.log("搜索:", searchInput.value, modelStatus.value)
}
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-container {
  display: flex;
  align-items: center;
}

.search-input {
  margin-right: 10px;
}

.search-radio {
  margin-left: 10px;
}

.model-content {
  display: flex;
  align-items: center;
  .model-image {
    width: 15%;
    margin-right: 20px;
  }
  .model-name {
    font-weight: bold;
    font-size: 18px;
  }

  .model-unique-name {
    color: rgb(191, 199, 210);
    font-size: 16px;
  }
}
</style>
