import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  dismissBargainAlert,
  fetchActiveBargainAlerts,
  fetchBargainAlertsAuthorised,
} from '../lib/dotnetapi'
import { BargainAlertsContext, type BargainAlertsContextModel } from '../hooks/useBargainAlerts'
import { useItems } from '../hooks/useItems'
import type { BargainAlert } from '../types/bargainAlerts'
import type { Item } from '../types/items'

const POLL_INTERVAL_MS = 12_000

const tornMarketUrl = (itemId: number) =>
  `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${itemId}&sortField=price&sortOrder=ASC`

const formatMoney = (n: number) => `$${n.toLocaleString('en-US')}`

// Distinctive Web Audio synthesis: two-tone descending chirp the OS
// won't generate by accident. Cheaper than shipping an asset, and
// exactly what we want until Drew swaps a real sound in.
const playAlertSound = () => {
  try {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return
    const ctx = new AudioCtor()
    const now = ctx.currentTime

    const tone = (frequency: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(frequency, now + startOffset)
      gain.gain.setValueAtTime(0.0001, now + startOffset)
      gain.gain.exponentialRampToValueAtTime(0.18, now + startOffset + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + startOffset)
      osc.stop(now + startOffset + duration + 0.02)
    }

    tone(880, 0, 0.16)
    tone(1320, 0.18, 0.22)

    // Tear down the context after the tones finish so we don't leak
    // AudioContext instances on every alert.
    setTimeout(() => void ctx.close(), 600)
  } catch {
    // Audio refused (e.g. autoplay policy before any user gesture).
    // Drew's a logged-in user clicking around the app, so this almost
    // never bites in practice.
  }
}

// OS-level notification. Used when the tab is hidden — the in-page
// chirp is unreliable in backgrounded tabs (autoplay policy + Chrome's
// audio context suspension), and the OS notification gets attention
// even when the browser isn't the focused application.
//
// Click target: opens the Torn item market in a new tab. We don't try
// to focus the TornTools tab itself because window.focus() from a
// notification handler is flaky cross-browser, and Drew's intent on
// click is "buy the thing", not "look at TornTools".
const showOsNotification = (alert: BargainAlert, item: Item | undefined) => {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  try {
    const name = item?.name ?? `Item ${alert.itemId}`
    const n = new Notification(`Bargain: ${name}`, {
      body: `Listed for ${formatMoney(alert.listingPrice)}, sells for ${formatMoney(alert.marketValue)} (+${formatMoney(alert.profit)} profit)`,
      icon: item?.image,
      // tag dedupes: a re-fire for the same alert id replaces rather
      // than stacks (rare but possible if React StrictMode double-runs
      // an effect).
      tag: `torntools-bargain-${alert.id}`,
      // requireInteraction keeps the notification on screen until
      // dismissed — match the toast's persistent behaviour.
      requireInteraction: true,
    })

    n.onclick = () => {
      window.open(tornMarketUrl(alert.itemId), '_blank', 'noopener,noreferrer')
      n.close()
    }
  } catch {
    // Notifications can throw if the browser is in a weird state
    // (private mode quirks, OS-level "do not disturb"). Silent.
  }
}

type Props = { children: ReactNode }

export const BargainAlertsProvider = ({ children }: Props) => {
  const [authorised, setAuthorised] = useState(false)
  const [alerts, setAlerts] = useState<BargainAlert[]>([])
  const seenIdsRef = useRef<Set<number>>(new Set())
  const firstPollSettledRef = useRef(false)
  const { itemsById } = useItems()
  // Snapshot for use in the refresh callback without rebinding it on
  // every items change (which would tear down the polling interval).
  const itemsByIdRef = useRef(itemsById)
  itemsByIdRef.current = itemsById

  // Mount-time authorisation probe. Cheap and gates everything that follows.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const ok = await fetchBargainAlertsAuthorised()
        if (!cancelled) setAuthorised(ok)
      } catch {
        if (!cancelled) setAuthorised(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Once authorised, ask for OS notification permission — but most
  // modern browsers gate requestPermission() on a fresh user gesture
  // (a mount-time effect doesn't count). So we register a one-shot
  // click listener that fires the prompt on the first interaction
  // anywhere on the page, then removes itself. The toast + chirp keep
  // working regardless of whether permission is ever granted.
  useEffect(() => {
    if (!authorised) return
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'default') return

    // Try once eagerly; on browsers that allow it (Edge in some
    // configurations, sites with prior site engagement) this skips
    // the click hop.
    void Notification.requestPermission().catch(() => undefined)

    // Fallback: prompt on the next user interaction. Capture phase so
    // we beat any stopPropagation, once-only so we don't keep firing.
    const onGesture = () => {
      if (Notification.permission === 'default') {
        void Notification.requestPermission().catch(() => undefined)
      }
      window.removeEventListener('click', onGesture, true)
      window.removeEventListener('keydown', onGesture, true)
    }
    window.addEventListener('click', onGesture, { capture: true, once: false })
    window.addEventListener('keydown', onGesture, { capture: true, once: false })

    return () => {
      window.removeEventListener('click', onGesture, true)
      window.removeEventListener('keydown', onGesture, true)
    }
  }, [authorised])

  const refresh = useCallback(async () => {
    try {
      const next = await fetchActiveBargainAlerts()
      setAlerts(next)

      // Notify on first sighting of an id only.
      const seen = seenIdsRef.current
      const isFirstPoll = !firstPollSettledRef.current
      const newAlerts: BargainAlert[] = []
      for (const a of next) {
        if (!seen.has(a.id)) {
          seen.add(a.id)
          newAlerts.push(a)
        }
      }
      firstPollSettledRef.current = true

      if (newAlerts.length === 0) return

      const hidden = document.visibilityState === 'hidden'
      if (hidden) {
        // Always fire OS notifications — including on the first poll
        // when alerts pre-existed the page load. That case is exactly
        // when Drew most needs to know: he opened the app in another
        // tab and there's a bargain waiting. The toast is invisible
        // to him; the OS notification is the only signal.
        for (const a of newAlerts) {
          showOsNotification(a, itemsByIdRef.current[a.itemId])
        }
      } else if (!isFirstPoll) {
        // In-page chirp only on truly new alerts — not on the first
        // poll, because then the toast is rendering for the first
        // time anyway and a chirp on every page load would be
        // noisy.
        playAlertSound()
      }
    } catch {
      // Treat poll failures as transient.
    }
  }, [])

  // Always-on polling — the whole point of the toast is to alert Drew
  // when the tab is *not* the focused one, so suspending on hidden
  // would defeat the feature. The endpoint is cheap (one indexed
  // SELECT) and rate-limit cost is negligible for a single user.
  //
  // On return-to-visible we fire an extra fetch immediately. This
  // matters because Chrome / Firefox throttle setInterval in
  // backgrounded tabs to roughly once per minute (and on battery
  // saver, longer). The interval still fires during background, just
  // less often — the immediate-on-visible bump catches up any window
  // where it didn't.
  useEffect(() => {
    if (!authorised) return

    void refresh()
    const intervalId = setInterval(() => void refresh(), POLL_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [authorised, refresh])

  const dismiss = useCallback(async (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    try {
      await dismissBargainAlert(id)
    } catch {
      // Swallow — server-side state is the source of truth, the next
      // poll will reconcile if dismissal didn't actually persist.
    }
  }, [])

  const value = useMemo<BargainAlertsContextModel>(
    () => ({ authorised, alerts, dismiss }),
    [authorised, alerts, dismiss],
  )

  return <BargainAlertsContext.Provider value={value}>{children}</BargainAlertsContext.Provider>
}
