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
      <div v-for="group in modelGroups" :key="group.id" class="model-group">
        <h3>{{ group.name }}</h3>
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
              <router-link :to="`/model/info`" class="model-card" @click="handleModelClick(model)">
                <el-card class="model-card">
                  <div class="model-content">
                    <div class="model-image">
                      <img :src="model.icon" style="width: 100%" />
                    </div>
                    <div class="model-info">
                      <div class="model-name">{{ model.name }}</div>
                      <div class="model-unique-name">{{ model.uniqueName }}</div>
                    </div>
                  </div>
                </el-card>
              </router-link>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { CirclePlus, Search } from "@element-plus/icons-vue"
const searchInput = ref("")
const modelStatus = ref<"all" | "open" | "close">("all")

function handleModelClick(model: any) {
  // Handle model click here
  console.log("Model clicked:", model)
}

const modelGroups = ref([
  {
    id: 1,
    name: "分组1",
    models: [
      {
        id: 1,
        name: "模型1",
        uniqueName: "唯一名称1",
        icon: "https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png"
      },
      {
        id: 2,
        name: "模型2",
        uniqueName: "唯一名称2",
        icon: "https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png"
      },
      {
        id: 3,
        name: "模型3",
        uniqueName: "唯一名称3",
        icon: "https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png"
      },
      {
        id: 1,
        name: "模型1",
        uniqueName: "唯一名称1",
        icon: "https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png"
      },
      {
        id: 1,
        name: "模型1",
        uniqueName: "唯一名称1",
        icon: "https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png"
      },
      {
        id: 1,
        name: "模型1",
        uniqueName: "唯一名称1",
        icon: "https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png"
      }
    ]
  },
  {
    id: 2,
    name: "分组2",
    models: [
      {
        id: 1,
        name: "模型1",
        uniqueName: "唯一名称1",
        icon: "https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png"
      },
      {
        id: 1,
        name: "模型1",
        uniqueName: "唯一名称1",
        icon: "https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png"
      },
      {
        id: 1,
        name: "模型1",
        uniqueName: "唯一名称1",
        icon: "https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png"
      },
      {
        id: 1,
        name: "模型1",
        uniqueName: "唯一名称1",
        icon: "https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png"
      },
      {
        id: 1,
        name: "模型1",
        uniqueName: "唯一名称1",
        icon: "https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png"
      }
    ]
  }
])

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
  .model-image {
    width: 20%;
    margin-right: 20px;
  }
}
</style>
