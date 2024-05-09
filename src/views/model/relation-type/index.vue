<template>
  <div class="manual-manuscript">
    <div class="itxst">
      <el-row>
        <div class="col">
          <div class="title">
            <el-checkbox class="check-box"> 稿件列表</el-checkbox>
          </div>
          <VueDraggable
            v-model="list1"
            dragClass="drag"
            :animation="animationDuration"
            group="people"
            ghostClass="ghost"
            chosenClass="chosen"
            @start="onStart"
            @end="onEnd"
            itemKey="id"
            class="flex flex-col gap-2 p-4 w-300px bg-gray-500/5 rounded"
          >
            <div
              v-for="item in list1"
              :key="item.id"
              class="h-30px bg-gray-500/5 rounded flex items-center justify-between px-4"
            >
              {{ item.name }}
            </div>
          </VueDraggable>
        </div>
        <div class="col">
          <div class="title">
            <h2 class="check-box">已选属性</h2>
          </div>
          <VueDraggable
            v-model="list2"
            dragClass="drag"
            :animation="animationDuration"
            group="people"
            ghostClass="ghost"
            chosenClass="chosen"
            handle=".handle"
            @start="onStart"
            @end="onEnd"
            itemKey="id"
            class="flex flex-col gap-2 p-4 w-300px bg-gray-500/5 rounded"
          >
            <div
              v-for="(item, index) in list2"
              :key="item.id"
              class="h-30px bg-gray-500/5 rounded flex items-center justify-between px-4"
            >
              <el-icon name="sort" class="handle cursor-move"><Grid /></el-icon>
              {{ item.name }}
              <el-icon class="cursor-pointer" @click="remove(index)"><Close /></el-icon>
            </div>
          </VueDraggable>
        </div>
        <div class="flex justify-between">
          <preview-list :list="list1" />
          <preview-list :list="list2" />
        </div>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElIcon } from "element-plus"
import { ref } from "vue"
import { VueDraggable } from "vue-draggable-plus"
const animationDuration = ref<number>(150)

const list1 = ref([
  {
    name: "Joao",
    id: 1
  },
  {
    name: "Jean",
    id: 2
  },
  {
    name: "Johanna",
    id: 3
  },
  {
    name: "Juan",
    id: 4
  }
])

const list2 = ref([
  {
    name: "Joao",
    id: 1
  },
  {
    name: "Jeadddn",
    id: 21
  },
  {
    name: "Johansssana",
    id: 31
  },
  {
    name: "Juasdasdan",
    id: 41
  }
])
// const list1 = ref([
//   {
//     name: "Joao",
//     id: "1"
//   },
//   {
//     name: "Jean",
//     id: "2"
//   },
//   {
//     name: "Johanna",
//     id: "3"
//   },
//   {
//     name: "Juan",
//     id: "4"
//   }
// ])

// const list2 = ref(
//   list1.value.map((item) => ({
//     name: `${item.name}-2`,
//     id: `${item.id}-2`
//   }))
// )

function remove(index: number) {
  list2.value.splice(index, 1)
}
const drag = ref(false)
const onStart = () => {
  drag.value = true
}
//拖拽结束事件
const onEnd = () => {
  drag.value = false
}
</script>

<style lang="scss" scoped>
.manual-manuscript {
  width: 60%;
  height: 600px;
}
.main-title {
  font-size: 20px;
  font-weight: 700;
  margin-left: 33px;
  margin-top: 20px;
  float: left;
  margin-bottom: 10px;
}
.chosen {
  background-color: #409eff !important;
  color: rgb(255, 255, 255);
}
.ghost {
  background-color: #409eff !important;
}

.itxst {
  margin: 10px;
}
.title {
  height: 50px;
  background: rgb(245, 243, 243);
}

.check-box {
  float: left;
  margin-left: 15px;
  margin-top: 5px;
  font-size: 12px;
  font-weight: bold;
}
.col {
  width: 40%;
  flex: 1;
  padding: 10px;
  border: solid 1px rgb(241, 210, 210);
  border-radius: 5px;
  float: left;
}
.col + .col {
  margin-left: 20px;
}
</style>
