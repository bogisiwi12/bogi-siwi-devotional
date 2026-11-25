import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import { isFirebaseConfigured } from '@/firebase/config'
import { useAuthStore } from '@/stores/auth'
import { useFamilyStore } from '@/stores/family'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',           name: 'dashboard',  component: DashboardView,                                            meta: { requiresAuth: true } },
    { path: '/bible',      name: 'bible',      component: () => import('@/views/BibleReadingView.vue'),             meta: { requiresAuth: true } },
    { path: '/devotional', name: 'devotional', component: () => import('@/views/DevotionalView.vue'),              meta: { requiresAuth: true } },
    { path: '/reflections',name: 'reflections',component: () => import('@/views/ReflectionsView.vue'),             meta: { requiresAuth: true } },
    { path: '/prayer',     name: 'prayer',     component: () => import('@/views/FamilyPrayerView.vue'),            meta: { requiresAuth: true } },
    { path: '/plans',      name: 'plans',      component: () => import('@/views/ReadingPlansView.vue'),            meta: { requiresAuth: true } },
    { path: '/growth',     name: 'growth',     component: () => import('@/views/SpiritualGrowthView.vue'),         meta: { requiresAuth: true } },
    { path: '/members',    name: 'members',    component: () => import('@/views/FamilyMembersView.vue'),           meta: { requiresAuth: true } },
    { path: '/settings',   name: 'settings',   component: () => import('@/views/SettingsView.vue'),                meta: { requiresAuth: true } },
    { path: '/admin/family-requests', name: 'family-requests', component: () => import('@/views/FamilyRequestsView.vue'), meta: { requiresAuth: true, layout: 'plain' } },
    { path: '/setup',      name: 'setup',      component: () => import('@/views/FamilySetupView.vue'),             meta: { requiresAuth: true, layout: 'plain' } },
    { path: '/login',      name: 'login',      component: () => import('@/views/AuthView.vue'),                    meta: { layout: 'auth', guestOnly: true } },
    { path: '/register',   name: 'register',   component: () => import('@/views/AuthView.vue'),                    meta: { layout: 'auth', guestOnly: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  if (!isFirebaseConfigured) return true

  const authStore = useAuthStore()
  authStore.init()
  await authStore.waitUntilReady()

  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)
  const guestOnly    = to.matched.some((r) => r.meta.guestOnly)

  if (requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }
  // Keep invitation links on the auth view so they can be claimed for the
  // signed-in user instead of sending them through the new-family flow.
  if (guestOnly && authStore.isAuthenticated && !(to.query.invite && to.query.family)) {
    return { name: 'dashboard' }
  }

  // For authenticated routes, make sure the family store is initialised.
  if (requiresAuth && authStore.isAuthenticated) {
    if (to.name === 'family-requests') {
      return authStore.role === 'admin' ? true : { name: 'settings' }
    }
    const familyStore = useFamilyStore()
    await familyStore.init(authStore.user)

    // User has no family and no invite — send to setup, except if already there.
    if (familyStore.noFamily && to.name !== 'setup' && authStore.role !== 'admin') {
      return { name: 'setup' }
    }

    // User has claimed an invite but admin hasn't approved yet — also send to setup.
    if (familyStore.awaitingApproval && to.name !== 'setup') {
      return { name: 'setup' }
    }

    // Once the user has a family, don't let them stay on setup.
    if (to.name === 'setup' && !familyStore.noFamily && !familyStore.awaitingApproval) {
      return { name: 'dashboard' }
    }
  }

  return true
})

export default router
