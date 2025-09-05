<template>
  <div class="file-manager-demo">
    <div class="demo-header">
      <h2>文件管理系统演示</h2>
      <p>这是一个完整的文件目录管理代码编辑器演示页面</p>

      <div class="demo-actions">
        <el-button type="primary" @click="loadSampleProject" :teleported="false">
          <el-icon><FolderOpened /></el-icon>
          加载示例项目
        </el-button>
        <el-button @click="clearProject" :teleported="false">
          <el-icon><Delete /></el-icon>
          清空项目
        </el-button>
        <el-button @click="exportProject" :teleported="false">
          <el-icon><Download /></el-icon>
          导出项目
        </el-button>
      </div>
    </div>

    <div class="demo-content">
      <FileManager
        ref="fileManagerRef"
        :initialFiles="projectFiles"
        :projectName="projectName"
        @update:files="handleFilesUpdate"
        @file-change="handleFileChange"
        @project-save="handleProjectSave"
        @import-project="handleImportProject"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { FolderOpened, Delete, Download } from "@element-plus/icons-vue"
import FileManager from "@@/components/FileManager/index.vue"
import { ElMessage } from "element-plus"

interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  content?: string
  language?: string
  children?: FileNode[]
  parentId?: string
}

const fileManagerRef = ref()
const projectName = ref("演示项目")
const projectFiles = ref<FileNode[]>([])

// 初始化示例项目
const initializeSampleProject = () => {
  projectFiles.value = [
    {
      id: "root",
      name: "演示项目",
      type: "folder",
      children: [
        {
          id: "main",
          name: "main.py",
          type: "file",
          content: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
主程序入口
这是一个演示项目的入口文件
"""

import os
import sys
from utils.helper import Helper
from config.settings import Settings

def main():
    """主函数"""
    print("欢迎使用文件管理系统演示！")

    # 初始化设置
    settings = Settings()
    helper = Helper()

    # 执行主要逻辑
    result = helper.process_data()
    print(f"处理结果: {result}")

    return 0

if __name__ == "__main__":
    sys.exit(main())`,
          language: "python",
          parentId: "root"
        },
        {
          id: "utils",
          name: "utils",
          type: "folder",
          children: [
            {
              id: "helper",
              name: "helper.py",
              type: "file",
              content: `# -*- coding: utf-8 -*-
"""
辅助函数模块
提供各种辅助功能
"""

class Helper:
    """辅助类"""

    def __init__(self):
        self.data = []

    def process_data(self):
        """处理数据"""
        return "数据处理完成"

    def format_output(self, data):
        """格式化输出"""
        return f"输出: {data}"`,
              language: "python",
              parentId: "utils"
            },
            {
              id: "validator",
              name: "validator.py",
              type: "file",
              content: `# -*- coding: utf-8 -*-
"""
数据验证模块
"""

def validate_email(email):
    """验证邮箱格式"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """验证手机号格式"""
    import re
    pattern = r'^1[3-9]\d{9}$'
    return re.match(pattern, phone) is not None`,
              language: "python",
              parentId: "utils"
            }
          ],
          parentId: "root"
        },
        {
          id: "config",
          name: "config",
          type: "folder",
          children: [
            {
              id: "settings",
              name: "settings.py",
              type: "file",
              content: `# -*- coding: utf-8 -*-
"""
配置文件
"""

class Settings:
    """设置类"""

    def __init__(self):
        self.debug = True
        self.version = "1.0.0"
        self.database_url = "sqlite:///demo.db"

    def get_config(self):
        """获取配置"""
        return {
            "debug": self.debug,
            "version": self.version,
            "database_url": self.database_url
        }`,
              language: "python",
              parentId: "config"
            },
            {
              id: "database",
              name: "database.json",
              type: "file",
              content: `{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "demo_db",
    "user": "demo_user"
  },
  "redis": {
    "host": "localhost",
    "port": 6379,
    "db": 0
  },
  "logging": {
    "level": "INFO",
    "file": "logs/app.log"
  }
}`,
              language: "json",
              parentId: "config"
            }
          ],
          parentId: "root"
        },
        {
          id: "tests",
          name: "tests",
          type: "folder",
          children: [
            {
              id: "test_main",
              name: "test_main.py",
              type: "file",
              content: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
主程序测试
"""

import unittest
from unittest.mock import patch
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import main

class TestMain(unittest.TestCase):
    """主程序测试类"""

    def test_main_function(self):
        """测试主函数"""
        with patch('builtins.print') as mock_print:
            result = main()
            self.assertEqual(result, 0)
            mock_print.assert_called()

    def test_imports(self):
        """测试导入"""
        try:
            from utils.helper import Helper
            from config.settings import Settings
            self.assertTrue(True)
        except ImportError as e:
            self.fail(f"导入失败: {e}")

if __name__ == '__main__':
    unittest.main()`,
              language: "python",
              parentId: "tests"
            }
          ],
          parentId: "root"
        },
        {
          id: "readme",
          name: "README.md",
          type: "file",
          content: `# 文件管理系统演示项目

这是一个演示文件管理系统功能的示例项目。

## 项目结构

\`\`\`
演示项目/
├── main.py              # 主程序入口
├── utils/               # 工具模块
│   ├── helper.py        # 辅助函数
│   └── validator.py     # 数据验证
├── config/              # 配置模块
│   ├── settings.py      # 设置类
│   └── database.json    # 数据库配置
├── tests/               # 测试模块
│   └── test_main.py     # 主程序测试
└── README.md            # 项目说明
\`\`\`

## 功能特性

- 多文件项目管理
- 代码语法高亮
- 文件树导航
- 实时编辑同步
- 项目导入导出

## 使用方法

1. 在左侧文件树中点击文件进行编辑
2. 使用右键菜单进行文件操作
3. 支持多种编程语言
4. 自动保存编辑内容

## 技术栈

- Vue 3
- TypeScript
- Element Plus
- CodeMirror
- SCSS`,
          language: "markdown",
          parentId: "root"
        }
      ]
    }
  ]
}

// 加载示例项目
const loadSampleProject = () => {
  initializeSampleProject()
  ElMessage.success("示例项目加载成功！")
}

// 清空项目
const clearProject = () => {
  projectFiles.value = []
  ElMessage.success("项目已清空")
}

// 导出项目
const exportProject = () => {
  if (fileManagerRef.value) {
    fileManagerRef.value.exportProject()
  }
}

// 处理文件更新
const handleFilesUpdate = (files: FileNode[]) => {
  projectFiles.value = files
}

// 处理文件变化
const handleFileChange = (file: FileNode) => {
  console.log("文件变化:", file)
}

// 处理项目保存
const handleProjectSave = (files: FileNode[]) => {
  ElMessage.success("项目已保存")
}

// 处理导入项目
const handleImportProject = () => {
  // 创建文件输入元素
  const input = document.createElement("input")
  input.type = "file"
  input.accept = ".json"
  input.style.display = "none"

  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const importedData = JSON.parse(content)

          // 验证导入的数据格式
          if (Array.isArray(importedData)) {
            projectFiles.value = importedData
            ElMessage.success("项目导入成功")
          } else {
            ElMessage.error("无效的项目文件格式")
          }
        } catch (error) {
          console.error("导入失败:", error)
          ElMessage.error("项目文件解析失败")
        }
      }
      reader.readAsText(file)
    }
  }

  // 触发文件选择
  document.body.appendChild(input)
  input.click()
  document.body.removeChild(input)
}

// 组件挂载时初始化
onMounted(() => {
  initializeSampleProject()
})
</script>

<style lang="scss" scoped>
.file-manager-demo {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.demo-header {
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
  }

  p {
    margin: 0 0 16px 0;
    color: #6b7280;
    font-size: 14px;
  }

  .demo-actions {
    display: flex;
    gap: 12px;

    .el-button {
      font-size: 13px;
    }
  }
}

.demo-content {
  flex: 1;
  padding: 16px;
  min-height: 0;
  overflow: hidden;
}
</style>
