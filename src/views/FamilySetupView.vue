<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFamilyStore } from '@/stores/family'
import { useAuthStore } from '@/stores/auth'

const store = useFamilyStore()
const auth = useAuthStore()
const router = useRouter()
const busy = ref(false)
const error = ref('')

onMounted(async () => {
  const savedInvite = window.localStorage.getItem('family-bible:pendingInvite')
  if (!savedInvite || !auth.user) return
  try {
    const { invite, family } = JSON.parse(savedInvite)
    if (!invite || !family) return
    busy.value = true
    await store.claimInvitation(invite, family, auth.user)
    await router.replace('/members')
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
})

async function setupFamily() {
  busy.value = true
  error.value = ''
  try {
    await store.createFamily(auth.user)
    router.replace('/')
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}

async function signOut() {
  await auth.logout()
  store.dispose()
  router.replace('/login')
}
</script>

<template>
  <div class="min-h-screen bg-parchment flex items-center justify-center p-5">
    <div class="w-full max-w-md space-y-6">

      <!-- Logo -->
      <div class="flex items-center justify-center gap-3">
        <div class="grid place-items-center w-12 h-12 rounded-xl text-white font-serif text-xl shadow bg-gradient-to-br from-gold to-sage animate-float">✝</div>
        <div>
          <p class="font-serif text-xl font-bold text-ink">Family Bible</p>
          <p class="text-xs text-sage">Together in the Word</p>
        </div>
      </div>

      <!-- Awaiting approval -->
      <div v-if="store.awaitingApproval" class="card p-8 text-center space-y-4">
        <div class="text-5xl">🙏</div>
        <h1 class="font-serif text-2xl font-bold text-ink">Invitation accepted!</h1>
        <p class="text-sm text-ink/60 leading-relaxed">
          Your family admin has been notified. This page will update automatically
          once they approve your membership — no need to refresh.
        </p>
        <div class="flex items-center justify-center gap-2 pt-2">
          <span class="w-2 h-2 rounded-full bg-gold animate-bounce" style="animation-delay:0ms" />
          <span class="w-2 h-2 rounded-full bg-gold animate-bounce" style="animation-delay:150ms" />
          <span class="w-2 h-2 rounded-full bg-gold animate-bounce" style="animation-delay:300ms" />
        </div>
        <button @click="signOut" class="text-xs text-ink/40 hover:text-rose transition-colors mt-4">
          Sign out
        </button>
      </div>

      <!-- No family — either create one (first admin) or explain they need an invite -->
      <div v-else class="card p-8 space-y-5">
        <div class="text-center space-y-2">
          <div class="text-5xl">👨‍👩‍👧</div>
          <h1 class="font-serif text-2xl font-bold text-ink">No family group yet</h1>
          <p class="text-sm text-ink/60 leading-relaxed">
            You're not part of a family group. You can create one as the family admin,
            or wait for someone to send you an invitation.
          </p>
        </div>

        <div class="border-t border-stone pt-5 space-y-3">
          <p class="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Create a family group</p>
          <p class="text-sm text-ink/60">
            As admin you can invite family members, approve them, and manage their roles.
          </p>
          <button
            @click="setupFamily"
            :disabled="busy"
            class="w-full bg-sage hover:bg-sage-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {{ busy ? 'Creating…' : 'Create my family group' }}
          </button>
          <p v-if="error" class="text-xs text-rose">{{ error }}</p>
        </div>

        <div class="border-t border-stone pt-5 space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Waiting for an invitation?</p>
          <p class="text-sm text-ink/60 leading-relaxed">
            Ask your family admin to send you an invite to
            <span class="font-medium text-ink">{{ auth.emailAddress }}</span>.
            Once you receive it, open the link in the email and sign in here.
          </p>
        </div>

        <button @click="signOut" class="w-full text-xs text-ink/40 hover:text-rose transition-colors pt-1">
          Sign out
        </button>
      </div>

    </div>
  </div>
</template>
