<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handlerCreate">新增</el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="listAttributeFields" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="resourcesData">
          <el-table-column type="selection" width="50" align="center" />

          <el-table-column
            v-for="item in displayFileds"
            :key="item.id"
            :prop="`data.${item.field_uid}`"
            :label="item.field_name"
            align="center"
          >
            <template #default="scope">
              <template v-if="item.secure">
                <el-button
                  v-if="!secureDisplay.get(scope.row.id)"
                  type="primary"
                  size="small"
                  @click="handleSecureClick(scope.row, item)"
                >
                  查看
                </el-button>
                <div v-if="secureDisplay.get(scope.row.id)">
                  {{ scope.row.data[item.field_uid] }}
                </div>
              </template>
              <template v-else-if="item.link">
                <el-button type="text" @click="openNewPage(scope.row.data[item.field_uid])">
                  {{ scope.row.data[item.field_uid] }}
                </el-button>
              </template>
              <template v-else-if="item.field_type === 'file'">
                <div v-if="scope.row.data[item.field_uid] === undefined">空</div>
                <div v-else>
                  <el-popover width="350px" trigger="click" placement="top">
                    <div v-for="(file, index) in fileList" :key="index" class="file-item">
                      <span class="file-name">{{ file.name }}</span>
                      <el-button size="small" type="primary" @click="downloadFile(file.url)">下载</el-button>
                    </div>
                    <template #reference>
                      <el-button
                        type="primary"
                        text
                        bg
                        size="small"
                        @click="handleReviewClick(scope.row.data[item.field_uid])"
                      >
                        查看
                      </el-button>
                    </template>
                  </el-popover>
                </div>
              </template>
              <template v-else>
                {{ scope.row.data[item.field_uid] }}
              </template>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="200" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleDetailClick(scope.row)">详情</el-button>
              <el-button type="warning" text bg size="small" @click="handleUpdate(scope.row)">修改</el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager-wrapper">
          <el-pagination
            background
            :layout="paginationData.layout"
            :page-sizes="paginationData.pageSizes"
            :total="paginationData.total"
            :page-size="paginationData.pageSize"
            :currentPage="paginationData.currentPage"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
    <!-- 新增 -->
    <el-drawer class="drawer-container" v-model="drawerVisible" :title="title" :closed="onClosed" size="30%">
      <createOrUpdate
        ref="apiRef"
        :attributeFiledsData="attributeFiledsData"
        :modelUid="modelUid"
        @list="listResourceByModelUid"
        @close="onClosed"
      />
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确认</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, h, reactive, nextTick } from "vue"
import { useRoute } from "vue-router"
import { type Attribute } from "@/api/attribute/types/attribute"
import { ListAttributeFieldApi } from "@/api/attribute"
import { listResourceApi, deleteResourceApi, findSecureData } from "@/api/resource"
import { type Resource } from "@/api/resource/types/resource"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/hooks/usePagination"
import { ElMessage, ElMessageBox, ElPopover, UploadUserFile } from "element-plus"
import router from "@/router"

import createOrUpdate from "./createOrUpdate.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const route = useRoute()
const modelUid = route.query.uid as string
const attributeFiledsData = ref<Attribute[]>([])

const displayFileds = ref<Attribute[]>([])
const drawerVisible = ref<boolean>(false)

const title = ref<string>("")

const handleDetailClick = (resource: Resource) => {
  router.push({
    path: "/cmdb/resource/info",
    query: { model_uid: modelUid, id: resource.id, name: resource.name }
  })
}

const fileList = ref<UploadUserFile[]>([])
const handleReviewClick = (data: UploadUserFile[]) => {
  fileList.value = Array.isArray(data) ? data : []

  // 如果文件列表为空，则隐藏 popover
  if (fileList.value.length === 0) {
    return
  }
}

const downloadFile = (url?: string) => {
  window.open(url, "_blank")
}

// ** 获取资产字段信息 */
const listAttributeFields = () => {
  ListAttributeFieldApi(modelUid)
    .then(({ data }) => {
      attributeFiledsData.value = data.attribute_fields
      sortFields()
    })
    .catch(() => {
      attributeFiledsData.value = []
    })
    .finally(() => {
      // ...
    })
}

// ** 过滤展示字段，并排序 */
const sortFields = () => {
  displayFileds.value = attributeFiledsData.value
    .filter((item) => item.display === true)
    .sort((a, b) => {
      const indexA = a.index ?? 100
      const indexB = b.index ?? 100
      return indexA - indexB
    })
}

// 跳转外部
const openNewPage = (url: string) => {
  window.open(url, "_blank")
}

// ** 获取资产列表 */
const resourcesData = ref<Resource[]>([])
const listResourceByModelUid = () => {
  listResourceApi({
    model_uid: modelUid,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      resourcesData.value = data.resources
      paginationData.total = data.total
    })
    .catch(() => {
      attributeFiledsData.value = []
    })
    .finally(() => {})
}

const handleDelete = (row: Resource) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除名称: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteResourceApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listResourceByModelUid()
    })
  })
}

const secureDisplay = reactive(new Map())
const handleSecureClick = (row: Resource, item: Attribute) => {
  findSecureData({
    id: row.id,
    field_uid: item.field_uid
  }).then((data) => {
    row.data[item.field_uid] = data.data
    secureDisplay.set(row.id, true)
  })
}

const apiRef = ref<InstanceType<typeof createOrUpdate>>()
const handlerCreate = () => {
  title.value = "新增资产"
  drawerVisible.value = true
}

const handleUpdate = (row: Resource) => {
  title.value = "修改资产"

  drawerVisible.value = true
  nextTick(() => {
    apiRef.value?.setForm(row)
  })
}

const onClosed = (val: boolean) => {
  drawerVisible.value = val
}

const handleCreate = () => {
  apiRef.value?.handleCreate()
}

onMounted(() => {
  listAttributeFields()
})

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listResourceByModelUid, { immediate: true })
</script>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.file-name {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
