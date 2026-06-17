<template>
  <div class="search-page">
    <div class="search-container">
      <section class="search-stage">
        <div class="header-copy">
          <h1 class="search-title">
            <span>全局资源搜索</span>
          </h1>
          <p class="search-subtitle">统一检索资产数据，快速定位资源名称、IP、序列号与模型字段</p>
        </div>

        <div class="search-stack">
          <div class="search-input-group">
            <div class="search-input-main">
              <el-icon class="search-icon"><Search /></el-icon>
              <el-input
                v-model="inputSearch"
                placeholder="搜索资源数据，如资源名称、IP、序列号、模型字段"
                size="large"
                clearable
                @keyup.enter="search"
                class="elegant-search-input"
              />
              <span class="enter-hint">Enter</span>
            </div>
            <button class="search-submit" type="button" @click="search">
              <el-icon><Search /></el-icon>
              <span>搜索</span>
            </button>
          </div>

          <div v-if="searchHistory.length > 0" class="history-section">
            <div class="history-header">
              <h2>最近搜索</h2>
              <el-button type="primary" text @click="removeHistory" :icon="Delete">清除</el-button>
            </div>
            <div class="history-list">
              <button
                v-for="(history, index) in searchHistory"
                :key="index"
                class="history-row"
                @click="handlerTagClick(history)"
              >
                <el-icon><Clock /></el-icon>
                <span class="history-keyword">{{ history }}</span>
                <span class="history-action">搜索</span>
              </button>
            </div>
          </div>
          <div v-else class="history-section history-empty-section">
            <div class="history-header">
              <h2>最近搜索</h2>
            </div>
            <div class="empty-search-history">
              <el-icon><Clock /></el-icon>
              <span>暂无搜索记录，输入关键词开始检索资源数据</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { Clock, Delete, Search } from "@element-plus/icons-vue"
import { useSearchStore } from "@/pinia/stores/search"

const router = useRouter()
const inputSearch = ref("")
const searchHistory = computed(() => useSearchStore().historySearchData)

const search = () => {
  if (inputSearch.value.trim() === "") {
    ElMessage.error("请输入搜索内容")
    return
  }

  useSearchStore().addHistorySearch(inputSearch.value.trim())
  router.push({
    path: "/cmdb/dashboard/search",
    query: { text: inputSearch.value }
  })
}

const removeHistory = () => {
  useSearchStore().clearHistorySearch()
}

const handlerTagClick = (history: string) => {
  router.push({
    path: "/cmdb/dashboard/search",
    query: { text: history }
  })
}
</script>

<style scoped lang="scss">
.search-page {
  position: relative;
  min-height: 100%;
  overflow: auto;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 34%, #f7fafc 100%);
  color: #0f172a;
  font-family: "Inter", "PingFang SC", sans-serif;
  --search-main-width: min(820px, calc(100vw - 64px));
  --search-top-space: clamp(72px, 14vh, 132px);
  --search-title-size: clamp(28px, 3vw, 42px);
  --search-subtitle-size: 14px;
  --search-box-height: 58px;
  --search-input-size: 16px;
  --search-history-size: 14px;
}

.search-container {
  position: relative;
  z-index: 1;
  min-height: 100%;
  padding: var(--search-top-space) 32px 32px;
  box-sizing: border-box;
}

.search-stage {
  position: relative;
  max-width: var(--search-main-width);
  margin: 0 auto;
  text-align: center;
}

.search-title {
  display: block;
  margin: 0 0 8px;
  color: #0f172a;
  font-size: var(--search-title-size);
  line-height: 1.18;
  font-weight: 800;
  letter-spacing: 0;
}

.search-subtitle {
  margin: 0;
  color: #64748b;
  font-size: var(--search-subtitle-size);
  line-height: 1.7;
  font-weight: 500;
}

.search-stack {
  margin-top: 28px;
}

.search-input-group {
  display: flex;
  align-items: center;
  min-height: var(--search-box-height);
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 18px 36px -30px rgba(15, 23, 42, 0.46);
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus-within {
    border-color: #2563eb;
    box-shadow:
      0 0 0 3px rgba(37, 99, 235, 0.1),
      0 22px 42px -32px rgba(37, 99, 235, 0.72);
  }
}

.search-input-main {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: var(--search-box-height);
  padding: 0 14px 0 18px;

  .search-icon {
    flex: 0 0 auto;
    margin-right: 10px;
    color: #64748b;
    font-size: 18px;
  }

  .enter-hint {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 8px;
    border-radius: 6px;
    background: #f1f5f9;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
  }
}

.elegant-search-input {
  flex: 1;

  :deep(.el-input__wrapper) {
    border: none;
    box-shadow: none;
    background: transparent;
    padding: 0;

    &:hover,
    &.is-focus {
      box-shadow: none;
    }

    .el-input__inner {
      color: #0f172a;
      font-size: var(--search-input-size);
      font-weight: 500;

      &::placeholder {
        color: #94a3b8;
        font-weight: 400;
      }
    }
  }
}

.search-submit {
  align-self: stretch;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 118px;
  padding: 0 24px;
  border: 0;
  border-left: 1px solid #1d4ed8;
  background: #2563eb;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;

  &:hover,
  &:focus {
    background: #1d4ed8;
    outline: none;
  }

  &:active {
    background: #1e40af;
  }
}

.history-section {
  margin-top: 24px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 12px 32px -30px rgba(15, 23, 42, 0.42);
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px 8px;
  border-bottom: 1px solid #edf2f7;

  h2 {
    margin: 0;
    color: #334155;
    font-size: 13px;
    line-height: 1.25;
    font-weight: 800;
  }
}

:deep(.history-header .el-button) {
  height: 26px;
  padding: 0 4px;
  font-weight: 600;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.empty-search-history {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 0 8px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  text-align: left;

  .el-icon {
    flex: 0 0 auto;
    color: #cbd5e1;
    font-size: 18px;
  }
}

.history-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  width: 100%;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: #475569;
  font-size: var(--search-history-size);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    color: #2563eb;
    background: #f8fbff;
    border-color: #dbeafe;
  }

  .el-icon {
    justify-self: center;
    color: #94a3b8;
    font-size: 16px;
  }
}

.history-keyword {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-action {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
}

@media (hover: none) {
  .enter-hint {
    display: none;
  }
}

@media (min-width: 1921px) {
  .search-page {
    --search-main-width: min(1040px, calc(100vw - 120px));
    --search-top-space: clamp(108px, 15vh, 180px);
    --search-title-size: clamp(42px, 2vw, 56px);
    --search-subtitle-size: 16px;
    --search-box-height: 72px;
    --search-input-size: 18px;
    --search-history-size: 15px;
  }

  .search-stack {
    margin-top: 36px;
  }

  .search-submit {
    min-width: 150px;
    font-size: 17px;
  }
}

@media (max-width: 1180px) {
  .search-page {
    --search-main-width: min(760px, calc(100vw - 48px));
    --search-top-space: 72px;
    --search-title-size: 36px;
  }

  .search-container {
    padding: var(--search-top-space) 24px 28px;
  }
}

@media (max-width: 760px) {
  .search-page {
    --search-main-width: 100%;
    --search-top-space: 42px;
    --search-title-size: 28px;
    --search-box-height: auto;
  }

  .search-container {
    padding: var(--search-top-space) 20px 24px;
  }

  .search-input-group {
    display: block;
    overflow: visible;
    border-radius: 10px;

    &:focus-within {
      box-shadow:
        0 0 0 3px rgba(37, 99, 235, 0.1),
        0 16px 32px -28px rgba(37, 99, 235, 0.62);
    }
  }

  .search-input-main {
    height: 52px;
    padding: 0 14px;
  }

  .search-submit {
    width: 100%;
    min-height: 46px;
    border-left: 0;
    border-top: 1px solid #1d4ed8;
    border-radius: 0 0 9px 9px;
  }

  .history-header {
    align-items: center;
    flex-direction: row;
  }

  .history-section {
    padding: 12px;
  }
}
</style>
