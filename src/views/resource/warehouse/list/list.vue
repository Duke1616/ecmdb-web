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
                <div v-if="scope.row.data[item.field_uid] === undefined || scope.row.data[item.field_uid].length === 0">
                  <el-upload
                    v-model:file-list="scope.row.data[item.field_uid]"
                    class="upload-file"
                    action="#"
                    multiple
                    show-file-list
                    :http-request="(action: UploadRequestOptions) => uploadFile(action, scope.row, item.field_uid)"
                    :limit="5"
                    :on-exceed="handleExceed"
                    :on-progress="handleProgress"
                  >
                    <el-button type="warning" text bg size="small">上传</el-button>
                  </el-upload>
                </div>
                <div v-else>
                  <el-popover width="300px" trigger="click" placement="top">
                    <div class="upload-container">
                      <el-upload
                        v-model:file-list="scope.row.data[item.field_uid]"
                        class="upload-file"
                        action="#"
                        multiple
                        show-file-list
                        :http-request="(action: UploadRequestOptions) => uploadFile(action, scope.row, item.field_uid)"
                        :limit="5"
                        :on-exceed="handleExceed"
                        :on-progress="handleProgress"
                        :on-preview="handlePreview"
                        :on-remove="createHandleRemove(scope.row, item.field_uid)"
                        :before-remove="beforeRemove"
                      >
                        <el-button type="primary" text bg size="default" style="width: 100%; text-align: center">
                          新增文件
                        </el-button>
                      </el-upload>
                    </div>
                    <template #reference>
                      <el-button type="primary" text bg size="small"> 查看 </el-button>
                    </template>
                  </el-popover>
                </div>
              </template>
              <template v-else>
                {{ scope.row.data[item.field_uid] }}
              </template>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="300" align="center">
            <template #default="scope">
              <router-link
                v-if="modelUid === 'host'"
                :to="{ path: '/terminal', query: { resource_id: scope.row.id, title: scope.row.name } }"
                target="_blank"
              >
                <el-button type="primary" text bg size="small">终端</el-button>
              </router-link>
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
    <!-- 新增或删除 -->
    <el-drawer class="drawer-container" v-model="drawerVisible" :title="title" @closed="onClosed" size="30%">
      <createOrUpdate
        ref="apiRef"
        :attributeFiledsData="attributeFiledsData"
        :modelUid="modelUid"
        @list="listResourceByModelUid"
        @closed="onClosed"
      />
      <template #footer>
        <el-button @click="onClosed">取消</el-button>
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
import { listResourceApi, deleteResourceApi, findSecureData, setCustomFieldApi } from "@/api/resource"
import { type Resource } from "@/api/resource/types/resource"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import {
  ElLoading,
  ElMessage,
  ElMessageBox,
  ElPopover,
  UploadFile,
  UploadProgressEvent,
  UploadProps,
  UploadRequestOptions,
  UploadUserFile
} from "element-plus"
import router from "@/router"

import createOrUpdate from "./createOrUpdate.vue"
import { getMinioPresignedUrl, putMinioPresignedUrl, removeMinioObject } from "@/api/tools"
import axios from "axios"
import { decodedUrlPath, getLocalMinioUrl } from "../../../../common/utils/url"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const route = useRoute()
const modelUid = route.query.uid as string
const attributeFiledsData = ref<Attribute[]>([])

const displayFileds = ref<Attribute[]>([])
const drawerVisible = ref<boolean>(false)

const title = ref<string>("")

const handleExceed: UploadProps["onExceed"] = (files) => {
  ElMessage.warning(`限制最多上传 ${files.length} 个文件`)
}

const handleProgress = (event: UploadProgressEvent, file: UploadUserFile) => {
  file.percentage = event.percent
}

// 下载文件
const handlePreview: UploadProps["onPreview"] = (uploadFile) => {
  ElMessageBox({
    title: "下载确认",
    message: h("p", null, [
      h("span", null, "正在下载文件: "),
      h("i", { style: "color: red" }, `${uploadFile.name}`),
      h("span", null, " 确认下载？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    if (uploadFile?.url === undefined) {
      return
    }

    getMinioPresignedUrl(decodedUrlPath(uploadFile.url)).then((res: any) => {
      window.location.href = getLocalMinioUrl(res.data)
    })
  })
}

const createHandleRemove = (row: Resource, filed: string) => {
  const handleRemove: UploadProps["onRemove"] = (file: UploadFile) => {
    if (file.url === undefined) {
      return
    }

    removeMinioObject(decodedUrlPath(file.url)).then(() => {
      if (row === undefined) {
        return
      }

      if (row.data[filed]) {
        // 删除数据
        row.data[filed] = row.data[filed].map((item: UploadUserFile) =>
          item.name === file.name ? { ...item, url: "" } : item
        )

        // 变更字段数据
        setCustomFieldApi({
          id: row.id,
          field: filed,
          data: row.data[filed]
        }).then(() => {
          ElMessage.success("删除成功")
        })
      }
    })
  }

  return handleRemove
}

const beforeRemove: UploadProps["beforeRemove"] = (uploadFile) => {
  return ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除文件: "),
      h("i", { style: "color: red" }, `${uploadFile.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => true)
}

// 上传文件
const uploadFile = (action: UploadRequestOptions, row: Resource, filedUid: string) => {
  const loading = ElLoading.service({
    text: "正在上传...",
    background: "rgba(0, 0, 0, 0.7)"
  })

  const objectName = action.file.uid + "/" + action.file.name
  return putMinioPresignedUrl(objectName).then((res: any) => {
    const url = getLocalMinioUrl(res.data)

    axios
      .put(url, action.file, {
        headers: {
          "Content-Type": action.file.type
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            loading.setText(`已上传 ${percentCompleted.toFixed(1)}%`)
          }
        }
      })
      .then(() => {
        // 填写URL信息
        row.data[filedUid] = row.data[filedUid].map((item: UploadUserFile) =>
          item.name === action.file.name ? { ...item, url: res.data.split("?")[0] } : item
        )

        // 变更字段数据
        setCustomFieldApi({
          id: row.id,
          field: filedUid,
          data: row.data[filedUid]
        }).then(() => {
          ElMessage.success("上传成功")
        })
      })
      .catch(() => {
        ElMessage.error("上传失败")
      })
      .finally(() => {
        // 关闭 loading
        loading.close()
      })
  })
}

const handleDetailClick = (resource: Resource) => {
  router.push({
    path: "/cmdb/resource/info",
    query: { model_uid: modelUid, id: resource.id, name: resource.name }
  })
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

const onClosed = () => {
  console.log("onClosed")
  apiRef.value?.resetForm()
  drawerVisible.value = false
}

const handleCreate = () => {
  apiRef.value?.handleSubmit()
}

onMounted(() => {
  listAttributeFields()
})

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listResourceByModelUid, { immediate: true })
</script>

<style lang="scss" scoped>
:deep(.el-drawer__header) {
  margin-bottom: 0px;
}

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

.upload-file {
  :deep(.el-upload) {
    width: 100%;
  }

  ::v-deep .el-upload-list__item {
    transition: none !important;
  }
}

.file-name {
  max-width: 230px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
