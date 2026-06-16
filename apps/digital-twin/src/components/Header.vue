<template>
  <header
    class="liquid-glass relative mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-[1.4rem] border border-white/20 bg-primary/55 px-4 py-3.5 shadow-[0_10px_44px_-14px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/10 supports-[backdrop-filter]:bg-primary/45"
  >
    <RouterLink to="/" class="flex shrink-0 items-center px-2">
      <FariLogo class="h-7 w-auto" />
    </RouterLink>

    <!-- Dock (md+): app-like items with hover + cursor-proximity magnification -->
    <nav
      ref="dockRef"
      class="hidden items-end gap-3 md:flex"
      @mousemove="onDockMove"
      @mouseleave="onDockLeave"
    >
      <RouterLink
        v-for="(item, i) in navItems"
        :key="item.to"
        :to="item.to"
        data-dock
        :style="{
          transform: `translateY(${((scales[i] ?? 1) - 1) * -16}px) scale(${scales[i] ?? 1})`,
          transformOrigin: 'center bottom',
        }"
        :class="[
          'group relative flex w-[4.75rem] flex-col items-center gap-1.5 rounded-2xl bg-primary px-3 py-2.5 ring-1 ring-inset ring-white/10 transition-[transform,color] duration-100 ease-out will-change-transform',
          isActive(item.to) ? 'text-white' : 'text-white/80 hover:text-white',
        ]"
      >
        <!-- solid accent layer: cross-fades in so the active color transitions smoothly -->
        <span
          :class="[
            'pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 ease-out',
            item.activeSolid,
            isActive(item.to) ? 'opacity-100' : 'opacity-0',
          ]"
        />
        <!-- subtle top sheen so the opaque tile still reads as glassy -->
        <span
          class="pointer-events-none absolute inset-x-2 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />
        <component :is="item.icon" class="relative z-10 h-5 w-5" />
        <span class="relative z-10 text-[11px] font-semibold leading-none">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <!-- Right actions -->
    <div class="flex shrink-0 items-center gap-2">
      <Button
        variant="ghost"
        as-child
        size="sm"
        class="hidden rounded-xl border border-white/15 px-3.5 text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground sm:inline-flex"
      >
        <RouterLink to="/doc" class="flex items-center gap-2">
          <FileCode class="h-4 w-4" />
          <span>API Docs</span>
        </RouterLink>
      </Button>

      <div class="mx-0.5 hidden h-7 w-px bg-white/20 sm:block" />

      <template v-if="!isAuthenticated">
        <Button
          variant="ghost"
          size="sm"
          class="hidden rounded-xl px-3.5 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground sm:inline-flex"
          :disabled="isPending"
          @click="openLoginDialog"
        >
          Register
        </Button>
        <Button
          variant="secondary"
          size="sm"
          class="rounded-xl px-4"
          :disabled="isPending"
          @click="openLoginDialog"
        >
          <span v-if="isPending">Connecting...</span>
          <span v-else>Sign in</span>
        </Button>
      </template>

      <DropdownMenu v-else>
        <DropdownMenuTrigger as-child>
          <button
            class="flex cursor-pointer items-center gap-2 rounded-full ring-white/20 transition-all hover:ring-2"
          >
            <img :src="avatarUrl" :alt="displayName" class="h-8 w-8 rounded-full" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56 rounded-xl">
          <DropdownMenuLabel class="font-normal">
            <div class="flex flex-col space-y-1">
              <p class="text-sm font-medium">{{ displayName }}</p>
              <p v-if="userEmail" class="text-xs text-muted-foreground">{{ userEmail }}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="cursor-pointer rounded-lg" @click="handleLogout">
            <LogOut class="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Hamburger (mobile) -->
      <button
        class="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground/90 transition-colors hover:bg-white/10 md:hidden"
        :aria-expanded="mobileOpen"
        aria-label="Menu"
        @click="mobileOpen = !mobileOpen"
      >
        <component :is="mobileOpen ? X : Menu" class="h-5 w-5" />
      </button>
    </div>

    <!-- Mobile menu panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2 scale-95"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 -translate-y-2 scale-95"
    >
      <nav
        v-if="mobileOpen"
        class="absolute inset-x-0 top-full z-50 mt-2 grid origin-top grid-cols-3 gap-2 rounded-2xl border border-white/15 bg-primary/80 p-2.5 shadow-xl shadow-black/30 ring-1 ring-inset ring-white/10 backdrop-blur-2xl md:hidden"
      >
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center ring-1 ring-inset transition-colors',
            isActive(item.to)
              ? `${item.activeSolid} text-white ring-white/25`
              : 'bg-gradient-to-b from-white/10 to-white/[0.02] text-white/80 ring-white/[0.06] hover:from-white/20',
          ]"
        >
          <component :is="item.icon" class="h-5 w-5" />
          <span class="text-xs font-semibold">{{ item.label }}</span>
        </RouterLink>
        <RouterLink
          to="/doc"
          class="col-span-3 flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/10"
        >
          <FileCode class="h-4 w-4" />
          API Docs
        </RouterLink>
      </nav>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useLoginDialog } from '@/composables/useLoginDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FariLogo from '@/assets/FariLogo.vue';
import { getLogoutRedirectUri } from '@/utils/path';
import { LogOut, Box, Map, Layers, Radio, Play, FileCode, Menu, X } from 'lucide-vue-next';

const route = useRoute();
const { isAuthenticated, isPending, displayName, userEmail, avatarUrl, logout } = useAuth();
const { open: openLoginDialog } = useLoginDialog();

const publicOrigin = window.location.origin;
const loginRedirectPath = import.meta.env.VITE_KEYCLOAK_REDIRECT_PATH ?? '/callback';
const logoutRedirectUri = getLogoutRedirectUri(
  publicOrigin,
  import.meta.env.VITE_KEYCLOAK_LOGOUT_REDIRECT_PATH,
  loginRedirectPath
);

// Active state cross-fades to a clean solid accent fill (no glow).
const navItems = [
  {
    to: '/library/assets',
    label: 'Assets',
    icon: Box,
    activeSolid: 'bg-amber-500 shadow-lg shadow-amber-500/40',
  },
  {
    to: '/library/maps',
    label: 'Maps',
    icon: Map,
    activeSolid: 'bg-blue-500 shadow-lg shadow-blue-500/40',
  },
  {
    to: '/library/tilesets',
    label: 'Tilesets',
    icon: Layers,
    activeSolid: 'bg-emerald-500 shadow-lg shadow-emerald-500/40',
  },
  {
    to: '/library/realtime',
    label: 'Realtime',
    icon: Radio,
    activeSolid: 'bg-violet-500 shadow-lg shadow-violet-500/40',
  },
  {
    to: '/library/demo',
    label: 'Demo',
    icon: Play,
    activeSolid: 'bg-rose-500 shadow-lg shadow-rose-500/40',
  },
];

const mobileOpen = ref(false);
watch(
  () => route.path,
  () => {
    mobileOpen.value = false;
  }
);

// macOS-dock magnification: each item scales gently with cursor proximity.
// Kept subtle so a magnified item never blows out of the pill.
const dockRef = ref<HTMLElement | null>(null);
const scales = ref<number[]>(navItems.map(() => 1));

function onDockMove(e: MouseEvent): void {
  const els = dockRef.value?.querySelectorAll<HTMLElement>('[data-dock]');
  if (!els) return;
  const influence = 130; // px radius of the magnification field
  scales.value = Array.from(els).map((el) => {
    const r = el.getBoundingClientRect();
    const center = r.left + r.width / 2;
    const t = Math.max(0, 1 - Math.abs(e.clientX - center) / influence);
    const eased = t * t * (3 - 2 * t); // smoothstep → an organic dock wave
    return 1 + eased * 0.18; // up to ~1.18×
  });
}

function onDockLeave(): void {
  scales.value = navItems.map(() => 1);
}

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/');
}

function handleLogout(): void {
  logout(logoutRedirectUri ?? undefined);
}
</script>
