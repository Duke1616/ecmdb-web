<template>
  <div class="field-tab-header">
    <div class="search-field">
      <el-button
        type="primary"
        size="default"
        style="margin-right: 8px"
        :icon="CirclePlus"
        @click="dialogAttrGroupVisible = true"
        >新增分组</el-button
      >
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
    <div v-for="group in filterData" :key="group.group_id" class="model-group">
      <div class="model-group-header">
        <div @click="toggleGroup(group)" class="group-header">
          <el-icon v-if="group.expanded"><ArrowRight /></el-icon>
          <el-icon v-else><ArrowDown /></el-icon>
          <h4>{{ group.group_name }}</h4>
        </div>
        <div class="model-button">
          <el-button text size="default" type="primary" icon="CirclePlus" @click="handleAddAttr(group.group_id)"
            >添加字段</el-button
          >
        </div>
      </div>
      <div v-if="group.expanded">
        <div>
          <el-row :gutter="20">
            <el-col
              v-for="item in group.attributes"
              :key="item.id"
              :xs="8"
              :sm="6"
              :md="6"
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
                      @click.stop="handleUpdateAttr(group.group_id, item)"
                      el-button
                    />
                    <el-button
                      text
                      size="default"
                      type="primary"
                      icon="delete"
                      @click.stop="deleteDialogVisible = true"
                      @click="handleDelete(item)"
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

  <!-- 新增属性分组 -->
  <el-dialog v-model="dialogAttrGroupVisible" title="新增分组" @closed="resetAttrGroupFrom" width="30%">
    <el-form ref="attrGroupRef" :model="AttrGroup" :rules="attrGroupRules" label-width="100px" label-position="left">
      <el-form-item prop="group_name" label="组名称">
        <el-input v-model="AttrGroup.group_name" placeholder="请输入" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="addDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handlerAddAttributeGroup" :loading="loading">确认</el-button>
    </template>
  </el-dialog>

  <!-- 添加字段属性 -->
  <el-drawer v-model="attrFieldVisible" title="添加属性" @closed="onClosed" size="30%">
    <createOrUpdateField
      ref="apiFieldRef"
      :model-uid="props.modelUid"
      :group-id="groupId"
      @close="onClosed"
      @getAttributesData="getAttributesData"
    />
  </el-drawer>

  <!-- 表格排序设置 -->
  <sortField
    :model-uid="props.modelUid"
    :sort-drawer-visibe="sortDrawerVisibe"
    :attributes-data="AttributesData"
    @close="sortClose"
    @attributes-updated="getAttributesData"
  />
</template>

<script lang="ts" setup>
import { h, nextTick, ref, watch } from "vue"
import { Search, CirclePlus } from "@element-plus/icons-vue"
import { listAttributesByModelUidApi, DeleteAttributeApi, createAttributeGroupApi } from "@/api/attribute"
import { type AttributeGroup, type Attribute, CreateAttributeGroupReq } from "@/api/attribute/types/attribute"
import { usePagination } from "@/hooks/usePagination"
import { type FormInstance, type FormRules, ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import createOrUpdateField from "./createOrUpdateField.vue"
import sortField from "./sort-field.vue"

const { paginationData } = usePagination()
const searchInput = ref("")
const cardDrawer = ref(false)

const deleteDialogVisible = ref(false)
const addDialogVisible = ref(false)
const loading = ref<boolean>(false)

// 接收父组建传递
interface Props {
  modelUid: string
}
const props = defineProps<Props>()

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

//** 获取字段信息 */
const AttributesData = ref<AttributeGroup[]>([])
function getAttributesData() {
  loading.value = true
  listAttributesByModelUidApi(props.modelUid)
    .then(({ data }) => {
      AttributesData.value = data.attribute_groups
      filterData.value = data.attribute_groups
    })
    .catch(() => {
      AttributesData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

//** 添加 OR 修改字段属性 */
const groupId = ref<number>()
const apiFieldRef = ref<InstanceType<typeof createOrUpdateField>>()
const attrFieldVisible = ref<boolean>(false)

function handleAddAttr(group_id: number) {
  attrFieldVisible.value = true
  groupId.value = group_id
}

function handleUpdateAttr(group_id: number, row: Attribute) {
  attrFieldVisible.value = true
  row.group_id = group_id

  nextTick(() => {
    apiFieldRef.value?.setFrom(row)
  })
}

const onClosed = (val: boolean) => {
  attrFieldVisible.value = val
}

//** 组展开 */
function toggleGroup(group: any) {
  group.expanded = !group.expanded
}

//** 前端动态表单排序 */
const sortDrawerVisibe = ref<boolean>(false)
const handleSortDrawer = () => {
  sortDrawerVisibe.value = true
}

const sortClose = (val: boolean) => {
  sortDrawerVisibe.value = val
}

//** 前端过滤展示 */
const filterData = ref<AttributeGroup[]>([])
const search = () => {
  filterData.value = AttributesData.value
  // 如果搜索关键词为空，不执行过滤
  if (!searchInput.value.trim()) {
    return
  }

  const foundAttrs: AttributeGroup[] = []
  AttributesData.value.forEach((group) => {
    if (Array.isArray(group.attributes)) {
      const matchingAttrs = group.attributes.filter(
        (attr) =>
          attr.field_uid.toLowerCase().includes(searchInput.value.trim().toLowerCase()) ||
          attr.field_name.toLowerCase().includes(searchInput.value.trim().toLowerCase())
      )
      if (matchingAttrs.length > 0) {
        foundAttrs.push({
          group_id: group.group_id,
          group_name: group.group_name,
          attributes: matchingAttrs,
          expanded: true,
          index: 0,
          total: 0
        })
      }
    }
  })

  filterData.value = foundAttrs
}

const handleDelete = (row: Attribute) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除字段: "),
      h("i", { style: "color: red" }, `${row.field_name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    DeleteAttributeApi(row.id).then(() => {
      ElMessage.success("删除成功")
      getAttributesData()
    })
  })
}

const DEFAULT_ATTR_GROUP_DATA: CreateAttributeGroupReq = {
  model_uid: props.modelUid,
  group_name: ""
}
const dialogAttrGroupVisible = ref<boolean>(false)
const AttrGroup = ref<CreateAttributeGroupReq>(cloneDeep(DEFAULT_ATTR_GROUP_DATA))
const attrGroupRef = ref<FormInstance | null>(null)
const attrGroupRules: FormRules = {
  group_name: [{ required: true, message: "必须输入分组名称", trigger: "blur" }]
}

const resetAttrGroupFrom = () => {
  attrGroupRef.value?.clearValidate()
  AttrGroup.value = cloneDeep(DEFAULT_ATTR_GROUP_DATA)
}

const handlerAddAttributeGroup = () => {
  attrGroupRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)
    createAttributeGroupApi(AttrGroup.value)
      .then(() => {
        ElMessage.success("操作成功")
        dialogAttrGroupVisible.value = false
        getAttributesData()
      })
      .finally(() => {
        loading.value = false
      })
  })
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], getAttributesData, {
  immediate: true
})
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
</style>
