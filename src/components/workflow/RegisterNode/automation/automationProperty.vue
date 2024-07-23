<template>
  <div>
    <el-form
      ref="formRef"
      :model="propertyForm"
      :inline-message="true"
      :rules="formRules"
      label-position="top"
      :disabled="flowDetail.status == '2'"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="propertyForm.name" clearable />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="代码模版" prop="codebook_uid">
            <el-select
              v-model="propertyForm.codebook_uid"
              filterable
              placeholder="请选择代码模版"
              @change="handlerChangeCodebook()"
            >
              <el-option
                v-for="item in runnerTagsData"
                :key="item.codebook_uid"
                :label="item.codebook_uid"
                :value="item.codebook_uid"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="标签" prop="tag">
            <el-select
              v-model="propertyForm.tag"
              filterable
              placeholder="选择代码模版后可编辑"
              :disabled="!propertyForm.codebook_uid"
            >
              <el-option v-for="(tag, index) in tags" :key="index" :label="tag" :value="tag" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div class="mt15" v-if="flowDetail.status != '2'">
      <el-button @click="cancelFunc"> 取消 </el-button>
      <el-button type="primary" @click="confirmFunc"> 确定 </el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { listRunnerTagsApi } from "@/api/runner"
import { runnerTags } from "@/api/runner/types/runner"
import { FormInstance, FormRules } from "element-plus"
import { ref, onMounted, reactive } from "vue"

const props = defineProps({
  nodeData: Object,
  lf: Object || String,
  //详情
  flowDetail: {
    type: Object,
    default: () => {
      return {}
    }
  }
})

const emits = defineEmits(["closed"])
const propertyForm = reactive({
  name: "",
  codebook_uid: "",
  tag: ""
})

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [
    { required: true, message: "名称不能为空" },
    {
      max: 50,
      message: "最大50字符"
    }
  ]
}

//更新节点属性
const setProperties = () => {
  props.lf?.setProperties(props.nodeData?.id, {
    name: propertyForm.name,
    codebook_uid: propertyForm.codebook_uid,
    tag: propertyForm.tag
  })
}

//确定
const confirmFunc = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      setProperties()
      props.lf?.updateText(props.nodeData?.id, propertyForm.name)
      emits("closed")
    }
  })
}
const runnerTagsData = ref<runnerTags[]>([])
const tags = ref<string[]>([])
const handlerChangeCodebook = () => {
  console.log(propertyForm.codebook_uid)
  runnerTagsData.value.forEach((item) => {
    if (item.codebook_uid == propertyForm.codebook_uid) {
      const uniqueTags = new Set(item.tags)
      tags.value = Array.from(uniqueTags)
    }
  })
}
const listRunnerTags = () => {
  listRunnerTagsApi()
    .then((res) => {
      runnerTagsData.value = res.data.runner_tags
    })
    .catch((error) => {
      console.log(error)
    })
}

//取消
const cancelFunc = () => {
  emits("closed")
}

onMounted(() => {
  listRunnerTags()
  propertyForm.name = props.nodeData?.properties.name
  propertyForm.codebook_uid = props.nodeData?.properties.codebook_uid
  propertyForm.tag = props.nodeData?.properties.tag
})
</script>
<style scoped></style>
