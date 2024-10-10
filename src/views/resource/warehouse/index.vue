<template>
  <div class="app-container">
    <div class="header">
      <el-empty v-if="empty" :image-size="200" />
      <el-space v-else direction="vertical" fill>
        <div v-for="group in groupModelsData" :key="group.group_id" class="model-group">
          <!-- 使用 el-descriptions 展示组名称 -->
          <el-descriptions v-if="group.models" :title="group.group_name" :column="3" border />

          <!-- 展示模型卡片 -->
          <el-space wrap>
            <el-card
              v-for="model in group.models"
              :key="model.id"
              class="model-card"
              @click="handleModelClick(model)"
              style="width: 200px"
            >
              <div class="model-title">
                <div class="model-content">
                  <div class="model-image">
                    <img :src="model.icon" class="model-icon" />
                  </div>
                  <div class="model-name">{{ model.name }}</div>
                </div>
                <div>{{ model.total }}</div>
              </div>
            </el-card>
          </el-space>
        </div>
      </el-space>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router"
import { type Model, type Models } from "@/api/model/types/model"
import { ref } from "vue"
import { useModelStore } from "@/store/modules/model"

const empty = ref<boolean>(false)
const router = useRouter()

const groupModelsData = ref<Models[]>([])
// ** 获取数据 */

const getModelsData = () => {
  useModelStore()
    .ListModelsByGroup()
    .then(({ data }) => {
      groupModelsData.value = data.mgs
      if (groupModelsData.value.length === 0) {
        empty.value = true
      }
    })
    .catch(() => {
      groupModelsData.value = []
    })
    .finally(() => {})
}

const handleModelClick = (model: Model) => {
  router.push({
    path: "/cmdb/resource/list",
    query: { uid: model.uid }
  })
}

getModelsData()
</script>

<style>
.model-card:hover {
  box-shadow: 0 1px 6px rgba(255, 255, 255, 0.932);
  border-color: #eee;
  transition: all 0.2s ease-in-out;
  transform: scale(1.02);
}

/* 调整 el-card 大小 */
/*
.model-card {
  .el-card__body {
    padding: 16px;
  }
} */

.el-descriptions__header {
  margin-bottom: 10px;
}

.search-input {
  margin-right: 10px;
}

.search-radio {
  margin-left: 10px;
}

.model-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.model-content {
  display: flex;
  .model-image {
    width: 17px;
    height: 17px;
    margin-right: 5px;
  }
  .model-icon {
    width: 100%;
    height: 100%;
  }

  .model-name {
    font-weight: bold;
  }
}
</style>
