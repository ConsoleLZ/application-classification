<template>
  <div style="padding: 20px">
    <a-tabs v-if="listData?.length">
      <a-tab-pane
        v-for="(tabItem, index) in listData"
        :key="index"
        :tab="tabItem.title"
      >
        <a-list
          v-if="tabItem.data?.length"
          item-layout="horizontal"
          :data-source="tabItem.data"
        >
          <template #renderItem="{ item, index }">
            <a-list-item>
              <a-list-item-meta :description="`路径：${item.path}`">
                <template #title>
                  <a @click="onOpen(item.path)">{{ item.name }}</a>
                </template>
                <template #avatar>
                  <a-avatar :src="item.icon" :size="32" shape="square" />
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-button
                  type="link"
                  size="small"
                  @click="onEdit(index, item)"
                >
                  编辑
                </a-button>
                <a-button
                  type="link"
                  danger
                  size="small"
                  @click="onDelete(tabItem.title, index)"
                >
                  删除
                </a-button>
              </template>
            </a-list-item>
          </template>
        </a-list>
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
</template>

<script lang="ts" src="./index.ts"></script>
<style src="./index.css" scoped>
.header-actions {
  margin-bottom: 16px;
}
</style>
