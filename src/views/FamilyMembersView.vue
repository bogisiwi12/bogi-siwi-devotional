<script setup>
import { ref } from 'vue'
import { useFamilyStore } from '@/stores/family'

const store = useFamilyStore()
const inviteEmail = ref('')
const invited = ref(false)

const sendInvite = () => {
  if (!inviteEmail.value.trim()) return
  invited.value = true
  inviteEmail.value = ''
  setTimeout(() => invited.value = false, 3000)
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink heading-rule reveal">Family Members</h1>

    <!-- Members List -->
    <div class="grid sm:grid-cols-2 gap-4 stagger">
      <div
        v-for="m in store.members"
        :key="m.id"
        class="card card-hover p-5 flex items-center gap-4 group"
      >
        <div
          class="w-12 h-12 rounded-full bg-gradient-to-br from-sage/20 to-gold/15 flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110"
        >
          {{ m.avatar }}
        </div>
        <div class="flex-1">
          <p class="font-medium text-ink">{{ m.name }}</p>
          <p class="text-xs text-sage">{{ m.role }}</p>
          <p class="text-xs text-ink/40 mt-0.5">🔥 {{ m.streak }} day streak</p>
        </div>
        <span class="text-xs px-2 py-0.5 rounded-full bg-stone text-ink/50">{{ m.permission }}</span>
      </div>
    </div>

    <!-- Invite -->
    <section class="card p-6 reveal delay-1">
      <h2 class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-3">Invite a Family Member</h2>
      <div class="flex gap-3">
        <input
          v-model="inviteEmail"
          type="email"
          placeholder="Email address"
          class="flex-1 border border-stone rounded-lg px-4 py-2.5 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage/50"
        />
        <button
          @click="sendInvite"
          class="bg-sage hover:bg-sage-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg btn-press shrink-0"
        >
          Send Invite
        </button>
      </div>
      <Transition name="pop">
        <p v-if="invited" class="text-sm text-sage mt-2">✓ Invitation sent successfully!</p>
      </Transition>
      <p class="text-xs text-ink/40 mt-2">Invited members can read, reflect, and join family prayer.</p>
    </section>
  </div>
</template>
