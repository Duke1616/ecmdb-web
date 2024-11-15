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
        <ListRule ref="ruleListRef" @closed="onRuleListClosed" />
      </el-dialog>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick } from "vue"
import { CalendarOptions, EventApi, DateSelectArg, EventClickArg } from "@fullcalendar/core"
import zhLocale from "@fullcalendar/core/locales/zh-cn"
import FullCalendar from "@fullcalendar/vue3"
import dayGridPlugin from "@fullcalendar/daygrid"
import rrulePlugin from "@fullcalendar/rrule"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { INITIAL_EVENTS, createEventId } from "./event-utils"
import Rule from "./rule/rule.vue"
import ListRule from "./rule/list-rule.vue"
import { useRoute } from "vue-router"
import { getRuleListById } from "@/api/rota"
import { rotaRule } from "@/api/rota/types/rota"
import { ElMessage } from "element-plus"

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
    right: "today,dayGridMonth,timeGridWeek,prev,next,rule,settings",
    center: ""
  },
  initialView: "dayGridMonth",
  aspectRatio: 2.2,
  events: [
    {
      title: "Shift A",
      rrule: {
        freq: "DAILY", // 设置为每日频率
        interval: 6, // 每隔 6 天一次（即 3 天工作，3 天休息）
        dtstart: "2024-11-13T10:30:00" // 起始时间
      }
    },
    {
      title: "Shift B",
      rrule: {
        freq: "DAILY", // 设置为每日频率
        interval: 6, // 每隔 6 天一次（即 3 天工作，3 天休息）
        dtstart: "2024-11-16T18:30:00" // 起始时间（Shift B 从 Shift A 结束后开始）
      }
    }
  ],
  initialEvents: INITIAL_EVENTS,
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
    const visibleStart = info.view.activeStart
    const visibleEnd = info.view.activeEnd

    console.log("当前视图的显示开始时间：", visibleStart.toISOString())
    console.log("当前视图的显示结束时间：", visibleEnd.toISOString())
  },
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventsSet: handleEvents
} as CalendarOptions)

const currentEvents = ref<EventApi[]>([])
const calendarRef = ref()
const dialogVisible = ref<boolean>(false)
const dialogListRuleVisible = ref<boolean>(false)

function addShifSchedulingRule() {
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

function handleEventClick(clickInfo: EventClickArg) {
  if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
    clickInfo.event.remove()
  }
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
