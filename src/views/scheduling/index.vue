<template>
  <div class="app-container">
    <div class="app-sidebar">
      <div class="app-sidebar-header">
        <span>
          <b>排班表</b>
        </span>
        <div>
          <el-button>规则</el-button>
          <el-button>设置</el-button>
        </div>
      </div>
      <div class="app-sidebar-section">
        <el-card class="card-item">当前排班</el-card>
        <el-card class="card-item">下期排班</el-card>
      </div>
    </div>
    <div class="app-main">
      <FullCalendar ref="calendarRef" class="demo-app-calendar" :options="calendarOptions">
        <template v-slot:eventContent="arg">
          <b>{{ arg.timeText }}</b>
          <i>{{ arg.event.title }}</i>
        </template>
      </FullCalendar>
      <!-- <div class="app-sidebar-event">
        <h2>All Events ({{ currentEvents.length }})</h2>
        <ul>
          <li v-for="event in currentEvents" :key="event.id">
            <b>{{ event.startStr }}</b>
            <i>{{ event.title }}</i>
          </li>
        </ul>
      </div> -->
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue"
import { CalendarOptions, EventApi, DateSelectArg, EventClickArg } from "@fullcalendar/core"
import zhLocale from "@fullcalendar/core/locales/zh-cn"
import FullCalendar from "@fullcalendar/vue3"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { INITIAL_EVENTS, createEventId } from "./event-utils"

const calendarOptions = reactive<any>({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  locales: [zhLocale],
  headerToolbar: {
    left: "prev,next",
    right: "dayGridMonth,timeGridWeek,today",
    center: "title"
  },
  initialView: "dayGridMonth",
  initialEvents: INITIAL_EVENTS,
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  contentHeight: "auto",
  height: "auto",
  handleWindowResize: true,
  windowResizeDelay: 500,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventsSet: handleEvents
} as CalendarOptions)

const currentEvents = ref<EventApi[]>([])

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

const calendarRef = ref<HTMLElement | null>(null)

function handleEventClick(clickInfo: EventClickArg) {
  if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
    clickInfo.event.remove()
  }
}

function handleEvents(events: EventApi[]) {
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
  max-height: 500px;
  width: 100%;
}

:deep(.fc .fc-icon) {
  font-family: fcicons !important; /* 确保字体加载正确 */
}
</style>
