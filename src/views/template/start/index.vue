<template>
  <div class="app-container">
    <div>
      <h3>假勤管理</h3>
      <el-card>
        <el-row>
          <el-col :span="6">
            <el-space>
              <div>
                <span>
                  <Icon data="ClockRegular" :size="40" />
                </span>
              </div>
              <div>
                <span>
                  <h4>请假申请</h4>
                </span>
              </div>
            </el-space>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { Icon } from "vue3-icon-picker"

const icon = ref(null)

console.log(icon.value)
</script>
<style lang="scss" scoped></style>
