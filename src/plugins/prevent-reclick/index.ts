import type { App } from "vue"

/** 按钮手抖/快速连击最小过滤间隔（毫秒） */
const CLICK_THROTTLE_GAP = 400

/**
 * 全局按钮防快速重复点击插件
 *
 * 设计原理：
 * 1. 采用事件捕获（capture: true），在 DOM 点击事件分发给业务层（Vue / @click）之前拦截。
 * 2. 仅拦截真实的按钮实体（button / .el-button），不影响链接、菜单项、树节点等普通元素。
 * 3. 过滤 400ms 内的物理手抖或双击，静默拦截，不影响任何正常业务与数据查询。
 */
export function loadPreventReClick(_app: App) {
  if (typeof window === "undefined") return

  window.addEventListener(
    "click",
    (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      // 定位被点击的真实按钮实体
      const button = target.closest("button, .el-button") as HTMLElement | null
      if (!button) return

      // 1. 若按钮本身已被置为禁用或加载状态，阻止继续分发
      if (
        button.hasAttribute("disabled") ||
        button.getAttribute("aria-disabled") === "true" ||
        button.classList.contains("is-disabled") ||
        button.classList.contains("is-loading")
      ) {
        event.stopImmediatePropagation()
        event.preventDefault()
        return
      }

      // 2. 过滤手抖与快速连续物理点击（400ms 窗口）
      const now = Date.now()
      const lastClickTime = Number(button.dataset.lastClickTime || 0)
      if (now - lastClickTime < CLICK_THROTTLE_GAP) {
        event.stopImmediatePropagation()
        event.preventDefault()
        return
      }

      // 记录本次有效点击的时间戳
      button.dataset.lastClickTime = String(now)
    },
    true // 必须使用捕获阶段，抢在所有组件绑定处理函数之前阻断
  )
}
