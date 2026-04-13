import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { UserContext, type UserContextModel } from '../hooks/useUser'
import { fetchTornKeyInfo, fetchTornUserDetails, type TornUserProfile } from '../lib/tornapi'
import {
  getMe,
  login,
  logout,
  postAddUserFavourite,
  postRemoveUserFavourite,
  type DotNetUserDetails,
} from '../lib/dotnetapi'

const LOCAL_STORAGE_KEY_TORN_API_KEY = 'torntools:user:torn:apiKey:v1'
const LOCAL_STORAGE_KEY_TORN_USER_DETAILS = 'torntools:user:torn:details:v1'
const LOCAL_STORAGE_KEY_USER_CACHE_TS = 'torntools:user:cache:ts:v1'

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000

type UserProviderProps = {
  children: ReactNode
  ttlMs?: number
}

export const UserProvider = ({ children, ttlMs = DEFAULT_TTL_MS }: UserProviderProps) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [tornUserProfile, setTornUserProfile] = useState<TornUserProfile | null>(null)
  const [dotNetUserDetails, setDotNetUserDetails] = useState<DotNetUserDetails | null>(null)

  const [loadingTornUserProfile, setLoadingTornUserProfile] = useState(false)
  const [errorTornUserProfile, setErrorTornUserProfile] = useState<string | null>(null)

  const [loadingDotNetUserDetails, setLoadingDotNetUserDetails] = useState(false)
  const [errorDotNetUserDetails, setErrorDotNetUserDetails] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  // --- helpers ---

  const updateCacheTimestamp = useCallback(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_USER_CACHE_TS, Date.now().toString())
  }, [])

  const clearAllUserData = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }

    localStorage.removeItem(LOCAL_STORAGE_KEY_TORN_API_KEY)
    localStorage.removeItem(LOCAL_STORAGE_KEY_TORN_USER_DETAILS)
    localStorage.removeItem(LOCAL_STORAGE_KEY_USER_CACHE_TS)

    setApiKeyState(null)
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

  // --- Torn profile fetch (used for signin preview and ForeignMarkets) ---

  const fetchTornProfileAsync = useCallback(
    async (key: string) => {
      setLoadingTornUserProfile(true)
      setErrorTornUserProfile(null)

      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()

      try {
        await fetchTornKeyInfo(key, abortRef.current.signal)
      } catch (e: unknown) {
        if (e instanceof Error) {
          setErrorTornUserProfile(e.message)
        }
        return
      } finally {
        setLoadingTornUserProfile(false)
      }

      try {
        const tornUserDetails = await fetchTornUserDetails(key, abortRef.current.signal)

        const profile = tornUserDetails.profile ?? null

        setTornUserProfile(profile)
        localStorage.setItem(LOCAL_STORAGE_KEY_TORN_USER_DETAILS, JSON.stringify(profile))
        updateCacheTimestamp()
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          return
        }
        if (e instanceof Error) {
          setErrorTornUserProfile(e.message)
        } else {
          setErrorTornUserProfile('Unknown error')
        }
      } finally {
        setLoadingTornUserProfile(false)
      }
    },
    [updateCacheTimestamp],
  )

  // --- public setter for API key (called from UI when user types/pastes key) ---

  const setApiKey = useCallback(
    async (key: string | null) => {
      if (!key) {
        await logoutAsync()
        return
      }

      setApiKeyState(key)
      localStorage.setItem(LOCAL_STORAGE_KEY_TORN_API_KEY, key)
      setDotNetUserDetails(null)
      updateCacheTimestamp()

      await fetchTornProfileAsync(key)
    },
    [logoutAsync, fetchTornProfileAsync, updateCacheTimestamp],
  )

  // --- "I agree to add this API key" flow ---

  const confirmApiKeyAsync = useCallback(async () => {
    if (!apiKey) {
      setErrorDotNetUserDetails('No API key set.')
      return
    }

    setLoadingDotNetUserDetails(true)
    setErrorDotNetUserDetails(null)

    try {
      const userData = await login(apiKey)
      if (userData) {
        updateDotNetUserDetails(userData)
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
  }, [apiKey, updateDotNetUserDetails])

  // --- favourites toggle ---

  const toggleFavouriteItemAsync = useCallback(
    async (itemId: number) => {
      if (!dotNetUserDetails) {
        return
      }

      const favourites = new Set(dotNetUserDetails.favouriteItems ?? [])
      let userData: DotNetUserDetails | null = null

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
        updateDotNetUserDetails(userData)
      }
    },
    [dotNetUserDetails, updateDotNetUserDetails],
  )

  // --- initial load ---

  useEffect(() => {
    // Always check if the JWT cookie is still valid
    getMe()
      .then((userData) => {
        if (userData) setDotNetUserDetails(userData)
      })
      .catch(() => {
        /* not logged in */
      })

    // Restore apiKey and tornProfile from localStorage (used for ForeignMarkets etc.)
    const tsRaw = localStorage.getItem(LOCAL_STORAGE_KEY_USER_CACHE_TS)
    const ts = tsRaw ? Number(tsRaw) : 0
    const age = ts ? Date.now() - ts : Infinity

    if (!ts || age > ttlMs) {
      localStorage.removeItem(LOCAL_STORAGE_KEY_TORN_API_KEY)
      localStorage.removeItem(LOCAL_STORAGE_KEY_TORN_USER_DETAILS)
      return
    }

    const cachedApiKey = localStorage.getItem(LOCAL_STORAGE_KEY_TORN_API_KEY)
    const cachedTornProfile = localStorage.getItem(LOCAL_STORAGE_KEY_TORN_USER_DETAILS)

    if (cachedApiKey) {
      setApiKeyState(cachedApiKey)
    }

    if (cachedTornProfile) {
      try {
        setTornUserProfile(JSON.parse(cachedTornProfile))
      } catch {
        // Cached value is unparseable - leave tornUserProfile as null
      }
    }
  }, [ttlMs])

  const contextValue = useMemo(
    () =>
      ({
        apiKey,
        tornUserProfile,
        dotNetUserDetails,

        loadingTornUserProfile,
        errorTornUserProfile,
        loadingDotNetUserDetails,
        errorDotNetUserDetails,

        fetchTornProfileAsync,

        setApiKey,
        confirmApiKeyAsync,
        toggleFavouriteItemAsync,

        logoutAsync,
        updateDotNetUserDetails,
      }) as UserContextModel,
    [
      apiKey,
      tornUserProfile,
      dotNetUserDetails,
      loadingTornUserProfile,
      errorTornUserProfile,
      loadingDotNetUserDetails,
      errorDotNetUserDetails,
      fetchTornProfileAsync,
      setApiKey,
      confirmApiKeyAsync,
      toggleFavouriteItemAsync,
      logoutAsync,
      updateDotNetUserDetails,
    ],
  )

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
}
