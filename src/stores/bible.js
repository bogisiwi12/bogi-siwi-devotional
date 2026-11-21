import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { books as bookRegistry, getBookById } from '@/data/bible/books'
import { categories, languages, testaments, translations } from '@/data/bible/categories'

const modules = {
  en: import.meta.glob('../data/bible/en/*.js'),
  id: import.meta.glob('../data/bible/id/*.js'),
}

const fileName = (filePath) => filePath.split(/[\\/]/).pop().replace(/\.js$/, '')

const loaders = Object.fromEntries(
  Object.entries(modules).map(([lang, files]) => [
    lang,
    Object.fromEntries(
      Object.entries(files).map(([filePath, load]) => [fileName(filePath), load])
    ),
  ])
)

const STORAGE_KEY = 'family-bible:bible'

function readSettings() {
  if (typeof localStorage === 'undefined') return {}
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeSettings(patch) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSettings(), ...patch }))
  } catch {
    // Persistence is optional; ignore storage failures.
  }
}

export const useBibleStore = defineStore('bible', () => {
  const settings = readSettings()

  const language = ref(loaders[settings.language] ? settings.language : 'en')
  const translation = ref(
    translations[language.value].includes(settings.translation)
      ? settings.translation
      : translations[language.value][0]
  )
  const activeBookId = ref(getBookById(settings.activeBookId) ? settings.activeBookId : null)
  const activeChapterNumber = ref(
    Number.isInteger(settings.activeChapter) && settings.activeChapter > 0
      ? settings.activeChapter
      : 1
  )

  const contentCache = ref({})
  const loading = ref(false)
  const error = ref(null)

  const languageOptions = languages

  const translationOptions = computed(() => translations[language.value] ?? translations.en)
  const localizedTestaments = computed(() =>
    testaments.map((t) => ({ id: t.id, name: t.names[language.value] ?? t.names.en }))
  )
  const localizedCategories = computed(() =>
    categories.map((c) => ({ id: c.id, name: c.names[language.value] ?? c.names.en }))
  )

  const localizedBooks = computed(() =>
    bookRegistry.map((book) => ({
      ...book,
      name: book.names[language.value] ?? book.names.en,
      fileSlug: book.files[language.value] ?? book.files.en,
    }))
  )

  const oldTestamentBooks = computed(() =>
    localizedBooks.value.filter((book) => book.testament === 'old')
  )
  const newTestamentBooks = computed(() =>
    localizedBooks.value.filter((book) => book.testament === 'new')
  )

  const currentBook = computed(
    () => localizedBooks.value.find((book) => book.id === activeBookId.value) ?? null
  )

  const cacheKey = (lang, fileSlug) => `${lang}:${fileSlug}`

  const currentBookContent = computed(() => {
    if (!currentBook.value) return null
    return contentCache.value[cacheKey(language.value, currentBook.value.fileSlug)] ?? null
  })

  const chapters = computed(() => {
    if (!currentBook.value) return []
    const provided = Array.isArray(currentBookContent.value?.chapters)
      ? currentBookContent.value.chapters
      : []
    const byNumber = new Map(provided.map((chapter) => [Number(chapter.chapter), chapter]))
    return Array.from({ length: currentBook.value.chapterCount }, (_, index) => {
      const chapterNumber = index + 1
      const found = byNumber.get(chapterNumber)
      return {
        chapter: chapterNumber,
        verses: Array.isArray(found?.verses) ? found.verses : [],
      }
    })
  })

  const chapterNumbers = computed(() => chapters.value.map((chapter) => chapter.chapter))
  const currentChapter = computed(
    () => chapters.value.find((chapter) => chapter.chapter === activeChapterNumber.value) ?? null
  )
  const currentVerses = computed(() =>
    (currentChapter.value?.verses ?? []).map((verse) => ({
      ...verse,
      text: verse.translations?.[translation.value] ?? verse.text ?? '',
    }))
  )

  const hasContent = computed(() => chapters.value.some((chapter) => chapter.verses.length > 0))
  const isFirstChapter = computed(() => activeChapterNumber.value <= 1)
  const isLastChapter = computed(() => activeChapterNumber.value >= chapters.value.length)
  const contentPath = computed(() =>
    currentBook.value
      ? `src/data/bible/${language.value}/${currentBook.value.fileSlug}.js`
      : ''
  )

  const categoryName = (id) =>
    localizedCategories.value.find((category) => category.id === id)?.name ?? id

  async function loadBook(lang = language.value, fileSlug = currentBook.value?.fileSlug) {
    if (!fileSlug) return null
    const key = cacheKey(lang, fileSlug)
    if (contentCache.value[key]) return contentCache.value[key]

    const load = loaders[lang]?.[fileSlug]
    if (!load) {
      error.value = `No content file found for "${lang}/${fileSlug}.js".`
      return null
    }

    loading.value = true
    error.value = null
    try {
      const module = await load()
      const content = module.default ?? module
      contentCache.value[key] = content
      return content
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to load ${fileSlug}.`
      return null
    } finally {
      loading.value = false
    }
  }

  function selectBook(id) {
    if (!getBookById(id)) return
    activeBookId.value = id
    activeChapterNumber.value = 1
    writeSettings({ activeBookId: id, activeChapter: 1 })
  }

  function clearBook() {
    activeBookId.value = null
    activeChapterNumber.value = 1
    writeSettings({ activeBookId: null, activeChapter: 1 })
  }

  function selectChapter(chapter) {
    const next = Number(chapter)
    if (!Number.isInteger(next) || next < 1 || next > chapters.value.length) return
    activeChapterNumber.value = next
    writeSettings({ activeChapter: next })
  }

  function nextChapter() {
    if (!isLastChapter.value) selectChapter(activeChapterNumber.value + 1)
  }

  function previousChapter() {
    if (!isFirstChapter.value) selectChapter(activeChapterNumber.value - 1)
  }

  function setLanguage(lang) {
    if (!loaders[lang]) return
    language.value = lang
    if (!translations[lang].includes(translation.value)) {
      translation.value = translations[lang][0]
    }
    writeSettings({ language: lang, translation: translation.value })
  }

  function setTranslation(value) {
    if (!translationOptions.value.includes(value)) return
    translation.value = value
    writeSettings({ translation: value })
  }

  watch(
    () => [language.value, currentBook.value?.fileSlug],
    ([, fileSlug]) => {
      if (fileSlug) loadBook(language.value, fileSlug)
    },
    { immediate: true }
  )

  return {
    language,
    translation,
    activeBookId,
    activeChapterNumber,
    loading,
    error,
    languageOptions,
    translationOptions,
    localizedTestaments,
    localizedCategories,
    localizedBooks,
    oldTestamentBooks,
    newTestamentBooks,
    currentBook,
    chapters,
    chapterNumbers,
    currentChapter,
    currentVerses,
    hasContent,
    isFirstChapter,
    isLastChapter,
    contentPath,
    categoryName,
    selectBook,
    clearBook,
    selectChapter,
    nextChapter,
    previousChapter,
    setLanguage,
    setTranslation,
    loadBook,
  }
})
