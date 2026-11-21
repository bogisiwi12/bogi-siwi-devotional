<script setup>
import { computed, onMounted } from 'vue'
import { useFamilyStore } from '@/stores/family'
import { useAuthStore } from '@/stores/auth'
import { useCountUp } from '@/composables/useCountUp'

const store = useFamilyStore()
const auth = useAuthStore()
onMounted(() => store.init(auth.user))

const { formatted: streak } = useCountUp(() => store.currentStreak)
const { formatted: progress } = useCountUp(() => store.totalProgress)
const { formatted: bookmarkCount } = useCountUp(() => store.bookmarks.length)

const weeklyData = computed(() => store.weeklyReading)
const maxChapters = computed(() => Math.max(1, ...weeklyData.value.map((day) => day.chapters)))
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink heading-rule reveal">Spiritual Growth</h1>

    <div class="grid sm:grid-cols-3 gap-4 stagger">
      <div class="card card-hover p-5 text-center">
        <p class="text-3xl font-bold text-ink tabular-nums">{{ streak }}</p>
        <p class="text-xs text-sage mt-1">Day Streak 🔥</p>
      </div>
      <div class="card card-hover p-5 text-center">
        <p class="text-3xl font-bold text-ink tabular-nums">{{ progress }}%</p>
        <p class="text-xs text-sage mt-1">Reading Progress</p>
      </div>
      <div class="card card-hover p-5 text-center">
        <p class="text-3xl font-bold text-ink tabular-nums">{{ bookmarkCount }}</p>
        <p class="text-xs text-sage mt-1">Bookmarks</p>
      </div>
    </div>

    <!-- Weekly Chart -->
    <section class="card p-6 reveal delay-1">
      <h2 class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-4">This Week's Reading</h2>
      <div class="flex items-end gap-3 h-36">
        <div
          v-for="(d, i) in weeklyData"
          :key="d.day"
          class="flex-1 flex flex-col items-center justify-end h-full gap-1.5"
        >
          <div
            class="w-full bar-grow rounded-t-md bg-gradient-to-t from-sage/60 to-sage transition-all duration-300 hover:from-gold/60 hover:to-gold"
            :style="{ height: (d.chapters / maxChapters * 100) + '%', animationDelay: (i * 60) + 'ms' }"
            :title="d.chapters + ' chapters'"
          />
          <span class="text-xs text-ink/50">{{ d.day }}</span>
        </div>
      </div>
    </section>

    <!-- Reading History -->
    <section class="card p-6 reveal delay-2">
      <h2 class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-4">Recent Reading History</h2>
      <ul class="space-y-2">
        <li
          v-for="(pct, ref) in store.readingProgress"
          :key="ref"
          class="flex items-center justify-between text-sm py-1.5 border-b border-stone/50 last:border-0 transition-colors duration-300 hover:text-ink"
        >
          <span class="text-ink/70">{{ ref }}</span>
          <span class="text-xs" :class="pct === 100 ? 'text-sage' : 'text-ink/40'">
            {{ pct === 100 ? 'Completed ✓' : pct + '%' }}
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>
