<script setup>
import { computed, onMounted, ref } from 'vue'
import { useFamilyStore } from '@/stores/family'
import { useAuthStore } from '@/stores/auth'

const family = useFamilyStore()
const auth = useAuthStore()
const error = ref('')
const defaults = [
  { id: 'bible-year', title: 'Bible in a Year', type: 'Daily', duration: '365 days', description: 'Read the entire Bible in one year with daily Old and New Testament portions.', progress: 0 },
  { id: 'gospels-30', title: 'The Gospels in 30 Days', type: 'Thematic', duration: '30 days', description: 'Journey through Matthew, Mark, Luke, and John.', progress: 0 },
  { id: 'psalms-proverbs', title: 'Psalms & Proverbs', type: 'Weekly', duration: '12 weeks', description: 'One Psalm and one Proverb each week for wisdom and worship.', progress: 0 },
]
onMounted(() => family.init(auth.user))
const plans = computed(() => defaults.map((plan) => ({ ...plan, ...(family.readingPlans.find((item) => item.id === plan.id) || {}) })))

async function start(plan) {
  error.value = ''
  try { await family.savePlan(plan, true) }
  catch (err) { error.value = err.message }
}
async function completeDay(plan) {
  error.value = ''
  try { await family.savePlan({ ...plan, progress: Math.min(100, (plan.progress || 0) + 1) }, true) }
  catch (err) { error.value = err.message }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink heading-rule reveal">Reading Plans</h1>
    <p v-if="error" class="text-sm text-rose">{{ error }}</p>
    <div class="space-y-4 stagger">
      <div v-for="plan in plans" :key="plan.id" class="card card-hover sheen p-6">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1"><span class="text-xs px-2 py-0.5 rounded-full bg-stone text-ink/60">{{ plan.type }}</span><span class="text-xs text-ink/40">{{ plan.duration }}</span></div>
            <h3 class="font-serif text-lg font-bold text-ink">{{ plan.title }}</h3>
          </div>
          <button v-if="!plan.active" @click="start(plan)" class="text-sm font-medium text-sage hover:text-sage-dark shrink-0">Start</button>
          <button v-else @click="completeDay(plan)" class="text-sm font-medium text-sage hover:text-sage-dark shrink-0">Mark day complete</button>
        </div>
        <p class="text-sm text-ink/60 mt-2">{{ plan.description }}</p>
        <div class="mt-4"><div class="w-full bg-stone rounded-full h-1.5 overflow-hidden"><div class="progress-fill bg-gradient-to-r from-gold to-sage h-1.5 rounded-full" :style="{ width: plan.progress + '%' }" /></div><p class="text-xs text-ink/40 mt-1">{{ plan.progress }}% complete · {{ plan.active ? 'In progress' : 'Not started' }}</p></div>
      </div>
    </div>
  </div>
</template>
