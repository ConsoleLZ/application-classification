<template>
  <a-modal
    v-model:open="visible"
    title="排序分类"
    @ok="onConfirm"
    cancelText="取消"
    okText="确认"
  >
    <draggable
      v-model="localTabs"
      item-key="title"
      handle=".drag-handle"
    >
      <template #item="{ element }">
        <div class="sort-item">
          <HolderOutlined class="drag-handle" />
          <span class="tab-title">{{ element.title }}</span>
        </div>
      </template>
    </draggable>
  </a-modal>
</template>

<script lang="ts" src="./index.ts"></script>

<style scoped>
.sort-item {
  padding: 8px;
  margin: 4px 0;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.drag-handle {
  cursor: move;
  color: #999;
}

.tab-title {
  flex: 1;
}
</style> 