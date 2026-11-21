import { computed, onUnmounted, ref, watch } from 'vue'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useCountUp(source, { duration = 1100, decimals = 0 } = {}) {
  const display = ref(0)
  let rafId = null

  const target = () => (typeof source === 'function' ? source() : source.value) ?? 0

  const run = (to) => {
    const end = Number(to) || 0
    if (prefersReducedMotion()) {
      display.value = end
      return
    }
    cancelAnimationFrame(rafId)
    const startTime = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      display.value = end * eased
      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        display.value = end
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  watch(target, (value) => run(value), { immediate: true })
  onUnmounted(() => cancelAnimationFrame(rafId))

  const formatted = computed(() => display.value.toFixed(decimals))

  return { display, formatted }
}
