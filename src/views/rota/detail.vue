<template>
  <div class="app-container">
    <div class="app-sidebar">
      <div class="app-sidebar-section">
        <el-card class="card-item">当前排班</el-card>
        <el-card class="card-item">下期排班</el-card>
      </div>
    </div>
    <el-card class="app-calendar">
      <div class="app-main">
        <FullCalendar ref="calendarRef" class="demo-app-calendar" :options="calendarOptions">
          <template v-slot:eventContent="arg">
            <b>{{ arg.timeText }}</b>
            <i>{{ arg.event.title }}</i>
          </template>
        </FullCalendar>
      </div>
    </el-card>
    <div>
      <el-dialog v-model="dialogVisible" title="新增规则" :before-close="onClosed" width="400">
        <Rule ref="ruleRef" @closed="onClosed" />
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="onClosed">取消</el-button>
            <el-button type="primary" @click="handlerSubmitRotaRule"> 保存 </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
    <div>
      <el-dialog v-model="dialogListRuleVisible" title="规则列表" :before-close="onRuleListClosed" width="400">
        <ListRule ref="ruleListRef" @closed="onRuleListClosed" @callback="preview" />
      </el-dialog>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick, createApp, h } from "vue"
import { CalendarOptions, EventApi, DateSelectArg, EventInput, EventHoveringArg } from "@fullcalendar/core"
import zhLocale from "@fullcalendar/core/locales/zh-cn"
import FullCalendar from "@fullcalendar/vue3"
import dayGridPlugin from "@fullcalendar/daygrid"
import rrulePlugin from "@fullcalendar/rrule"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { createEventId } from "./event-utils"
import Rule from "./rule/rule.vue"
import ListRule from "./rule/list-rule.vue"
import { useRoute } from "vue-router"
import { getRuleListById, previewSchedule } from "@/api/rota"
import { rotaRule, schedule } from "@/api/rota/types/rota"
import { ElButton, ElDivider, ElMessage } from "element-plus"
import tippy, { followCursor } from "tippy.js"
import "tippy.js/dist/tippy.css"
import "tippy.js/themes/light.css"
import "tippy.js/animations/scale.css"
import formatDate from "@/utils/day"

const route = useRoute()
const rotaId = route.query.id as string

const onClosed = () => {
  dialogVisible.value = false
  ruleRef.value?.resetForm()
}

const onRuleListClosed = () => {
  dialogListRuleVisible.value = false
  ruleListRef.value?.resetRule()
}

const ruleRef = ref<InstanceType<typeof Rule>>()
const ruleListRef = ref<InstanceType<typeof ListRule>>()

// 添加新的规则
const handlerSubmitRotaRule = () => {
  ruleRef.value?.submitForm(Number(rotaId))
}

const calendarOptions = reactive<any>({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin],
  locales: [zhLocale],
  headerToolbar: {
    left: "title",
    right: "today,dayGridMonth,prev,next,rule,settings",
    center: ""
  },
  initialView: "dayGridMonth",
  aspectRatio: 2.2,
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  unselectAuto: true,
  weekends: true,
  buttonText: {
    today: "当前",
    month: "月视图",
    week: "周视图",
    day: "天视图",
    list: "列表"
  },
  customButtons: {
    rule: {
      text: "新增规则",
      click: addShifSchedulingRule
    },
    settings: {
      text: "查看规则",
      click: listShifSchedulingRule
    }
  },
  contentHeight: "auto",
  height: "auto",
  handleWindowResize: true,
  windowResizeDelay: 500,
  datesSet: function (info) {
    visibleStart.value = info.view.activeStart.getTime()
    endStart.value = info.view.activeEnd.getTime()
    preview()
  },
  select: handleDateSelect,
  eventMouseEnter: handleEventMouseEnter,
  // eventMouseLeave: handleEventMouseLeave,
  eventsSet: handleEvents
} as CalendarOptions)

const visibleStart = ref<number>(0)
const endStart = ref<number>(0)
const currentEvents = ref<EventApi[]>([])
const calendarRef = ref()
const dialogVisible = ref<boolean>(false)
const dialogListRuleVisible = ref<boolean>(false)
const event = ref<EventInput[]>([])

async function addShifSchedulingRule() {
  await getRuleList()

  if (rotaRuleData.value.length >= 1) {
    ElMessage.warning("当前最多只能添加 1 个规则")
    return
  }

  dialogVisible.value = true
}

// 获取指定排班-规则列表
const rotaRuleData = ref<rotaRule[]>([])
const getRuleList = async () => {
  await getRuleListById(Number(rotaId))
    .then(({ data }) => {
      rotaRuleData.value = data
    })
    .catch(() => {
      rotaRuleData.value = []
    })
    .finally(() => {})
}

function handleEventMouseEnter(info: EventHoveringArg) {
  // 创建 Vue 应用程序
  console.log("info", info.event.groupId)
  const app = createApp({
    render() {
      return h("div", [
        h("div", { style: "font-weight: bold; margin-bottom: 5px;" }, info.event.title),
        h("div", { style: "margin-bottom: 5px;" }, `${formatDate(info.event.start)} - ${formatDate(info.event.end)}`),
        h(ElDivider, { style: "margin: 10px 0;" }),
        h("div", { style: "margin-bottom: 10px;" }, [h("div", "值班人员："), h("div", "张三"), h("div", "李四")]),
        h(ElDivider, { style: "margin: 10px 0;" }),
        h("div", { style: "display: flex; gap: 10px; justify-content: flex-end;" }, [
          h(
            ElButton,
            {
              type: "primary",
              size: "small",
              onClick: () => {
                console.log("编辑按钮被点击")
                alert("编辑操作")
              }
            },
            "编辑"
          ),
          h(
            ElButton,
            {
              type: "warning",
              size: "small",
              onClick: () => {
                console.log("调班按钮被点击")
                alert("调班操作")
              }
            },
            "调班"
          )
        ])
      ])
    }
  })

  // 创建一个容器 DOM
  const container = document.createElement("div")

  // 挂载 Vue 应用到容器
  app.mount(container)

  const instance = tippy(info.el, {
    content: container,
    placement: "bottom",
    theme: "gradient",
    interactive: true,
    appendTo: document.body,
    allowHTML: true,
    arrow: true,
    zIndex: 9999,
    followCursor: "horizontal",
    plugins: [followCursor],
    onHidden() {
      // 销毁 Vue 应用并清理容器
      app.unmount()
      container.remove()
    }
  })

  // 显示工具提示
  instance.show()
}

async function listShifSchedulingRule() {
  await getRuleList()

  if (rotaRuleData.value.length === 0) {
    ElMessage.warning("暂无规则, 请先添加")
    return
  }
  dialogListRuleVisible.value = true

  nextTick(() => {
    ruleListRef.value?.setRules(Number(rotaId), rotaRuleData.value)
  })
}

function handleDateSelect(selectInfo: DateSelectArg) {
  const title = prompt("Please enter a new title for your event")
  const calendarApi = selectInfo.view.calendar
  calendarApi.unselect()

  if (title) {
    calendarApi.addEvent({
      id: createEventId(),
      title,
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay
    })
  }
}

const preview = () => {
  previewSchedule({
    id: Number(rotaId),
    start_time: visibleStart.value,
    end_time: endStart.value
  })
    .then(({ data }) => {
      event.value = []
      data.final_schedule.forEach((item: schedule) => {
        event.value.push({
          id: createEventId(),
          title: item.title + " - " + item.rota_group.name,
          start: item.start_time,
          end: item.end_time
        })
      })

      calendarOptions.events = event.value
    })
    .catch((error) => {
      console.log(error)
    })
    .finally(() => {})
}

function handleEvents(events: EventApi[]) {
  console.log("selectInfo", events)
  currentEvents.value = events
}
</script>

<style lang="scss" scoped>
.app-sidebar-header {
  display: flex;
  justify-content: space-between;
  min-height: 100%;
  font-family:
    Arial,
    Helvetica Neue,
    Helvetica,
    sans-serif;
  font-size: 14px;
}

.app-sidebar-section {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.card-item {
  flex: 1;
  margin-top: 15px;
  margin-bottom: 20px;
}

.demo-app-sidebar-section {
  padding: 2em;
}

.fc {
  height: 100%;
  width: 100%;
}

:deep(.fc .fc-icon) {
  font-family: fcicons !important; /* 确保字体加载正确 */
}
</style>
