import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
	{
		path: '/',
		name: 'main',
		component: () => import('@/pages/main/index.vue')
	}
];

const router = createRouter({
	history: createWebHashHistory(),
	routes
});

export default router;