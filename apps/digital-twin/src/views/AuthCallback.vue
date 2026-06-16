<!-- AuthCallback.vue -->
<script setup lang="ts">
  import { watch, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuth } from '@/composables/useAuth';
  import { Loader2 } from 'lucide-vue-next';

  const router = useRouter();
  const { isPending, consumeReturnPath } = useAuth();

  function navigateToReturnPath(): void {
    // Read (and clear) the path stashed before the login redirect; default home.
    const returnPath = consumeReturnPath();
    if (returnPath) {
      void router.replace(returnPath);
    } else {
      void router.replace({ name: 'Home' });
    }
  }
  
  onMounted(() => {
    if (!isPending.value) {
      navigateToReturnPath();
    }
  });
  
  watch(isPending, (pending: boolean) => {
    if (!pending) {
      navigateToReturnPath();
    }
  });
  </script>
  
  <template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div class="text-center">
        <div class="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Loader2 class="h-8 w-8 text-primary animate-spin" />
        </div>
        <h2 class="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Signing you in...
        </h2>
        <p class="text-slate-500 dark:text-slate-400">
          Please wait while we complete authentication
        </p>
      </div>
    </div>
  </template>