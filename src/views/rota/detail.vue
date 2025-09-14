<template>
  <PageContainer>
    <ManagerHeader title="排班详情" subtitle="查看和管理排班规则及日程安排" :show-back-button="true" @back="goBack">
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="addShifSchedulingRule" class="action-btn"> 新增规则 </el-button>
        <el-button type="primary" :icon="Setting" @click="listShifSchedulingRule" class="action-btn">
          查看规则
        </el-button>
        <el-tooltip content="刷新数据">
          <el-button type="primary" :icon="RefreshRight" circle @click="preview" class="refresh-btn" />
        </el-tooltip>
      </template>
    </ManagerHeader>

    <div class="detail-content">
      <div class="schedule-cards">
        <!-- 当前值班 -->
        <div class="schedule-card-wrapper">
          <ScheduleCard title="当前值班" :schedule="currentSchecule" :formatTimestamp="formatTimestamp" />
        </div>
        <!-- 下期值班 -->
        <div class="schedule-card-wrapper">
          <ScheduleCard title="下期值班" :schedule="nextSchecule" :formatTimestamp="formatTimestamp" />
        </div>
      </div>

      <el-card class="calendar-card" shadow="hover">
        <template #header>
          <div class="calendar-header">
            <div class="calendar-title">
              <el-icon class="title-icon">
                <Calendar />
              </el-icon>
              <span>排班日历</span>
            </div>
            <div class="calendar-actions">
              <el-tooltip content="今天">
                <el-button size="small" :icon="Calendar" circle @click="goToToday" />
              </el-tooltip>
              <el-tooltip content="刷新">
                <el-button size="small" :icon="RefreshRight" circle @click="preview" />
              </el-tooltip>
            </div>
          </div>
        </template>
        <div class="calendar-container">
          <FullCalendar ref="calendarRef" class="demo-app-calendar" :options="calendarOptions">
            <template v-slot:eventContent="arg">
              <div class="event-content">
                <span class="event-time">{{ arg.timeText }}</span>
                <span class="event-title">{{ arg.event.title }}</span>
              </div>
            </template>
          </FullCalendar>
        </div>
      </el-card>
    </div>
    <!-- 新增规则对话框 -->
    <FormDialog
      v-model="dialogVisible"
      title="新增规则"
      subtitle="配置新的排班规则"
      header-icon="Calendar"
      confirm-text="保存"
      cancel-text="取消"
      @confirm="handlerSubmitRotaRule"
      @cancel="onClosed"
      @closed="onClosed"
    >
      <Rule ref="ruleRef" @closed="onClosed" />
    </FormDialog>

    <!-- 规则列表对话框 -->
    <FormDialog
      v-model="dialogListRuleVisible"
      title="规则列表"
      subtitle="查看和管理现有规则"
      header-icon="List"
      :show-footer="false"
      @cancel="onRuleListClosed"
      @closed="onRuleListClosed"
    >
      <ListRule ref="ruleListRef" @closed="onRuleListClosed" @callback="preview" />
    </FormDialog>

    <!-- 临时调班对话框 -->
    <FormDialog
      v-model="dialogAdjustmentRuleVisible"
      title="临时调班"
      subtitle="调整值班安排"
      header-icon="Refresh"
      width="500px"
      :show-footer="true"
      confirm-text="保存"
      cancel-text="取消"
      @confirm="handlerSubmitAdjustmentRule"
      @cancel="onAdjustmentRuleClosed"
      @closed="onAdjustmentRuleClosed"
    >
      <AdjustmentRule ref="adjustmentRuleRef" @closed="onAdjustmentRuleClosed" @callback="preview" />
    </FormDialog>
  </PageContainer>
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick, createApp, h, watch } from "vue"
import { CalendarOptions, EventApi, DateSelectArg, EventInput, EventHoveringArg } from "@fullcalendar/core"
import ScheduleCard from "./schedule-card.vue"
import zhLocale from "@fullcalendar/core/locales/zh-cn"
import FullCalendar from "@fullcalendar/vue3"
import dayGridPlugin from "@fullcalendar/daygrid"
import rrulePlugin from "@fullcalendar/rrule"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { createEventId, colorMap } from "./event-utils"
import Rule from "./rule/rule.vue"
import ListRule from "./rule/list-rule.vue"
import AdjustmentRule from "./rule/adjustment-rule.vue"
import { useRoute } from "vue-router"
import { deleteShifAdjustmentRuleApi, getRotaRuleById, previewSchedule } from "@/api/rota"
import { rotaRule, schedule } from "@/api/rota/types/rota"
import { ElButton, ElDivider, ElMessage, ElTooltip } from "element-plus"
import { Plus, Setting, RefreshRight, Calendar } from "@element-plus/icons-vue"
import tippy, { followCursor } from "tippy.js"
import "tippy.js/dist/tippy.css"
import "tippy.js/themes/light.css"
import "tippy.js/animations/scale.css"
import { formatDate, formatTimestamp } from "@/common/utils/day"
import { isEqual } from "lodash-es"
import { useAppStore } from "@/pinia/stores/app"
import { useUserToolsStore } from "@/pinia/stores/user-tools"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { FormDialog } from "@@/components/Dialogs"
const appStore = useAppStore()
const userToolsStore = useUserToolsStore()

const route = useRoute()
const rotaId = route.query.id as string

const currentSchecule = ref<schedule>()
const nextSchecule = ref<schedule>()

const onClosed = () => {
  dialogVisible.value = false
  ruleRef.value?.resetForm()
}

const onRuleListClosed = () => {
  dialogListRuleVisible.value = false
  ruleListRef.value?.resetRule()
}

const onAdjustmentRuleClosed = () => {
  dialogAdjustmentRuleVisible.value = false
  adjustmentRuleRef.value?.resetForm()
}

const calendarRef = ref<InstanceType<typeof FullCalendar>>()
const ruleRef = ref<InstanceType<typeof Rule>>()
const ruleListRef = ref<InstanceType<typeof ListRule>>()
const adjustmentRuleRef = ref<InstanceType<typeof AdjustmentRule>>()

// 添加新的规则
const handlerSubmitRotaRule = () => {
  ruleRef.value?.submitForm(Number(rotaId))
}

// 添加调班规则
const handlerSubmitAdjustmentRule = () => {
  adjustmentRuleRef.value?.submitForm(Number(rotaId))
}

// 跳转到今天
const goToToday = () => {
  calendarRef.value?.getApi().today()
}

// 返回上一页
const goBack = () => {
  window.history.back()
}

const calendarOptions = reactive<any>({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin],
  locales: [zhLocale],
  headerToolbar: {
    left: "dayGridMonth,timeGridWeek,timeGridDay",
    right: "prev,next",
    center: "title"
  },
  initialView: "dayGridMonth",
  editable: false,
  selectable: false,
  selectMirror: true,
  dayMaxEvents: 3,
  unselectAuto: true,
  weekends: true,
  buttonText: {
    today: "今天",
    month: "月",
    week: "周",
    day: "日",
    list: "列表"
  },
  contentHeight: "auto",
  height: "auto",
  aspectRatio: 1.8,
  handleWindowResize: true,
  windowResizeDelay: 500,
  datesSet: function (info) {
    visibleStart.value = info.view.activeStart.getTime()
    endStart.value = info.view.activeEnd.getTime()

    preview()
  },
  select: handleDateSelect,
  eventMouseEnter: handleEventMouseEnter,
  eventsSet: handleEvents
} as CalendarOptions)

const visibleStart = ref<number>(0)
const endStart = ref<number>(0)
const currentEvents = ref<EventApi[]>([])
const dialogVisible = ref<boolean>(false)
const dialogListRuleVisible = ref<boolean>(false)
const dialogAdjustmentRuleVisible = ref<boolean>(false)
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
  await getRotaRuleById(Number(rotaId))
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
  const memberNames = (info.event.extendedProps.members || [])
    .map((username: string) => userToolsStore.getOnlyDisplayName(username) || username)
    .join("、")

  console.log(info.event.start)

  const app = createApp({
    render() {
      // 按钮数组，动态渲染
      const buttons = []

      // 如果 groupId 是 TEMP，则添加“撤销”按钮
      if (info.event.groupId === "TEMP") {
        buttons.push(
          h(
            ElButton,
            {
              type: "danger",
              size: "small",
              style: { flex: "1" },
              onClick: () => {
                deleteShifAdjustmentRuleApi({ id: Number(rotaId), group_id: info.event.extendedProps.groupid })
                  .then(() => {
                    ElMessage.success("撤销成功")
                    preview()
                    instance.hide()
                  })
                  .catch(() => {})
                  .finally(() => {})
              }
            },
            "撤销"
          )
        )
      }

      // 添加“调班”按钮
      buttons.push(
        h(
          ElButton,
          {
            type: "primary",
            size: "small",
            style: { flex: "1" },
            onClick: () => {
              dialogAdjustmentRuleVisible.value = true
              nextTick(() => {
                // 只有当前组是调班组才写回数据
                if (info.event.groupId === "TEMP") {
                  adjustmentRuleRef.value?.setMembers(info.event.extendedProps.members)
                }

                adjustmentRuleRef.value?.setGroupId(info.event.extendedProps.groupid)
                adjustmentRuleRef.value?.setStartDate(info.event.start)
                adjustmentRuleRef.value?.setEndDate(info.event.end)
              })
            }
          },
          "调班"
        )
      )

      const containerStyle = {
        display: "flex",
        justifyContent: "space-between",
        gap: "10px",
        width: "100%"
      }

      return h("div", [
        h("div", { style: "font-weight: bold; margin-bottom: 5px;" }, info.event.title),
        h("div", { style: "margin-bottom: 5px;" }, `${formatDate(info.event.start)} - ${formatDate(info.event.end)}`),
        h(ElDivider, { style: "margin: 10px 0;" }),
        h("div", { style: "margin-bottom: 10px;" }, [h("div", "值班人员："), h("div", memberNames)]),
        h(ElDivider, { style: "margin: 10px 0;" }),
        h("div", { style: containerStyle }, buttons)
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

const members = ref<string[]>([])
const preview = () => {
  previewSchedule({
    id: Number(rotaId),
    start_time: visibleStart.value,
    end_time: endStart.value
  })
    .then(({ data }) => {
      event.value = []
      members.value = data.members

      // 录入当前值班，下期值班
      currentSchecule.value = data.current_schedule
      nextSchecule.value = data.next_schedule

      data.final_schedule.forEach((item: schedule) => {
        // 计算时间戳差值，确保时间戳为毫秒单位
        const duration = (item.end_time - item.start_time) / (1000 * 60 * 60 * 24)
        const isAllDay = duration >= 1

        event.value.push({
          id: createEventId(),
          title: item.title + " - " + item.rota_group.name,
          start: item.start_time,
          end: item.end_time,
          backgroundColor: colorMap.get(item.rota_group.name)?.color,
          allDay: isAllDay,
          groupId: item.rota_group.name,
          extendedProps: {
            groupid: item.rota_group.id,
            members: item.rota_group.members
          }
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
  currentEvents.value = events
}

// 深度监听 members 数据的变化
watch(
  members,
  (newMembers, oldMembers) => {
    if (!isEqual(newMembers, oldMembers)) {
      // 例如，重新加载数据或更新视图
      userToolsStore.setByUsernames(newMembers)
    }
  },
  { deep: true }
)

// 检测左侧菜单栏变化
// 副作用：屏幕宽度变小，无法正常展开 sidebar
watch(
  () => appStore.sidebar.opened,
  () => {
    window.dispatchEvent(new Event("resize"))
  },
  { immediate: false }
)
</script>

<style lang="scss" scoped>
.detail-content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 8rem);
  overflow: hidden;
}

.schedule-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: calc(1rem + 0.4vw);
  margin-bottom: calc(0.9rem + 0.2vw);
  flex-shrink: 0;
}

.schedule-card-wrapper {
  min-height: 120px;
}

.calendar-card {
  flex: 1;
  min-height: 0;
  border-radius: calc(0.5rem + 0.1vw);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.el-card__header) {
    padding: calc(0.75rem + 0.2vw) calc(1rem + 0.4vw);
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
  }

  :deep(.el-card__body) {
    padding: calc(0.75rem + 0.2vw) calc(1rem + 0.4vw);
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-title {
  display: flex;
  align-items: center;
  gap: calc(0.5rem + 0.1vw);
  font-size: calc(1rem + 0.2vw);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.title-icon {
  font-size: calc(1.25rem + 0.2vw);
  color: var(--el-color-primary);
}

.calendar-actions {
  display: flex;
  gap: calc(0.5rem + 0.1vw);
}

.calendar-container {
  height: 100%;
  min-height: 0;
  border-radius: calc(0.375rem + 0.05vw);
  overflow: auto;
  flex: 1;

  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-lighter);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-fill-color-dark);
    border-radius: 3px;

    &:hover {
      background: var(--el-fill-color-darker);
    }
  }
}

.fc {
  height: 100%;
  width: 100%;
  border-radius: calc(0.375rem + 0.05vw);
}

:deep(.fc .fc-icon) {
  font-family: fcicons !important;
}

:deep(.fc .fc-toolbar) {
  margin-bottom: calc(0.75rem + 0.2vw);
  padding: calc(0.5rem + 0.1vw) 0;
}

:deep(.fc .fc-toolbar-title) {
  font-size: calc(1.125rem + 0.2vw);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

:deep(.fc .fc-button) {
  font-size: calc(0.8rem + 0.1vw);
  padding: calc(0.375rem + 0.1vw) calc(0.75rem + 0.2vw);
  border-radius: calc(0.375rem + 0.05vw);
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

:deep(.fc .fc-button-primary) {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);

  &:hover {
    background: var(--el-color-primary-light-3);
    border-color: var(--el-color-primary-light-3);
  }
}

:deep(.fc .fc-daygrid-event) {
  font-size: calc(0.75rem + 0.1vw);
  padding: calc(0.25rem + 0.05vw) calc(0.375rem + 0.1vw);
  border-radius: calc(0.25rem + 0.05vw);
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
}

.event-content {
  display: flex;
  flex-direction: column;
  gap: calc(0.125rem + 0.05vw);
}

.event-time {
  font-size: calc(0.7rem + 0.1vw);
  font-weight: 600;
  opacity: 0.9;
}

.event-title {
  font-size: calc(0.75rem + 0.1vw);
  font-weight: 500;
  line-height: 1.2;
}

:deep(.fc .fc-daygrid-day) {
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--el-fill-color-lighter);
  }
}

:deep(.fc .fc-daygrid-day-number) {
  font-size: calc(0.875rem + 0.1vw);
  font-weight: 500;
  padding: calc(0.5rem + 0.1vw);
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border-radius: calc(0.25rem + 0.05vw);
  }
}

:deep(.fc .fc-day-today) {
  background-color: var(--el-color-primary-light-9);

  .fc-daygrid-day-number {
    background-color: var(--el-color-primary);
    color: white;
    border-radius: calc(0.25rem + 0.05vw);
  }
}
</style>
