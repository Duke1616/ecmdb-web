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
              <el-space @click="handleDetail(template.id)">
                <span>
                  <e-icon :icon-name="template.icon" class-name="icon" />
                </span>
                <span>
                  <h4>{{ template.name }}</h4>
                </span>
              </el-space>
            </el-col>
          </el-row>
        </el-card>
      </div>
    </div>
    <!-- 创建工单，模版展示 -->
    <el-dialog v-model="dialogVisible" :title="'新建工单'" @closed="onClosed" width="35%">
      <FormCreate v-if="dialogVisible" :rule="rule" :option="options" v-model="data" v-model:api="fApi" />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { pipelineGroupApi } from "@/api/template"
import { templateCombination } from "@/api/template/types/template"
import { onMounted, ref } from "vue"

import { detailTemplateApi } from "@/api/template"
import { Api, FormRule, Options } from "@form-create/element-ui"
import formCreate from "@form-create/element-ui"

// 获取 FormCreate 组件, 最新版本
const FormCreate = formCreate.$form()

import { ElMessage } from "element-plus"
import { createOrderApi } from "@/api/order"
import { createOrderReq } from "@/api/order/types/order"
import { cloneDeep } from "lodash-es"

const dialogVisible = ref<boolean>(false)
const empty = ref<boolean>(false)

const fApi = ref<Api>()
const rule = ref<FormRule[]>()
const options = ref<Options>()
const data = ref<any>()

const handleDetail = async (id: number) => {
  try {
    const res = await detailTemplateApi(id)

    // 设置表单配置和规则
    options.value = {
      ...formCreate.parseJson(res.data.options)
    } as Options

    options.value.onSubmit = handleSubmit(res.data)
    rule.value = formCreate.parseJson(res.data.rules)

    // 打开对话框时，确保 options 和 rule 数据已准备好
    dialogVisible.value = true
  } catch (error) {
    console.log("Error fetching details:", error)
  }
}

const DEFAULT_FORM_DATA: createOrderReq = {
  workflow_id: 0,
  template_id: 0,
  template_name: "",
  data: {}
}
const formData = ref<createOrderReq>(cloneDeep(DEFAULT_FORM_DATA))

const handleSubmit = (resData: any) => {
  return () => {
    // 封装提交数据的逻辑
    formData.value = {
      data: data.value,
      template_name: resData.name,
      template_id: resData.id,
      workflow_id: resData.workflow_id
    }

    createOrderApi(formData.value)
      .then(() => {
        onClosed()
        ElMessage.success("保存成功")
      })
      .catch((error) => {
        console.log("catch", error)
      })
  }
}

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
  reset()
}

const reset = () => {
  rule.value = []
  options.value = {}
  data.value = {}
}

onMounted(() => {
  listTemplateCombinations()
})
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
