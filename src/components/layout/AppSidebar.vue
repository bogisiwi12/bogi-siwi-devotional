<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const route = useRoute()
const authStore = useAuthStore()
const settings = useSettingsStore()

const links = computed(() => {
  const items = [
    { name: settings.t('nav.dashboard'), path: '/', icon: '🏠' },
    { name: settings.t('nav.bible'), path: '/bible', icon: '📖' },
    { name: settings.t('nav.devotional'), path: '/devotional', icon: '☀️' },
    { name: settings.t('nav.reflections'), path: '/reflections', icon: '✍️' },
    { name: settings.t('nav.prayer'), path: '/prayer', icon: '🙏' },
    { name: settings.t('nav.plans'), path: '/plans', icon: '📋' },
    { name: settings.t('nav.growth'), path: '/growth', icon: '🌱' },
    { name: settings.t('nav.members'), path: '/members', icon: '👨‍👩‍👧' },
    { name: settings.t('nav.settings'), path: '/settings', icon: '⚙️' },
  ]

  if (authStore.role === 'admin') {
    items.push({ name: 'Family Requests', path: '/admin/family-requests', icon: '🛡️' })
  }

  return items
})

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
          <h1 class="font-serif text-xl font-bold text-ink tracking-tight">{{ settings.t('appName') }}</h1>
          <p class="text-xs text-sage mt-0.5">{{ settings.t('appTagline') }}</p>
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
