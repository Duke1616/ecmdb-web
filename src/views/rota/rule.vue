<template>
  <div>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" label-position="top">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item prop="desc" label="开始时间">
            <el-date-picker
              v-model="formData.rota_rule.start_time"
              type="datetime"
              placeholder="选择日期和时间"
              format="YYYY-MM-DD HH:mm"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="desc" label="结束时间">
            <el-date-picker
              v-model="formData.rota_rule.end_time"
              type="datetime"
              placeholder="选择日期和时间"
              format="YYYY-MM-DD HH:mm"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item prop="desc" label="轮换周期">
            <el-select v-model="formData.rota_rule.rotate.time_duration" placeholder="Select" style="width: 100%">
              <el-option v-for="num in 30" :key="num" :label="num.toString()" :value="num" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="desc" label="单位">
            <el-select v-model="formData.rota_rule.rotate.time_unit" placeholder="选择单位" style="width: 100%">
              <el-option label="小时" value="hour" />
              <el-option label="天" value="day" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <div>
        <div class="group-header">
          <span>班排人员</span>
          <el-button type="info" text bg size="default" @click="addUser">添加人员</el-button>
        </div>
        <div>
          <div v-for="(group, index) in rotaGroups" :key="group.id">
            <div v-if="group.members.length > 0">
              <div class="empty-group">
                <span>{{ group.name }}</span>
              </div>
              <VueDraggable
                v-model="group.members"
                :animation="200"
                group="rotaGroup"
                ghostClass="ghost"
                chosenClass="chosen"
                handle=".handle"
                @start="onStart"
                @end="onEnd"
                itemKey="id"
                class="flex flex-col gap-4 p-0 rounded"
                @change="onGroupChange(group, index)"
              >
                <div
                  v-for="(member, itemIndex) in group.members"
                  :key="member"
                  class="h-40px bg-gray-500/5 px-2 rounded flex items-center"
                >
                  <div class="flex-1 flex">
                    <el-text truncated class="sort-text">{{ member }}</el-text>
                  </div>

                  <div class="flex items-center space-x-2">
                    <el-icon @click="removeAndToLeftList(itemIndex, member, group)">
                      <Close />
                    </el-icon>
                    <el-icon name="sort" class="handle cursor-move">
                      <Grid />
                    </el-icon>
                  </div>
                </div>
              </VueDraggable>
            </div>
          </div>
        </div>
      </div>
      <el-divider style="margin: 10px 10px" />
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { addOrUpdateRuleReq, rotaGroup } from "@/api/rota/types/rota"
import { FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import { VueDraggable } from "vue-draggable-plus"
import { ref } from "vue"

// 定义值班组的数据结构
const rotaGroups = ref<rotaGroup[]>([]) // 组列表
let userId = 1

// 添加用户并创建新组
const addUser = () => {
  const newGroupName = `组 ${String.fromCharCode(65 + rotaGroups.value.length)}`
  const newGroup = {
    id: Date.now(), // 使用时间戳作为唯一标识
    name: newGroupName,
    members: [userId]
  }
  rotaGroups.value.push(newGroup)
  userId++
}

// 处理拖拽开始事件
const onStart = () => {
  console.log("当前值班组:", rotaGroups.value)
}

// 处理拖拽结束事件
const onEnd = () => {
  console.log("当前值班组:", rotaGroups.value)
}

// 组内成员变更时调用此方法
const onGroupChange = (group: rotaGroup, groupIndex: number) => {
  if (group.members.length === 0) {
    rotaGroups.value.splice(groupIndex, 1)
  }
}

// 将成员从当前组移到另一组（或者做其他操作）
const removeAndToLeftList = (index: number, member: number, group: rotaGroup) => {
  // 从当前组中移除成员
  group.members.splice(index, 1)

  // 需要手动触发刷新
  // VueDraggable 并不会自动触发成员数组的更新，手动更新触发视图更新
  group.members = [...group.members]
}

const DEFAULT_FORM_DATA: addOrUpdateRuleReq = {
  id: 0,
  rota_rule: {
    start_time: 0,
    end_time: 0,
    rota_groups: [],
    is_rotate: false,
    rotate: {
      time_unit: 0,
      time_duration: 0
    }
  }
}

const formData = ref<addOrUpdateRuleReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入值班名称", trigger: "blur" }],
  owner: [{ required: true, message: "必须输入值班管理人员", trigger: "blur" }]
}
</script>

<style scoped>
/* 自定义样式 */
.sort-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  justify-items: center;
  align-items: center;
}
.empty-group {
  padding: 10px;
  text-align: center;
}
</style>
