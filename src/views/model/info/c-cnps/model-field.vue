<template>
  <div class="field-management">
    <!-- 移除外层容器的padding，让它与model-detail-page保持一致 -->
    <div class="field-header">
      <div class="header-left">
        <el-button type="primary" size="default" :icon="CirclePlus" @click="dialogAttrGroupVisible = true">
          新增分组
        </el-button>
        <el-input
          v-model="searchInput"
          placeholder="搜索字段..."
          :suffix-icon="Search"
          style="width: 240px"
          clearable
        />
      </div>
      <div class="header-right">
        <el-button :icon="allExpanded ? Expand : ArrowUp" @click="toggleAllGroups" size="default">
          {{ allExpanded ? "全部收起" : "全部展开" }}
        </el-button>
        <el-button :icon="Setting" @click="handleSortDrawer" size="default"> 排序设置 </el-button>
      </div>
    </div>

    <div class="groups-container">
      <div v-for="group in filterData" :key="group.group_id" class="group-card">
        <div class="group-header" @click="toggleGroup(group)">
          <div class="group-info">
            <el-icon class="toggle-icon" :class="{ expanded: group.expanded }">
              <ArrowRight />
            </el-icon>
            <h3 class="group-title">{{ group.group_name }}</h3>
            <el-tag size="small" type="info">{{ group.attributes?.length || 0 }}</el-tag>
          </div>
          <el-button type="primary" link :icon="CirclePlus" @click.stop="handleAddAttr(group.group_id)">
            添加字段
          </el-button>
        </div>

        <div v-if="group.expanded" class="fields-container">
          <div class="fields-grid">
            <div v-for="item in group.attributes" :key="item.id" class="field-item" @click="detailInfo(item)">
              <div class="field-content">
                <div class="field-header-info">
                  <h4 class="field-name">{{ item.field_name }}</h4>
                  <!-- 重新设计悬停操作按钮，确保正确显示 -->
                  <div class="field-actions">
                    <el-button
                      type="primary"
                      link
                      :icon="Edit"
                      @click.stop="handleUpdateAttr(group.group_id, item)"
                      size="small"
                      class="action-btn edit-btn"
                      title="编辑"
                    />
                    <el-button
                      type="danger"
                      link
                      :icon="Delete"
                      @click.stop="handleDelete(item)"
                      size="small"
                      class="action-btn delete-btn"
                      title="删除"
                    />
                  </div>
                </div>
                <div class="field-details">
                  <el-tag size="small" type="primary">{{ item.field_type }}</el-tag>
                  <code class="field-uid">{{ item.field_uid }}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="dialogAttrGroupVisible"
      title="新增分组"
      @closed="resetAttrGroupFrom"
      width="400px"
      class="modern-dialog"
    >
      <el-form ref="attrGroupRef" :model="AttrGroup" :rules="attrGroupRules" label-width="80px" class="dialog-form">
        <el-form-item prop="group_name" label="组名称">
          <el-input v-model="AttrGroup.group_name" placeholder="请输入分组名称" class="form-input" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogAttrGroupVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="handlerAddAttributeGroup" :loading="loading" class="confirm-btn">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-drawer
      v-model="attrFieldVisible"
      :show-close="false"
      :with-header="false"
      :before-close="handleClose"
      class="modern-drawer"
    >
      <createOrUpdateField
        ref="apiFieldRef"
        :model-uid="props.modelUid"
        :group-id="groupId"
        @close="onClosed"
        @getAttributesData="getAttributesData"
      />
    </el-drawer>

    <el-drawer
      v-model="sortFieldVisibe"
      class="sort-drawer"
      :show-close="false"
      :with-header="false"
      title="表格排序设置"
    >
      <sortField
        ref="sortFieldRef"
        :model-uid="props.modelUid"
        :attributes-data="AttributesData"
        @close="sortClose"
        @getAttributesData="getAttributesData"
      />
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { h, nextTick, ref, watch } from "vue"
import { Search, CirclePlus, Edit, Delete, Setting, ArrowRight, Expand, ArrowUp } from "@element-plus/icons-vue"
import { listAttributesByModelUidApi, DeleteAttributeApi, createAttributeGroupApi } from "@/api/attribute"
import { type AttributeGroup, type Attribute, CreateAttributeGroupReq } from "@/api/attribute/types/attribute"
import { usePagination } from "@/common/composables/usePagination"
import { type FormInstance, type FormRules, ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import createOrUpdateField from "./createOrUpdateField.vue"
import sortField from "./sort-field.vue"

const { paginationData } = usePagination()
const searchInput = ref("")
const cardDrawer = ref(false)

const loading = ref<boolean>(false)

// 接收父组建传递
interface Props {
  modelUid: string
}
const props = defineProps<Props>()

const currentItem = ref<Attribute>()

const detailInfo = (item: Attribute) => {
  currentItem.value = item
  cardDrawer.value = true
}

//** 前端动态表单排序 */
const handleSortDrawer = () => {
  sortFieldVisibe.value = true
  nextTick(() => {
    sortFieldRef.value?.handleSortFilter()
  })
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

  console.log(row, "row")
  nextTick(() => {
    apiFieldRef.value?.setFrom(row)
  })
}

const onClosed = (val: boolean) => {
  attrFieldVisible.value = val
}

const handleClose = () => {
  attrFieldVisible.value = false
  apiFieldRef.value?.resetForm()
}
//** 属性表格展示排序 */
const sortFieldRef = ref<InstanceType<typeof sortField>>()
const sortFieldVisibe = ref<boolean>(false)

const sortClose = (val: boolean) => {
  sortFieldVisibe.value = val
}

//** 组展开 */
function toggleGroup(group: any) {
  group.expanded = !group.expanded
}

//** 前端过滤展示 */
const filterData = ref<AttributeGroup[]>([])
watch(searchInput, () => {
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
})

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

//** 全部展开/收起功能 */
const allExpanded = ref(false)

function toggleAllGroups() {
  allExpanded.value = !allExpanded.value
  filterData.value.forEach((group) => {
    group.expanded = allExpanded.value
  })
}
</script>

<style lang="scss" scoped>
/* 重新设计样式系统，与model-detail-page完全一致 */
.field-management {
  /* 移除所有外层padding，让父容器控制间距 */

  .field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 16px 20px;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .groups-container {
    .group-card {
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);

      .group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #f8fafc;
        border-bottom: 1px solid #d1d5db;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background: #f1f5f9;
        }

        .group-info {
          display: flex;
          align-items: center;
          gap: 12px;

          .toggle-icon {
            transition: transform 0.2s ease;
            color: #6b7280;

            &.expanded {
              transform: rotate(90deg);
            }
          }

          .group-title {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
        }
      }

      .fields-container {
        padding: 20px;

        .fields-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;

          .field-item {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            min-height: 85px;

            &:hover {
              border-color: #2563eb;
              box-shadow: 0 6px 16px rgba(37, 99, 235, 0.2);
              transform: translateY(-2px);

              .field-actions {
                opacity: 1 !important;
                visibility: visible !important;
              }
            }

            .field-content {
              .field-header-info {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
                position: relative;

                .field-name {
                  font-size: 14px;
                  font-weight: 600;
                  color: #1f2937;
                  margin: 0;
                  flex: 1;
                  line-height: 1.3;
                  padding-right: 50px;
                }

                .field-actions {
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  justify-content: center;
                  gap: 6px;
                  opacity: 0;
                  visibility: hidden;
                  transition: all 0.2s ease;
                  position: absolute;
                  right: 8px;
                  top: 0;

                  .action-btn {
                    width: 22px;
                    height: 22px;
                    padding: 0;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    font-size: 12px;
                    transition: all 0.2s ease;
                    min-width: 22px;

                    :deep(.el-icon) {
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      width: 100%;
                      height: 100%;
                      margin: 0;
                    }

                    &.edit-btn {
                      background: #dbeafe;
                      color: #1d4ed8;

                      &:hover {
                        background: #1d4ed8;
                        color: white;
                        transform: scale(1.1);
                      }
                    }

                    &.delete-btn {
                      background: #fee2e2;
                      color: #dc2626;

                      &:hover {
                        background: #dc2626;
                        color: white;
                        transform: scale(1.1);
                      }
                    }
                  }
                }
              }

              .field-details {
                display: flex;
                align-items: center;
                gap: 8px;

                :deep(.el-tag) {
                  background: #eff6ff;
                  color: #1e40af;
                  border: 1px solid #bfdbfe;
                  font-weight: 500;
                }

                .field-uid {
                  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
                  font-size: 11px;
                  color: #4b5563;
                  background: #f9fafb;
                  padding: 3px 6px;
                  border-radius: 4px;
                  border: 1px solid #d1d5db;
                  font-weight: 500;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
