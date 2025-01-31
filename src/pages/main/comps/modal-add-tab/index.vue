<template>
  <a-modal v-model:open="visible" title="添加标签" cancelText="取消" okText="确认" @ok="onConfirm">
    <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 15 }">
      <a-form-item label="标签名称" v-bind="validateInfos.name">
        <a-input v-model:value="formState.name" placeholder="请输入标签名称"></a-input>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" src="./index.ts"></script>
