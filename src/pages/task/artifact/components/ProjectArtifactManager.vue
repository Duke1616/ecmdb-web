<template>
  <FormDialog
    v-model="publishDialogVisible"
    title="发布制品"
    :subtitle="`将项目【${target.name}】的当前代码树保存为不可变制品`"
    width="520px"
    :header-icon="Upload"
    :confirm-loading="publishing"
    confirm-text="发布并激活"
    :show-footer-info="false"
    @cancel="publishDialogVisible = false"
    @confirm="publish"
  >
    <el-form label-position="top" class="publish-form">
      <el-form-item label="发布说明">
        <el-input
          v-model="publishMessage"
          type="textarea"
          :rows="4"
          maxlength="200"
          show-word-limit
          placeholder="说明本次发布包含的修改"
        />
      </el-form-item>
    </el-form>
  </FormDialog>

  <ArtifactHistoryDrawer ref="historyDrawerRef" :project-id="target.id" :project-name="target.name" />
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue"
import { Upload } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { FormDialog } from "@/common/components/Dialogs"
import { publishArtifactApi } from "@/api/task/artifact"
import ArtifactHistoryDrawer from "./ArtifactHistoryDrawer.vue"

const target = ref({ id: 0, name: "" })
const publishing = ref(false)
const publishDialogVisible = ref(false)
const publishMessage = ref("")
const historyDrawerRef = ref<InstanceType<typeof ArtifactHistoryDrawer>>()

/** 打开指定制品库的发布表单。 */
function openPublish(projectId: number, projectName: string) {
  target.value = { id: projectId, name: projectName }
  publishMessage.value = ""
  publishDialogVisible.value = true
}

/** 打开指定制品库的发布历史。 */
async function openHistory(projectId: number, projectName: string) {
  target.value = { id: projectId, name: projectName }
  await nextTick()
  await historyDrawerRef.value?.open()
}

/** 发布并激活当前选中项目的制品。 */
async function publish(message = publishMessage.value.trim()) {
  if (!target.value.id) return
  publishing.value = true
  try {
    await publishArtifactApi({
      scope: "TENANT",
      project_id: target.value.id,
      message
    })
    publishDialogVisible.value = false
    ElMessage.success("制品发布并激活成功")
  } finally {
    publishing.value = false
  }
}

defineExpose({ openPublish, openHistory })
</script>

<style scoped lang="scss">
.publish-form {
  padding-top: 14px;
}
</style>
