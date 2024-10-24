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
    <el-dialog v-model="dialogVisible" :title="'新建工单'" @closed="onClosed" width="35%">
      <Detail ref="detailRef" @closed="onClosed" />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { pipelineGroupApi } from "@/api/template"
import { templateCombination } from "@/api/template/types/template"
import { onMounted, ref, nextTick } from "vue"
import Detail from "./detail.vue"

const detailRef = ref<InstanceType<typeof Detail>>()
const dialogVisible = ref<boolean>(false)

const empty = ref<boolean>(false)
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
  dialogVisible.value = false
  detailRef.value?.resetForm()
}

onMounted(() => {
  listTemplateCombinations()
})

const handlerStart = (id: number) => {
  dialogVisible.value = true
  nextTick(() => {
    detailRef.value?.handleDetail(id)
  })
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
