import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useBibleStore } from './bible'

const STORAGE_KEY = 'family-bible:preferences'
const SUPPORTED_LOCALES = ['en', 'id']

const MESSAGES = {
  en: {
    appName: 'Family Bible',
    appTagline: 'Together in the Word',
    nav: {
      dashboard: 'Dashboard',
      bible: 'Bible Reading',
      devotional: 'Daily Devotional',
      reflections: 'My Reflections',
      prayer: 'Family Prayer',
      plans: 'Reading Plans',
      growth: 'Spiritual Growth',
      members: 'Family Members',
      settings: 'Settings',
    },
    settings: {
      title: 'Settings',
      reviewRequests: 'Review family group requests →',
      language: 'Language',
      languageDesc: 'Interface language',
      reminder: 'Daily Reminder',
      reminderDesc: 'Remind me to read',
      appearance: 'Appearance',
      appearanceDesc: 'Theme preference',
      light: 'Light',
      dark: 'Dark',
      notifications: 'Notifications',
      notificationsDesc: 'Family activity & prayer updates',
      notificationsAria: 'Toggle notifications',
      account: 'Account',
      signedInAs: 'Signed in as',
      signOut: 'Sign Out',
      notificationDenied: 'Notifications are blocked in your browser settings.',
      notificationUnsupported: 'Notifications are not supported in this browser.',
      reminderSaved: 'Daily reminder updated.',
    },
    header: {
      openMenu: 'Open menu',
      signOut: 'Sign out',
    },
  },
  id: {
    appName: 'Alkitab Keluarga',
    appTagline: 'Bersama dalam Firman',
    nav: {
      dashboard: 'Dasbor',
      bible: 'Bacaan Alkitab',
      devotional: 'Renungan Harian',
      reflections: 'Renungan Saya',
      prayer: 'Doa Keluarga',
      plans: 'Rencana Bacaan',
      growth: 'Pertumbuhan Rohani',
      members: 'Anggota Keluarga',
      settings: 'Pengaturan',
    },
    settings: {
      title: 'Pengaturan',
      reviewRequests: 'Tinjau permintaan grup keluarga →',
      language: 'Bahasa',
      languageDesc: 'Bahasa antarmuka',
      reminder: 'Pengingat Harian',
      reminderDesc: 'Ingatkan saya untuk membaca',
      appearance: 'Tampilan',
      appearanceDesc: 'Preferensi tema',
      light: 'Terang',
      dark: 'Gelap',
      notifications: 'Notifikasi',
      notificationsDesc: 'Aktivitas keluarga & pembaruan doa',
      notificationsAria: 'Alihkan notifikasi',
      account: 'Akun',
      signedInAs: 'Masuk sebagai',
      signOut: 'Keluar',
      notificationDenied: 'Notifikasi diblokir di pengaturan browser Anda.',
      notificationUnsupported: 'Notifikasi tidak didukung di browser ini.',
      reminderSaved: 'Pengingat harian diperbarui.',
    },
    header: {
      openMenu: 'Buka menu',
      signOut: 'Keluar',
    },
  },
}

function readPrefs() {
  if (typeof localStorage === 'undefined') return {}
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writePrefs(prefs) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Persistence is optional.
  }
}

function applyAppearance(appearance) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = appearance === 'dark' ? 'dark' : 'light'
  root.style.colorScheme = appearance === 'dark' ? 'dark' : 'light'
}

function normalizeTime(value) {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? value : '07:00'
}

export const useSettingsStore = defineStore('settings', () => {
  const saved = readPrefs()

  const locale = ref(SUPPORTED_LOCALES.includes(saved.locale) ? saved.locale : 'en')
  const appearance = ref(saved.appearance === 'dark' ? 'dark' : 'light')
  const reminderTime = ref(normalizeTime(saved.reminderTime))
  const notificationsEnabled = ref(saved.notificationsEnabled !== false)

  let reminderTimer = null
  let initialized = false

  const messages = computed(() => MESSAGES[locale.value] ?? MESSAGES.en)

  function t(path) {
    const parts = String(path).split('.')
    let current = messages.value
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) current = current[part]
      else return path
    }
    return typeof current === 'string' ? current : path
  }

  function persist() {
    writePrefs({
      locale: locale.value,
      appearance: appearance.value,
      reminderTime: reminderTime.value,
      notificationsEnabled: notificationsEnabled.value,
    })
  }

  function setLocale(next) {
    locale.value = SUPPORTED_LOCALES.includes(next) ? next : 'en'
    if (typeof document !== 'undefined') document.documentElement.lang = locale.value
    // Keep Bible content language aligned with interface language for consistency.
    try {
      const bible = useBibleStore()
      bible.setLanguage(locale.value)
    } catch {
      // Bible store may not be ready in all contexts.
    }
    persist()
  }

  function setAppearance(next) {
    appearance.value = next === 'dark' ? 'dark' : 'light'
    applyAppearance(appearance.value)
    persist()
  }

  function setReminderTime(next) {
    reminderTime.value = normalizeTime(next)
    persist()
    scheduleDailyReminder()
  }

  function canUseNotifications() {
    return typeof window !== 'undefined' && 'Notification' in window
  }

  function notificationPermission() {
    return canUseNotifications() ? Notification.permission : 'unsupported'
  }

  async function requestNotificationPermission() {
    if (!canUseNotifications()) return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission === 'denied') return 'denied'
    try {
      return await Notification.requestPermission()
    } catch {
      return Notification.permission
    }
  }

  function showReminderNotification() {
    if (!notificationsEnabled.value) return
    if (!canUseNotifications() || Notification.permission !== 'granted') return
    const title = locale.value === 'id' ? 'Pengingat Bacaan Harian' : 'Daily Reading Reminder'
    const body =
      locale.value === 'id'
        ? 'Saatnya meluangkan waktu untuk membaca Firman dan berdoa bersama keluarga.'
        : 'Time to pause for Scripture reading and prayer with your family.'
    try {
      const notification = new Notification(title, {
        body,
        tag: 'family-bible-daily-reminder',
        renotify: true,
      })
      notification.onclick = () => {
        window.focus?.()
        notification.close()
      }
    } catch {
      // Ignore notification creation failures.
    }
  }

  function clearReminderTimer() {
    if (reminderTimer) {
      clearTimeout(reminderTimer)
      reminderTimer = null
    }
  }

  function msUntilNextReminder() {
    const [h, m] = reminderTime.value.split(':').map((n) => Number.parseInt(n, 10) || 0)
    const now = new Date()
    const next = new Date(now)
    next.setHours(h, m, 0, 0)
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
    return next.getTime() - now.getTime()
  }

  function scheduleDailyReminder() {
    clearReminderTimer()
    if (!notificationsEnabled.value) return
    if (typeof window === 'undefined') return
    if (!canUseNotifications() || Notification.permission !== 'granted') return
    const delay = msUntilNextReminder()
    reminderTimer = window.setTimeout(() => {
      showReminderNotification()
      scheduleDailyReminder()
    }, delay)
  }

  async function setNotificationsEnabled(next) {
    notificationsEnabled.value = Boolean(next)
    if (notificationsEnabled.value) {
      await requestNotificationPermission()
    }
    persist()
    scheduleDailyReminder()
    return notificationPermission()
  }

  async function testReminderNotification() {
    const permission = await requestNotificationPermission()
    if (permission === 'granted') {
      showReminderNotification()
    }
    return permission
  }

  function init() {
    if (initialized) return
    initialized = true
    applyAppearance(appearance.value)
    if (typeof document !== 'undefined') document.documentElement.lang = locale.value
    scheduleDailyReminder()
  }

  watch(locale, (value) => {
    if (typeof document !== 'undefined') document.documentElement.lang = value
  })

  return {
    locale,
    appearance,
    reminderTime,
    notificationsEnabled,
    messages,
    t,
    persist,
    setLocale,
    setAppearance,
    setReminderTime,
    setNotificationsEnabled,
    canUseNotifications,
    notificationPermission,
    requestNotificationPermission,
    showReminderNotification,
    testReminderNotification,
    scheduleDailyReminder,
    init,
  }
})
