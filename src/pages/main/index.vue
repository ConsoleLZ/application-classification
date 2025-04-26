<template>
  <div>
    <a-tabs
      :tabBarStyle="{
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 1,
        padding: '0 10px',
      }"
    >
      <a-tab-pane
        v-for="element in listData"
        :key="element.title"
        :tab="element.title"
      >
        <draggable
          v-if="element.data?.length"
          v-model="element.data"
          item-key="path"
          handle=".drag-handle"
          @end="onDragEnd"
          class="app-list"
        >
          <template #item="{ element: item }">
            <div class="app-list-item">
              <a-list-item-meta :description="`路径：${item.path}`">
                <template #title>
                  <a @click="onOpen(item.path)">{{ item.name }}</a>
                </template>
                <template #avatar>
                  <a-avatar :src="item.icon" :size="32" shape="square" />
                </template>
              </a-list-item-meta>
              <div class="app-list-item-actions">
                <holder-outlined class="drag-handle" />
                <a-button type="link" size="small" @click="onEdit(element.data.indexOf(item), item)">
                  编辑
                </a-button>
                <a-button
                  type="link"
                  danger
                  size="small"
                  @click="onDelete(element.title, element.data.indexOf(item))"
                >
                  删除
                </a-button>
              </div>
            </div>
          </template>
        </draggable>
        <a-empty
          v-else
          :image="simpleImage"
          description="暂无应用，请点击右下方按钮进行添加"
        />
      </a-tab-pane>
    </a-tabs>
  </div>

  <a-avatar @click="onShow" class="add-btn" :size="36" src="./add.png" />

  <modal-add-application-comp
    ref="modalAddApplicationRef"
    @confirm="onConfirm"
  />
  <modal-add-tab-comp ref="modalAddTabRef" @confirm="onConfirmTab" />
  <modal-sort-tabs-comp ref="modalSortTabsRef" @confirm="onSortConfirm" />
</template>

<script lang="ts" src="./index.ts"></script>
<style scoped>
.app-list {
  padding: 8px;
}

.app-list-item {
  padding: 16px;
  margin: 8px 0;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.app-list-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.app-list-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.drag-handle {
  cursor: move;
  color: #999;
  font-size: 16px;
  margin-right: 8px;
}

.add-btn {
  position: fixed;
  right: 24px;
  bottom: 24px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}

.add-btn:hover {
  transform: scale(1.1);
}
</style>
