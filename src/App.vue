<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { useAuthStore } from '@/stores/auth'
import { useFamilyStore } from '@/stores/family'

const route = useRoute()
const authStore = useAuthStore()
const familyStore = useFamilyStore()
const sidebarOpen = ref(false)

const isAuthLayout  = computed(() => route.meta.layout === 'auth')
const isPlainLayout = computed(() => route.meta.layout === 'plain')

onMounted(() => {
  authStore.init()
})

watch(() => authStore.user, (user) => {
  if (user && route.query.invite) return
  if (user) familyStore.init(user)
  else familyStore.dispose()
}, { immediate: true })
</script>

<template>
  <RouterView v-if="isAuthLayout || isPlainLayout" v-slot="{ Component, route: currentRoute }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="currentRoute.path" />
    </Transition>
  </RouterView>

  <div v-else class="min-h-screen bg-parchment flex">
    <!-- Mobile backdrop -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0 lg:ml-64">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <RouterView v-slot="{ Component, route: currentRoute }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="currentRoute.path" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>
