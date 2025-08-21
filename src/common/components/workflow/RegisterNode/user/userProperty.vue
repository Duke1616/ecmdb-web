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
      <el-form-item label="审批规则" prop="rule">
        <el-select v-model="propertyForm.rule" clearable @change="handleChange">
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <!-- TODO: 查询使用模版的字段，进行options选择， 暂时主动录入 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item v-if="propertyForm.rule === 'template'" label="模版名称" prop="leftValue">
            <el-select v-model="propertyForm.template_id" placeholder="请选择模版" class="select-box">
              <el-option v-for="item in templateRules" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item v-if="propertyForm.rule === 'template'" label="模版字段" prop="leftValue">
            <el-select
              v-model="propertyForm.template_field"
              :disabled="!propertyForm.template_id"
              placeholder="请选择模版字段"
              class="input-box"
            >
              <el-option
                v-for="[title, field] in Array.from(getTemplateFieldOptions(propertyForm.template_id))"
                :key="field"
                :label="title"
                :value="field"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item
        v-if="['leaders', 'main_leader', 'appoint'].includes(propertyForm.rule)"
        label="参与者"
        prop="approved"
      >
        <template #label>
          <span>{{ getLabel(propertyForm.rule) }}</span>
        </template>
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
            <!-- 使用 v-slot 自定义选项内容 -->
            <el-option v-for="item in approvedOptions" :key="item.name" :label="item.display_name" :value="item.name" />
          </el-select>
          <el-button class="select-button" :icon="UserFilled" @click="openUser" />
        </div>
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="是否会签" prop="type">
            <el-switch v-model="propertyForm.is_cosigned" size="default" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="仅抄送" prop="cc">
            <el-switch v-model="propertyForm.is_cc" size="default" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div class="mt15" v-if="flowDetail.status != '2'">
      <el-button @click="cancelFunc"> 取消 </el-button>
      <el-button type="primary" @click="confirmFunc"> 确定 </el-button>
    </div>
    <el-dialog v-model="approvalVisible" title="审批人员" width="25%">
      <div class="input-tree-container">
        <el-input
          v-model="filterInput"
          size="default"
          placeholder="输入用户名或展示名称进行搜索"
          :suffix-icon="Search"
        />
        <el-tree
          ref="treeRef"
          :data="treeData"
          show-checkbox
          check-strictly
          default-expand-all
          node-key="id"
          :highlight-current="true"
          :default-checked-keys="checkedKeys"
          :props="defaultProps"
          :filter-node-method="filterNode"
        />
      </div>
      <template #footer>
        <el-button @click="approvalVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAppendUser">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { FormInstance, FormRules, ElTree } from "element-plus"
import { ref, onMounted, reactive, watch } from "vue"
import { UserFilled } from "@element-plus/icons-vue"
import { userDepartmentCombination } from "@/api/user/types/user"
import { findByUsernamesApi, pipelineUserByDepartmentApi } from "@/api/user"
import { Search } from "@element-plus/icons-vue"

import { useTemplateRules } from "@/hooks/useTemplateRules"
// 使用模板 Hook
const { templateRules, getTemplateFieldOptions, fetchTemplates } = useTemplateRules()

// 在需要获取模板的地方调用 fetchTemplates
const handleChange = async () => {
  if (propertyForm.rule !== "template") return
  if (props.id === undefined) return

  await fetchTemplates(props.id)
}

const filterInput = ref<string>("")

interface Tree {
  [key: string]: any
}

const filterNode = (value: string, data: Tree) => {
  if (!value) return true

  // 确保data.label存在且是字符串
  return (typeof data.display_name === "string" && data.display_name.includes(value)) || data.name.includes(value)
}

const treeRef = ref<InstanceType<typeof ElTree>>()
const defaultProps = {
  key: "id",
  children: "children",
  label: "display_name",
  disabled: "disabled"
}

const options = [
  {
    label: "指定内部人员",
    value: "appoint"
  },
  {
    label: "所属部门领导【允许多人】",
    value: "leaders"
  },
  {
    label: "所属分管领导【仅有一人】",
    value: "main_leader"
  },
  {
    label: "工单提交人",
    value: "founder"
  },
  {
    label: "模版字段提取",
    value: "template"
  }
]

const getLabel = (rule: string) => {
  switch (rule) {
    case "leaders":
      return "部门领导（保底机制）"
    case "main_leader":
      return "分管领导（保底机制）"
    case "appoint":
      return "参与者"
    default:
      return ""
  }
}

/** 查询模版列表 */
const treeData = ref<userDepartmentCombination[]>([])
const listDepartmentTreeData = () => {
  pipelineUserByDepartmentApi()
    .then(({ data }) => {
      treeData.value = data
    })
    .catch(() => {
      treeData.value = []
    })
    .finally(() => {})
}

const props = defineProps({
  nodeData: Object,
  lf: Object || String,
  id: Number,
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
  template_field: "",
  template_id: 0,
  rule: "appoint",
  is_cosigned: false,
  is_cc: false
})

interface ParticipantOption {
  display_name: string
  name: string
}
const approvedOptions = ref<ParticipantOption[]>([])
const checkedKeys = ref<number[]>([])
const getUsernamesData = (uns: string[]) => {
  findByUsernamesApi(uns)
    .then(({ data }) => {
      approvedOptions.value = data.users.map((node) => ({
        display_name: node.display_name,
        name: node.username
      }))
      checkedKeys.value = data.users.map((node) => node.id)
    })
    .catch(() => {
      approvedOptions.value = []
    })
    .finally(() => {})
}

const openUser = () => {
  approvalVisible.value = !approvalVisible.value
  listDepartmentTreeData()
}

const handleAppendUser = () => {
  if (treeRef.value) {
    const nodes = treeRef.value.getCheckedNodes()
    console.log(nodes)
    // 填充数据
    propertyForm.approved = nodes.map((node) => node.name)
    // 填充默认值
    checkedKeys.value = nodes.map((node) => node.id)
    // 填充选项
    approvedOptions.value = nodes.map((node) => ({
      display_name: node.display_name,
      name: node.name
    }))
  }

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
    template_id: propertyForm.template_id,
    template_field: propertyForm.template_field,
    rule: propertyForm.rule,
    is_cosigned: propertyForm.is_cosigned,
    is_cc: propertyForm.is_cc
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

watch(filterInput, (val: string) => {
  treeRef.value!.filter(val)
})

onMounted(async () => {
  propertyForm.name = props.nodeData?.properties.name || ""
  propertyForm.is_cosigned = props.nodeData?.properties.is_cosigned ? props.nodeData.properties.is_cosigned : false
  propertyForm.approved = Array.isArray(props.nodeData?.properties.approved) ? props.nodeData.properties.approved : []
  propertyForm.template_field = props.nodeData?.properties.template_field || ""
  propertyForm.template_id = props.nodeData?.properties.template_id || ""
  propertyForm.rule = props.nodeData?.properties.rule || "appoint"
  propertyForm.is_cc = props.nodeData?.properties.is_cc ? props.nodeData.properties.is_cc : false
  // 如果存在审批用户则获取
  if (props.nodeData?.properties.approved.length > 0) {
    getUsernamesData(props.nodeData?.properties.approved)
  }

  // 如果执行方式是模板，加载模板数据
  if (propertyForm.rule === "template" && propertyForm.template_id) {
    if (props.id !== undefined) {
      fetchTemplates(props.id).then(() => {
        getTemplateFieldOptions(propertyForm.template_id)
      })
    }
  }
})
</script>
<style lang="scss" scoped>
.select-container {
  display: flex;
  justify-items: center;
  align-items: center;
  width: 100%;
}
.input-tree-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
