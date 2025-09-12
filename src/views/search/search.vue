<template>
  <div class="search-page">
    <div class="search-container">
      <div class="search-header">
        <h1 class="search-title">全局搜索</h1>
        <p class="search-subtitle">搜索所有资源数据</p>
      </div>

      <div class="search-input-wrapper">
        <div class="elegant-search-card">
          <div class="search-input-group">
            <el-icon class="search-icon"><Search /></el-icon>
            <el-input
              v-model="inputSearch"
              placeholder="搜索资源..."
              size="large"
              clearable
              @keyup.enter="search"
              class="elegant-search-input"
            />
            <el-button type="primary" @click="search" class="elegant-search-button" :icon="Search" size="large">
              搜索
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="searchHistory.length > 0" class="history-section">
        <div class="history-header">
          <h3>搜索历史</h3>
          <el-button type="primary" text @click="removeHistory" :icon="Delete"> 清除历史 </el-button>
        </div>
        <div class="history-tags">
          <el-tag
            v-for="(history, index) in searchHistory"
            :key="index"
            class="history-tag"
            @click="handlerTagClick(history)"
            effect="plain"
            size="large"
          >
            {{ history }}
          </el-tag>
        </div>
      </div>

      <div v-else class="empty-history">
        <div class="empty-text">暂无搜索历史</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { Search, Delete } from "@element-plus/icons-vue"
import { useSearchStore } from "@/pinia/stores/search"

const router = useRouter()
const inputSearch = ref("")
const searchHistory = computed(() => useSearchStore().historySearchData)

const search = () => {
  if (inputSearch.value.trim() === "") {
    ElMessage.error("搜索内容不成为空")
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
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  padding: 40px;
  max-width: 600px;
  width: 100%;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.search-header {
  margin-bottom: 32px;

  .search-title {
    font-size: 32px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .search-subtitle {
    font-size: 16px;
    color: #64748b;
    margin: 0;
    font-weight: 500;
  }
}

.search-input-wrapper {
  margin-bottom: 32px;
  display: flex;
  justify-content: center;

  .elegant-search-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    padding: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    width: 100%;
    max-width: 500px;

    &:hover {
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .search-input-group {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 8px;

      .search-icon {
        color: #64748b;
        font-size: 18px;
        margin-left: 6px;
        transition: color 0.3s ease;
      }

      .elegant-search-input {
        flex: 1;

        :deep(.el-input__wrapper) {
          border: none;
          box-shadow: none;
          background: transparent;
          padding: 0;
          border-radius: 0;

          &:hover,
          &.is-focus {
            box-shadow: none;
            border: none;
          }

          .el-input__inner {
            font-size: 14px;
            color: #1e293b;
            font-weight: 500;

            &::placeholder {
              color: #94a3b8;
              font-weight: 400;
            }
          }
        }
      }

      .elegant-search-button {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border: none;
        border-radius: 10px;
        padding: 10px 20px;
        font-weight: 600;
        font-size: 13px;
        color: white;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background: linear-gradient(135deg, #5b5bd6 0%, #7c3aed 100%);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }
      }
    }
  }
}

.history-section {
  text-align: left;

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
    }
  }

  .history-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .history-tag {
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 24px;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 500;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;

      &:hover {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
        border-color: transparent;
      }
    }
  }
}

.empty-history {
  padding: 16px 0;
  text-align: center;

  .empty-text {
    color: #94a3b8;
    font-size: 14px;
    font-weight: 400;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .search-page {
    padding: 16px;
  }

  .search-container {
    padding: 24px;
  }

  .search-header {
    .search-title {
      font-size: 24px;
    }

    .search-subtitle {
      font-size: 14px;
    }
  }

  .search-input-wrapper {
    .elegant-search-card {
      .search-input-group {
        .search-icon {
          font-size: 16px;
        }

        .elegant-search-button {
          padding: 8px 16px;
          font-size: 12px;
        }
      }
    }
  }

  .history-tags {
    .history-tag {
      font-size: 12px;
      padding: 8px 14px;
    }
  }
}

@media (max-width: 480px) {
  .search-container {
    padding: 20px;
  }

  .search-input-wrapper {
    .elegant-search-card {
      .search-input-group {
        gap: 8px;
        padding: 2px 6px;

        .search-icon {
          font-size: 16px;
          margin-left: 4px;
        }

        .elegant-search-button {
          padding: 6px 12px;
          font-size: 11px;
          border-radius: 8px;
        }
      }
    }
  }
}
</style>
