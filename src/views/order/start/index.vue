<template>
  <div class="app-container">
    <el-empty v-if="empty === true" :image-size="200" />
    <div v-if="empty === false">
      <div v-for="item in templateCombinations" :key="item.id">
        <div>
          <h3>{{ item.name }}</h3>
        </div>
        <el-card>
          <el-row>
            <el-col :sm="12" :md="8" :lg="6" :xl="4" :span="4" v-for="template in item.templates" :key="template.id">
              <el-space @click="handlerStart(template.id)">
                <div>
                  <span>
                    <e-icon :icon-name="template.icon" class-name="icon" />
                  </span>
                </div>
                <div>
                  <span>
                    <h4>{{ template.name }}</h4>
                  </span>
                </div>
              </el-space>
            </el-col>
          </el-row>
        </el-card>
      </div>
    </div>
    <!-- 创建工单，模版展示 -->
    <Detail :template-id="templateId" :is-visible="isVisible" @close="onClosed" />
  </div>
</template>

<script lang="ts" setup>
import { pipelineGroupApi } from "@/api/template"
import { templateCombination } from "@/api/template/types/template"
import { onMounted, ref } from "vue"
import Detail from "./detail.vue"
const empty = ref<boolean>(false)

const templateId = ref<number>()
const isVisible = ref<boolean>(false)

/** 查询流程列表 */
const templateCombinations = ref<templateCombination[]>([])
const listTemplateCombinations = () => {
  pipelineGroupApi()
    .then(({ data }) => {
      templateCombinations.value = data.template_combinations
      if (templateCombinations.value.length === 0) {
        empty.value = true
      }
    })
    .catch(() => {
      templateCombinations.value = []
    })
    .finally(() => {})
}

const onClosed = () => {
  isVisible.value = false
  templateId.value = 0
}

onMounted(() => {
  listTemplateCombinations()
})

const handlerStart = (id: number) => {
  templateId.value = id
  isVisible.value = !isVisible.value
}
</script>

<style lang="scss" scoped>
.icon {
  font-size: 44px;
}

.el-space {
  transition: background-color 0.3s;
  padding: 10px;
  border: 1px solid transparent;
  cursor: pointer;
}
</style>
