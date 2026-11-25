<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'

const authStore = useAuthStore()
const settings = useSettingsStore()
const router = useRouter()

const notice = ref('')
const noticeTone = ref('info')

const signedInAs = computed(() => authStore.emailAddress || settings.t('settings.signedInAs'))
const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Bahasa Indonesia' },
]

function setNotice(message = '', tone = 'info') {
  notice.value = message
  noticeTone.value = tone
}

function onLanguageChange(event) {
  settings.setLocale(event.target.value)
  setNotice('')
}

function onReminderChange(event) {
  settings.setReminderTime(event.target.value)
  const permission = settings.notificationPermission()
  if (settings.notificationsEnabled && permission === 'denied') {
    setNotice(settings.t('settings.notificationDenied'), 'warn')
  } else if (settings.notificationsEnabled && permission === 'unsupported') {
    setNotice(settings.t('settings.notificationUnsupported'), 'warn')
  } else {
    setNotice(settings.t('settings.reminderSaved'), 'success')
  }
}

async function onAppearanceChange(value) {
  settings.setAppearance(value)
  setNotice('')
}

async function toggleNotifications() {
  const next = !settings.notificationsEnabled
  const permission = await settings.setNotificationsEnabled(next)
  if (next && permission === 'denied') {
    setNotice(settings.t('settings.notificationDenied'), 'warn')
  } else if (next && permission === 'unsupported') {
    setNotice(settings.t('settings.notificationUnsupported'), 'warn')
  } else if (next) {
    setNotice(settings.t('settings.reminderSaved'), 'success')
  } else {
    setNotice('')
  }
}

async function signOut() {
  try {
    await authStore.logout()
  } catch {
    // Ignore network errors and return to login regardless.
  }
  router.push({ name: 'login' })
}

watch(
  () => [settings.locale, settings.appearance, settings.notificationsEnabled, settings.reminderTime],
  () => {
    // Reactive dependencies for UI labels; settings store persists changes.
  }
)
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink heading-rule reveal">{{ settings.t('settings.title') }}</h1>

    <RouterLink v-if="authStore.role === 'admin'" to="/admin/family-requests" class="card block p-5 text-sm font-medium text-sage hover:bg-sage/5">
      {{ settings.t('settings.reviewRequests') }}
    </RouterLink>

    <div class="card overflow-hidden divide-y divide-stone reveal delay-1">
      <!-- Language -->
      <div class="p-5 flex items-center justify-between gap-4 transition-colors duration-300 hover:bg-parchment/50">
        <div>
          <p class="text-sm font-medium text-ink">{{ settings.t('settings.language') }}</p>
          <p class="text-xs text-ink/50">{{ settings.t('settings.languageDesc') }}</p>
        </div>
        <select
          :value="settings.locale"
          @change="onLanguageChange"
          class="border border-stone rounded-lg px-3 py-1.5 text-sm bg-white text-ink transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-sage/30"
        >
          <option v-for="option in languageOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- Reminder -->
      <div class="p-5 flex items-center justify-between gap-4 transition-colors duration-300 hover:bg-parchment/50">
        <div>
          <p class="text-sm font-medium text-ink">{{ settings.t('settings.reminder') }}</p>
          <p class="text-xs text-ink/50">{{ settings.t('settings.reminderDesc') }}</p>
        </div>
        <input
          :value="settings.reminderTime"
          @change="onReminderChange"
          type="time"
          class="border border-stone rounded-lg px-3 py-1.5 text-sm bg-white text-ink transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-sage/30"
        />
      </div>

      <!-- Appearance -->
      <div class="p-5 flex items-center justify-between gap-4 transition-colors duration-300 hover:bg-parchment/50">
        <div>
          <p class="text-sm font-medium text-ink">{{ settings.t('settings.appearance') }}</p>
          <p class="text-xs text-ink/50">{{ settings.t('settings.appearanceDesc') }}</p>
        </div>
        <div class="flex bg-stone rounded-lg p-0.5">
          <button
            v-for="theme in ['light', 'dark']"
            :key="theme"
            @click="onAppearanceChange(theme)"
            :class="[
              'px-3 py-1 rounded-md text-xs font-medium capitalize transition-all duration-300',
              settings.appearance === theme ? 'bg-white text-ink shadow-sm' : 'text-ink/50 hover:text-ink',
            ]"
          >
            {{ settings.t(`settings.${theme}`) }}
          </button>
        </div>
      </div>

      <!-- Notifications -->
      <div class="p-5 flex items-center justify-between gap-4 transition-colors duration-300 hover:bg-parchment/50">
        <div>
          <p class="text-sm font-medium text-ink">{{ settings.t('settings.notifications') }}</p>
          <p class="text-xs text-ink/50">{{ settings.t('settings.notificationsDesc') }}</p>
        </div>
        <button
          @click="toggleNotifications"
          :class="[
            'relative w-11 h-6 rounded-full transition-colors duration-300 btn-press',
            settings.notificationsEnabled ? 'bg-sage' : 'bg-stone',
          ]"
          :aria-pressed="settings.notificationsEnabled"
          :aria-label="settings.t('settings.notificationsAria')"
        >
          <span
            :class="[
              'absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ease-out',
              settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0',
            ]"
          />
        </button>
      </div>

      <!-- Account -->
      <div class="p-5 transition-colors duration-300 hover:bg-parchment/50">
        <p class="text-sm font-medium text-ink mb-2">{{ settings.t('settings.account') }}</p>
        <p class="text-xs text-ink/50 mb-3">{{ settings.t('settings.signedInAs') }} {{ signedInAs }}</p>
        <button
          @click="signOut"
          class="text-sm text-rose hover:text-rose/80 font-medium btn-press"
        >
          {{ settings.t('settings.signOut') }}
        </button>
      </div>
    </div>

    <p
      v-if="notice"
      :class="[
        'text-sm px-1',
        noticeTone === 'warn' ? 'text-rose' : noticeTone === 'success' ? 'text-sage-dark' : 'text-ink/60',
      ]"
    >
      {{ notice }}
    </p>
  </div>
</template>
