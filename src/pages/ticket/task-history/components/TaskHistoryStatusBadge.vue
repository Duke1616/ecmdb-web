<template>
  <div class="status-cell">
    <span class="status-badge" :class="`is-${statusMeta.tone}`">
      <i class="status-dot" />
      {{ statusMeta.text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { getTaskStatus } from "../composables/useTaskHistoryStatus"

const props = defineProps<{
  status: number
}>()

const statusMeta = computed(() => getTaskStatus(props.status))
</script>

<style scoped lang="scss">
.status-cell {
  display: flex;
  justify-content: center;
  width: 100%;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 64px;
  height: 26px;
  padding: 0 10px;
  border: 1px solid #d8dee8;
  border-radius: 999px;
  background: #f8fafc;
  color: #4b5563;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  justify-content: center;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-badge.is-success {
  border-color: #c7ded4;
  background: #f3faf7;
  color: #277456;

  .status-dot {
    background: #3ba776;
  }
}

.status-badge.is-danger {
  border-color: #efd0d0;
  background: #fff7f7;
  color: #b44a4a;

  .status-dot {
    background: #d85c5c;
  }
}

.status-badge.is-running {
  border-color: #cbdaf2;
  background: #f5f8fd;
  color: #386aa8;

  .status-dot {
    background: #4d86d8;
  }
}

.status-badge.is-warning {
  border-color: #ead9ba;
  background: #fffaf0;
  color: #9a6a21;

  .status-dot {
    background: #d0922f;
  }
}
</style>
