<script setup>
import { onMounted } from 'vue'
import { useDevotionalStore } from '@/stores/devotional'
import { useFamilyStore } from '@/stores/family'
import { useAuthStore } from '@/stores/auth'
import { useCountUp } from '@/composables/useCountUp'

const devotionalStore = useDevotionalStore()
const familyStore = useFamilyStore()
const authStore = useAuthStore()
onMounted(() => familyStore.init(authStore.user))

const { formatted: progressLabel } = useCountUp(() => familyStore.totalProgress)
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="reveal">
      <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink heading-rule">Welcome back</h1>
      <p class="mt-3 text-sm text-ink/55">Here's how your family is growing in the Word.</p>
    </div>

    <!-- Today's Verse -->
    <section class="verse-card sheen card card-hover relative overflow-hidden reveal delay-1">
      <span
        class="pointer-events-none absolute -right-2 -top-6 font-serif text-[9rem] leading-none text-gold/10 select-none animate-float"
        aria-hidden="true"
      >
        &rdquo;
      </span>
      <div class="relative p-6 sm:p-8">
        <p class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-3">Today's Verse</p>
        <blockquote class="font-serif text-lg sm:text-xl text-ink leading-relaxed italic">
          "{{ devotionalStore.today.verse }}"
        </blockquote>
        <p class="mt-3 text-sm text-sage">— {{ devotionalStore.today.scripture }}</p>
      </div>
    </section>

    <div class="grid md:grid-cols-2 gap-6 stagger">
      <!-- Devotional Card -->
      <section class="card card-hover p-6">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Daily Devotional</p>
          <RouterLink
            to="/devotional"
            class="text-xs text-sage hover:text-sage-dark font-medium transition-colors inline-flex items-center gap-1 group"
          >
            Read more
            <span class="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </RouterLink>
        </div>
        <h2 class="font-serif text-xl font-bold text-ink mb-2">{{ devotionalStore.today.title }}</h2>
        <p class="text-sm text-ink/70 leading-relaxed line-clamp-3">{{ devotionalStore.today.message }}</p>
      </section>

      <!-- Reading Progress -->
      <section class="card card-hover p-6">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Reading Progress</p>
          <RouterLink
            to="/growth"
            class="text-xs text-sage hover:text-sage-dark font-medium transition-colors inline-flex items-center gap-1 group"
          >
            View all
            <span class="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </RouterLink>
        </div>
        <div class="flex items-end gap-2 mb-2">
          <span class="text-3xl font-bold text-ink tabular-nums">{{ progressLabel }}%</span>
          <span class="text-sm text-sage mb-1">overall</span>
        </div>
        <div class="w-full bg-stone rounded-full h-2.5 overflow-hidden">
          <div
            class="progress-fill bg-gradient-to-r from-sage to-gold h-2.5 rounded-full"
            :style="{ width: familyStore.totalProgress + '%' }"
          />
        </div>
        <p class="mt-3 text-xs text-ink/50">Current streak: {{ familyStore.currentStreak }} days 🔥</p>
      </section>
    </div>

    <!-- Family Activity -->
    <section class="card p-6 reveal delay-2">
      <p class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-4">Family Activity</p>
      <ul v-if="familyStore.recentActivity.length" class="stagger space-y-1">
        <li
          v-for="(act, i) in familyStore.recentActivity"
          :key="i"
          class="flex items-center gap-3 text-sm rounded-xl px-2 py-2.5 -mx-2 transition-colors duration-300 hover:bg-parchment/70"
        >
          <span
            class="w-8 h-8 rounded-full bg-sage/10 flex items-center justify-center text-xs transition-transform duration-300 hover:scale-110"
          >
            {{ act.icon }}
          </span>
          <div class="flex-1">
            <span class="font-medium text-ink">{{ act.member }}</span>
            <span class="text-ink/60"> {{ act.action }}</span>
          </div>
          <span class="text-xs text-ink/40">{{ act.timeLabel }}</span>
        </li>
      </ul>
      <p v-else class="text-sm text-ink/40 italic">No recent activity yet — start reading!</p>
    </section>
  </div>
</template>
