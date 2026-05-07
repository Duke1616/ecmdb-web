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
          <el-tab-pane name="feishu">
            <template #label>
              <div class="label">
                <strong style="font-size: 18px">飞书登录</strong>
              </div>
            </template>
            <div class="feishu-login-wrapper">
              <el-button
                :loading="feishuLoading"
                class="feishu-login-btn"
                type="primary"
                size="large"
                @click="handleFeishuLogin"
              >
                <el-icon :size="18" class="feishu-icon">
                  <Promotion />
                </el-icon>
                飞书登录
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { useRoute } from "vue-router"
import ThemeSwitch from "@@/components/ThemeSwitch/index.vue"
import { type TabsPaneContext, ElMessage } from "element-plus"
import { Promotion } from "@element-plus/icons-vue"
import Owl from "./components/Owl.vue"
import Login from "./login.vue"
import { useFocus } from "./composables/useFocus"
import { getOidcRenderApi } from "@/api/iam/user"

const route = useRoute()

// 直接在父组件中使用useFocus
const { isFocus, handleFocus, handleBlur } = useFocus()

const isDemoEnv = window.location.hostname === "82.156.165.98"
const activeName = ref((route.query.mode as string) || (isDemoEnv ? "pass" : "ldap"))

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}

/** 飞书登录 */
const feishuLoading = ref(false)

const handleFeishuLogin = async () => {
  feishuLoading.value = true
  try {
    // 后端 render 接口公开，直接传 provider_type="feishu"
    // 后端 Data 字段直接返回 URL 字符串
    const res = await getOidcRenderApi("feishu")
    const authUrl = res.data
    if (authUrl) {
      window.location.href = authUrl
    } else {
      ElMessage.error("获取飞书授权地址失败")
    }
  } catch {
    ElMessage.error("获取飞书授权地址失败")
  } finally {
    feishuLoading.value = false
  }
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
      .feishu-login-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px 0;
        .feishu-login-btn {
          width: 100%;
          .feishu-icon {
            margin-right: 8px;
          }
        }
      }
    }
  }
}
</style>
