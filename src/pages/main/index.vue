<template>
  <div class="main-container">
    <a-tabs
      :tabBarStyle="{
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 1,
        borderBottom: '1px solid #f0f0f0',
        margin: '0 -16px',
        padding: '0 16px',
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
              <div class="app-list-item-content">
                <div class="drag-handle">
                  <holder-outlined />
                </div>
                <div class="app-info">
                  <a-avatar :src="item.icon" :size="32" shape="square" class="app-icon" />
                  <div class="app-details">
                    <a @click="onOpen(item.path)" class="app-name">{{ item.name }}</a>
                    <div class="app-path">路径：{{ item.path }}</div>
                  </div>
                </div>
                <div class="app-list-item-actions">
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
.main-container {
  padding: 0 16px 16px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.app-list {
  padding: 16px 8px;
}

.app-list-item {
  margin-bottom: 12px;
}

.app-list-item-content {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.app-list-item-content:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
  border-color: #e6f7ff;
}

.drag-handle {
  color: #bfbfbf;
  font-size: 16px;
  cursor: move;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.drag-handle:hover {
  color: #1890ff;
  background-color: #f0f7ff;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.app-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-icon {
  border-radius: 6px;
  transition: transform 0.3s ease;
}

.app-icon:hover {
  transform: scale(1.05);
}

.app-name {
  font-size: 15px;
  color: #262626;
  transition: color 0.3s ease;
  line-height: 1.2;
}

.app-name:hover {
  color: #1890ff;
}

.app-path {
  font-size: 13px;
  color: #8c8c8c;
}

.app-list-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.app-list-item-content:hover .app-list-item-actions {
  opacity: 1;
}

.add-btn {
  position: fixed;
  right: 24px;
  bottom: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: #1890ff;
  border: none;
}

.add-btn:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

:deep(.ant-tabs-tab) {
  transition: all 0.3s ease;
}

:deep(.ant-tabs-tab:hover) {
  color: #1890ff;
}

:deep(.ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn) {
  font-weight: 600;
}
</style>
