<script setup lang="ts">
/**
 * LoginPrompt - Displayed when authentication is required for an action
 * Uses FARI design system colors and styling
 */
import { computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { Button } from '@/components/ui/button';
import { LockKeyhole, LogIn, UserPlus } from 'lucide-vue-next';

// ============================================================================
// Props
// ============================================================================

interface Props {
  /** The action that requires authentication */
  action?: string;
  /** Title to display */
  title?: string;
  /** Description text */
  description?: string;
  /** Compact mode for inline display */
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  action: 'perform this action',
  title: 'Authentication Required',
  description: '',
  compact: false,
});

// ============================================================================
// Auth
// ============================================================================

const { login, register, isPending } = useAuth();

// ============================================================================
// Computed
// ============================================================================

const displayDescription = computed(() => {
  if (props.description) return props.description;
  return `Please sign in to ${props.action}. Your data will be securely linked to your account.`;
});
</script>

<template>
  <!-- Compact mode for inline prompts -->
  <div
    v-if="compact"
    class="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg"
  >
    <LockKeyhole class="w-5 h-5 text-primary flex-shrink-0" />
    <span class="text-sm text-muted-foreground flex-1">
      Sign in to {{ action }}
    </span>
    <Button
      size="sm"
      variant="default"
      class="bg-primary hover:bg-primary/90"
      :disabled="isPending"
      @click="login"
    >
      <LogIn class="w-4 h-4 mr-1" />
      Sign in
    </Button>
  </div>

  <!-- Full mode for dedicated prompts -->
  <div
    v-else
    class="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border border-border rounded-xl shadow-sm"
  >
    <!-- Icon -->
    <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
      <LockKeyhole class="w-8 h-8 text-primary" />
    </div>

    <!-- Title -->
    <h3 class="text-xl font-semibold text-foreground mb-2">
      {{ title }}
    </h3>

    <!-- Description -->
    <p class="text-muted-foreground text-center max-w-md mb-6">
      {{ displayDescription }}
    </p>

    <!-- Actions -->
    <div class="flex gap-3">
      <Button
        variant="outline"
        class="border-primary/30 text-primary hover:bg-primary/10"
        :disabled="isPending"
        @click="register"
      >
        <UserPlus class="w-4 h-4 mr-2" />
        Create Account
      </Button>
      <Button
        variant="default"
        class="bg-primary hover:bg-primary/90"
        :disabled="isPending"
        @click="login"
      >
        <LogIn class="w-4 h-4 mr-2" />
        <span v-if="isPending">Connecting...</span>
        <span v-else>Sign in</span>
      </Button>
    </div>

    <!-- Info text -->
    <p class="text-xs text-muted-foreground mt-6">
      Secure authentication powered by Keycloak
    </p>
  </div>
</template>
