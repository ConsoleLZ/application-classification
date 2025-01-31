<template>
  <a-modal v-model:open="visible" title="添加应用" cancelText="取消" okText="确认" @ok="onConfirm">
    <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 15 }">
      <a-form-item label="应用程序">
        <a-space>
          <a-input v-model:value="formState.path" placeholder="请选择应用程序" readonly></a-input>
          <a-button type="primary" @click="selectExe">选择</a-button>
        </a-space>
      </a-form-item>
      <a-form-item label="应用图标">
        <a-space>
          <a-input v-model:value="formState.iconPath" placeholder="请选择图标文件" readonly></a-input>
          <a-button type="primary" @click="selectIcon">选择</a-button>
        </a-space>
        <div v-if="formState.icon" class="icon-preview">
          <img :src="formState.icon" alt="icon" style="width: 32px; height: 32px;" />
        </div>
      </a-form-item>
      <a-form-item label="应用名称" v-bind="validateInfos.name">
        <a-input v-model:value="formState.name" placeholder="请输入应用名称"></a-input>
      </a-form-item>
      <a-form-item label="分类" v-bind="validateInfos.tab">
        <a-select v-model:value="formState.tab" :options="tabsOptions" placeholder="请选择分类标签"></a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" src="./index.ts"></script>

<style scoped>
.icon-preview {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  display: inline-block;
}
</style>
