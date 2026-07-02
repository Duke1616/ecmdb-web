<template>
  <ProGovernanceLayout
    title="排班详情"
    subtitle="查看和管理排班规则及日程安排"
    :show-back-button="true"
    :primary-action="{ capability: ALERT_CAPABILITIES.Oncall.RuleAdd, label: '新增规则', icon: Plus }"
    :secondary-action="{ capability: ALERT_CAPABILITIES.Oncall.RuleView, label: '查看规则', icon: Setting }"
    @back="goBack"
    @primary-action="addShifSchedulingRule"
    @secondary-action="listShifSchedulingRule"
    @refresh="refreshDetail"
  >
    <div class="detail-content">
      <div class="schedule-cards">
        <!-- 当前值班 -->
        <div class="schedule-card-wrapper">
          <ScheduleCard title="当前值班" :schedule="currentSchedule" :formatTimestamp="formatTimestamp" />
        </div>
        <!-- 下期值班 -->
        <div class="schedule-card-wrapper">
          <ScheduleCard title="下期值班" :schedule="nextSchedule" :formatTimestamp="formatTimestamp" />
        </div>
      </div>

      <div class="active-rule-status" :class="{ empty: !activeRule }">
        <div class="active-rule-main">
          <el-icon class="active-rule-icon"><Setting /></el-icon>
          <div class="active-rule-text">
            <div class="active-rule-title">
              <span>当前生效规则</span>
              <el-tag v-if="activeRule" size="small" type="success" effect="plain">
                规则 {{ activeRuleIndex + 1 }}
              </el-tag>
              <el-tag v-else size="small" type="info" effect="plain">未配置</el-tag>
            </div>
            <div class="active-rule-desc">{{ activeRuleDescription }}</div>
          </div>
        </div>
        <AuthButton
          size="small"
          text
          type="primary"
          :capability="ALERT_CAPABILITIES.Oncall.RuleView"
          disable-mode
          @click="listShifSchedulingRule"
        >
          查看规则
        </AuthButton>
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
          <FullCalendar ref="calendarRef" class="app-calendar" :options="calendarOptions">
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
      width="min(1080px, 92vw)"
      :full-height="true"
      confirm-text="保存"
      cancel-text="取消"
      @confirm="handlerSubmitRotaRule"
      @cancel="onClosed"
      @closed="onClosed"
    >
      <Rule ref="ruleRef" @closed="onClosed" @callback="refreshDetail" />
    </FormDialog>

    <!-- 规则列表对话框 -->
    <FormDialog
      v-model="dialogListRuleVisible"
      title="规则列表"
      subtitle="查看和管理现有规则"
      header-icon="List"
      width="min(1080px, 92vw)"
      :full-height="true"
      :show-footer="false"
      @cancel="onRuleListClosed"
      @closed="onRuleListClosed"
    >
      <ListRule ref="ruleListRef" @closed="onRuleListClosed" @callback="refreshDetail" />
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
  </ProGovernanceLayout>
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick, createApp, h, watch, computed } from "vue"
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
import { deleteShiftAdjustmentRuleApi, getOnCallRuleByIdApi, previewScheduleApi } from "@/api/alert/oncall"
import { OnCallRule, Schedule } from "@/api/alert/oncall/types/oncall"
import { ElDivider, ElMessage, ElTooltip } from "element-plus"
import { Plus, Setting, RefreshRight, Calendar } from "@element-plus/icons-vue"
import tippy, { followCursor } from "tippy.js"
import "tippy.js/dist/tippy.css"
import "tippy.js/themes/light.css"
import "tippy.js/animations/scale.css"
import { formatDate, formatTimestamp } from "@/common/utils/day"
import { isEqual } from "lodash-es"
import { useAppStore } from "@/pinia/stores/app"
import { useUserToolsStore } from "@/pinia/stores/user-tools"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import { FormDialog } from "@@/components/Dialogs"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
const appStore = useAppStore()
const userToolsStore = useUserToolsStore()

const route = useRoute()
const rotaId = route.query.id as string

const currentSchedule = ref<Schedule>()
const nextSchedule = ref<Schedule>()

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

    refreshDetail()
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
  dialogVisible.value = true
}

// 获取指定排班-规则列表
const oncallRuleData = ref<OnCallRule[]>([])
const getRuleId = (rule?: OnCallRule) => rule?.id || rule?.rule_id || 0
const activeRuleIndex = computed(() => oncallRuleData.value.findIndex((rule) => rule.enabled))
const activeRule = computed(() => (activeRuleIndex.value >= 0 ? oncallRuleData.value[activeRuleIndex.value] : null))
const activeRuleDescription = computed(() => {
  if (!activeRule.value) {
    return oncallRuleData.value.length > 0 ? "当前没有启用的规则，请在规则列表中设为启用" : "暂无规则，请先新增排班规则"
  }

  const groupCount = activeRule.value.oncall_groups?.length || 0
  const memberCount =
    activeRule.value.oncall_groups?.reduce((total, group) => total + (group.members?.length || 0), 0) || 0
  const rotate = activeRule.value.rotate
  const rotateUnit = rotate?.time_unit === 5 ? "小时" : "天"
  const rotateText = rotate?.time_duration ? `每 ${rotate.time_duration} ${rotateUnit}轮换` : "未设置轮换周期"
  const ruleId = getRuleId(activeRule.value)

  return `ID ${ruleId}，${groupCount} 个组，${memberCount} 人，${rotateText}`
})
const getRuleList = async () => {
  await getOnCallRuleByIdApi(Number(rotaId))
    .then(({ data }) => {
      oncallRuleData.value = data
    })
    .catch(() => {
      oncallRuleData.value = []
    })
    .finally(() => {})
}

const refreshDetail = () => {
  preview()
  getRuleList()
}

function handleEventMouseEnter(info: EventHoveringArg) {
  // 创建 Vue 应用程序
  const memberNames = (info.event.extendedProps.members || [])
    .map((username: string) => userToolsStore.getNickname(username) || username)
    .join("、")

  const app = createApp({
    render() {
      // 按钮数组，动态渲染
      const buttons = []

      // 如果 groupId 是 TEMP，则添加“撤销”按钮
      if (info.event.groupId === "TEMP") {
        buttons.push(
          h(
            AuthButton,
            {
              capability: ALERT_CAPABILITIES.Oncall.AdjDelete,
              disableMode: true,
              type: "danger",
              size: "small",
              style: { flex: "1" },
              onClick: () => {
                deleteShiftAdjustmentRuleApi({ id: Number(rotaId), group_id: info.event.extendedProps.groupid })
                  .then(() => {
                    ElMessage.success("撤销成功")
                    preview()
                    instance.hide()
                  })
                  .catch(() => {
                    ElMessage.error("撤销失败")
                  })
                  .finally(() => {})
              }
            },
            { default: () => "撤销" }
          )
        )
      }

      // 添加“调班”按钮
      buttons.push(
        h(
          AuthButton,
          {
            capability:
              info.event.groupId === "TEMP" ? ALERT_CAPABILITIES.Oncall.AdjEdit : ALERT_CAPABILITIES.Oncall.AdjAdd,
            disableMode: true,
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
          { default: () => "调班" }
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

  if (oncallRuleData.value.length === 0) {
    ElMessage.warning("暂无规则, 请先添加")
    return
  }
  dialogListRuleVisible.value = true

  nextTick(() => {
    ruleListRef.value?.setRules(Number(rotaId), oncallRuleData.value)
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
  previewScheduleApi({
    id: Number(rotaId),
    start_time: visibleStart.value,
    end_time: endStart.value
  })
    .then(({ data }) => {
      event.value = []
      members.value = data.members

      // 录入当前值班，下期值班
      currentSchedule.value = data.current_schedule
      nextSchedule.value = data.next_schedule

      data.final_schedule.forEach((item: Schedule) => {
        // 计算时间戳差值，确保时间戳为毫秒单位
        const duration = (item.end_time - item.start_time) / (1000 * 60 * 60 * 24)
        const isAllDay = duration >= 1

        event.value.push({
          id: createEventId(),
          title: item.title + " - " + item.oncall_group.name,
          start: item.start_time,
          end: item.end_time,
          backgroundColor: colorMap.get(item.oncall_group.name)?.color,
          allDay: isAllDay,
          groupId: item.oncall_group.name,
          extendedProps: {
            groupid: item.oncall_group.id,
            members: item.oncall_group.members
          }
        })
      })

      calendarOptions.events = event.value
    })
    .catch(() => {
      ElMessage.error("获取排班预览失败")
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
      userToolsStore.batchResolveUsers(newMembers)
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
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  gap: calc(0.9rem + 0.2vw);
  padding-right: 2px;
}

.schedule-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: calc(1rem + 0.4vw);
  flex-shrink: 0;
}

.schedule-card-wrapper {
  min-height: 120px;
}

.active-rule-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #dbeafe;
  border-radius: 8px;

  &.empty {
    border-color: #e2e8f0;
    background: #f9fafb;

    .active-rule-icon {
      color: #94a3b8;
      background: #f1f5f9;
    }
  }
}

.active-rule-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.active-rule-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #2563eb;
  background: #eff6ff;
  border-radius: 8px;
}

.active-rule-text {
  min-width: 0;
}

.active-rule-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.active-rule-desc {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-card {
  flex: 0 0 auto;
  border-radius: calc(0.5rem + 0.1vw);
  display: flex;
  flex-direction: column;
  margin-bottom: calc(1rem + 0.1vw);
  overflow: visible;

  :deep(.el-card__header) {
    padding: calc(0.75rem + 0.2vw) calc(1rem + 0.4vw);
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
  }

  :deep(.el-card__body) {
    padding: calc(0.75rem + 0.2vw) calc(1rem + 0.4vw);
    overflow: visible;
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
  height: auto;
  min-height: 560px;
  border-radius: calc(0.375rem + 0.05vw);
  overflow: visible;
}

.fc {
  height: auto !important;
  width: 100%;
  border-radius: calc(0.375rem + 0.05vw);
}

:deep(.fc) {
  height: auto !important;
}

:deep(.fc-view-harness),
:deep(.fc-view-harness-active) {
  height: auto !important;
}

:deep(.fc-scroller),
:deep(.fc-scroller-liquid-absolute) {
  position: static !important;
  height: auto !important;
  overflow: visible !important;
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

:deep(.fc .fc-daygrid-day-frame) {
  box-sizing: border-box;
  padding-bottom: 10px;
}

:deep(.fc .fc-daygrid-event-harness) {
  margin-bottom: 6px;
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
