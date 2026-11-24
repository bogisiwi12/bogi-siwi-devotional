<script setup>
import { onMounted, ref } from 'vue'
import { useFamilyStore } from '@/stores/family'
import { useAuthStore } from '@/stores/auth'

const store = useFamilyStore()
const auth = useAuthStore()
const inviteEmail = ref('')
const notice = ref('')
const error = ref('')
const busy = ref(false)
const actionBusy = ref('')

onMounted(() => store.init(auth.user))

const ROLES = [
  { value: 'parent', label: 'Parent', icon: '👨‍👩‍👧' },
  { value: 'child',  label: 'Child',  icon: '🧒' },
]

const ROLE_META = {
  parent: { label: 'Parent', icon: '👨‍👩‍👧' },
  child:  { label: 'Child',  icon: '🧒' },
}

function isOwner() {
  return store.familyId === auth.user?.uid
}

async function sendInvite() {
  if (!inviteEmail.value.trim()) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await store.inviteMember(inviteEmail.value)
    notice.value = `Invitation sent to ${inviteEmail.value.trim()}.`
    inviteEmail.value = ''
  } catch (err) { error.value = err.message }
  finally { busy.value = false }
}

async function approve(invite) {
  actionBusy.value = invite.id
  error.value = ''
  try { await store.approveInvitation(invite) }
  catch (err) { error.value = err.message }
  finally { actionBusy.value = '' }
}

async function changeRole(member, role) {
  if (member.role === role) return
  actionBusy.value = `role-${member.uid}`
  error.value = ''
  try { await store.updateMemberRole(member, role) }
  catch (err) { error.value = err.message }
  finally { actionBusy.value = '' }
}

async function resend(invite) {
  actionBusy.value = `resend-${invite.id}`
  error.value = ''
  notice.value = ''
  try {
    await store.resendInvite(invite.email)
    notice.value = `Invitation resent to ${invite.email}.`
  } catch (err) { error.value = err.message }
  finally { actionBusy.value = '' }
}

async function cancelInvite(invite) {
  if (!confirm(`Cancel invitation for ${invite.email}?`)) return
  actionBusy.value = `cancel-${invite.id}`
  error.value = ''
  try { await store.deleteInvite(invite.id) }
  catch (err) { error.value = err.message }
  finally { actionBusy.value = '' }
}

async function remove(member) {
  if (!confirm(`Remove ${member.name} from the family?`)) return
  actionBusy.value = `remove-${member.uid}`
  error.value = ''
  try { await store.removeMember(member.uid) }
  catch (err) { error.value = err.message }
  finally { actionBusy.value = '' }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink heading-rule reveal">Family Members</h1>

    <p v-if="store.error" class="text-sm text-rose">{{ store.error }}</p>

    <!-- Awaiting approval notice -->
    <section v-if="store.awaitingApproval" class="card p-5 border border-gold/30 bg-gold/5">
      <p class="font-medium text-ink">Invitation accepted — waiting for family approval.</p>
      <p class="text-sm text-ink/55 mt-1">This page will update automatically once the family owner approves your membership.</p>
    </section>

    <!-- Loading skeleton -->
    <div v-if="store.loading" class="grid sm:grid-cols-2 gap-4">
      <div v-for="i in 2" :key="i" class="card p-5 flex items-center gap-4 animate-pulse">
        <div class="w-12 h-12 rounded-full bg-stone" />
        <div class="flex-1 space-y-2">
          <div class="h-3 bg-stone rounded w-2/3" />
          <div class="h-2.5 bg-stone rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- Approved members -->
    <div v-else class="space-y-3">
      <div
        v-for="member in store.members"
        :key="member.id"
        class="card p-4 sm:p-5 flex items-center gap-4 group"
      >
        <!-- Avatar -->
        <div class="w-11 h-11 rounded-full bg-sage/15 flex items-center justify-center text-xl shrink-0 select-none">
          {{ ROLE_META[member.role]?.icon ?? '🙂' }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="font-medium text-ink truncate">{{ member.name }}</p>
          <p class="text-xs text-ink/50 truncate">{{ member.email }}</p>
          <p class="text-xs text-ink/40 mt-0.5">🔥 {{ member.streak || 0 }} day streak</p>
        </div>

        <!-- Role badge / selector -->
        <div class="shrink-0 flex items-center gap-2">
          <!-- Family role selector (owner only) -->
          <template v-if="isOwner() && member.uid !== auth.user?.uid">
            <select
              :value="member.role"
              :disabled="actionBusy === `role-${member.uid}`"
              @change="changeRole(member, $event.target.value)"
              class="text-xs font-medium border border-stone rounded-lg px-2 py-1 bg-white text-ink
                     focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50 cursor-pointer"
            >
              <option v-for="r in ROLES" :key="r.value" :value="r.value">
                {{ r.icon }} {{ r.label }}
              </option>
            </select>
            <span
              v-if="actionBusy === `role-${member.uid}`"
              class="text-xs text-ink/40"
            >Saving…</span>
          </template>

          <!-- Role badge for non-owner view -->
          <span
            v-else
            class="text-xs font-semibold px-2.5 py-1 rounded-full"
            :class="{
              'bg-sage/15 text-sage':   member.role === 'parent',
              'bg-blue-50 text-blue-500': member.role === 'child',
            }"
          >{{ ROLE_META[member.role]?.label ?? member.role }}</span>

          <!-- Remove button (owner only, hover-revealed) -->
          <button
            v-if="isOwner() && member.uid !== auth.user?.uid"
            @click="remove(member)"
            :disabled="actionBusy === `remove-${member.uid}`"
            class="opacity-0 group-hover:opacity-100 text-xs text-rose/70 hover:text-rose
                   transition-opacity disabled:opacity-30 ml-1"
            title="Remove member"
          >✕</button>
        </div>
      </div>

      <p v-if="!store.loading && !store.members.length" class="text-sm text-ink/40 italic px-1">
        No members yet — invite your family below.
      </p>
    </div>

    <!-- Pending invitations (admin only) -->
    <section v-if="isOwner() && store.pendingInvitations.length" class="card p-6">
      <h2 class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-3">Pending Invitations</h2>
      <div
        v-for="invite in store.pendingInvitations"
        :key="invite.id"
        class="flex items-center justify-between gap-3 py-3 border-b border-stone last:border-0"
      >
        <div>
          <p class="text-sm text-ink">{{ invite.email }}</p>
          <p class="text-xs text-ink/40 mt-0.5">
            {{ invite.claimedUid ? '✓ Accepted — awaiting your approval' : 'Sent, waiting for them to open it' }}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            v-if="invite.claimedUid"
            @click="approve(invite)"
            :disabled="actionBusy === invite.id"
            class="text-sm font-medium text-sage hover:text-sage-dark disabled:opacity-40"
          >{{ actionBusy === invite.id ? 'Approving…' : 'Approve' }}</button>
          <button
            v-else
            @click="resend(invite)"
            :disabled="actionBusy === `resend-${invite.id}`"
            class="text-sm font-medium text-sage hover:text-sage-dark disabled:opacity-40"
          >{{ actionBusy === `resend-${invite.id}` ? 'Sending…' : 'Resend' }}</button>
          <button
            @click="cancelInvite(invite)"
            :disabled="actionBusy === `cancel-${invite.id}`"
            class="text-sm text-rose/70 hover:text-rose disabled:opacity-40"
          >Cancel</button>
        </div>
      </div>
    </section>

    <!-- Invite form (owner only) -->
    <section v-if="isOwner()" class="card p-6 reveal delay-1">
      <h2 class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-3">Invite a Family Member</h2>
      <form class="flex gap-3" @submit.prevent="sendInvite">
        <input
          v-model="inviteEmail"
          type="email"
          required
          placeholder="Email address"
          class="flex-1 min-w-0 border border-stone rounded-lg px-4 py-2.5 text-sm
                 focus:outline-none focus:ring-2 focus:ring-sage/30"
        />
        <button
          :disabled="busy"
          class="bg-sage hover:bg-sage-dark text-white text-sm font-medium px-5 py-2.5
                 rounded-lg shrink-0 disabled:opacity-50"
        >{{ busy ? 'Sending…' : 'Send Invite' }}</button>
      </form>
      <p v-if="notice" class="text-sm text-sage mt-2">✓ {{ notice }}</p>
      <p v-if="error" class="text-sm text-rose mt-2">{{ error }}</p>
      <p class="text-xs text-ink/40 mt-3 leading-relaxed">
        They'll receive an email invitation. After they accept and you approve them, they join as a
        <strong>Child</strong>. You can change their role to <strong>Parent</strong> at any time.
      </p>
    </section>

    <!-- Role legend (always visible) -->
    <section class="card p-5 reveal delay-2">
      <h2 class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-3">Roles</h2>
      <ul class="space-y-2 text-sm text-ink/70">
        <li class="flex items-center gap-2"><span>👨‍👩‍👧</span><strong class="text-ink">Parent</strong> — adult family member</li>
        <li class="flex items-center gap-2"><span>🧒</span><strong class="text-ink">Child</strong> — younger family member</li>
      </ul>
    </section>
  </div>
</template>
