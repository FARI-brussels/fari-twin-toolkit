import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { normalizePath } from '@/utils/path';

// Views - Eager loaded
import HomePage from '@/views/HomePage.vue';
import ApiDocView from '@/views/ApiDocView.vue';
import LibraryLayout from '@/components/LibraryLayout.vue';
import AssetLibrary from '@/views/libraries/AssetLibrary.vue';
import MapLibrary from '@/views/libraries/MapLibrary.vue';
import TilesetLibrary from '@/views/libraries/TilesetLibrary.vue';
import RealtimeLibrary from '@/views/libraries/RealtimeLibrary.vue';
import DemoView from '@/views/DemoView.vue';

// Callback path from environment
const callbackPath = normalizePath(import.meta.env.VITE_KEYCLOAK_REDIRECT_PATH ?? '/callback');

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
  },
  {
    path: '/doc',
    name: 'ApiDocumentation',
    component: ApiDocView,
  },
  {
    path: '/library',
    component: LibraryLayout,
    children: [
      {
        path: 'assets',
        name: 'AssetLibrary',
        component: AssetLibrary,
      },
      {
        path: 'maps',
        name: 'MapLibrary',
        component: MapLibrary,
      },
      {
        path: 'tilesets',
        name: 'TilesetLibrary',
        component: TilesetLibrary,
      },
      {
        path: 'realtime',
        name: 'RealtimeLibrary',
        component: RealtimeLibrary,
      },
      {
        path: 'demo',
        name: 'Demo',
        component: DemoView,
      },
      {
        path: '',
        redirect: { name: 'AssetLibrary' },
      },
    ],
  },
];

// Add auth callback route if configured
if (callbackPath) {
  routes.push({
    path: callbackPath,
    name: 'AuthCallback',
    component: () => import('@/views/AuthCallback.vue'),
  });
}

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
