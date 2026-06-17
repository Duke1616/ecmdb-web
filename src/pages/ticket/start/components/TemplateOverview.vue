<template>
  <div class="catalog-overview">
    <TemplateSection
      title="最近使用"
      subtitle="快速回到刚刚发起过的服务"
      :templates="recentTemplates"
      :favorite-ids="favoriteIds"
      :can-create="canCreate"
      :can-favorite="canFavorite"
      @template-click="(id) => emit('template-click', id)"
      @toggle-favorite="(id, event) => emit('toggle-favorite', id, event)"
    />

    <div v-for="category in groups" :key="category.id" class="template-group">
      <div class="group-header">
        <div class="group-title">
          <el-icon class="group-icon"><Folder /></el-icon>
          <span>{{ category.name }}</span>
          <span class="group-count">({{ category.templates.length }})</span>
        </div>
      </div>

      <div class="templates-grid">
        <TemplateCard
          v-for="tpl in category.templates"
          :key="tpl.id"
          :template="tpl"
          :is-favorite="favoriteIds.includes(tpl.id)"
          :disabled="!canCreate"
          :can-favorite="canFavorite"
          @click="emit('template-click', tpl.id)"
          @toggle-favorite="(id, event) => emit('toggle-favorite', id, event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Folder } from "@element-plus/icons-vue"
import type { template, templateCombination } from "@/api/ticket/template/types/template"
import TemplateCard from "./TemplateCard.vue"
import TemplateSection from "./TemplateSection.vue"

defineProps<{
  recentTemplates: template[]
  groups: templateCombination[]
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
.catalog-overview {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.template-group {
  .group-header {
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f5f9;
  }

  .group-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #1e293b;
    font-size: 15px;
    font-weight: 700;
  }

  .group-icon {
    color: #4f46e5;
    font-size: 16px;
  }

  .group-count {
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
  }
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
