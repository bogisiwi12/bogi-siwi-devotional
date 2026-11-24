import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, query, serverTimestamp,
  setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore'
import { sendInvitationEmail } from '@/firebase/invitationMailer'
import { auth, db } from '@/firebase/config'

const empty = {
  members: [], invitations: [], prayerRequests: [], reflections: [], readingPlans: [],
  readingProgress: {}, progressEntries: [], bookmarks: [], devotionalReads: {},
}

export const useFamilyStore = defineStore('family', () => {
  const data = ref({ ...empty })
  const loading = ref(false)
  const error = ref('')
  const awaitingApproval = ref(false)
  const familyRequestStatus = ref('')
  const noFamily = ref(false)
  const familyId = ref('')
  let stop = []
  let startedFor = ''
  let initPromise = null

  const members = computed(() => data.value.members.filter((member) => member.status === 'approved'))
  const pendingInvitations = computed(() => data.value.invitations.filter((invite) => invite.status === 'pending'))
  const reflections = computed(() => data.value.reflections)
  const prayerRequests = computed(() => data.value.prayerRequests)
  const readingProgress = computed(() => data.value.readingProgress)
  const bookmarks = computed(() => data.value.bookmarks)
  const totalProgress = computed(() => {
    const values = Object.values(data.value.readingProgress)
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0
  })
  const currentStreak = computed(() => Math.max(0, ...members.value.map((member) => member.streak || 0)))
  const weeklyReading = computed(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))
      return { key: date.toDateString(), day: date.toLocaleDateString(undefined, { weekday: 'short' }), chapters: 0 }
    })
    for (const entry of data.value.progressEntries) {
      if (entry.percent !== 100) continue
      const day = days.find((item) => item.key === entry.updatedAt?.toDate?.().toDateString())
      if (day) day.chapters += 1
    }
    return days
  })

  const recentActivity = computed(() => {
    const items = []
    for (const r of data.value.reflections.slice(0, 5)) {
      items.push({ member: r.author || 'Someone', action: `added a reflection: "${r.title}"`, time: r.createdAt, icon: '✍️' })
    }
    for (const p of data.value.prayerRequests.slice(0, 5)) {
      items.push({ member: p.author || 'Someone', action: 'added a prayer request', time: p.createdAt, icon: '🙏' })
    }
    for (const b of data.value.bookmarks.slice(0, 5)) {
      items.push({ member: 'You', action: `bookmarked ${b.book} ${b.chapter}:${b.verse}`, time: b.createdAt, icon: '🔖' })
    }
    return items
      .filter((item) => item.time)
      .sort((a, b) => (b.time?.toMillis?.() ?? 0) - (a.time?.toMillis?.() ?? 0))
      .slice(0, 8)
      .map((item) => ({
        ...item,
        timeLabel: formatTimeAgo(item.time),
      }))
  })

  function formatTimeAgo(timestamp) {
    if (!timestamp?.toDate) return ''
    const diff = Date.now() - timestamp.toDate().getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
    return timestamp.toDate().toLocaleDateString()
  }
  function collectionRef(name) { return collection(db, 'families', familyId.value, name) }
  function watchCollection(name, key, orderField = 'createdAt', filterByAuthor = false) {
    const source = filterByAuthor
      ? query(collectionRef(name), where('authorUid', '==', auth.currentUser.uid))
      : query(collectionRef(name))
    stop.push(onSnapshot(source, (snapshot) => {
      data.value[key] = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => (b[orderField]?.toMillis?.() ?? 0) - (a[orderField]?.toMillis?.() ?? 0))
    }, (err) => { error.value = err.message }))
  }

  async function init(user) {
    if (!db || !user) return
    // If already initialized for this user+family, return immediately.
    if (startedFor.startsWith(`${user.uid}:`)) return
    // If initialization is in progress for this user, wait for it.
    if (initPromise) return initPromise
    initPromise = _doInit(user)
    try { await initPromise } finally { initPromise = null }
  }

  async function _doInit(user) {
    if (!db || !user || startedFor.startsWith(`${user.uid}:`)) return
    dispose()
    loading.value = true
    error.value = ''
    try {
      const profile = await getDoc(doc(db, 'users', user.uid))
      const linkedFamilyId = profile.data()?.familyId
      const requestSnapshot = await getDoc(doc(db, 'familyRequests', user.uid))
      familyRequestStatus.value = requestSnapshot.data()?.status || ''

      // ── Case 1: user owns their own family (they registered as admin) ──
      const ownedSnap = await getDoc(doc(db, 'families', user.uid))
      if (!linkedFamilyId && ownedSnap.exists()) {
        const ownerMemberRef = doc(db, 'families', user.uid, 'members', user.uid)
        const ownerMember = await getDoc(ownerMemberRef)
        if (ownerMember.exists() && ownerMember.data().role !== 'parent') {
          await updateDoc(ownerMemberRef, { role: 'parent' })
        }
        // Existing admin — family doc already exists, just connect.
        familyId.value = user.uid
        startedFor = `${user.uid}:${familyId.value}`
        awaitingApproval.value = false
        _attachListeners(user)
        return
      }

      // ── Case 2: user has a linkedFamilyId (joined via invite) ──
      if (linkedFamilyId) {
        familyId.value = linkedFamilyId
        startedFor = `${user.uid}:${familyId.value}`
        const invitationRef = doc(db, 'families', linkedFamilyId, 'invitations', profile.data()?.familyInviteId)
        const invitation = await getDoc(invitationRef)
        if (!invitation.exists() || invitation.data().claimedUid !== user.uid) {
          throw new Error('The family invitation could not be verified.')
        }
        if (invitation.data().status !== 'approved') {
          awaitingApproval.value = true
          const unsubscribe = onSnapshot(invitationRef, (snapshot) => {
            if (snapshot.data()?.status === 'approved') {
              unsubscribe()
              dispose()
              init(user)
            }
          }, (err) => { error.value = err.message })
          stop.push(unsubscribe)
          return
        }
        awaitingApproval.value = false
        _attachListeners(user)
        return
      }

      // ── Case 3: brand-new user with no invite and no owned family ──
      // Do NOT auto-create anything. Mark as noFamily so the UI can show
      // an "ask for an invitation" screen.
      noFamily.value = true
      const requestRef = doc(db, 'familyRequests', user.uid)
      stop.push(onSnapshot(requestRef, (snapshot) => {
        familyRequestStatus.value = snapshot.data()?.status || ''
        if (familyRequestStatus.value === 'approved') {
          dispose()
          init(user)
        }
      }, (err) => { error.value = err.message }))

    } catch (err) { error.value = err.message }
    finally { loading.value = false }
  }

  function _attachListeners(user) {
    watchCollection('members', 'members')
    if (familyId.value === user.uid) watchCollection('invitations', 'invitations')
    watchCollection('reflections', 'reflections', 'createdAt', true)
    watchCollection('prayers', 'prayerRequests')
    watchCollection('readingPlans', 'readingPlans')
    watchCollection('bookmarks', 'bookmarks')
    stop.push(onSnapshot(collectionRef('readingProgress'), (snapshot) => {
      data.value.readingProgress = Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data().percent]))
      data.value.progressEntries = snapshot.docs.map((item) => item.data())
    }, (err) => { error.value = err.message }))
    stop.push(onSnapshot(collectionRef('devotionalReads'), (snapshot) => {
      data.value.devotionalReads = Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data()]))
    }, (err) => { error.value = err.message }))
  }

  function dispose() {
    stop.forEach((unsubscribe) => unsubscribe())
    stop = []
    startedFor = ''
    initPromise = null
    familyId.value = ''
    noFamily.value = false
    data.value = { ...empty }
    awaitingApproval.value = false
  }

  async function createFamily(user) {
    const savedInvite = window.localStorage.getItem('family-bible:pendingInvite')
    if (savedInvite) {
      try {
        const { invite, family } = JSON.parse(savedInvite)
        if (invite && family) {
          await claimInvitation(invite, family, user)
          return
        }
      } catch (err) {
        throw new Error(`Could not accept the pending family invitation: ${err.message}`)
      }
    }
    const profile = await getDoc(doc(db, 'users', user.uid))
    const linkedFamilyId = profile.data()?.familyId
    if (linkedFamilyId) {
      await init(user)
      throw new Error('You already have a family invitation. It is being connected now; you cannot create a separate family.')
    }
    const existingRequest = await getDoc(doc(db, 'familyRequests', user.uid))
    if (existingRequest.exists() && existingRequest.data().status === 'pending') {
      familyRequestStatus.value = 'pending'
      return
    }
    if (existingRequest.exists() && existingRequest.data().status === 'approved') {
      dispose()
      await init(user)
      return
    }
    if (existingRequest.exists() && existingRequest.data().status === 'rejected') {
      await deleteDoc(doc(db, 'familyRequests', user.uid))
    }
    await setDoc(doc(db, 'familyRequests', user.uid), {
      uid: user.uid, email: user.email || '', name: user.displayName || user.email?.split('@')[0] || 'Family owner',
      status: 'pending', createdAt: serverTimestamp(),
    })
    familyRequestStatus.value = 'pending'
  }

  async function approveFamilyRequest(request) {
    const batch = writeBatch(db)
    batch.update(doc(db, 'familyRequests', request.uid), { status: 'approved', reviewedAt: serverTimestamp() })
    batch.set(doc(db, 'families', request.uid), { ownerUid: request.uid, name: `${request.name || 'My'} Family`, createdAt: serverTimestamp() })
    batch.set(doc(db, 'families', request.uid, 'members', request.uid), {
      uid: request.uid, email: request.email || '', name: request.name || 'Family Parent', role: 'parent', status: 'approved', streak: 0, joinedAt: serverTimestamp(),
    })
    await batch.commit()
  }

  async function rejectFamilyRequest(request) {
    await updateDoc(doc(db, 'familyRequests', request.uid), { status: 'rejected', reviewedAt: serverTimestamp() })
    if (request.uid === auth.currentUser?.uid) familyRequestStatus.value = 'rejected'
  }

  async function loadFamilyRequests(callback, onError = () => {}) {
    const source = query(collection(db, 'familyRequests'), where('status', '==', 'pending'))
    return onSnapshot(source, (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError)
  }
  async function addReflection({ title, content, type }) {
    const user = auth.currentUser
    return addDoc(collectionRef('reflections'), { title: title.trim(), content: content.trim(), type, authorUid: user.uid, author: user.displayName || user.email, createdAt: serverTimestamp() })
  }
  async function addPrayerRequest(text) {
    const user = auth.currentUser
    return addDoc(collectionRef('prayers'), { text: text.trim(), authorUid: user.uid, author: user.displayName || user.email, answered: false, createdAt: serverTimestamp() })
  }
  async function togglePrayerAnswered(id, answered) {
    return updateDoc(doc(db, 'families', familyId.value, 'prayers', id), { answered: !answered, updatedAt: serverTimestamp() })
  }
  async function inviteMember(email) {
    const normalizedEmail = email.trim().toLowerCase()
    const inviteRef = doc(db, 'families', familyId.value, 'invitations', normalizedEmail)
    if (members.value.some((member) => member.email.toLowerCase() === normalizedEmail)) {
      throw new Error('This email already belongs to an approved family member.')
    }
    const existingInvite = await getDoc(inviteRef)
    if (existingInvite.exists() && existingInvite.data().claimedUid) {
      throw new Error('This email has already accepted the invitation and is awaiting approval.')
    }
    // Delete any stale pending invite before recreating so the owner setDoc is always a create.
    if (existingInvite.exists()) await deleteDoc(inviteRef)
    await setDoc(inviteRef, {
      email: normalizedEmail, status: 'pending', createdBy: auth.currentUser.uid, createdAt: serverTimestamp(), claimedUid: '',
    })
    const inviteUrl = `${window.location.origin}/login?${new URLSearchParams({ invite: inviteRef.id, family: familyId.value })}`
    const user = auth.currentUser
    try {
      await sendInvitationEmail({
        email: normalizedEmail,
        inviteUrl,
        familyName: user.displayName ? `${user.displayName}'s Family` : 'Family Bible',
        inviterName: user.displayName || user.email || 'Your family admin',
      })
      return inviteRef.id
    } catch (err) {
      await deleteDoc(inviteRef)
      throw new Error(`Could not send the invitation email: ${err.message}`)
    }
  }
  async function approveInvitation(invite) {
    const userRef = doc(db, 'families', familyId.value, 'members', invite.claimedUid)
    const invitationRef = doc(db, 'families', familyId.value, 'invitations', invite.id)
    const batch = writeBatch(db)
    batch.set(userRef, {
      uid: invite.claimedUid, email: invite.email, name: invite.email.split('@')[0],
      role: 'child', status: 'approved', streak: 0, joinedAt: serverTimestamp(),
    })
    batch.update(invitationRef, { status: 'approved', approvedAt: serverTimestamp() })
    await batch.commit()
  }
  async function claimInvitation(inviteId, invitedFamilyId, user) {
    const inviteRef = doc(db, 'families', invitedFamilyId, 'invitations', inviteId)
    const invite = await getDoc(inviteRef)
    if (!invite.exists() || invite.data().email.toLowerCase() !== user.email?.toLowerCase() || invite.data().status !== 'pending') {
      throw new Error('This invitation is invalid, expired, or addressed to a different email.')
    }
    await updateDoc(inviteRef, { claimedUid: user.uid, claimedAt: serverTimestamp() })
    await setDoc(doc(db, 'users', user.uid), { familyId: invitedFamilyId, familyInviteId: inviteId }, { merge: true })
    window.localStorage.removeItem('family-bible:pendingInvite')
    dispose()
    await init(user)
    return invitedFamilyId
  }
  async function updateMemberRole(member, role) {
    const memberRef = doc(db, 'families', familyId.value, 'members', member.uid)
    await updateDoc(memberRef, { role })
  }
  async function removeMember(uid) {
    // Delete from the members subcollection. The removed user will be redirected
    // out on their next navigation because init() will find no approved member doc.
    await deleteDoc(doc(db, 'families', familyId.value, 'members', uid))
  }
  async function deleteInvite(inviteId) {
    return deleteDoc(doc(db, 'families', familyId.value, 'invitations', inviteId))
  }
  async function resendInvite(email) {
    const normalizedEmail = email.trim().toLowerCase()
    const inviteRef = doc(db, 'families', familyId.value, 'invitations', normalizedEmail)
    const inviteUrl = `${window.location.origin}/login?${new URLSearchParams({ invite: inviteRef.id, family: familyId.value })}`
    const user = auth.currentUser
    await sendInvitationEmail({
      email: normalizedEmail,
      inviteUrl,
      familyName: user.displayName ? `${user.displayName}'s Family` : 'Family Bible',
      inviterName: user.displayName || user.email || 'Your family admin',
    })
  }
  async function savePlan(plan, active) {
    const target = doc(db, 'families', familyId.value, 'readingPlans', String(plan.id))
    return setDoc(target, { ...plan, active, updatedBy: auth.currentUser.uid, updatedAt: serverTimestamp() }, { merge: true })
  }
  async function saveProgress(reference, percent) {
    return setDoc(doc(db, 'families', familyId.value, 'readingProgress', encodeURIComponent(reference)), {
      reference, percent, updatedBy: auth.currentUser.uid, updatedAt: serverTimestamp(),
    })
  }
  async function saveDevotionalRead(date, completed) {
    return setDoc(doc(db, 'families', familyId.value, 'devotionalReads', date), {
      completed, updatedBy: auth.currentUser.uid, updatedAt: serverTimestamp(),
    })
  }
  async function getDailyDevotional(date, fallback) {
    if (!familyId.value) throw new Error('Family not initialized yet.')
    const devotionalRef = doc(db, 'families', familyId.value, 'devotionals', date)
    const existing = await getDoc(devotionalRef)
    if (existing.exists()) return existing.data()
    const user = auth.currentUser
    const devotional = {
      title: fallback.title, scripture: fallback.scripture, verse: fallback.verse,
      message: fallback.message, meditation: fallback.meditation, prayer: fallback.prayer,
      date, createdBy: user.uid, createdAt: serverTimestamp(),
    }
    try { await setDoc(devotionalRef, devotional) }
    catch {
      const concurrent = await getDoc(devotionalRef)
      if (concurrent.exists()) return concurrent.data()
      throw new Error('Could not save today’s devotional to Firestore.')
    }
    return fallback
  }
  async function toggleBookmark(book, chapter, verse, text) {
    const id = `${book}_${chapter}_${verse}`
    const bookmarkRef = doc(db, 'families', familyId.value, 'bookmarks', encodeURIComponent(id))
    const existing = await getDoc(bookmarkRef)
    if (existing.exists()) return deleteDoc(bookmarkRef)
    return setDoc(bookmarkRef, {
      book, chapter, verse, text, createdBy: auth.currentUser.uid, createdAt: serverTimestamp(),
    })
  }

  return {
    members, pendingInvitations, reflections, prayerRequests, readingPlans: computed(() => data.value.readingPlans),
    readingProgress, bookmarks, devotionalReads: computed(() => data.value.devotionalReads),
    totalProgress, currentStreak, weeklyReading, recentActivity, familyId, loading, error, init, dispose,
    awaitingApproval, noFamily, familyRequestStatus, approveFamilyRequest, rejectFamilyRequest, loadFamilyRequests,
    addReflection, addPrayerRequest, togglePrayerAnswered, inviteMember, approveInvitation,
    savePlan, saveProgress, saveDevotionalRead, getDailyDevotional, toggleBookmark, claimInvitation,
    removeMember, deleteInvite, resendInvite, updateMemberRole, createFamily,
  }
})
