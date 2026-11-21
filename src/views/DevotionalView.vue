<script setup>
import { useDevotionalStore } from '@/stores/devotional'
const store = useDevotionalStore()
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink heading-rule reveal">Daily Devotional</h1>

    <article class="card sheen p-6 sm:p-8 space-y-6 reveal delay-1">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-1">{{ store.today.scripture }}</p>
        <h2 class="font-serif text-2xl font-bold text-ink">{{ store.today.title }}</h2>
      </div>

      <blockquote
        class="border-l-4 border-gold pl-4 font-serif text-lg italic text-ink/80 transition-all duration-300 hover:border-sage hover:pl-5"
      >
        {{ store.today.verse }}
      </blockquote>

      <div>
        <h3 class="text-xs font-semibold uppercase tracking-[0.15em] text-sage mb-2">Message</h3>
        <p class="text-ink/80 leading-relaxed">{{ store.today.message }}</p>
      </div>

      <div class="bg-parchment rounded-xl p-5 transition-colors duration-300 hover:bg-parchment/70">
        <h3 class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-2">Meditation</h3>
        <p class="text-ink/70 text-sm leading-relaxed">{{ store.today.meditation }}</p>
      </div>

      <div>
        <h3 class="text-xs font-semibold uppercase tracking-[0.15em] text-sage mb-2">Prayer</h3>
        <p class="text-ink/80 leading-relaxed italic">{{ store.today.prayer }}</p>
      </div>
    </article>
  </div>
</template>
