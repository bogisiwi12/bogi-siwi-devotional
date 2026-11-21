<script setup>
import { computed } from 'vue'
import { useFamilyStore } from '@/stores/family'

defineEmits(['toggle-sidebar'])
const familyStore = useFamilyStore()

const todayLabel = computed(() =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
)
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

      <div class="flex items-center gap-3">
        <div class="text-right hidden sm:block">
          <p class="text-sm font-semibold text-ink leading-tight">{{ familyStore.currentUser.name }}</p>
          <p class="text-xs text-sage">{{ familyStore.currentUser.role }}</p>
        </div>
        <div class="group relative">
          <span
            class="absolute inset-0 rounded-full pulse-ring opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
          <div
            class="relative w-9 h-9 rounded-full flex items-center justify-center text-lg bg-gradient-to-br from-sage/30 to-gold/25 ring-1 ring-white/80 shadow-sm transition-transform duration-300 group-hover:scale-105"
          >
            {{ familyStore.currentUser.avatar }}
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
