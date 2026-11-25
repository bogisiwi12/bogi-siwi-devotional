<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useFamilyStore } from '@/stores/family'

const store = useFamilyStore()
const requests = ref([])
const loaded = ref(false)
const error = ref('')
const busyId = ref('')
let stop

const pendingCountLabel = computed(() => {
  const count = requests.value.length
  return `${count} pending ${count === 1 ? 'request' : 'requests'}`
})

function itemId(item) {
  return item?.uid || item?.id || ''
}

onMounted(async () => {
  stop = await store.loadFamilyRequests(
    (items) => {
      requests.value = items
      loaded.value = true
    },
    (err) => {
      error.value = err?.message || 'Failed to load family requests.'
      loaded.value = true
    }
  )
})

onUnmounted(() => stop?.())

function formatRequestedAt(value) {
  if (!value) return 'Requested time unavailable'
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Requested time unavailable'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function initials(item) {
  const source = (item?.name || item?.email || '?').trim()
  if (!source) return '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

async function approve(item) {
  busyId.value = itemId(item)
  error.value = ''
  try {
    await store.approveFamilyRequest(item)
  } catch (err) {
    error.value = err?.message || 'Could not approve this request.'
  } finally {
    busyId.value = ''
  }
}

async function reject(item) {
  const name = item?.name || item?.email || 'this requester'
  if (typeof window !== 'undefined' && !window.confirm(`Reject the family creation request from ${name}?`)) return
  busyId.value = itemId(item)
  error.value = ''
  try {
    await store.rejectFamilyRequest(item)
  } catch (err) {
    error.value = err?.message || 'Could not reject this request.'
  } finally {
    busyId.value = ''
  }
}
</script>

<template>
  <main class="min-h-screen bg-parchment">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      <header class="space-y-4 reveal">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="space-y-3 max-w-3xl">
            <RouterLink
              to="/settings"
              class="inline-flex items-center gap-2 text-sm font-medium text-sage hover:text-sage-dark transition-colors w-fit"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to settings
            </RouterLink>

            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Admin Review</p>
              <h1 class="font-serif text-3xl sm:text-4xl font-bold text-ink heading-rule">New Family Requests</h1>
              <p class="text-sm sm:text-base text-ink/65 leading-relaxed">
                Review requests from users who want to create a new family group. Approving creates the family and
                assigns the requester as the parent/owner. Rejecting keeps the requester without a family group.
              </p>
            </div>
          </div>

          <div class="card px-4 sm:px-5 py-4 flex items-center justify-between gap-4 min-w-[220px]">
            <div>
              <p class="text-xs uppercase tracking-wide text-ink/45">Queue status</p>
              <p class="text-sm font-medium text-ink mt-0.5">{{ pendingCountLabel }}</p>
            </div>
            <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-gold/25 to-sage/25 text-ink font-semibold grid place-items-center">
              {{ requests.length }}
            </div>
          </div>
        </div>
      </header>

      <div
        v-if="error"
        class="card border-rose/30 bg-rose/5 p-4 sm:p-5 flex items-start gap-3 reveal"
        role="alert"
      >
        <div class="mt-0.5 w-8 h-8 rounded-full bg-rose/10 text-rose grid place-items-center shrink-0">!</div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-rose">Unable to complete request action</p>
          <p class="text-sm text-rose/90 mt-0.5 break-words">{{ error }}</p>
        </div>
      </div>

      <section v-if="!loaded" class="space-y-4 reveal delay-1" aria-busy="true" aria-live="polite">
        <article v-for="n in 3" :key="n" class="card p-5 sm:p-6">
          <div class="flex flex-col sm:flex-row sm:items-center gap-4 animate-pulse">
            <div class="flex items-center gap-4 flex-1">
              <div class="w-12 h-12 rounded-full bg-stone/70"></div>
              <div class="space-y-2 flex-1">
                <div class="h-4 bg-stone/70 rounded w-40 max-w-full"></div>
                <div class="h-3 bg-stone/60 rounded w-56 max-w-full"></div>
                <div class="h-3 bg-stone/50 rounded w-32 max-w-full"></div>
              </div>
            </div>
            <div class="flex gap-3 sm:w-56">
              <div class="h-10 bg-stone/60 rounded-lg flex-1"></div>
              <div class="h-10 bg-stone/70 rounded-lg flex-1"></div>
            </div>
          </div>
        </article>
      </section>

      <section v-else-if="!requests.length" class="card p-8 sm:p-12 text-center space-y-4 reveal delay-1">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sage/20 to-gold/20 grid place-items-center text-2xl">
          ✓
        </div>
        <div class="space-y-2">
          <h2 class="font-serif text-2xl font-semibold text-ink">No pending requests</h2>
          <p class="text-sm sm:text-base text-ink/60 max-w-xl mx-auto">
            New family creation requests will appear here when users ask to start a family group. Approved and rejected
            requests are removed from this queue automatically.
          </p>
        </div>
        <RouterLink
          to="/settings"
          class="inline-flex items-center justify-center gap-2 bg-white border border-stone hover:border-sage/40 text-ink text-sm font-medium px-4 py-2.5 rounded-lg transition-colors btn-press"
        >
          Return to settings
        </RouterLink>
      </section>

      <section v-else class="space-y-4 stagger" aria-label="Pending family creation requests">
        <article
          v-for="item in requests"
          :key="item.uid || item.id"
          class="card overflow-hidden"
        >
          <div class="p-5 sm:p-6 lg:p-7 flex flex-col lg:flex-row lg:items-center gap-5">
            <div class="flex items-start sm:items-center gap-4 flex-1 min-w-0">
              <div
                class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sage/30 via-white to-gold/25 border border-stone text-ink font-semibold grid place-items-center shrink-0 shadow-sm"
                aria-hidden="true"
              >
                {{ initials(item) }}
              </div>

              <div class="min-w-0 flex-1 space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="font-semibold text-lg text-ink truncate max-w-full">{{ item.name || 'Unnamed requester' }}</h2>
                  <span class="inline-flex items-center rounded-full bg-gold/15 text-gold border border-gold/20 px-2.5 py-0.5 text-xs font-medium capitalize">
                    {{ item.status || 'pending' }}
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-ink/65">
                  <p class="truncate">
                    <span class="text-ink/45">Email:</span>
                    <span class="ml-1 font-medium text-ink/80">{{ item.email || 'No email provided' }}</span>
                  </p>
                  <p class="truncate">
                    <span class="text-ink/45">Requested:</span>
                    <span class="ml-1">{{ formatRequestedAt(item.createdAt) }}</span>
                  </p>
                </div>

                <p class="text-xs text-ink/45 break-all">
                  Request ID: <span class="font-mono">{{ item.uid || item.id || 'Unknown' }}</span>
                </p>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 lg:w-56 xl:w-auto lg:shrink-0">
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-rose/25 bg-rose/5 hover:bg-rose/10 text-rose text-sm font-medium px-4 py-2.5 transition-colors disabled:opacity-45 disabled:cursor-not-allowed btn-press w-full sm:w-auto"
                :disabled="busyId === itemId(item)"
                @click="reject(item)"
              >
                <span>Reject</span>
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-sage hover:bg-sage-dark text-white text-sm font-semibold px-4 py-2.5 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-press w-full sm:w-auto"
                :disabled="busyId === itemId(item)"
                @click="approve(item)"
              >
                <svg
                  v-if="busyId === itemId(item)"
                  class="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>{{ busyId === itemId(item) ? 'Processing…' : 'Approve family' }}</span>
              </button>
            </div>
          </div>

          <div class="px-5 sm:px-6 lg:px-7 py-3 border-t border-stone/80 bg-parchment/40 text-xs sm:text-sm text-ink/55 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p>Approving will create a new family workspace for this requester.</p>
            <p class="font-medium text-sage-dark">Action required by admin</p>
          </div>
        </article>
      </section>

      <p v-if="loaded && requests.length" class="text-xs text-ink/45 px-1 reveal-fade">
        Requests update in real time. After you approve or reject a request, it will disappear from this list.
      </p>
    </div>
  </main>
</template>
