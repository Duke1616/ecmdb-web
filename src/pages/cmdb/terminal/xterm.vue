<template>
  <div ref="xtermRef" class="xterm" />
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onDeactivated, onMounted, ref } from "vue"

import "@xterm/xterm/css/xterm.css"
import { ITerminalInitOnlyOptions, ITerminalOptions, Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import _ from "lodash"
import { ElMessage } from "element-plus"
import type { PrefixConfig } from "./utils/prefix-config"

const props = withDefaults(
  defineProps<{
    resource_id: string
    prefix: PrefixConfig | undefined
  }>(),
  {
    resource_id: "1"
  }
)

defineOptions({
  name: "IXterm"
})

const xtermRef = ref<HTMLElement>()
const fitAddon = ref<FitAddon>()
const xterm = ref<Terminal | null>(null)
const socket = ref<WebSocket>()
let resizeObserver: ResizeObserver | undefined
let resizeHandler: ReturnType<typeof _.debounce> | undefined

const initXterm = () => {
  const options = ref<ITerminalOptions & ITerminalInitOnlyOptions>({
    fontSize: 14,
    fontFamily: 'monaco, Consolas, "Lucida Console", monospace',
    convertEol: false, //启用时，光标将设置为下一行的开头
    scrollback: 2000, //终端中的回滚量
    disableStdin: false, //是否应禁用输入
    cursorStyle: "underline", //光标样式
    cursorBlink: true, //光标闪烁
    theme: {
      foreground: "#ECECEC", //字体
      background: "#000000", //背景色
      cursor: "help" //设置光标
    }
  })

  xterm.value = new Terminal(options.value)
  xterm.value.open(xtermRef.value as HTMLElement)
  fitAddon.value = new FitAddon()
  xterm.value.loadAddon(fitAddon.value)
  fitAddon.value.fit()
  xterm.value.focus()

  socket.value = new WebSocket(
    `${props.prefix?.wsServer}/api/cmdb/term/ssh/session?resource_id=${props.resource_id}&cols=${xterm.value.cols}&rows=${xterm.value.rows}`
  )

  socketOnClose()
  socketOnOpen()
  socketOnMessage()
  socketOnError()

  // 发送数据
  xterm.value?.onData(function (data: string) {
    const message = {
      operation: "stdin",
      data: data
    }

    socket.value!.send(JSON.stringify(message))
  })

  bindResizeEvents()
  nextTick(() => {
    resizeTerminal()
  })
}

const pingInterval = ref()
const socketOnOpen = () => {
  socket.value!.onopen = () => {
    pingInterval.value = setInterval(() => {
      const message = {
        operation: "ping",
        data: ""
      }

      socket.value!.send(JSON.stringify(message))
    }, 10000)
  }
}

const socketOnClose = () => {
  socket.value!.onclose = () => {
    xterm.value?.writeln("connection is closed.")
    if (pingInterval.value) {
      clearInterval(pingInterval.value)
    }
  }
}

const socketOnError = () => {
  socket.value!.onerror = () => {
    const errorMsg = "WebSocket 连接错误"
    xterm.value?.writeln(`websocket error: \x1B[1;3;31m${errorMsg}\x1B[0m `)
    ElMessage.error("错误：连接失败")
  }
}

const socketOnMessage = () => {
  socket.value!.onmessage = (msg: MessageEvent) => {
    const content = JSON.parse(msg.data as string) as { data: string }
    xterm.value?.write(content.data)
  }
}

const resizeTerminal = () => {
  if (xterm.value && fitAddon.value) {
    fitAddon.value.fit()

    const cols = xterm.value.cols
    const rows = xterm.value.rows
    const terminalSize = {
      operation: "resize",
      cols,
      rows
    }
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(terminalSize))
    }
  }
}

const bindResizeEvents = () => {
  resizeHandler = _.debounce(() => {
    resizeTerminal()
  }, 80)

  window.addEventListener("resize", resizeHandler)
  document.addEventListener("fullscreenchange", resizeHandler)

  if (window.ResizeObserver && xtermRef.value) {
    resizeObserver = new ResizeObserver(() => {
      resizeHandler?.()
    })
    resizeObserver.observe(xtermRef.value)
  }
}

const cleanup = () => {
  resizeObserver?.disconnect()
  resizeObserver = undefined

  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler)
    document.removeEventListener("fullscreenchange", resizeHandler)
    resizeHandler.cancel?.()
    resizeHandler = undefined
  }

  if (pingInterval.value) {
    clearInterval(pingInterval.value)
    pingInterval.value = undefined
  }

  socket.value?.close()
  socket.value = undefined
  xterm.value?.dispose()
  xterm.value = null
  fitAddon.value = undefined
}

onMounted(() => {
  initXterm()
})

onBeforeUnmount(() => {
  cleanup()
})

onDeactivated(() => {
  cleanup()
})
</script>

<style lang="scss" scoped>
.xterm {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 5px;
  background-color: #000;
  box-sizing: border-box;
}
</style>
