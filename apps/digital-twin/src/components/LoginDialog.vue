<!-- components/LoginDialog.vue -->
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-md p-0 overflow-hidden rounded-2xl">
      <div class="relative">
        <!-- Header -->
        <div class="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-primary/10 to-primary/5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
              <LogIn class="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle class="text-lg font-semibold text-slate-900 dark:text-white">
                Welcome
              </DialogTitle>
              <DialogDescription class="text-sm text-slate-500 dark:text-slate-400">
                Sign in to continue
              </DialogDescription>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <p class="text-slate-600 dark:text-slate-300 mb-6">
            Sign in to upload assets, manage your library, and access all features.
          </p>

          <!-- Benefits list -->
          <ul class="space-y-3 mb-6">
            <li v-for="benefit in benefits" :key="benefit" class="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <div class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Check class="w-3 h-3 text-primary" />
              </div>
              {{ benefit }}
            </li>
          </ul>

          <!-- Action buttons -->
          <div class="space-y-3">
            <Button
              class="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
              :disabled="isPending"
              @click="handleLogin"
            >
              <Loader2 v-if="isPending" class="mr-2 h-4 w-4 animate-spin" />
              <LogIn v-else class="mr-2 h-4 w-4" />
              {{ isPending ? 'Connecting...' : 'Sign in' }}
            </Button>
            
            <Button
              variant="outline"
              class="w-full rounded-xl"
              :disabled="isPending"
              @click="handleRegister"
            >
              <UserPlus class="mr-2 h-4 w-4" />
              Create an account
            </Button>
          </div>

          <!-- Privacy note -->
          <p class="text-xs text-slate-400 dark:text-slate-500 text-center mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import { useLoginDialog } from '@/composables/useLoginDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LogIn, UserPlus, Check, Loader2 } from 'lucide-vue-next';

const { login, register, isPending } = useAuth();
const { isOpen, close } = useLoginDialog();

const benefits = [
  'Upload and manage 3D assets',
  'Add custom map layers and tilesets',
  'Access integration code snippets',
  'Contribute to the community library',
];

function handleLogin(): void {
  close();
  login();
}

function handleRegister(): void {
  close();
  register();
}
</script>