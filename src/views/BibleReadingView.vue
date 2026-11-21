<script setup>
import { computed, nextTick, ref } from 'vue'
import { useBibleStore } from '@/stores/bible'
import { useFamilyStore } from '@/stores/family'

const bible = useBibleStore()
const familyStore = useFamilyStore()

const testament = ref('old')
const readerRef = ref(null)

const visibleBooks = computed(() =>
  bible.localizedBooks.filter((book) => book.testament === testament.value)
)

const chapterCountLabel = (count) =>
  bible.language === 'id' ? `${count} pasal` : `${count} ${count === 1 ? 'chapter' : 'chapters'}`

const ui = computed(() =>
  bible.language === 'id'
    ? {
        allBooks: 'Semua kitab',
        noVerses: 'Belum ada ayat untuk pasal ini.',
        addHint: 'Tambahkan di',
        chapter: 'Pasal',
        version: 'Versi',
      }
    : {
        allBooks: 'All books',
        noVerses: 'No verses for this chapter yet.',
        addHint: 'Add them in',
        chapter: 'Chapter',
        version: 'Version',
      }
)

const openBook = async (book) => {
  bible.selectBook(book.id)
  await nextTick()
  readerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 reveal">
      <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink heading-rule">Bible Reading</h1>

      <div class="flex bg-white rounded-xl border border-stone p-1 shadow-sm self-start sm:self-auto">
        <button
          v-for="lang in bible.languageOptions"
          :key="lang.id"
          @click="bible.setLanguage(lang.id)"
          :title="lang.label"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 btn-press',
            bible.language === lang.id ? 'bg-sage text-white shadow-sm' : 'text-ink/60 hover:text-ink hover:bg-stone/50',
          ]"
        >
          {{ lang.short }}
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 items-center reveal delay-1">
      <div class="flex bg-white rounded-xl border border-stone p-1 shadow-sm">
        <button
          v-for="option in bible.localizedTestaments"
          :key="option.id"
          @click="testament = option.id"
          :class="[
            'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 btn-press',
            testament === option.id ? 'bg-sage text-white shadow-sm' : 'text-ink/60 hover:text-ink hover:bg-stone/50',
          ]"
        >
          {{ option.name }}
        </button>
      </div>

      <select
        :value="bible.translation"
        @change="bible.setTranslation($event.target.value)"
        class="bg-white border border-stone rounded-xl px-3 py-2 text-sm text-ink transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-sage/30 hover:border-sage/40"
        :aria-label="ui.version"
      >
        <option v-for="version in bible.translationOptions" :key="version" :value="version">
          {{ version }}
        </option>
      </select>
    </div>

    <!-- Reader -->
    <Transition name="pop">
      <section
        v-if="bible.currentBook"
        ref="readerRef"
        class="card p-5 sm:p-6 space-y-5 scroll-mt-24"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <button
              @click="bible.clearBook()"
              class="inline-flex items-center gap-1 text-xs text-sage hover:text-sage-dark font-medium mb-1 transition-colors group"
            >
              <span class="transition-transform duration-300 group-hover:-translate-x-0.5">←</span>
              {{ ui.allBooks }}
            </button>
            <h2 class="font-serif text-xl sm:text-2xl font-bold text-ink">{{ bible.currentBook.name }}</h2>
            <p class="text-xs text-ink/40 mt-0.5">
              {{ bible.categoryName(bible.currentBook.category) }} ·
              {{ chapterCountLabel(bible.currentBook.chapterCount) }}
            </p>
          </div>
          <span v-if="bible.loading" class="text-xs text-sage animate-pulse">Loading…</span>
          <span v-else-if="bible.error" class="text-xs text-rose text-right max-w-[14rem]">{{ bible.error }}</span>
        </div>

        <!-- Chapter picker -->
        <div class="flex items-center gap-2">
          <button
            @click="bible.previousChapter()"
            :disabled="bible.isFirstChapter"
            class="shrink-0 w-8 h-8 rounded-lg bg-stone/60 text-ink/70 hover:bg-stone disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 btn-press"
            aria-label="Previous chapter"
          >
            ‹
          </button>
          <div class="flex-1 flex gap-1.5 overflow-x-auto py-1 px-0.5 scroll-smooth">
            <button
              v-for="number in bible.chapterNumbers"
              :key="number"
              @click="bible.selectChapter(number)"
              :class="[
                'shrink-0 w-8 h-8 rounded-lg text-xs font-medium transition-all duration-300 btn-press',
                bible.activeChapterNumber === number
                  ? 'bg-sage text-white shadow-sm'
                  : 'bg-stone/50 text-ink/60 hover:bg-stone hover:text-ink',
              ]"
            >
              {{ number }}
            </button>
          </div>
          <button
            @click="bible.nextChapter()"
            :disabled="bible.isLastChapter"
            class="shrink-0 w-8 h-8 rounded-lg bg-stone/60 text-ink/70 hover:bg-stone disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 btn-press"
            aria-label="Next chapter"
          >
            ›
          </button>
        </div>

        <!-- Verses -->
        <div v-if="bible.currentVerses.length" class="space-y-2.5">
          <p class="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
            {{ ui.chapter }} {{ bible.activeChapterNumber }} · {{ bible.translation }}
          </p>
          <p
            v-for="verse in bible.currentVerses"
            :key="verse.verse"
            class="flex gap-3 text-sm leading-relaxed transition-colors duration-300 hover:bg-parchment/60 rounded-lg px-2 py-1 -mx-2"
          >
            <span class="text-xs text-gold font-semibold pt-0.5 w-5 shrink-0 text-right">{{ verse.verse }}</span>
            <span class="text-ink/80">{{ verse.text }}</span>
          </p>
        </div>

        <Transition name="fade" mode="out-in">
          <div
            v-if="!bible.currentVerses.length && !bible.loading"
            class="rounded-xl border border-dashed border-stone p-6 text-center"
          >
            <p class="text-sm text-ink/55">{{ ui.noVerses }}</p>
            <p class="text-xs text-ink/40 mt-1">
              {{ ui.addHint }}
              <code class="px-1.5 py-0.5 rounded bg-stone/60 text-ink/60">{{ bible.contentPath }}</code>
            </p>
          </div>
        </Transition>
      </section>
    </Transition>

    <!-- Books Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 stagger">
      <button
        v-for="book in visibleBooks"
        :key="`${bible.language}-${book.id}`"
        @click="openBook(book)"
        :class="[
          'card card-hover group p-4 text-left cursor-pointer',
          bible.activeBookId === book.id ? 'ring-2 ring-sage/40 border-sage/40' : '',
        ]"
      >
        <p class="font-serif font-semibold text-ink transition-colors duration-300 group-hover:text-sage-dark">
          {{ book.name }}
        </p>
        <p class="text-xs text-sage mt-1">{{ chapterCountLabel(book.chapterCount) }}</p>
      </button>
    </div>

    <!-- Bookmarks -->
    <section class="card p-6 reveal delay-2">
      <h2 class="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-4">Bookmarks</h2>
      <div class="stagger space-y-3">
        <div
          v-for="bm in familyStore.bookmarks"
          :key="bm.id"
          class="flex items-start gap-3 p-3 rounded-xl bg-parchment/50 transition-all duration-300 hover:bg-parchment hover:shadow-sm"
        >
          <span class="text-lg">🔖</span>
          <div>
            <p class="text-sm font-medium text-ink">{{ bm.book }} {{ bm.chapter }}:{{ bm.verse }}</p>
            <p class="text-xs text-ink/60 mt-1 italic">"{{ bm.text }}"</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
