<script setup>
import { ref } from 'vue'

const plans = ref([
  { id: 1, title: 'Bible in a Year', type: 'Daily', duration: '365 days', description: 'Read the entire Bible in one year with daily Old and New Testament portions.', progress: 32 },
  { id: 2, title: 'The Gospels in 30 Days', type: 'Thematic', duration: '30 days', description: 'Journey through Matthew, Mark, Luke, and John.', progress: 0 },
  { id: 3, title: 'Psalms & Proverbs', type: 'Weekly', duration: '12 weeks', description: 'One Psalm and one Proverb each week for wisdom and worship.', progress: 75 },
])
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink heading-rule reveal">Reading Plans</h1>

    <div class="space-y-4 stagger">
      <div v-for="plan in plans" :key="plan.id" class="card card-hover sheen p-6">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs px-2 py-0.5 rounded-full bg-stone text-ink/60 transition-colors duration-300 hover:bg-gold/15 hover:text-gold">
                {{ plan.type }}
              </span>
              <span class="text-xs text-ink/40">{{ plan.duration }}</span>
            </div>
            <h3 class="font-serif text-lg font-bold text-ink">{{ plan.title }}</h3>
          </div>
          <button class="text-sm font-medium text-sage hover:text-sage-dark btn-press shrink-0">Start</button>
        </div>
        <p class="text-sm text-ink/60 mt-2">{{ plan.description }}</p>
        <div class="mt-4">
          <div class="w-full bg-stone rounded-full h-1.5 overflow-hidden">
            <div
              class="progress-fill bg-gradient-to-r from-gold to-sage h-1.5 rounded-full"
              :style="{ width: plan.progress + '%' }"
            />
          </div>
          <p class="text-xs text-ink/40 mt-1">{{ plan.progress }}% complete</p>
        </div>
      </div>
    </div>
  </div>
</template>
