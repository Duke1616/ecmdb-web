import { DirectiveBinding } from "vue"

/**
 * 防抖指令
 * @param el 指令绑定的元素
 * @param binding 指令绑定的值
 * @param binding.value.click 回调函数
 * @param binding.value.params 回调函数参数
 * @param binding.value.times 延迟时间 默认值为500毫秒
 * @example
 * <button v-debounce="{click: handleLike, params: { test: 0 }}">防抖</button> handleLike 为函数 params 为传入的参数
 */
export default {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    let timer: ReturnType<typeof setTimeout> | null = null

    el.addEventListener("click", (e: Event) => {
      // 阻止默认事件
      e.preventDefault()
      // 阻止冒泡
      e.stopPropagation()

      if (timer) {
        clearTimeout(timer)
      }
      // 设定默认时间为500毫秒
      const times = binding.value?.times || 500

      timer = setTimeout(() => {
        const { click, params } = binding.value
        // click 不是函数
        if (typeof click !== "function") {
          throw new TypeError("click is not a function")
        }
        click(params || e)
        // 重置计时器
        timer = null
      }, times)
    })
  }
}
