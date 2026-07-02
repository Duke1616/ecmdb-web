<template>
  <div class="display" ref="guacamoleRef" />
</template>

<script lang="ts" setup>
import guacamole, { Mouse } from "guacamole-common-js"
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import _ from "lodash"

const guacamoleRef = ref<HTMLDivElement | null>(null)
const guacamoleClient = ref()
let resizeObserver: ResizeObserver | undefined
let resizeHandler: ReturnType<typeof _.debounce> | undefined
let focusHandler: (() => void) | undefined

const resizeDisplay = () => {
  const client = guacamoleClient.value
  const container = guacamoleRef.value
  if (!client || !container) return

  const display = client.getDisplay()
  const width = display.getWidth()
  const height = display.getHeight()

  if (width && height) {
    const scale = Math.min(container.clientWidth / width, container.clientHeight / height)
    if (scale) {
      display.scale(scale)
    }
  }

  if (container.clientWidth && container.clientHeight && typeof client.sendSize === "function") {
    client.sendSize(container.clientWidth, container.clientHeight)
  }
}

const init = async () => {
  const socketLink = `ws://127.0.0.1:8000/api/term/guac/tunnel`
  const tunnel = new guacamole.WebSocketTunnel(socketLink)
  const client = new guacamole.Client(tunnel)
  guacamoleClient.value = client

  if (document.hasFocus()) {
    const current_text = await navigator.clipboard.readText()
    const stream = client.createClipboardStream("text/plain")
    const writer = new guacamole.StringWriter(stream)
    writer.sendText(current_text)
    writer.sendEnd()
  }

  client.onclipboard = function (stream) {
    const reader = new guacamole.StringReader(stream)
    let receivedData = ""
    reader.ontext = function (text) {
      receivedData += text
    }
    reader.onend = function () {
      navigator.clipboard
        .writeText(receivedData)
        .then(function () {})
        .catch(function () {})
    }
  }

  const text = ref()
  focusHandler = async () => {
    const current_text = await navigator.clipboard.readText()
    if (text.value != current_text) {
      text.value = current_text
      const stream = client.createClipboardStream("text/plain")
      const writer = new guacamole.StringWriter(stream)
      writer.sendText(text.value)
      writer.sendEnd()
    }
  }
  window.addEventListener("focus", focusHandler)

  client.onstatechange = (state: number) => {
    console.log("状态变化", state)
  }

  const displayElement = client.getDisplay().getElement()
  guacamoleRef.value?.appendChild(displayElement)

  client.connect(`width=${guacamoleRef.value?.clientWidth}&height=${guacamoleRef.value?.clientHeight}&dpi=96`)

  // 键盘事件
  const sink = new guacamole.InputSink()
  guacamoleRef.value?.appendChild(sink.getElement())
  const sinkFocus = _.debounce(() => {
    sink.focus()
  })

  const keyboard = new guacamole.Keyboard(sink.getElement())
  keyboard.onkeydown = (keysym) => {
    console.log("键盘事件 DOWN", keysym)
    client.sendKeyEvent(1, keysym)
    if (keysym === 65288) {
      return false
    }
  }
  keyboard.onkeyup = (keysym) => {
    console.log("键盘事件 UP", keysym)
    client.sendKeyEvent(0, keysym)
  }

  // 初始化鼠标事件
  interface MouseHandler {
    onmousedown?: (mouseState: Mouse.State) => void
    onmouseup?: (mouseState: Mouse.State) => void
    onmousemove?: (mouseState: Mouse.State) => void
  }

  const mouse = new guacamole.Mouse(displayElement) as MouseHandler
  mouse.onmousedown = mouse.onmouseup = function (mouseState: Mouse.State) {
    sinkFocus()
    client.sendMouseState(mouseState)
  }
  mouse.onmousemove = function (mouseState: Mouse.State) {
    sinkFocus()
    client.getDisplay().showCursor(false)
    mouseState.x = mouseState.x / display.getScale()
    mouseState.y = mouseState.y / display.getScale()
    client.sendMouseState(mouseState)
  }

  const touch = new guacamole.Mouse.Touchpad(displayElement) as MouseHandler

  touch.onmousedown =
    touch.onmousemove =
    touch.onmouseup =
      function (state: Mouse.State) {
        client.sendMouseState(state)
      }

  const display = client.getDisplay()
  display.onresize = () => {
    resizeHandler?.()
  }

  bindResizeEvents()
  nextTick(() => {
    resizeHandler?.()
  })
}

const bindResizeEvents = () => {
  resizeHandler = _.debounce(() => {
    resizeDisplay()
  }, 80)

  window.addEventListener("resize", resizeHandler)
  document.addEventListener("fullscreenchange", resizeHandler)

  if (window.ResizeObserver && guacamoleRef.value) {
    resizeObserver = new ResizeObserver(() => {
      resizeHandler?.()
    })
    resizeObserver.observe(guacamoleRef.value)
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

  if (focusHandler) {
    window.removeEventListener("focus", focusHandler)
    focusHandler = undefined
  }

  guacamoleClient.value?.disconnect?.()
  guacamoleClient.value = undefined
}

onMounted(() => {
  init()
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<style lang="scss" scoped>
.display {
  width: 100%;
  height: 100%;
  min-height: 0;
  background-color: black;
  overflow: hidden;
}
</style>
