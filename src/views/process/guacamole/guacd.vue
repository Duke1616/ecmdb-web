<template>
  <div class="display" ref="guacamoleRef" />
</template>

<script lang="ts" setup>
import guacamole, { Mouse } from "guacamole-common-js"
import { onMounted, ref } from "vue"
import _ from "lodash"

const guacamoleRef = ref<HTMLDivElement | null>(null)
const guacamoleClient = ref()

const init = () => {
  const socketLink = `ws://127.0.0.1:8000/api/sessions/tunnel`
  const tunnel = new guacamole.WebSocketTunnel(socketLink)
  const client = new guacamole.Client(tunnel)
  guacamoleClient.value = client

  client.onstatechange = (state: number) => {
    console.log("状态变化", state)
  }

  client.connect(`w=1024&h=768&dpi=96`)

  if (guacamoleRef.value) {
    const displayElement = client.getDisplay().getElement()
    guacamoleRef.value.appendChild(displayElement)

    const sink = new guacamole.InputSink()

    const sinkFocus = _.debounce(() => {
      sink.focus()
    })

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
  }

  const display = client.getDisplay()
  display.onresize = () => {
    const scale = Math.min(window.innerWidth / display.getWidth(), window.innerHeight / display.getHeight())
    if (scale) display.scale(scale)
  }

  // 键盘事件
  const sink = new guacamole.InputSink()
  const keyboard = new guacamole.Keyboard(sink.getElement())

  keyboard.onkeydown = (keysym) => {
    client.sendKeyEvent(1, keysym)
    if (keysym === 65288) {
      return false
    }
  }
  keyboard.onkeyup = (keysym) => {
    client.sendKeyEvent(0, keysym)
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
