<template>
  <div class="field-tab-header">
    <div class="search-field">
      <el-input
        v-model="searchInput"
        style="width: 240px"
        placeholder="字段信息"
        :suffix-icon="Search"
        class="search-input"
        @input="search"
      />
    </div>
    <div class="field-sort">
      <el-button text size="default" type="default" icon="Setting" @click="handleSortDrawer">表格排序设置</el-button>
    </div>
  </div>
  <div>
    <div v-for="group in AttributesData" :key="group.group_id" class="model-group">
      <div class="model-group-header">
        <div @click="toggleGroup(group)" class="group-header">
          <el-icon v-if="group.expanded"><ArrowRight /></el-icon>
          <el-icon v-else><ArrowDown /></el-icon>
          <h4>{{ group.group_name }}</h4>
        </div>
        <div class="model-button">
          <el-button text size="default" type="primary" icon="CirclePlus" @click="handleEditDrawer">添加字段</el-button>
        </div>
      </div>
      <div v-if="group.expanded">
        <div>
          <el-row :gutter="20">
            <el-col
              v-for="item in group.attributes"
              :key="item.id"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="4"
              :xl="3"
              style="margin-bottom: 4px"
              @mouseenter="showDetails(item)"
              @mouseleave="hideDetails()"
            >
              <el-card @click="detailInfo(item)">
                <div class="model-field-card">
                  <div class="field-content">
                    <p class="field-name">{{ item.field_name }}</p>
                    <p font-size="14px">{{ item.field_type }} {{ item.field_uid }}</p>
                  </div>
                  <!-- 判断鼠标移动到card，是否展示按钮 -->
                  <div v-if="showDetail && currentItem === item" class="btn-field-cell">
                    <el-button
                      text
                      size="default"
                      type="primary"
                      icon="edit"
                      @click.stop="handleEditDrawer(item)"
                      el-button
                    />
                    <el-button
                      text
                      size="default"
                      type="primary"
                      icon="delete"
                      @click.stop="deleteDialogVisible = true"
                      el-button
                    />
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
  </div>
  <!-- 删除 Visible -->
  <el-dialog v-model="deleteDialogVisible" align-center title="确定删除字段" width="500">
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="deleteDialogVisible = false">确定</el-button>
      </div>
    </template>
  </el-dialog>
  <!-- Card 抽屉 -->
  <el-drawer v-model="cardDrawer" title="字段详情">
    <el-descriptions :column="2">
      <el-descriptions-item label="唯一标识：">
        {{ currentItem?.field_uid }}
      </el-descriptions-item>
      <el-descriptions-item label="字段名称：">
        {{ currentItem?.field_name }}
      </el-descriptions-item>
      <el-descriptions-item label="字段类型：">
        {{ currentItem?.field_type }}
      </el-descriptions-item>
      <el-descriptions-item label="是否必填：">
        {{ currentItem?.required }}
      </el-descriptions-item>
    </el-descriptions>
    <div>
      <el-button size="default" type="primary" @click.stop="handlerAddAttribute()">修改</el-button>
      <el-button size="default" type="danger" @click.stop="deleteDialogVisible = true">删除</el-button>
    </div>
  </el-drawer>

  <!-- Edit、Create 抽屉 -->
  <el-drawer v-model="editDrawer" title="编辑字段">
    <el-form :model="formData" :rules="fieldRules" size="large" label-width="auto" ref="formRef">
      <el-form-item label="唯一标识" prop="field_uid">
        <el-input v-model="formData.field_uid" />
      </el-form-item>
      <el-form-item label="字段名称" prop="field_name">
        <el-input v-model="formData.field_name" />
      </el-form-item>
      <el-form-item label="字段类型" prop="field_type">
        <el-input v-model="formData.field_type" />
      </el-form-item>
      <el-form-item label="是否必填" prop="required">
        <el-switch v-model="formData.required" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handlerAddAttribute()"> 保存 </el-button>
        <el-button @click="resetForm()">取消</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>

  <!-- 表格排序设置 -->
  <el-drawer v-model="sortDrawer" class="sort-drawer flex" size="38%" title="表格排序设置">
    <div class="sort-card-container">
      <el-card class="sort-card">
        <VueDraggable
          v-model="leftList"
          dragClass="drag"
          :animation="animationDuration"
          group="cmdb"
          ghostClass="ghost"
          chosenClass="chosen"
          @start="onStart"
          @end="onEnd"
          itemKey="id"
          class="flex flex-col gap-4 p-0 rounded"
        >
          <div v-for="(item, index) in leftList" :key="item.id">
            <div class="sort-item">
              <div>
                <el-text truncated>{{ item.name }}</el-text>
              </div>
              <div>
                <el-icon @click="removeAndToRightList(index, item)"><Right /></el-icon>
              </div>
            </div>
          </div>
        </VueDraggable>
      </el-card>
      <el-card class="sort-card">
        <VueDraggable
          v-model="rightList"
          dragClass="drag"
          :animation="animationDuration"
          group="cmdb"
          ghostClass="ghost"
          chosenClass="chosen"
          handle=".handle"
          @start="onStart"
          @end="onEnd"
          itemKey="id"
          class="flex flex-col gap-4 p-0 rounded"
        >
          <div v-for="(item, index) in rightList" :key="item.id">
            <div class="sort-item">
              <div>
                <el-icon name="sort" class="handle cursor-move"><Grid /></el-icon>
                <el-text truncated class="sort-text">{{ item.name }}</el-text>
              </div>
              <div>
                <el-icon @click="removeAndToLeftList(index, item)"><Close /></el-icon>
              </div>
            </div>
          </div>
        </VueDraggable>
      </el-card>
    </div>

    <el-form :model="formData" :rules="fieldRules" size="large" label-width="auto" ref="formRef">
      <el-form-item class="text-right">
        <el-button type="primary" @click="handlerCustomAttributeFieldColumns()"> 保存 </el-button>
        <el-button @click="resetForm()">取消</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { Search } from "@element-plus/icons-vue"
import { listAttributesByModelUidApi, CreateAttributeApi, CustomAttributeFieldColumnsApi } from "@/api/attribute"
import {
  type AttributeGroup,
  type Attribute,
  type CreateAttributeRequestData,
  type CustomField,
  type CustomAttributeFieldColumnsReq
} from "@/api/attribute/types/attribute"
import { usePagination } from "@/hooks/usePagination"
import { type FormInstance, type FormRules, ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { VueDraggable } from "vue-draggable-plus"

const { paginationData } = usePagination()
const searchInput = ref("")
const cardDrawer = ref(false)
const editDrawer = ref(false)
const sortDrawer = ref(false)
const deleteDialogVisible = ref(false)
const loading = ref<boolean>(false)
const animationDuration = ref<number>(150)

// 接收父组建传递
interface Props {
  modelUid: string
}
const props = defineProps<Props>()

const DEFAULT_FORM_DATA: CreateAttributeRequestData = {
  model_uid: props.modelUid,
  field_uid: "",
  field_name: "",
  field_type: "",
  required: false
}
const dialogVisible = ref<boolean>(false)
const formData = ref<CreateAttributeRequestData>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const fieldRules: FormRules = {
  field_uid: [
    { required: true, message: "必须输入字段唯一标识", trigger: "blur" },
    { type: "string", pattern: /^[A-Za-z]+$/, message: "只能输入英文字母", trigger: "blur" }
  ],
  field_name: [{ required: true, message: "必须输入字段名称", trigger: "blur" }]
}

// 是否展开组、鼠标聚焦效果
const showDetail = ref(false)
const currentItem = ref<Attribute>()

const showDetails = (item: Attribute) => {
  currentItem.value = item
  showDetail.value = true
}

const detailInfo = (item: Attribute) => {
  currentItem.value = item
  cardDrawer.value = true
}

const hideDetails = () => {
  showDetail.value = false
}

//** 新增字段信息 */
const handlerAddAttribute = () => {
  formRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)
    CreateAttributeApi(formData.value)
      .then(() => {
        ElMessage.success("操作成功")
        dialogVisible.value = false
        editDrawer.value = false
        getAttributesData()
      })
      .finally(() => {
        loading.value = false
      })
  })
}

//** 获取字段信息 */
const AttributesData = ref<AttributeGroup[]>([])

// ** 获取数据 */
function getAttributesData() {
  loading.value = true
  listAttributesByModelUidApi(props.modelUid)
    .then(({ data }) => {
      AttributesData.value = data.data.ags
    })
    .catch(() => {
      AttributesData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], getAttributesData, {
  immediate: true
})

function handleEditDrawer(model: any) {
  editDrawer.value = true
  console.log(model)
}

const resetForm = () => {
  editDrawer.value = false
}

function search() {
  // 调用搜索接口
  console.log("搜索:", searchInput.value)
}

function toggleGroup(group: any) {
  group.expanded = !group.expanded
}

//** 获取自定义列表信息 */
const leftList = ref<CustomField[]>([])
const rightList = ref<CustomField[]>([])

const handleSortDrawer = () => {
  sortDrawer.value = true
  const attributesData = AttributesData.value
  // resetLeftAndRightList()
  if (rightList.value.length != 0 || leftList.value.length != 0) {
    return
  }

  // 预先检查是否所有的属性都是显示的，如果是，则只需要处理一次
  if (attributesData.every((item) => item.attributes.every((attr) => attr.display === true))) {
    attributesData[0].attributes.forEach((attr) => {
      rightList.value.push({ name: attr.field_name, index: attr.index || 0, id: attr.id })
    })
  } else {
    attributesData.forEach((item) => {
      item.attributes.forEach((attr) => {
        const list = attr.display ? rightList : leftList
        list.value.push({ name: attr.field_name, id: attr.id, index: attr.index || 0 })
      })
    })
  }

  rightList.value.sort((a, b) => a.index - b.index)
}

const handlerCustomAttributeFieldColumns = () => {
  loading.value = true
  const req: CustomAttributeFieldColumnsReq = {
    model_uid: props.modelUid,
    custom_field_name: rightList.value.map((item) => item.name)
  }

  CustomAttributeFieldColumnsApi(req)
    .then(({ data }) => {
      console.log("data", data)
      sortDrawer.value = false
    })
    .catch(() => {})
    .finally(() => {
      loading.value = false
    })
}

function removeAndToLeftList(index: number, item: any) {
  leftList.value.push(item)
  rightList.value.splice(index, 1)
}

function removeAndToRightList(index: number, item: any) {
  leftList.value.splice(index, 1)
  rightList.value.push(item)
}

const drag = ref(false)
const onStart = () => {
  drag.value = true
}

const onEnd = () => {
  drag.value = false
}
</script>

<style lang="scss">
.field-tab-header {
  display: flex;
  justify-content: space-between;
}
p {
  margin: 0;
}

.model-field-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.model-field-card:hover {
  box-shadow: 0 1px 6px rgba(255, 255, 255, 0.932);
  border-color: #eee;
  transition: all 0.2s ease-in-out;
}

.btn-field-cell {
  width: 35px;
  height: 35px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: flex-end;
}

.field-name {
  font-weight: bold;
  font-size: 16px;
  padding-bottom: 5px;
}

.model-group-header {
  display: flex;
  align-items: center;
}

.group-header {
  display: flex;
  align-items: center;
  h4 {
    margin: 10px;
    margin-left: 10px;
  }
}

.sort-card-container {
  display: flex;
  width: 100%;
  height: 95%;
  padding-bottom: 20px;
}

.sort-drawer {
  .el-drawer__body {
    padding: 0px;
    display: flex; /* 使用 Flexbox 布局 */
    justify-content: flex-end;
    flex-direction: column; /* 子元素垂直排列 */
    height: 100%; /* 确保填充整个抽屉高度 */
  }
}

.sort-card {
  flex: 1;
  overflow-y: auto;
}

.sort-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
  border-radius: 0.25rem;
  .sort-text {
    padding-left: 8px;
  }
}
.text-right {
  padding-left: 15px;
}
</style>
