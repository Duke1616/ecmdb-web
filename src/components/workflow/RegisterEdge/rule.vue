<template>
  <el-form :model="formData" ref="formRef" label-width="80px" :rules="rules">
    <!-- 左值 -->
    <el-form-item label="左值：" prop="leftValue">
      <div class="form-row">
        <el-select
          v-model="formData.leftValue"
          placeholder="请选择模版"
          class="select-box"
          @change="handleChangeLeftValue"
        >
          <el-option v-for="(item, index) in props.templates" :key="index" :label="item.name" :value="item.name" />
        </el-select>

        <el-select
          v-model="formData.leftValueData"
          :disabled="!formData.leftValue"
          placeholder="请选择具体值"
          class="input-box"
        >
          <el-option
            v-for="[title, field] in Array.from(getOptionsForLeftValue())"
            :key="field"
            :label="title"
            :value="field"
          />
        </el-select>
      </div>
    </el-form-item>

    <!-- 运算符 -->
    <el-form-item label="运算符：" prop="operator">
      <el-select v-model="formData.operator" placeholder="请选择运算符">
        <el-option label="等于" value="=" />
        <el-option label="不等于" value="!=" />
        <el-option label="大于" value=">" />
        <el-option label="小于" value="<" />
        <el-option label="包含" value="in" />
        <el-option label="不包含" value="not in" />
      </el-select>
    </el-form-item>

    <!-- 右值, 根据运算符自动计算处理是列表还是字符串 -->
    <el-form-item label="右值：" prop="rightValue">
      <div class="form-row">
        <el-select
          v-model="formData.rightValue"
          disabled
          placeholder="请选择右值"
          class="select-box"
          @change="onRightValueChange"
        >
          <el-option label="预留字段" value="reserve" />
        </el-select>

        <!-- 动态切换 el-select 和 el-input -->
        <template v-if="isFieldInMap">
          <el-select v-model="formData.rightValueData" :multiple="isMultiple" class="input-box">
            <el-option
              v-for="item in selectOptionsMap.get(formData.leftValueData) || []"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>
        <template v-else>
          <el-input v-model="rightValueDataComputed" class="input-box" />
        </template>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue"
import { FormInstance } from "element-plus"
import { template } from "@/api/template/types/template"
import { Rule } from "@form-create/element-ui"

interface Props {
  templates: template[]
}

const props = defineProps<Props>()
const formRef = ref<FormInstance | null>(null)

const templatesMap = computed(() => {
  const map = new Map<string, template>()
  props.templates.forEach((template) => {
    map.set(template.name, template)
  })
  return map
})

const handleChangeLeftValue = () => {
  formData.rightValueData = ""
  formData.leftValueData = ""
}

const selectOptionsMap = new Map<string, any>()
const f = (template: template) => {
  const map = new Map<string, string>()

  // 每次变更都先清空列表字段数据
  selectOptionsMap.clear()

  template.rules.forEach((rule: Rule) => {
    if (typeof rule.title === "string" && typeof rule.field === "string") {
      map.set(rule.title, rule.field)

      if (rule.options !== undefined) {
        selectOptionsMap.set(rule.field, rule.options)
      }
    } else {
      console.warn("Invalid rule detected:", rule)
    }
  })
  return map
}

// 计算属性：判断当前 field 是否在 selectOptionsMap 中
const isFieldInMap = computed(() => {
  return formData.leftValueData && selectOptionsMap.has(formData.leftValueData)
})

const getOptionsForLeftValue = () => {
  const t = templatesMap.value.get(formData.leftValue)
  console.log(t)
  if (!t) {
    return new Map<string, string>()
  }
  return f(t)
}

const formData = reactive({
  leftValue: "",
  leftValueData: "",
  operator: "",
  rightValue: "reserve",
  rightValueData: [] as string[] | string
})

// 表单校验规则
const rules = {
  leftValue: [{ required: true, message: "请选择左值", trigger: "change" }],
  operator: [{ required: true, message: "请选择运算符", trigger: "change" }],
  rightValue: [{ required: true, message: "请选择右值", trigger: "change" }]
}

const isMultiple = computed(() => {
  return formData.operator === "in" || formData.operator === "not in"
})

const rightValueDataComputed = computed({
  get: () => {
    return Array.isArray(formData.rightValueData) ? formData.rightValueData.join(",") : formData.rightValueData
  },
  set: (val: string) => {
    formData.rightValueData = isMultiple.value ? val.split(",") : val
  }
})

// 选择右值时
const onRightValueChange = () => {
  if (isMultiple.value) {
    // 如果是多选，但 rightValueData 不是数组，则重置为数组
    if (!Array.isArray(formData.rightValueData)) {
      formData.rightValueData = []
    }
  } else {
    // 如果切换为单选，直接重置为字符串类型
    formData.rightValueData = ""
  }
}
const getForm = () => {
  return formData
}

defineExpose({
  getForm
})

watch([() => formData.operator, () => formData.leftValueData], () => {
  if (isFieldInMap.value) {
    formData.rightValueData = isMultiple.value ? [] : ""
  } else {
    formData.rightValueData = ""
  }
})
</script>
<style scoped>
/* 调整了行内布局，使其更加紧凑美观 */
.form-row {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

/* 优化输入框和下拉框宽度统一 */
.select-box {
  flex: 1;
}

.input-box {
  flex: 2;
}

/* 让运算符下拉框宽度自适应 */
.full-width {
  width: 100%;
}

/* 禁用输入框的背景色 */
.el-input[disabled] {
  background-color: #f5f7fa;
  color: #c0c4cc;
}
</style>
