<template>
	<div id="app">
		<router-view></router-view>
		<about-modal ref="aboutModalRef" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import AboutModal from './components/AboutModal.vue';

export default defineComponent({
	components: {
		AboutModal
	},
	setup() {
		const aboutModalRef = ref<InstanceType<typeof AboutModal> | null>(null);

		const showAbout = () => {
			aboutModalRef.value?.show();
		};

		onMounted(() => {
			window.ipcRenderer.on('show-about', showAbout);
		});

		onUnmounted(() => {
			window.ipcRenderer.off('show-about', showAbout);
		});

		return {
			aboutModalRef
		};
	}
});
</script>