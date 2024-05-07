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
      <el-button text size="default" type="default" icon="Setting">表格排序设置</el-button>
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
              :xl="4"
              style="margin-bottom: 4px"
              @mouseenter="showDetails(item)"
              @mouseleave="hideDetails()"
            >
              <el-card @click="showDetails(item)">
                <div class="model-field-card">
                  <div class="field-content">
                    <p class="field-name">{{ item.name }}</p>
                    <p font-size="12px">{{ item.field_type }} {{ item.field_name }}</p>
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
        {{ formData.filed_unique_name }}
      </el-descriptions-item>
      <el-descriptions-item label="字段名称：">
        {{ formData.filed_name }}
      </el-descriptions-item>
      <el-descriptions-item label="字段类型：">
        {{ formData.filed_type }}
      </el-descriptions-item>
      <el-descriptions-item label="是否必填：">
        {{ formData.required }}
      </el-descriptions-item>
    </el-descriptions>
    <div>
      <el-button size="default" type="primary" @click.stop="handleEditDrawer(model)">修改</el-button>
      <el-button size="default" type="danger" @click.stop="deleteDialogVisible = true">删除</el-button>
    </div>
  </el-drawer>

  <!-- Edit、Create 抽屉 -->
  <el-drawer v-model="editDrawer" title="编辑字段">
    <el-form :model="formData" :rules="fieldRules" size="large" label-width="auto" ref="formRef">
      <el-form-item label="唯一标识" prop="filed_unique_name">
        <el-input v-model="formData.filed_unique_name" />
      </el-form-item>
      <el-form-item label="字段名称" prop="filed_name">
        <el-input v-model="formData.filed_name" />
      </el-form-item>
      <el-form-item label="字段类型" prop="filed_type">
        <el-input v-model="formData.filed_type" />
      </el-form-item>
      <el-form-item label="是否必填" prop="required">
        <el-switch v-model="formData.required" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm(ruleFormRef)"> 保存 </el-button>
        <el-button @click="resetForm()">取消</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { Search } from "@element-plus/icons-vue"
import { listAttributesByModelUidApi } from "@/api/attribute"
import { type AttributeGroup, type Attribute } from "@/api/attribute/types/attribute"
import { usePagination } from "@/hooks/usePagination"

const { paginationData } = usePagination()
const searchInput = ref("")
const cardDrawer = ref(false)
const editDrawer = ref(false)
const deleteDialogVisible = ref(false)
const loading = ref<boolean>(false)

const props = defineProps({
  modelUid: String
})

// 是否展开组、鼠标聚焦效果
const showDetail = ref(false)
const currentItem = ref<Attribute>({
  id: 0,
  model_uid: "",
  name: "",
  field_name: "",
  field_type: "",
  required: false,
  showDetail: false
})

const showDetails = (item: Attribute) => {
  currentItem.value = item
  showDetail.value = true
}

const hideDetails = () => {
  showDetail.value = false
}

//** 获取字段信息 */

console.log(props.modelUid)
const AttributesData = ref<AttributeGroup[]>([])
// ** 获取数据 */
function getAttributesData() {
  loading.value = true
  listAttributesByModelUidApi(props.modelUid || "")
    .then(({ data }) => {
      console.log(data)
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

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      console.log("submit!")
    } else {
      console.log("error submit!")
      return false
    }
  })
}

const resetForm = () => {
  editDrawer.value = false
}

const formData = ref({
  id: 2,
  filed_name: "字段2",
  filed_unique_name: "唯一名称1",
  filed_type: "string",
  required: true
})

function search() {
  // 调用搜索接口
  console.log("搜索:", searchInput.value)
}

function toggleGroup(group: any) {
  group.expanded = !group.expanded
}

const fieldRules: FormRules = {
  filed_unique_name: [{ required: true, message: "必须输入帐号信息", trigger: "blur" }],
  filed_name: [{ required: true, message: "必须输入密码信息", trigger: "blur" }]
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
</style>
