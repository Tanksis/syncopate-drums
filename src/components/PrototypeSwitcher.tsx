// PROTOTYPE, throwaway: flips between `?variant=` keys. Never ships (dev builds only).
import { useEffect, useState } from 'react'

export function usePrototypeVariant(): string | null {
  const [variant, setVariant] = useState(() => new URLSearchParams(location.search).get('variant'))
  useEffect(() => {
    const onPop = () => setVariant(new URLSearchParams(location.search).get('variant'))
    addEventListener('prototype-variant', onPop)
    addEventListener('popstate', onPop)
    return () => {
      removeEventListener('prototype-variant', onPop)
      removeEventListener('popstate', onPop)
    }
  }, [])
  return import.meta.env.DEV ? variant : null
}

function go(key: string) {
  const url = new URL(location.href)
  url.searchParams.set('variant', key)
  history.replaceState(null, '', url)
  dispatchEvent(new Event('prototype-variant'))
}

export function PrototypeSwitcher({ variants, current }: { variants: [key: string, name: string][]; current: string }) {
  const i = Math.max(0, variants.findIndex(([key]) => key === current))
  const step = (d: number) => go(variants[(i + d + variants.length) % variants.length][0])
  if (!import.meta.env.DEV) return null
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black px-4 py-2 font-mono text-xs text-white shadow-xl">
      <button type="button" className="cursor-pointer px-1" onMouseDown={(e) => e.preventDefault()} onClick={() => step(-1)}>
        ←
      </button>
      <span>
        {variants[i][0]} ({variants[i][1]})
      </span>
      <button type="button" className="cursor-pointer px-1" onMouseDown={(e) => e.preventDefault()} onClick={() => step(1)}>
        →
      </button>
    </div>
  )
}
