<template>
  <a-modal
    v-model:open="visible"
    title="关于"
    :footer="null"
    :maskClosable="true"
    width="400px"
  >
    <div class="about-content">
      <img src="/favicon.ico" alt="logo" class="about-logo" />
      <h2 class="app-name">Windows应用分类管理器</h2>
      <p class="version">版本: {{ version }}</p>
      <p class="description">一个简单的Windows应用分类管理工具</p>
    </div>
  </a-modal>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  setup() {
    const visible = ref(false);
    const version = ref('');

    const show = async () => {
      version.value = await window.ipcRenderer.getAppVersion();
      visible.value = true;
    };

    return {
      visible,
      version,
      show
    };
  }
});
</script>

<style scoped>
.about-content {
  text-align: center;
  padding: 20px 0;
}

.about-logo {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
}

.app-name {
  margin: 16px 0 8px;
  font-size: 20px;
  font-weight: 500;
}

.version {
  margin: 8px 0;
  color: rgba(0, 0, 0, 0.45);
}

.description {
  margin: 8px 0;
  color: rgba(0, 0, 0, 0.65);
}
</style> 