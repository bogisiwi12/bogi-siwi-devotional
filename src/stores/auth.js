import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import {
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from '@/firebase/config'
import { ensureUserProfile } from '@/firebase/profile'

const AUTH_ERRORS = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with that email address.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in popup.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase.',
  'auth/too-many-requests': 'Too many attempts. Please try again in a moment.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/requires-recent-login': 'Please sign in again to continue.',
}

function toFriendlyError(error) {
  const code = error?.code
  if (code && AUTH_ERRORS[code]) {
    return Object.assign(new Error(AUTH_ERRORS[code]), { code })
  }
  return error instanceof Error ? error : new Error('Something went wrong. Please try again.')
}

export const useAuthStore = defineStore('auth', () => {
  const user = shallowRef(null)
  const profile = ref(null)
  const ready = ref(false)
  const initializing = ref(false)
  const busy = ref(false)
  const error = ref(null)

  let unsubscribe = null
  let initialized = false
  let resolveReady = null
  const readyPromise = new Promise((resolve) => {
    resolveReady = resolve
  })

  const isAuthenticated = computed(() => Boolean(user.value))
  const displayName = computed(
    () => profile.value?.displayName || user.value?.displayName || ''
  )
  const emailAddress = computed(() => user.value?.email || profile.value?.email || '')
  const photoURL = computed(() => profile.value?.photoURL || user.value?.photoURL || '')
  const role = computed(() => profile.value?.role || 'member')
  const provider = computed(() => profile.value?.provider || '')
  const emailVerified = computed(() => Boolean(user.value?.emailVerified))
  const initials = computed(() => {
    const source = displayName.value || emailAddress.value
    if (!source) return '?'
    const parts = source.trim().split(/\s+/)
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return source.slice(0, 2).toUpperCase()
  })

  function markReady() {
    ready.value = true
    initializing.value = false
    resolveReady?.()
    resolveReady = null
  }

  function init() {
    if (initialized) return
    initialized = true

    if (!isFirebaseConfigured || !auth) {
      markReady()
      return
    }

    initializing.value = true
    unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        user.value = firebaseUser
        markReady()

        if (firebaseUser) {
          ensureUserProfile(firebaseUser)
            .then((data) => {
              profile.value = data
            })
            .catch((err) => {
              profile.value = null
              error.value = toFriendlyError(err).message
            })
        } else {
          profile.value = null
        }
      },
      (err) => {
        error.value = toFriendlyError(err).message
        markReady()
      }
    )
  }

  function waitUntilReady() {
    return ready.value ? Promise.resolve() : readyPromise
  }

  function dispose() {
    unsubscribe?.()
    unsubscribe = null
    initialized = false
  }

  function requireConfig() {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase is not configured. Add your VITE_FIREBASE_* keys to .env.local and restart the dev server.'
      )
    }
  }

  function fail(err) {
    const friendly = toFriendlyError(err)
    error.value = friendly.message
    return friendly
  }

  async function syncProfile(firebaseUser, providerId) {
    try {
      profile.value = await ensureUserProfile(firebaseUser, { provider: providerId })
    } catch (err) {
      profile.value = null
      error.value = toFriendlyError(err).message
    }
  }

  async function registerWithEmail({ displayName: name, email, password }) {
    requireConfig()
    busy.value = true
    error.value = null
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      if (name?.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() })
      }
      try {
        await sendEmailVerification(credential.user)
      } catch {
        // Verification email is best-effort; the account is still usable.
      }
      user.value = credential.user
      await syncProfile(credential.user, 'password')
      return credential.user
    } catch (err) {
      throw fail(err)
    } finally {
      busy.value = false
    }
  }

  async function loginWithEmail(email, password) {
    requireConfig()
    busy.value = true
    error.value = null
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      user.value = credential.user
      await syncProfile(credential.user, 'password')
      return credential.user
    } catch (err) {
      throw fail(err)
    } finally {
      busy.value = false
    }
  }

  async function loginWithGoogle() {
    requireConfig()
    busy.value = true
    error.value = null
    try {
      const credential = await signInWithPopup(auth, googleProvider)
      user.value = credential.user
      await syncProfile(credential.user, 'google.com')
      return credential.user
    } catch (err) {
      throw fail(err)
    } finally {
      busy.value = false
    }
  }

  async function completeEmailLinkSignIn(email) {
    requireConfig()
    if (!isSignInWithEmailLink(auth, window.location.href)) throw new Error('This is not a valid Firebase invitation link.')
    busy.value = true
    error.value = null
    try {
      const credential = await signInWithEmailLink(auth, email.trim(), window.location.href)
      user.value = credential.user
      await syncProfile(credential.user, 'password')
      window.localStorage.removeItem('family-bible:emailForSignIn')
      return credential.user
    } catch (err) { throw fail(err) }
    finally { busy.value = false }
  }

  async function sendPasswordReset(email) {
    requireConfig()
    busy.value = true
    error.value = null
    try {
      await sendPasswordResetEmail(auth, email.trim())
    } catch (err) {
      throw fail(err)
    } finally {
      busy.value = false
    }
  }

  async function logout() {
    busy.value = true
    error.value = null
    try {
      if (auth) await signOut(auth)
    } catch (err) {
      throw fail(err)
    } finally {
      user.value = null
      profile.value = null
      busy.value = false
    }
  }

  return {
    user,
    profile,
    ready,
    initializing,
    busy,
    error,
    isAuthenticated,
    displayName,
    emailAddress,
    photoURL,
    role,
    provider,
    emailVerified,
    initials,
    init,
    waitUntilReady,
    dispose,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    completeEmailLinkSignIn,
    sendPasswordReset,
    logout,
  }
})
