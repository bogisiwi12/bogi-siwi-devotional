<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const language = ref('English')
const reminderTime = ref('07:00')
const appearance = ref('light')
const notifications = ref(true)

const signedInAs = computed(() => authStore.emailAddress || 'sarah.chen@email.com')

async function signOut() {
  try {
    await authStore.logout()
  } catch {
    // Ignore network errors and return to login regardless.
  }
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink heading-rule reveal">Settings</h1>

    <RouterLink v-if="authStore.role === 'admin'" to="/admin/family-requests" class="card block p-5 text-sm font-medium text-sage hover:bg-sage/5">
      Review family group requests →
    </RouterLink>

    <div class="card overflow-hidden divide-y divide-stone reveal delay-1">
      <!-- Language -->
      <div class="p-5 flex items-center justify-between transition-colors duration-300 hover:bg-parchment/50">
        <div>
          <p class="text-sm font-medium text-ink">Language</p>
          <p class="text-xs text-ink/50">Interface language</p>
        </div>
        <select
          v-model="language"
          class="border border-stone rounded-lg px-3 py-1.5 text-sm transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-sage/30"
        >
          <option>English</option>
          <option>Español</option>
          <option>中文</option>
          <option>Français</option>
        </select>
      </div>

      <!-- Reminder -->
      <div class="p-5 flex items-center justify-between transition-colors duration-300 hover:bg-parchment/50">
        <div>
          <p class="text-sm font-medium text-ink">Daily Reminder</p>
          <p class="text-xs text-ink/50">Remind me to read</p>
        </div>
        <input
          v-model="reminderTime"
          type="time"
          class="border border-stone rounded-lg px-3 py-1.5 text-sm transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-sage/30"
        />
      </div>

      <!-- Appearance -->
      <div class="p-5 flex items-center justify-between transition-colors duration-300 hover:bg-parchment/50">
        <div>
          <p class="text-sm font-medium text-ink">Appearance</p>
          <p class="text-xs text-ink/50">Theme preference</p>
        </div>
        <div class="flex bg-stone rounded-lg p-0.5">
          <button
            v-for="t in ['light', 'dark']"
            :key="t"
            @click="appearance = t"
            :class="[
              'px-3 py-1 rounded-md text-xs font-medium capitalize transition-all duration-300',
              appearance === t ? 'bg-white text-ink shadow-sm' : 'text-ink/50 hover:text-ink',
            ]"
          >
            {{ t }}
          </button>
        </div>
      </div>

      <!-- Notifications -->
      <div class="p-5 flex items-center justify-between transition-colors duration-300 hover:bg-parchment/50">
        <div>
          <p class="text-sm font-medium text-ink">Notifications</p>
          <p class="text-xs text-ink/50">Family activity & prayer updates</p>
        </div>
        <button
          @click="notifications = !notifications"
          :class="[
            'relative w-11 h-6 rounded-full transition-colors duration-300 btn-press',
            notifications ? 'bg-sage' : 'bg-stone',
          ]"
          :aria-pressed="notifications"
          aria-label="Toggle notifications"
        >
          <span
            :class="[
              'absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ease-out',
              notifications ? 'translate-x-5' : 'translate-x-0',
            ]"
          />
        </button>
      </div>

      <!-- Account -->
      <div class="p-5 transition-colors duration-300 hover:bg-parchment/50">
        <p class="text-sm font-medium text-ink mb-2">Account</p>
        <p class="text-xs text-ink/50 mb-3">Signed in as {{ signedInAs }}</p>
        <button
          @click="signOut"
          class="text-sm text-rose hover:text-rose/80 font-medium btn-press"
        >
          Sign Out
        </button>
      </div>
    </div>
  </div>
</template>
