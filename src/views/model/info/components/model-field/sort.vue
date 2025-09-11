<template>
  <!-- 主内容区域 -->
  <div class="sort-interface">
    <div class="sort-columns">
      <div class="sort-column">
        <div class="column-header">
          <h4>隐藏字段</h4>
          <span class="field-count">{{ leftList.length }} 个字段</span>
        </div>
        <div class="sort-card">
          <VueDraggable
            v-model="leftList"
            dragClass="drag-item"
            :animation="animationDuration"
            group="cmdb"
            ghostClass="ghost-item"
            chosenClass="chosen-item"
            @start="onStart"
            @end="onEnd"
            itemKey="id"
            class="drag-container"
          >
            <div v-for="(item, index) in leftList" :key="item.id" class="field-item hidden-field">
              <div class="field-content">
                <div class="field-info">
                  <span class="field-name">{{ item.name }}</span>
                </div>
                <el-button
                  type="primary"
                  text
                  :icon="ArrowRight"
                  @click="removeAndToRightList(index, item)"
                  class="move-btn"
                />
              </div>
            </div>
          </VueDraggable>
        </div>
      </div>

      <div class="sort-column">
        <div class="column-header">
          <h4>显示字段</h4>
          <span class="field-count">{{ rightList.length }} 个字段</span>
        </div>
        <div class="sort-card">
          <VueDraggable
            v-model="rightList"
            dragClass="drag-item"
            :animation="animationDuration"
            group="cmdb"
            ghostClass="ghost-item"
            chosenClass="chosen-item"
            handle=".drag-handle"
            @start="onStart"
            @end="onEnd"
            itemKey="id"
            class="drag-container"
          >
            <div v-for="(item, index) in rightList" :key="item.id" class="field-item visible-field">
              <div class="field-content">
                <div class="field-info">
                  <el-icon class="drag-handle">
                    <Grid />
                  </el-icon>
                  <span class="field-name">{{ item.name }}</span>
                </div>
                <el-button
                  type="danger"
                  text
                  :icon="Close"
                  @click="removeAndToLeftList(index, item)"
                  class="remove-btn"
                />
              </div>
            </div>
          </VueDraggable>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { VueDraggable } from "vue-draggable-plus"
import { CustomAttributeFieldColumnsApi } from "@/api/attribute"
import { type CustomField, type CustomAttributeFieldColumnsReq, AttributeGroup } from "@/api/attribute/types/attribute"
import { ref } from "vue"
import { ElMessage } from "element-plus"
import { ArrowRight, Close, Grid } from "@element-plus/icons-vue"

// eslint-disable react-hooks/rules-of-hooks

// 接收父组建传递
interface Props {
  modelUid: string
  attributesData: AttributeGroup[]
}

const props = defineProps<Props>()

const emits = defineEmits(["close", "getAttributesData"])

const animationDuration = ref<number>(150)

//** 获取自定义列表信息 */
const leftList = ref<CustomField[]>([])
const rightList = ref<CustomField[]>([])

const handleSortFilter = () => {
  const attributesData = props.attributesData
  if (!attributesData || !Array.isArray(attributesData)) {
    return
  }

  rightList.value = []
  leftList.value = []

  attributesData.forEach((item) => {
    item.attributes.forEach((attr) => {
      const list = attr.display ? rightList : leftList
      list.value.push({ name: attr.field_name, id: attr.id, index: attr.index || 0 })
    })
  })

  rightList.value.sort((a, b) => a.index - b.index)
}

const handlerCustomAttributeFieldColumns = () => {
  const req: CustomAttributeFieldColumnsReq = {
    model_uid: props.modelUid,
    custom_field_name: rightList.value.map((item) => item.name)
  }

  return CustomAttributeFieldColumnsApi(req)
    .then(() => {
      ElMessage.success("操作成功")
      emits("getAttributesData")
      return true
    })
    .catch(() => {
      return false
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

defineExpose({
  handleSortFilter,
  handlerCustomAttributeFieldColumns
})
</script>

<style lang="scss" scoped>
.sort-interface {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .sort-columns {
    display: flex;
    gap: 16px;
    flex: 1;
    min-height: 0;

    .sort-column {
      flex: 1;
      display: flex;
      flex-direction: column;

      .column-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        h4 {
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .field-count {
          background: #f3f4f6;
          color: #6b7280;
          padding: 3px 8px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 500;
        }
      }

      .sort-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
        flex: 1;
        overflow-y: auto;
        transition: all 0.2s ease;

        &:hover {
          border-color: #3b82f6;
        }

        .drag-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 200px;

          .field-item {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 8px 10px;
            transition: all 0.2s ease;

            &.hidden-field {
              border-left: 3px solid #9ca3af;
            }

            &.visible-field {
              border-left: 3px solid #3b82f6;
            }

            &:hover {
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              transform: translateY(-1px);
            }

            .field-content {
              display: flex;
              justify-content: space-between;
              align-items: center;

              .field-info {
                display: flex;
                align-items: center;
                gap: 6px;
                flex: 1;

                .drag-handle {
                  color: #9ca3af;
                  cursor: grab;
                  font-size: 14px;

                  &:active {
                    cursor: grabbing;
                  }
                }

                .field-name {
                  font-weight: 500;
                  color: #1f2937;
                  font-size: 14px;
                }
              }

              .move-btn,
              .remove-btn {
                opacity: 0.7;
                transition: opacity 0.2s ease;
                padding: 4px;

                &:hover {
                  opacity: 1;
                }

                :deep(.el-icon) {
                  font-size: 14px;
                }
              }
            }
          }

          .drag-item {
            transform: rotate(3deg);
            opacity: 0.8;
          }

          .ghost-item {
            opacity: 0.3;
            background: #3b82f6;
            color: #ffffff;
          }

          .chosen-item {
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
          }
        }
      }
    }
  }
}
</style>
