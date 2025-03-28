<template>
  <div ref="xtermRef" class="xterm" />
</template>

<script lang="ts" setup>
import { onDeactivated, onMounted, ref } from "vue"

import "@xterm/xterm/css/xterm.css"
import { ITerminalInitOnlyOptions, ITerminalOptions, Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import _ from "lodash"
import { ElMessage } from "element-plus"
import { PrefixConfig } from "./index.vue"

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
    `${props.prefix?.wsServer}/api/term/ssh/session?resource_id=${props.resource_id}&cols=${xterm.value.cols}&rows=${xterm.value.rows}`
  )
  socketOnClose()
  socketOnOpen()
  socketOnMessage()
  socketOnError()

  // 发送数据
  xterm.value?.onData(function (data: any) {
    const message = {
      operation: "stdin",
      data: data
    }

    socket.value!.send(JSON.stringify(message))
  })

  // resize
  const resize = _.debounce(() => {
    resizeTerminal()
  })
  window.addEventListener("resize", resize)
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
  socket.value!.onerror = (e: any) => {
    xterm.value?.writeln(`websocket error: \x1B[1;3;31m${e.data}\x1B[0m `)
    ElMessage.error("错误：连接失败", e.data)
  }
}

const socketOnMessage = () => {
  socket.value!.onmessage = (msg: any) => {
    const content = JSON.parse(msg.data)
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
    socket.value?.send(JSON.stringify(terminalSize))
  }
}

onMounted(() => {
  initXterm()
})

onDeactivated(() => {
  socket.value?.close()
})
</script>

<style lang="scss" scoped>
.xterm {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  padding: 5px;
  background-color: #000;
}
</style>
