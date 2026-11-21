import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFamilyStore = defineStore('family', () => {
  const members = ref([
    { id: 1, name: 'Sarah Chen', role: 'Admin', avatar: '👩‍🦰', streak: 14, permission: 'admin' },
    { id: 2, name: 'David Chen', role: 'Member', avatar: '👨', streak: 10, permission: 'edit' },
    { id: 3, name: 'Emma Chen', role: 'Member', avatar: '👧', streak: 7, permission: 'edit' },
  ])

  const currentUser = ref(members.value[0])

  const readingProgress = ref({
    'Genesis 1': 100,
    'Genesis 2': 100,
    'Genesis 3': 60,
    'Genesis 4': 0,
    'Matthew 1': 100,
    'Matthew 2': 40,
  })

  const bookmarks = ref([
    { id: 1, book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning God created the heavens and the earth.' },
    { id: 2, book: 'Matthew', chapter: 5, verse: 3, text: 'Blessed are the poor in spirit, for theirs is the kingdom of heaven.' },
  ])

  const prayerRequests = ref([
    { id: 1, author: 'Sarah', text: 'Pray for Emma\'s upcoming exams.', answered: false, date: '2026-11-18' },
    { id: 2, author: 'David', text: 'Thank God for providing a new job opportunity.', answered: true, date: '2026-11-15' },
  ])

  const reflections = ref([
    { id: 1, title: 'On Forgiveness', content: 'Today\'s reading in Matthew challenged me to forgive...', date: '2026-11-19', type: 'journal' },
    { id: 2, title: 'Genesis Study Notes', content: 'The creation account reveals God\'s intentional design...', date: '2026-11-17', type: 'study' },
  ])

  const addPrayerRequest = (text) => {
    prayerRequests.value.unshift({
      id: Date.now(),
      author: currentUser.value.name.split(' ')[0],
      text,
      answered: false,
      date: new Date().toISOString().split('T')[0],
    })
  }

  const togglePrayerAnswered = (id) => {
    const req = prayerRequests.value.find(r => r.id === id)
    if (req) req.answered = !req.answered
  }

  const addReflection = (reflection) => {
    reflections.value.unshift({
      id: Date.now(),
      ...reflection,
      date: new Date().toISOString().split('T')[0],
    })
  }

  const totalProgress = computed(() => {
    const chapters = Object.values(readingProgress.value)
    return Math.round(chapters.reduce((a, b) => a + b, 0) / chapters.length)
  })

  const currentStreak = computed(() => Math.max(...members.value.map(m => m.streak)))

  return {
    members, currentUser, readingProgress, bookmarks,
    prayerRequests, reflections, totalProgress, currentStreak,
    addPrayerRequest, togglePrayerAnswered, addReflection,
  }
})