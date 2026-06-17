<template>
  <section v-if="templates.length > 0" class="template-section">
    <div class="section-heading">
      <div>
        <h4>{{ title }}</h4>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <span class="section-count">{{ templates.length }}</span>
    </div>

    <div class="templates-grid">
      <TemplateCard
        v-for="tpl in templates"
        :key="tpl.id"
        :template="tpl"
        :is-favorite="favoriteIds.includes(tpl.id)"
        :disabled="!canCreate"
        :can-favorite="canFavorite"
        @click="emit('template-click', tpl.id)"
        @toggle-favorite="(id, event) => emit('toggle-favorite', id, event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { template } from "@/api/ticket/template/types/template"
import TemplateCard from "./TemplateCard.vue"

defineProps<{
  title: string
  subtitle?: string
  templates: template[]
  favoriteIds: number[]
  canCreate: boolean
  canFavorite: boolean
}>()

const emit = defineEmits<{
  "template-click": [id: number]
  "toggle-favorite": [id: number, event: Event]
}>()
</script>

<style lang="scss" scoped>
.template-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;

  h4 {
    margin: 0;
    color: #111827;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.4;
  }

  p {
    margin: 3px 0 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
  }
}

.section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 22px;
  padding: 0 8px;
  color: #475569;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

@media (max-width: 480px) {
  .templates-grid {
    grid-template-columns: 1fr;
  }
}
</style>
