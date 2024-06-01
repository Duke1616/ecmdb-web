<template>
  <div class="app-container">
    <div class="centered-container">
      <el-input clearable v-model="inputSearch" placeholder="请输入搜索内容">
        <template #append>
          <el-button class="centered-button" type="primary" @click="search">搜索</el-button>
        </template>
      </el-input>
      <el-button type="primary" @click="goBack" :icon="Back">返回主页</el-button>
    </div>
    <el-divider />
    <div>
      <el-card v-if="searchResourcesData.length > 0">
        <el-tabs v-model="activeName" class="demo-tabs" @tab-change="handleTabClick">
          <el-tab-pane
            v-for="(tab, index) in searchResourcesData"
            :key="index"
            :label="tab.model_uid + ' ( ' + tab.total + ' )'"
            :name="tab.model_uid"
          >
            <el-table :data="tab.data">
              <el-table-column fixed="left" prop="id" width="50" label="ID" align="center" />
              <el-table-column
                v-for="(item, index) in displayFileds.get(tab.model_uid)"
                :key="index"
                :prop="`${item.field_uid}`"
                :label="item.field_name"
                align="center"
              >
                <template #default="scope">
                  <span :style="{ color: textColor(scope.row[item.field_uid]) }">
                    {{ scope.row[item.field_uid] }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column fixed="right" label="操作" width="150" align="center">
                <template #default="scope">
                  <el-button type="primary" text bg size="small" @click="handlerDetailClick(scope.row)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue"
import { Back } from "@element-plus/icons-vue"
import { globalSearchData } from "@/api/resource/types/resource"
import { globalSearchApi } from "@/api/resource"
import { useRoute } from "vue-router"
import { Attribute } from "@/api/attribute/types/attribute"
import { ListAttributeFieldApi } from "@/api/attribute"
import { useSearchStore } from "@/store/modules/search"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"

const router = useRouter()
const route = useRoute()

const inputSearch = ref<string>(route.query.text as string)
let oldSearch = route.query.text as string
const search = () => {
  if (inputSearch.value.trim() === "") {
    ElMessage.error("搜索内容不成为空")
    return
  }

  if (oldSearch === inputSearch.value) {
    return
  }

  useSearchStore().addHistorySearch(inputSearch.value.trim())
  if (inputSearch.value.trim() !== "") {
    router.push({
      path: "/cmdb/dashboard/search",
      query: { text: inputSearch.value }
    })
    listGlobalSearchData(inputSearch.value)
  }
  oldSearch = inputSearch.value
}

const goBack = () => {
  router.push({
    path: "/cmdb/dashboard"
  })
}

const activeName = ref("first")
const handleTabClick = () => {
  sortFields(activeName.value)
}

const textColor = (fieldValue: string) => {
  if (fieldValue.includes(inputSearch.value)) {
    return "red"
  } else {
    return ""
  }
}

// ** 获取资产列表 */
const searchResourcesData = ref<globalSearchData[]>([])
const listGlobalSearchData = (text: string) => {
  globalSearchApi(text)
    .then(async ({ data }) => {
      searchResourcesData.value = data
      if (searchResourcesData.value.length > 0) {
        activeName.value = searchResourcesData.value[0].model_uid
        await sortFields(activeName.value)
      }
    })
    .catch(() => {
      searchResourcesData.value = []
    })
    .finally(() => {})
}

// ** 过滤展示字段，并排序 */
const displayFileds = ref<Map<string, Attribute[]>>(new Map())
const serachHistory = ref<Map<string, string>>(new Map())
const sortFields = async (modelUid: string) => {
  if (displayFileds.value.has(modelUid)) {
    return
  }

  if (serachHistory.value.get(modelUid) === inputSearch.value) {
    return
  }

  // 处理不存在前端列表，但是匹配项存在的情况
  let hightShowFields: Attribute[] = []
  const matchingItem = searchResourcesData.value.find((item) => item.model_uid === modelUid)
  if (matchingItem && matchingItem.data.length > 0) {
    hightShowFields = matchingItem.data.reduce((acc, obj) => {
      Object.keys(obj).forEach((key) => {
        console.log("key", obj)
        if (obj[key] === inputSearch.value) {
          acc.push({
            field_uid: key,
            field_name: key,
            display: true,
            model_uid: matchingItem.model_uid
          })
        }
      })
      return acc
    }, [])
  }

  // 获取展示字段
  await listAttributeFields(modelUid)
  const filteredFields = attributeFiledsData.value
    .filter((item) => item.display === true)
    .sort((a, b) => {
      const indexA = a.index ?? 100
      const indexB = b.index ?? 100
      return indexA - indexB
    })

  // 数据组合
  hightShowFields.forEach((field) => {
    const exists = filteredFields.some((existingField) => existingField.field_uid === field.field_uid)

    if (!exists) {
      filteredFields.push(field)
    }
  })
  serachHistory.value.set(modelUid, inputSearch.value)
  displayFileds.value.set(modelUid, filteredFields)
}

// ** 获取资产字段信息 */
const attributeFiledsData = ref<Attribute[]>([])
const listAttributeFields = async (modelUid: string) => {
  await ListAttributeFieldApi(modelUid)
    .then(({ data }) => {
      attributeFiledsData.value = data.attribute_fields

      console.log("attribute result", attributeFiledsData.value)
    })
    .catch((error) => {
      console.log("报错", error)
      attributeFiledsData.value = []
    })
    .finally(() => {
      // ...
    })
}

const handlerDetailClick = (row: any) => {
  router.push({
    path: "/cmdb/resource/info",
    query: { model_uid: row.model_uid, name: row.name, id: row.id }
  })
}

onMounted(() => {
  listGlobalSearchData(inputSearch.value)
})
</script>

<style scoped>
.centered-container {
  display: flex;
  justify-content: space-between;
}

.el-input {
  width: 40%; /* 根据需要调整宽度 */
  height: 40px;
}

.centered-button {
  height: 40px;
}
</style>
