<template>
  <div ref="containerRef" class="ansi-terminal" />
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { FitAddon } from "@xterm/addon-fit"
import { Terminal } from "@xterm/xterm"
import "@xterm/xterm/css/xterm.css"

const props = defineProps<{ content: string }>()

const containerRef = ref<HTMLElement>()
let terminal: Terminal | undefined
let fitAddon: FitAddon | undefined
let resizeObserver: ResizeObserver | undefined
let renderedContent = ""

const normalizeNewlines = (value: string) => value.replace(/\r?\n/g, "\r\n")

const fit = () => {
  if (!containerRef.value?.clientWidth || !containerRef.value.clientHeight) return
  fitAddon?.fit()
}

const render = (content: string) => {
  if (!terminal) return

  const afterWrite = () => terminal?.scrollToBottom()
  if (content.startsWith(renderedContent)) {
    terminal.write(normalizeNewlines(content.slice(renderedContent.length)), afterWrite)
  } else {
    terminal.reset()
    terminal.write(normalizeNewlines(content), afterWrite)
  }
  renderedContent = content
}

const scrollToBottom = () => {
  nextTick(() => terminal?.scrollToBottom())
}

onMounted(() => {
  terminal = new Terminal({
    allowTransparency: true,
    convertEol: true,
    cursorBlink: false,
    disableStdin: true,
    fontFamily: '"Fira Code", "SFMono-Regular", Consolas, monospace',
    fontSize: 13,
    lineHeight: 1.5,
    scrollback: 10_000,
    theme: {
      background: "#282c34",
      foreground: "#abb2bf",
      black: "#282c34",
      red: "#e06c75",
      green: "#98c379",
      yellow: "#e5c07b",
      blue: "#61afef",
      magenta: "#c678dd",
      cyan: "#56b6c2",
      white: "#abb2bf",
      brightBlack: "#5c6370",
      brightRed: "#e06c75",
      brightGreen: "#98c379",
      brightYellow: "#e5c07b",
      brightBlue: "#61afef",
      brightMagenta: "#c678dd",
      brightCyan: "#56b6c2",
      brightWhite: "#ffffff",
      selectionBackground: "#3e4451"
    }
  })
  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.open(containerRef.value!)
  resizeObserver = new ResizeObserver(fit)
  resizeObserver.observe(containerRef.value!)
  fit()
  render(props.content)
})

watch(
  () => props.content,
  (content) => {
    render(content)
  }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  terminal?.dispose()
})

defineExpose({ scrollToBottom })
</script>

<style scoped lang="scss">
.ansi-terminal {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 8px 10px;
  overflow: hidden;
  background: #282c34;
  box-sizing: border-box;

  :deep(.xterm) {
    height: 100%;
  }
}
</style>
