<script setup>
import { ref } from 'vue'
import { useFamilyStore } from '@/stores/family'

const store = useFamilyStore()
const showForm = ref(false)
const newTitle = ref('')
const newContent = ref('')
const newType = ref('journal')

const submit = () => {
  if (!newTitle.value.trim()) return
  store.addReflection({ title: newTitle.value, content: newContent.value, type: newType.value })
  newTitle.value = ''
  newContent.value = ''
  showForm.value = false
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center justify-between reveal">
      <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink heading-rule">My Reflections</h1>
      <button
        @click="showForm = !showForm"
        class="bg-sage hover:bg-sage-dark text-white text-sm font-medium px-4 py-2 rounded-lg btn-press"
      >
        {{ showForm ? 'Cancel' : '+ New' }}
      </button>
    </div>

    <!-- New Reflection Form -->
    <Transition name="pop">
      <div v-if="showForm" class="card p-6 space-y-4">
        <input
          v-model="newTitle"
          placeholder="Title"
          class="w-full border border-stone rounded-lg px-3 py-2 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage/50"
        />
        <select
          v-model="newType"
          class="border border-stone rounded-lg px-3 py-2 text-sm transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-sage/30"
        >
          <option value="journal">Personal Journal</option>
          <option value="study">Bible Study Note</option>
        </select>
        <textarea
          v-model="newContent"
          rows="4"
          placeholder="Write your reflection..."
          class="w-full border border-stone rounded-lg px-3 py-2 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage/50"
        />
        <button
          @click="submit"
          class="bg-sage text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-sage-dark btn-press"
        >
          Save Reflection
        </button>
      </div>
    </Transition>

    <!-- List -->
    <TransitionGroup name="list" tag="div" class="space-y-4">
      <div
        v-for="r in store.reflections"
        :key="r.id"
        class="card card-hover p-6"
      >
        <div class="flex items-center gap-2 mb-2">
          <span
            class="text-xs px-2 py-0.5 rounded-full transition-transform duration-300 hover:scale-105"
            :class="r.type === 'study' ? 'bg-gold/15 text-gold' : 'bg-sage/15 text-sage'"
          >
            {{ r.type === 'study' ? 'Study Note' : 'Journal' }}
          </span>
          <span class="text-xs text-ink/40">{{ r.date }}</span>
        </div>
        <h3 class="font-serif text-lg font-semibold text-ink">{{ r.title }}</h3>
        <p class="text-sm text-ink/70 mt-2 leading-relaxed">{{ r.content }}</p>
      </div>
    </TransitionGroup>

    <p v-if="!store.reflections.length" class="text-sm text-ink/40 italic reveal">
      No reflections yet — start writing today.
    </p>
  </div>
</template>
