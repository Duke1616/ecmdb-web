<template>
  <div class="app-container">
    <div class="header">
      <el-empty v-if="empty === true" :image-size="200" />
      <div v-if="empty === false">
        <el-row v-for="group in ModelsData" :key="group.group_id" class="model-group-row">
          <el-col class="model-group-col">
            <div class="model-grpup">
              <div v-if="group.models != undefined" class="model-group-name">{{ group.group_name }}</div>
              <div>
                <el-row :gutter="20">
                  <el-col
                    v-for="model in group.models"
                    :key="model.id"
                    :span="4"
                    :xs="8"
                    :sm="6"
                    :md="6"
                    :lg="5"
                    :xl="4"
                    style="margin-bottom: 4px"
                  >
                    <el-card class="model-card" @click="handleModelClick(model)">
                      <div class="model-title">
                        <div class="model-content">
                          <div class="model-image">
                            <img :src="model.icon" class="model-icon" />
                          </div>
                          <div class="model-name">{{ model.name }}</div>
                        </div>
                        <div>
                          {{ model.total }}
                        </div>
                      </div>
                    </el-card>
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router"
import { type Model, type Models } from "@/api/model/types/model"
import { listModelsApi } from "@/api/model"
import { ref } from "vue"

const empty = ref<boolean>(false)
const router = useRouter()

const ModelsData = ref<Models[]>([])
// ** 获取数据 */
const getModelsData = () => {
  listModelsApi()
    .then(({ data }) => {
      ModelsData.value = data.mgs
      if (ModelsData.value.length === 0) {
        empty.value = true
      }
    })
    .catch(() => {
      ModelsData.value = []
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

.model-card {
  .el-card__body {
    padding: 15px;
  }
}
.search-input {
  margin-right: 10px;
}

.search-radio {
  margin-left: 10px;
}

.model-group-col {
  padding-bottom: 10px;
  .model-group-name {
    padding-bottom: 5px;
  }
}

.model-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.model-content {
  display: flex;
  align-items: center;
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
    font-size: 14px;
    line-height: 14px;
  }
}
</style>
