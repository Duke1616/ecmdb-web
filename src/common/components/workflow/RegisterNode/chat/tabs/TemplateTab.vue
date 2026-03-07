<template>
  <div class="template-form-box">
    <el-form label-position="top">
      <el-form-item label="通过工单模板解析人员">
        <el-select
          v-model="templateConfig.id"
          placeholder="选择关联流程"
          filterable
          @change="templateConfig.field = ''"
        >
          <el-option v-for="t in templateRules" :key="t.id" :label="t.name" :value="t.id.toString()" />
        </el-select>
      </el-form-item>
      <el-form-item label="对应的人员变量字段" v-if="templateConfig.id">
        <el-select v-model="templateConfig.field" placeholder="选择存储人员的字段">
          <el-option
            v-for="[title, field] in Array.from(getTemplateFieldOptions(Number(templateConfig.id)))"
            :key="field"
            :label="title"
            :value="field"
          />
        </el-select>
      </el-form-item>
      <el-button type="primary" style="width: 100%" :disabled="!templateConfig.field" @click="addTemplateRule"
        >添加至策略列表</el-button
      >
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue"

interface Props {
  templateRules: any[]
  getTemplateFieldOptions: (id: number) => Map<string, string>
}

withDefaults(defineProps<Props>(), {
  templateRules: () => [],
  getTemplateFieldOptions: () => new Map()
})

const emits = defineEmits<{
  (e: "add", values: [string, string]): void
}>()

const templateConfig = reactive({ id: "", field: "" })

const addTemplateRule = () => {
  emits("add", [templateConfig.id, templateConfig.field])
}
</script>

<style lang="scss" scoped>
.template-form-box {
  max-width: 380px;
  margin: 0 auto;
  padding-top: 20px;
}
</style>
