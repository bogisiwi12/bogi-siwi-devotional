import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDevotionalStore = defineStore('devotional', () => {
  const todayIndex = ref(new Date().getDay())

  const devotionals = ref([
    {
      title: 'The Shepherd\'s Voice',
      scripture: 'John 10:27',
      verse: '"My sheep listen to my voice; I know them, and they follow me."',
      message: 'In a world full of noise, the voice of the Shepherd cuts through with clarity and love. He knows each of us by name, and He leads not with force but with tender guidance.',
      meditation: 'Where in your life do you need to quiet the noise to hear His voice more clearly?',
      prayer: 'Lord, tune my heart to recognize Your voice above all others. Give me the courage to follow where You lead. Amen.',
    },
    {
      title: 'Living Water',
      scripture: 'John 4:14',
      verse: '"But whoever drinks the water I give them will never thirst."',
      message: 'Jesus offers more than temporary relief. He offers a wellspring of life that sustains through every season of drought.',
      meditation: 'What "other wells" have you been drinking from that leave you still thirsty?',
      prayer: 'Jesus, help me release my grip on temporary comforts and drink deeply from Your eternal supply. Amen.',
    },
  ])

  const today = computed(() => devotionals.value[todayIndex.value % devotionals.value.length])

  return { today }
})