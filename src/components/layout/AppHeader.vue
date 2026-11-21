<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineEmits(['toggle-sidebar'])
const authStore = useAuthStore()
const router = useRouter()

const todayLabel = computed(() =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
)

const displayName = computed(() => authStore.displayName)
const roleLabel = computed(() => authStore.isAuthenticated ? authStore.role : '')

async function signOut() {
  try {
    await authStore.logout()
  } catch {
    // Even if the network call fails, clear local state and return to login.
  }
  router.push({ name: 'login' })
}
</script>

<template>
  <header
    class="sticky top-0 z-30 bg-parchment/75 backdrop-blur-xl border-b border-stone/80 px-4 sm:px-6 py-3"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <button
          class="lg:hidden text-ink/60 hover:text-ink hover:bg-stone/60 rounded-lg p-2 btn-press"
          @click="$emit('toggle-sidebar')"
          aria-label="Open menu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <p class="hidden sm:block text-xs font-medium uppercase tracking-[0.15em] text-gold">
          {{ todayLabel }}
        </p>
      </div>

      <div class="flex items-center gap-2 sm:gap-3">
        <div class="text-right hidden sm:block">
          <p class="text-sm font-semibold text-ink leading-tight">{{ displayName }}</p>
          <p class="text-xs text-sage capitalize">{{ roleLabel }}</p>
        </div>

        <button
          v-if="authStore.isAuthenticated"
          @click="signOut"
          class="grid place-items-center w-8 h-8 rounded-lg text-ink/40 hover:text-rose hover:bg-rose/10 transition-colors duration-300 btn-press"
          title="Sign out"
          aria-label="Sign out"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H9m4 8H6a2 2 0 01-2-2V6a2 2 0 012-2h7"
            />
          </svg>
        </button>

        <div class="group relative">
          <span
            class="absolute inset-0 rounded-full pulse-ring opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
          <div
            v-if="authStore.photoURL"
            class="relative w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/80 shadow-sm transition-transform duration-300 group-hover:scale-105"
          >
            <img
              :src="authStore.photoURL"
              :alt="displayName"
              class="w-full h-full object-cover"
              referrerpolicy="no-referrer"
            />
          </div>
          <div
            v-else
            class="relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-ink/70 bg-gradient-to-br from-sage/30 to-gold/25 ring-1 ring-white/80 shadow-sm transition-transform duration-300 group-hover:scale-105"
          >
          {{ authStore.isAuthenticated ? authStore.initials : '?' }}
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
