<script setup>
import { computed, ref } from 'vue'
import { useFamilyStore } from '@/stores/family'

const store = useFamilyStore()
const newPrayer = ref('')

const submit = () => {
  if (!newPrayer.value.trim()) return
  store.addPrayerRequest(newPrayer.value)
  newPrayer.value = ''
}

const activePrayers = computed(() => store.prayerRequests.filter(r => !r.answered))
const answeredPrayers = computed(() => store.prayerRequests.filter(r => r.answered))
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink heading-rule reveal">Family Prayer</h1>

    <!-- Input -->
    <div class="flex gap-3 reveal delay-1">
      <input
        v-model="newPrayer"
        @keyup.enter="submit"
        placeholder="Share a prayer request..."
        class="flex-1 bg-white border border-stone rounded-lg px-4 py-2.5 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage/50 focus:shadow-sm"
      />
      <button
        @click="submit"
        class="bg-sage hover:bg-sage-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg btn-press"
      >
        Pray
      </button>
    </div>

    <!-- Active -->
    <section class="reveal delay-2">
      <h2 class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-3">Prayer Requests</h2>
      <TransitionGroup name="list" tag="div" class="space-y-3">
        <div
          v-for="req in activePrayers"
          :key="req.id"
          class="card card-hover p-4 flex items-start gap-3 group"
        >
          <button
            @click="store.togglePrayerAnswered(req.id)"
            class="mt-1 w-5 h-5 rounded border-2 border-sage/40 hover:border-sage flex items-center justify-center transition-all duration-300 btn-press group/check"
            title="Mark as answered"
          >
            <span class="text-xs text-sage opacity-0 group-hover/check:opacity-100 transition-opacity">✓</span>
          </button>
          <div class="flex-1">
            <p class="text-sm text-ink">{{ req.text }}</p>
            <p class="text-xs text-ink/40 mt-1">{{ req.author }} · {{ req.date }}</p>
          </div>
        </div>
      </TransitionGroup>
      <Transition name="fade">
        <p v-if="!activePrayers.length" class="text-sm text-ink/40 italic mt-3">No active prayer requests.</p>
      </Transition>
    </section>

    <!-- Answered -->
    <section class="reveal delay-3">
      <h2 class="text-xs font-semibold uppercase tracking-[0.15em] text-sage mb-3">Answered Prayers 🙌</h2>
      <TransitionGroup name="list" tag="div" class="space-y-3">
        <div
          v-for="req in answeredPrayers"
          :key="req.id"
          class="bg-sage/5 rounded-xl p-4 border border-sage/20 flex items-start gap-3 transition-colors duration-300 hover:bg-sage/10"
        >
          <span class="text-sage mt-0.5">✓</span>
          <div class="flex-1">
            <p class="text-sm text-ink/70 line-through">{{ req.text }}</p>
            <p class="text-xs text-ink/40 mt-1">{{ req.author }} · {{ req.date }}</p>
          </div>
        </div>
      </TransitionGroup>
      <Transition name="fade">
        <p v-if="!answeredPrayers.length" class="text-sm text-ink/40 italic mt-3">No answered prayers yet.</p>
      </Transition>
    </section>
  </div>
</template>
