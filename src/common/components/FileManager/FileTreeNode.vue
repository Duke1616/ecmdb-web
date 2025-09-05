<template>
  <div class="file-tree-node">
    <!-- 当前文件/文件夹项 -->
    <div
      class="file-item"
      :class="{ active: currentFileId === file.id }"
      :style="{ paddingLeft: `${level * 20 + 8}px` }"
      @click="handleClick"
      @contextmenu="handleContextMenu"
    >
      <span 
        v-if="file.type === 'folder'" 
        class="folder-toggle"
        @click.stop="toggleFolder"
      >
        <span class="arrow" :class="{ expanded: isExpanded }">▶</span>
        <span class="folder-icon">📁</span>
      </span>
      <span v-else class="file-icon">📄</span>
      <span class="file-name">{{ file.name }}</span>
      <div class="file-actions">
        <button @click.stop="renameFile" class="btn-icon" title="重命名">
          ✏️
        </button>
        <button @click.stop="deleteFile" class="btn-icon" title="删除">
          🗑️
        </button>
      </div>
    </div>
    
    <!-- 递归渲染子节点 -->
    <div v-if="file.type === 'folder' && isExpanded && file.children" class="children">
      <FileTreeNode
        v-for="child in file.children"
        :key="child.id"
        :file="child"
        :current-file-id="currentFileId"
        :expanded-folders="expandedFolders"
        :level="level + 1"
        @select-file="$emit('select-file', $event)"
        @toggle-folder="$emit('toggle-folder', $event)"
        @rename-file="$emit('rename-file', $event)"
        @delete-file="$emit('delete-file', $event)"
        @context-menu="(event, file) => $emit('context-menu', event, file)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string
  language?: string
  children?: FileNode[]
  parentId?: string
}

interface Props {
  file: FileNode
  currentFileId: string
  expandedFolders: Set<string>
  level: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select-file', file: FileNode): void
  (e: 'toggle-folder', folderId: string): void
  (e: 'rename-file', file: FileNode): void
  (e: 'delete-file', file: FileNode): void
  (e: 'context-menu', event: MouseEvent, file: FileNode): void
}>()

// 计算属性
const isExpanded = computed(() => {
  return props.expandedFolders.has(props.file.id)
})

// 事件处理
const handleClick = () => {
  if (props.file.type === 'file') {
    emit('select-file', props.file)
  } else {
    emit('toggle-folder', props.file.id)
  }
}

const toggleFolder = () => {
  emit('toggle-folder', props.file.id)
}

const renameFile = () => {
  emit('rename-file', props.file)
}

const deleteFile = () => {
  emit('delete-file', props.file)
}

const handleContextMenu = (event: MouseEvent) => {
  emit('context-menu', event, props.file)
}
</script>

<style lang="scss" scoped>
.file-tree-node {
  .file-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    margin: 2px 0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: #f1f5f9;
    }
    
    &.active {
      background: #dbeafe;
      color: #1d4ed8;
    }
    
    .folder-toggle {
      display: flex;
      align-items: center;
      margin-right: 8px;
      cursor: pointer;
      user-select: none;
      
      .arrow {
        font-size: 12px;
        color: #6b7280;
        margin-right: 4px;
        transition: transform 0.2s ease;
        display: inline-block;
        
        &.expanded {
          transform: rotate(90deg);
        }
      }
      
      .folder-icon {
        font-size: 16px;
      }
    }
    
    .file-icon {
      margin-right: 8px;
      font-size: 16px;
    }
    
    .file-name {
      flex: 1;
      font-size: 14px;
      color: #374151;
    }
    
    .file-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
      
      .btn-icon {
        background: none;
        border: none;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        
        &:hover {
          background: #e5e7eb;
        }
      }
    }
    
    &:hover .file-actions {
      opacity: 1;
    }
  }
  
  .children {
    margin-left: 16px;
  }
}
</style>
