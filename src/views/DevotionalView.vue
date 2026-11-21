<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDevotionalStore } from '@/stores/devotional'
import { useFamilyStore } from '@/stores/family'
import { useAuthStore } from '@/stores/auth'
const store = useDevotionalStore()
const family = useFamilyStore()
const auth = useAuthStore()
const now = new Date()
const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const completed = computed(() => family.devotionalReads[todayKey]?.completed || false)
const error = ref('')
const devotional = ref(store.today)
onMounted(async () => {
  await family.init(auth.user)
  try { devotional.value = await family.getDailyDevotional(todayKey, store.today) }
  catch (err) { error.value = err.message }
})
async function markComplete() {
  error.value = ''
  try { await family.saveDevotionalRead(todayKey, !completed.value) }
  catch (err) { error.value = err.message }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink heading-rule reveal">Daily Devotional</h1>

    <article class="card sheen p-6 sm:p-8 space-y-6 reveal delay-1">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-1">{{ devotional.scripture }}</p>
        <h2 class="font-serif text-2xl font-bold text-ink">{{ devotional.title }}</h2>
      </div>

      <blockquote
        class="border-l-4 border-gold pl-4 font-serif text-lg italic text-ink/80 transition-all duration-300 hover:border-sage hover:pl-5"
      >
        {{ devotional.verse }}
      </blockquote>

      <div>
        <h3 class="text-xs font-semibold uppercase tracking-[0.15em] text-sage mb-2">Message</h3>
        <p class="text-ink/80 leading-relaxed">{{ devotional.message }}</p>
      </div>

      <div class="bg-parchment rounded-xl p-5 transition-colors duration-300 hover:bg-parchment/70">
        <h3 class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-2">Meditation</h3>
        <p class="text-ink/70 text-sm leading-relaxed">{{ devotional.meditation }}</p>
      </div>

      <div>
        <h3 class="text-xs font-semibold uppercase tracking-[0.15em] text-sage mb-2">Prayer</h3>
        <p class="text-ink/80 leading-relaxed italic">{{ devotional.prayer }}</p>
      </div>
      <div class="border-t border-stone pt-4">
        <button @click="markComplete" class="text-sm font-medium text-sage hover:text-sage-dark">{{ completed ? '✓ Completed today' : 'Mark today’s devotional complete' }}</button>
        <p v-if="error" class="text-sm text-rose mt-2">{{ error }}</p>
      </div>
    </article>
  </div>
</template>
