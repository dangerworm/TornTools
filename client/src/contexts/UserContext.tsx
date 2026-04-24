import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { UserContext, type UserContextModel } from '../hooks/useUser'
import {
  getMe,
  login,
  logout,
  postAddUserFavourite,
  postRemoveUserFavourite,
  proxyTornUserBasic,
  type DotNetUserDetails,
} from '../lib/dotnetapi'
import type { TornUserProfile } from '../types/torn'

// Legacy localStorage keys from the pre-Phase-2 design (when the plaintext
// API key was cached in the browser). Cleaned on first load so returning
// users don't keep a stale plaintext copy on their device.
const LEGACY_STORAGE_KEYS = [
  'torntools:user:torn:apiKey:v1',
  'torntools:user:torn:details:v1',
  'torntools:user:cache:ts:v1',
]

type UserProviderProps = {
  children: ReactNode
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [tornUserProfile, setTornUserProfile] = useState<TornUserProfile | null>(null)
  const [dotNetUserDetails, setDotNetUserDetails] = useState<DotNetUserDetails | null>(null)

  const [loadingTornUserProfile, setLoadingTornUserProfile] = useState(false)
  const [errorTornUserProfile, setErrorTornUserProfile] = useState<string | null>(null)

  const [loadingDotNetUserDetails, setLoadingDotNetUserDetails] = useState(false)
  const [errorDotNetUserDetails, setErrorDotNetUserDetails] = useState<string | null>(null)
  // Tracks whether the initial getMe() call is still in flight. Separate
  // from loadingDotNetUserDetails (which covers sign-in attempts) so pages
  // can distinguish "checking if you're signed in" from "attempting to
  // sign in".
  const [sessionChecking, setSessionChecking] = useState(true)

  const abortRef = useRef<AbortController | null>(null)

  // --- helpers ---

  const clearAllUserData = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }

    setTornUserProfile(null)
    setDotNetUserDetails(null)
    setLoadingTornUserProfile(false)
    setLoadingDotNetUserDetails(false)
    setErrorTornUserProfile(null)
    setErrorDotNetUserDetails(null)
  }, [])

  const logoutAsync = useCallback(async () => {
    try {
      await logout()
    } catch {
      // best-effort: clear local state regardless
    }
    clearAllUserData()
  }, [clearAllUserData])

  const updateDotNetUserDetails = useCallback((details: DotNetUserDetails | null) => {
    setDotNetUserDetails(details)
  }, [])

  // --- sign-in flow ---

  // The only path that carries a plaintext key from browser to backend.
  // On success, the backend sets the session cookie and we pick up the
  // user details in the response. The key is never stored on the client.
  const signInAsync = useCallback(async (apiKey: string) => {
    setLoadingDotNetUserDetails(true)
    setErrorDotNetUserDetails(null)

    try {
      const userData = await login(apiKey)
      if (userData) {
        setDotNetUserDetails(userData)
      } else {
        setErrorDotNetUserDetails('Invalid API key or login failed.')
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErrorDotNetUserDetails(e.message)
      } else {
        setErrorDotNetUserDetails('Unknown error')
      }
    } finally {
      setLoadingDotNetUserDetails(false)
    }
  }, [])

  // --- favourites toggle ---

  const toggleFavouriteItemAsync = useCallback(
    async (itemId: number) => {
      if (!dotNetUserDetails) {
        return
      }

      let userData: DotNetUserDetails | null = null
      const favourites = new Set(dotNetUserDetails.favouriteItems ?? [])

      try {
        if (favourites.has(itemId)) {
          userData = await postRemoveUserFavourite(dotNetUserDetails.id!, itemId)
        } else {
          userData = await postAddUserFavourite(dotNetUserDetails.id!, itemId)
        }
      } catch (error) {
        console.error('Failed to toggle favourite:', error)
        return
      }

      if (userData) {
        setDotNetUserDetails(userData)
      }
    },
    [dotNetUserDetails],
  )

  // --- initial session check + legacy storage cleanup ---

  useEffect(() => {
    // Drop any lingering plaintext API key caches from the pre-Phase-2
    // client. Safe to run every mount — it's idempotent.
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key)
    }

    setSessionChecking(true)
    getMe()
      .then((userData) => {
        if (userData) setDotNetUserDetails(userData)
      })
      .catch(() => {
        /* not signed in */
      })
      .finally(() => {
        setSessionChecking(false)
      })
  }, [])

  // --- Torn profile auto-load for signed-in users ---

  useEffect(() => {
    if (!dotNetUserDetails) {
      setTornUserProfile(null)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    setLoadingTornUserProfile(true)
    setErrorTornUserProfile(null)

    proxyTornUserBasic(signal)
      .then((payload) => {
        setTornUserProfile(payload.profile ?? null)
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        if (e instanceof Error) {
          setErrorTornUserProfile(e.message)
        } else {
          setErrorTornUserProfile('Unknown error')
        }
      })
      .finally(() => {
        setLoadingTornUserProfile(false)
      })
  }, [dotNetUserDetails])

  const contextValue = useMemo<UserContextModel>(
    () => ({
      tornUserProfile,
      dotNetUserDetails,

      loadingTornUserProfile,
      errorTornUserProfile,
      loadingDotNetUserDetails,
      errorDotNetUserDetails,
      sessionChecking,

      signInAsync,
      toggleFavouriteItemAsync,

      logoutAsync,
      updateDotNetUserDetails,
    }),
    [
      tornUserProfile,
      dotNetUserDetails,
      loadingTornUserProfile,
      errorTornUserProfile,
      loadingDotNetUserDetails,
      errorDotNetUserDetails,
      sessionChecking,
      signInAsync,
      toggleFavouriteItemAsync,
      logoutAsync,
      updateDotNetUserDetails,
    ],
  )

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
}
