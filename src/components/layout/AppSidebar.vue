<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const route = useRoute()

const links = [
  { name: 'Dashboard', path: '/', icon: '🏠' },
  { name: 'Bible Reading', path: '/bible', icon: '📖' },
  { name: 'Daily Devotional', path: '/devotional', icon: '☀️' },
  { name: 'My Reflections', path: '/reflections', icon: '✍️' },
  { name: 'Family Prayer', path: '/prayer', icon: '🙏' },
  { name: 'Reading Plans', path: '/plans', icon: '📋' },
  { name: 'Spiritual Growth', path: '/growth', icon: '🌱' },
  { name: 'Family Members', path: '/members', icon: '👨‍👩‍👧' },
  { name: 'Settings', path: '/settings', icon: '⚙️' },
]

const isActive = (path) => route.path === path
const sidebarClass = computed(() =>
  props.open
    ? 'translate-x-0 shadow-2xl'
    : '-translate-x-full lg:translate-x-0 lg:shadow-none'
)
</script>

<template>
  <aside
    :class="[
      sidebarClass,
      'fixed top-0 left-0 z-50 w-64 h-full bg-white/95 backdrop-blur-xl border-r border-stone transition-all duration-300 ease-out lg:shadow-none',
    ]"
  >
    <div class="p-6 border-b border-stone">
      <div class="flex items-center gap-3 group">
        <div
          class="grid place-items-center w-10 h-10 rounded-xl text-white font-serif text-lg shadow-sm bg-gradient-to-br from-gold to-sage transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105"
        >
          ✝
        </div>
        <div>
          <h1 class="font-serif text-xl font-bold text-ink tracking-tight">Family Bible</h1>
          <p class="text-xs text-sage mt-0.5">Together in the Word</p>
        </div>
      </div>
    </div>

    <nav class="p-3 space-y-1 overflow-y-auto h-[calc(100%-5rem)] stagger">
      <RouterLink
        v-for="link in links"
        :key="link.path"
        :to="link.path"
        @click="emit('close')"
        :class="[
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
          isActive(link.path)
            ? 'bg-sage/15 text-sage-dark pl-4'
            : 'text-ink/70 hover:bg-stone/60 hover:text-ink hover:pl-4',
        ]"
      >
        <span
          class="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-gradient-to-b from-gold to-sage transition-all duration-300"
          :class="isActive(link.path) ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'"
        />
        <span class="text-base transition-transform duration-300 group-hover:scale-110">{{ link.icon }}</span>
        <span>{{ link.name }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>
