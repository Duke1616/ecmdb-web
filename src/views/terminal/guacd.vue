<template>
  <div class="display" ref="guacamoleRef" />
</template>

<script lang="ts" setup>
import guacamole, { Mouse } from "guacamole-common-js"
import { onMounted, ref } from "vue"
import _ from "lodash"

const guacamoleRef = ref<HTMLDivElement | null>(null)
const guacamoleClient = ref()

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
  window.addEventListener("focus", async () => {
    const current_text = await navigator.clipboard.readText()
    if (text.value != current_text) {
      text.value = current_text
      const stream = client.createClipboardStream("text/plain")
      const writer = new guacamole.StringWriter(stream)
      writer.sendText(text.value)
      writer.sendEnd()
    }
  })

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
  const mouse = new guacamole.Mouse(displayElement) as any
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

  const touch = new guacamole.Mouse.Touchpad(displayElement) as any

  touch.onmousedown =
    touch.onmousemove =
    touch.onmouseup =
      function (state: Mouse.State) {
        client.sendMouseState(state)
      }

  const display = client.getDisplay()
  display.onresize = () => {
    const scale = Math.min(window.innerWidth / display.getWidth(), window.innerHeight / display.getHeight())
    if (scale) display.scale(scale)
  }
}

onMounted(() => {
  window.addEventListener("resize", () => {
    const client = guacamoleClient.value
    if (client) {
      const width = client.getDisplay().getWidth()
      const height = client.getDisplay().getHeight()

      const scale = Math.min(window.innerWidth / width, window.innerHeight / height)
      if (scale) client.getDisplay().scale(scale)
    }
  })
  init()
})
</script>

<style lang="scss" scoped>
.display {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: black;
}
</style>
