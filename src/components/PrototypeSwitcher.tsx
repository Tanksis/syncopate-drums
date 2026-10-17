import { useEffect, useState } from 'react'

// PROTOTYPE (as written / as played): a throwaway variant switcher. Never merge to main.

const read = (keys: readonly string[]) => {
  const v = new URLSearchParams(location.search).get('variant')
  return v && keys.includes(v) ? v : keys[0]
}

/** The `?variant=` search param, kept in step with the switcher and the ← → keys. */
export function useVariant(keys: readonly string[]) {
  const [variant, setVariant] = useState(() => read(keys))
  useEffect(() => {
    const onChange = () => setVariant(read(keys))
    window.addEventListener('prototype-variant', onChange)
    return () => window.removeEventListener('prototype-variant', onChange)
  }, [keys])
  return variant
}

function go(key: string) {
  const url = new URL(location.href)
  url.searchParams.set('variant', key)
  history.replaceState(history.state, '', url)
  window.dispatchEvent(new Event('prototype-variant'))
}

/** A floating pill at the bottom centre: ‹ key (name) ›. Dev builds only. */
export function PrototypeSwitcher({ variants }: { variants: Record<string, string> }) {
  const keys = Object.keys(variants)
  const current = useVariant(keys)
  const step = (by: number) => go(keys[(keys.indexOf(current) + by + keys.length) % keys.length])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
      e.preventDefault()
      step(e.key === 'ArrowLeft' ? -1 : 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  if (!import.meta.env.DEV) return null
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-2 py-1.5 font-mono text-xs text-white shadow-lg">
      <button className="rounded-full px-2 hover:bg-white/20" onClick={() => step(-1)} aria-label="Previous variant">
        ‹
      </button>
      <span>
        {current} · {variants[current]}
      </span>
      <button className="rounded-full px-2 hover:bg-white/20" onClick={() => step(1)} aria-label="Next variant">
        ›
      </button>
    </div>
  )
}
