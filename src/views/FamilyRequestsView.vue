<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useFamilyStore } from '@/stores/family'

const store = useFamilyStore()
const requests = ref([])
const error = ref('')
const busy = ref('')
let stop

onMounted(() => { stop = store.loadFamilyRequests((items) => { requests.value = items }, (err) => { error.value = err.message }) })
onUnmounted(() => stop?.())

async function approve(item) {
  busy.value = item.uid
  error.value = ''
  try { await store.approveFamilyRequest(item) }
  catch (err) { error.value = err.message }
  finally { busy.value = '' }
}

async function reject(item) {
  busy.value = item.uid
  error.value = ''
  try { await store.rejectFamilyRequest(item) }
  catch (err) { error.value = err.message }
  finally { busy.value = '' }
}
</script>

<template>
  <main class="min-h-screen bg-parchment p-5 sm:p-10">
    <div class="max-w-3xl mx-auto space-y-6">
      <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink">Family group requests</h1>
      <p v-if="error" class="text-sm text-rose" role="alert">{{ error }}</p>
      <p v-if="!requests.length" class="card p-6 text-sm text-ink/60">There are no pending requests.</p>
      <article v-for="item in requests" :key="item.uid" class="card p-5 flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-48">
          <p class="font-medium text-ink">{{ item.name }}</p>
          <p class="text-sm text-ink/55">{{ item.email }}</p>
        </div>
        <button class="text-sm text-rose" :disabled="busy === item.uid" @click="reject(item)">Reject</button>
        <button class="bg-sage text-white rounded-lg px-4 py-2 text-sm" :disabled="busy === item.uid" @click="approve(item)">
          {{ busy === item.uid ? 'Saving…' : 'Approve' }}
        </button>
      </article>
    </div>
  </main>
</template>
