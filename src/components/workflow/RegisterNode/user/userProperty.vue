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
      <el-form-item label="审批人" prop="type">
        <el-select v-model="propertyForm.type" clearable>
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="propertyForm.type === 'appoint'" label="参与者" prop="approved">
        <div class="select-container">
          <el-select
            v-model="propertyForm.approved"
            multiple
            placeholder=""
            :show-arrow="false"
            suffix-icon=""
            tag-type="info"
            :disabled="approvalInputDisabled"
          >
            <!-- 选项内容 -->
          </el-select>
          <el-button class="select-button" :icon="UserFilled" @click="openUser" />
        </div>
      </el-form-item>
    </el-form>
    <div class="mt15" v-if="flowDetail.status != '2'">
      <el-button @click="cancelFunc"> 取消 </el-button>
      <el-button type="primary" @click="confirmFunc"> 确定 </el-button>
    </div>
    <el-dialog v-model="approvalVisible" title="审批人员" width="25%">
      <el-tree
        ref="treeRef"
        :data="data"
        show-checkbox
        highlight-current
        check-strictly
        default-expand-all
        node-key="id"
        :props="defaultProps"
      />
      <template #footer>
        <el-button @click="approvalVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAppendUser">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { FormInstance, FormRules, ElTree } from "element-plus"
import { ref, onMounted, reactive } from "vue"
import { UserFilled } from "@element-plus/icons-vue"
// import type Node from "element-plus/es/components/tree/src/model/node"

const treeRef = ref<InstanceType<typeof ElTree>>()
const defaultProps = {
  children: "children",
  label: "label",
  disabled: "disabled"
}

const options = [
  {
    label: "指定人员",
    value: "appoint"
  },
  {
    label: "所属部门领导",
    value: "automatic"
  }
]

const data = [
  {
    id: 1,
    label: "市场组",
    disabled: true,
    children: [
      {
        id: 4,
        label: "华北区",
        disabled: true,
        children: [
          {
            id: 9,
            label: "张三"
          },
          {
            id: 10,
            label: "赵四"
          }
        ]
      }
    ]
  },
  {
    id: 2,
    label: "产品组",
    disabled: true,
    children: [
      {
        id: 5,
        label: "王五"
      },
      {
        id: 6,
        label: "老六"
      }
    ]
  },
  {
    id: 3,
    label: "研发组",
    disabled: true,
    children: [
      {
        id: 7,
        label: "孙七"
      },
      {
        id: 8,
        label: "周八皮"
      }
    ]
  }
]

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

const approvalInputDisabled = ref(true)
const approvalVisible = ref(false)
const emits = defineEmits(["closed"])
const propertyForm = reactive({
  name: "",
  approved: ref<string[]>(),
  type: "appoint"
})

const openUser = () => {
  approvalVisible.value = !approvalVisible.value
}

const handleAppendUser = () => {
  if (treeRef.value) {
    const nodes = treeRef.value.getCheckedNodes()
    console.log(nodes)
    propertyForm.approved = nodes.map((node) => node.label)
  }

  console.log(propertyForm.approved)
  approvalVisible.value = !approvalVisible.value
}

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
    approved: propertyForm.approved,
    type: propertyForm.type
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

//取消
const cancelFunc = () => {
  emits("closed")
}

onMounted(() => {
  propertyForm.name = props.nodeData?.properties.name
  propertyForm.approved = props.nodeData?.properties.approved ? props.nodeData.properties.approved : ""
})
</script>
<style lang="scss" scoped>
.select-container {
  display: flex;
  justify-items: center;
  align-items: center;
  width: 100%;
}
</style>
