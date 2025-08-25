<template>
  <div class="login-container">
    <ThemeSwitch class="theme-switch" />
    <Owl :close-eyes="isFocus" />
    <div class="login-card">
      <div class="title">
        <img src="@@/assets/images/layouts/logo-标准.png" />
      </div>

      <div class="content">
        <el-tabs class="tabs-center" stretch v-model="activeName" @tab-click="handleClick">
          <el-tab-pane name="ldap">
            <template #label>
              <div class="label">
                <strong style="font-size: 18px">AD认证</strong>
              </div>
            </template>
            <Login :active="activeName" @focus="handleFocus" @blur="handleBlur" />
          </el-tab-pane>
          <el-tab-pane name="pass">
            <template #label>
              <div class="label">
                <strong style="font-size: 18px">标准</strong>
              </div>
            </template>
            <Login :active="activeName" @focus="handleFocus" @blur="handleBlur" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import ThemeSwitch from "@@/components/ThemeSwitch/index.vue"
import { type TabsPaneContext } from "element-plus"
import Owl from "./components/Owl.vue"
import Login from "./login.vue"
import { useFocus } from "./composables/useFocus"

// 直接在父组件中使用useFocus
const { isFocus, handleFocus, handleBlur } = useFocus()

const activeName = ref("ldap")

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100%;
  .theme-switch {
    position: fixed;
    top: 5%;
    right: 5%;
    cursor: pointer;
  }
  .login-card {
    width: 480px;
    max-width: 90%;
    border-radius: 20px;
    box-shadow: 0 0 10px #dcdfe6;
    background-color: var(--el-bg-color);
    overflow: hidden;
    .title {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 130px;
      img {
        width: 100%;
        transform: scale(0.7);
      }
    }
    .content {
      padding: 0px 50px 50px 50px;
      margin-top: -10px;
      :deep(.el-input-group__append) {
        padding: 0;
        overflow: hidden;
        .el-image {
          width: 100px;
          height: 40px;
          border-left: 0px;
          user-select: none;
          cursor: pointer;
          text-align: center;
        }
      }
    }
  }
}
</style>
