import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

const USERS_COLLECTION = 'users'

export async function ensureUserProfile(user, { provider } = {}) {
  if (!db || !user) return null

  const userRef = doc(db, USERS_COLLECTION, user.uid)
  const resolvedProvider = provider ?? user.providerData?.[0]?.providerId ?? 'password'
  const fallbackName = user.email ? user.email.split('@')[0] : ''

  const base = {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName || fallbackName,
    photoURL: user.photoURL ?? '',
    provider: resolvedProvider,
    lastLoginAt: serverTimestamp(),
  }

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef)
    if (!snapshot.exists()) {
      transaction.set(userRef, {
        ...base,
        role: 'member',
        createdAt: serverTimestamp(),
      })
    } else {
      transaction.set(userRef, base, { merge: true })
    }
  })

  const fresh = await getDoc(userRef)
  return fresh.exists() ? fresh.data() : null
}

export async function fetchUserProfile(uid) {
  if (!db || !uid) return null
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, uid))
  return snapshot.exists() ? snapshot.data() : null
}
