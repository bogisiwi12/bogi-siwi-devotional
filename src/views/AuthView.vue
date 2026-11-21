<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { isSignInWithEmailLink } from 'firebase/auth'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { auth as firebaseAuth, isFirebaseConfigured } from '@/firebase/config'
import { useFamilyStore } from '@/stores/family'

const auth = useAuthStore()
const familyStore = useFamilyStore()
const route = useRoute()
const router = useRouter()

const isRegister = computed(() => route.name === 'register')
const configured = isFirebaseConfigured

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const error = ref('')
const notice = ref('')
const isInvitationLink = ref(false)
const isMagicLink = ref(false)

// Invitation params read once from the URL on mount.
let inviteId = ''
let inviteFamily = ''

onMounted(async () => {
  let linkUrl = window.location.href
  for (let depth = 0; depth < 3 && linkUrl; depth += 1) {
    const params = new URL(linkUrl, window.location.origin).searchParams
    inviteId ||= params.get('invite') || ''
    inviteFamily ||= params.get('family') || ''
    linkUrl = params.get('continueUrl') || params.get('link') || ''
  }
  if ((!inviteId || !inviteFamily) && window.localStorage.getItem('family-bible:pendingInvite')) {
    try {
      const pending = JSON.parse(window.localStorage.getItem('family-bible:pendingInvite'))
      inviteId ||= pending.invite || ''
      inviteFamily ||= pending.family || ''
    } catch { /* Ignore malformed stale invite data. */ }
  }
  isInvitationLink.value = Boolean(inviteId && inviteFamily)
  isMagicLink.value = Boolean(firebaseAuth && isSignInWithEmailLink(firebaseAuth, window.location.href))
  if (isInvitationLink.value) {
    window.localStorage.setItem('family-bible:pendingInvite', JSON.stringify({ invite: inviteId, family: inviteFamily }))
    email.value = window.localStorage.getItem('family-bible:emailForSignIn') || ''
    notice.value = 'Sign in with the account that received this family invitation.'
    if (auth.user) {
      try {
        await afterSignIn(auth.user)
      } catch (err) {
        error.value = err.message
      }
    }
  }
})

const inputClass =
  'w-full bg-white border border-stone rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage/50'

const redirectTarget = computed(() => {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') ? target : '/'
})

const switchTarget = computed(() => {
  const query = {}
  if (route.query.redirect) query.redirect = route.query.redirect
  if (route.query.invite && route.query.family) {
    query.invite = route.query.invite
    query.family = route.query.family
  }
  return { name: isRegister.value ? 'login' : 'register', query }
})

watch(isRegister, () => {
  password.value = ''
  confirmPassword.value = ''
  error.value = ''
  notice.value = ''
})

// After any sign-in, claim the invitation if params are present, then redirect.
async function afterSignIn(user) {
  if (inviteId && inviteFamily) {
    await familyStore.claimInvitation(inviteId, inviteFamily, user)
    await router.replace('/members')
  } else {
    await router.replace(redirectTarget.value)
  }
}

async function submit() {
  error.value = ''
  notice.value = ''

  if (!isMagicLink.value && isRegister.value && password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  if (!isMagicLink.value && password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }

  try {
    if (isMagicLink.value) {
      // Email-link sign-in (magic link flow).
      const user = await auth.completeEmailLinkSignIn(email.value)
      await afterSignIn(user)
      return
    }
    if (isRegister.value) {
      const user = await auth.registerWithEmail({
        displayName: fullName.value,
        email: email.value,
        password: password.value,
      })
      await afterSignIn(user)
    } else {
      const user = await auth.loginWithEmail(email.value, password.value)
      await afterSignIn(user)
    }
  } catch (err) {
    error.value = err.message
  }
}

async function signInWithGoogle() {
  error.value = ''
  notice.value = ''
  try {
    const user = await auth.loginWithGoogle()
    await afterSignIn(user)
  } catch (err) {
    error.value = err.message
  }
}

async function forgotPassword() {
  error.value = ''
  notice.value = ''
  if (!email.value.trim()) {
    error.value = 'Enter your email address first.'
    return
  }
  try {
    await auth.sendPasswordReset(email.value)
    notice.value = `Password reset link sent to ${email.value.trim()}.`
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
    <!-- Brand panel -->
    <aside
      class="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 bg-gradient-to-br from-sage/20 via-parchment to-gold/15"
    >
      <div class="pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full bg-sage/20 blur-3xl" />
      <div class="pointer-events-none absolute -bottom-24 right-0 w-80 h-80 rounded-full bg-gold/20 blur-3xl" />

      <div class="relative flex items-center gap-3">
        <div
          class="grid place-items-center w-11 h-11 rounded-xl text-white font-serif text-xl shadow-sm bg-gradient-to-br from-gold to-sage animate-float"
        >
          ✝
        </div>
        <div>
          <p class="font-serif text-xl font-bold text-ink leading-tight">Family Bible</p>
          <p class="text-xs text-sage">Together in the Word</p>
        </div>
      </div>

      <div class="relative max-w-md reveal">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-gold">A shared journey</p>
        <h1 class="font-serif text-4xl xl:text-5xl font-bold text-ink mt-4 leading-tight">
          Grow in faith,<br />together as a family.
        </h1>
        <p class="mt-5 text-ink/60 leading-relaxed">
          Read Scripture, share reflections, and lift one another up in prayer — all in one
          peaceful place.
        </p>
        <blockquote class="mt-9 border-l-2 border-gold pl-4 font-serif text-lg italic text-ink/70">
          “My sheep listen to my voice; I know them, and they follow me.”
          <span class="block mt-1 text-xs not-italic text-sage">— John 10:27</span>
        </blockquote>
      </div>

      <p class="relative text-xs text-ink/40">© {{ new Date().getFullYear() }} Family Bible</p>
    </aside>

    <!-- Form panel -->
    <main class="relative flex items-center justify-center p-5 sm:p-8 lg:p-10">
      <div class="w-full max-w-md">
        <div class="lg:hidden flex items-center justify-center gap-3 mb-8 reveal">
          <div
            class="grid place-items-center w-10 h-10 rounded-xl text-white font-serif text-lg shadow-sm bg-gradient-to-br from-gold to-sage"
          >
            ✝
          </div>
          <div>
            <p class="font-serif text-lg font-bold text-ink leading-tight">Family Bible</p>
            <p class="text-xs text-sage">Together in the Word</p>
          </div>
        </div>

        <div class="card p-6 sm:p-8 reveal delay-1">
          <div class="mb-6">
            <h2 class="font-serif text-2xl font-bold text-ink">
              {{ isRegister ? 'Create your account' : 'Welcome back' }}
            </h2>
            <p class="text-sm text-ink/55 mt-1">
              {{
                isRegister
                  ? 'Start your family’s reading journey today.'
                  : 'Sign in to continue reading together.'
              }}
            </p>
          </div>

          <div
            v-if="!configured"
            class="mb-5 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-xs text-ink/70"
          >
            <p class="font-semibold text-ink">Firebase is not configured</p>
            <p class="mt-1">
              Add your <code class="px-1 rounded bg-white/60">VITE_FIREBASE_*</code> keys to
              <code class="px-1 rounded bg-white/60">.env.local</code> and restart the dev server.
            </p>
          </div>

          <!-- Google -->
          <button
            type="button"
            :disabled="auth.busy || !configured"
            @click="signInWithGoogle"
            class="w-full flex items-center justify-center gap-3 rounded-xl border border-stone bg-white px-4 py-2.5 text-sm font-medium text-ink transition-all duration-300 hover:border-sage/40 hover:bg-parchment/50 focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50 disabled:cursor-not-allowed btn-press"
          >
            <svg class="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            Continue with Google
          </button>

          <div class="flex items-center gap-3 my-5">
            <span class="h-px flex-1 bg-stone" />
            <span class="text-xs uppercase tracking-wider text-ink/35">or</span>
            <span class="h-px flex-1 bg-stone" />
          </div>

          <form class="space-y-4" @submit.prevent="submit">
            <div v-if="isRegister">
              <label for="fullName" class="block text-xs font-semibold text-ink/60 mb-1.5">Full name</label>
              <input
                id="fullName"
                v-model="fullName"
                type="text"
                autocomplete="name"
                placeholder="Sarah Chen"
                :class="inputClass"
              />
            </div>

            <div>
              <label for="email" class="block text-xs font-semibold text-ink/60 mb-1.5">Email</label>
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                required
                placeholder="you@example.com"
                :class="inputClass"
              />
            </div>

            <div v-if="!isMagicLink">
              <label for="password" class="block text-xs font-semibold text-ink/60 mb-1.5">Password</label>
              <div class="relative">
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  :autocomplete="isRegister ? 'new-password' : 'current-password'"
                  required
                  placeholder="••••••••"
                  :class="[inputClass, 'pr-16']"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-2 my-auto h-7 px-2 rounded-md text-xs font-medium text-sage hover:text-sage-dark hover:bg-sage/10 transition-colors"
                >
                  {{ showPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
            </div>

            <div v-if="isRegister && !isMagicLink">
              <label for="confirmPassword" class="block text-xs font-semibold text-ink/60 mb-1.5">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                placeholder="••••••••"
                :class="inputClass"
              />
            </div>

            <div v-if="!isRegister" class="flex justify-end">
              <button
                type="button"
                @click="forgotPassword"
                class="text-xs font-medium text-sage hover:text-sage-dark transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Transition name="pop">
              <p
                v-if="error"
                class="rounded-lg bg-rose/10 px-3 py-2 text-xs text-rose border border-rose/20"
                role="alert"
              >
                {{ error }}
              </p>
            </Transition>

            <Transition name="pop">
              <p
                v-if="notice"
                class="rounded-lg bg-sage/10 px-3 py-2 text-xs text-sage-dark border border-sage/20"
                role="status"
              >
                {{ notice }}
              </p>
            </Transition>

            <button
              type="submit"
              :disabled="auth.busy || !configured"
              class="w-full flex items-center justify-center gap-2 bg-sage hover:bg-sage-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-press"
            >
              <svg
                v-if="auth.busy"
                class="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" class="opacity-25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
              {{
                auth.busy
                  ? 'Please wait…'
                  : isInvitationLink
                    ? 'Join family'
                  : isRegister
                    ? 'Create account'
                    : 'Sign in'
              }}
            </button>
          </form>

          <p class="text-sm text-ink/55 text-center mt-6">
            {{ isRegister ? 'Already have an account?' : 'New to Family Bible?' }}
            <RouterLink
              :to="switchTarget"
              class="text-sage hover:text-sage-dark font-semibold transition-colors"
            >
              {{ isRegister ? 'Sign in' : 'Create an account' }}
            </RouterLink>
          </p>
        </div>

        <p class="text-center text-xs text-ink/35 mt-5">
          Secure sign-in powered by Firebase Authentication.
        </p>
      </div>
    </main>
  </div>
</template>
