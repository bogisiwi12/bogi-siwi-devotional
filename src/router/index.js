import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/bible', name: 'bible', component: () => import('@/views/BibleReadingView.vue') },
    { path: '/devotional', name: 'devotional', component: () => import('@/views/DevotionalView.vue') },
    { path: '/reflections', name: 'reflections', component: () => import('@/views/ReflectionsView.vue') },
    { path: '/prayer', name: 'prayer', component: () => import('@/views/FamilyPrayerView.vue') },
    { path: '/plans', name: 'plans', component: () => import('@/views/ReadingPlansView.vue') },
    { path: '/growth', name: 'growth', component: () => import('@/views/SpiritualGrowthView.vue') },
    { path: '/members', name: 'members', component: () => import('@/views/FamilyMembersView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
  ]
})

export default router