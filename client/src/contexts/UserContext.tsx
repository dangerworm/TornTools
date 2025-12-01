import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { UserContext } from "../hooks/useUser";
import { fetchTornUserDetails, type TornUserProfile } from "../lib/tornapi";
import {
  postAddUserFavourite,
  postRemoveUserFavourite,
  postUserDetails,
  type DotNetUserDetails,
} from "../lib/dotnetapi";

const LOCAL_STORAGE_KEY_DOTNET_USER_DETAILS =
  "torntools:user:dotnet:details:v1";

const LOCAL_STORAGE_KEY_TORN_API_KEY = "torntools:user:torn:apiKey:v1";
const LOCAL_STORAGE_KEY_TORN_USER_DETAILS = "torntools:user:torn:details:v1";

// Single “master” timestamp for the whole user cache
const LOCAL_STORAGE_KEY_USER_CACHE_TS = "torntools:user:cache:ts:v1";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

type UserProviderProps = {
  children: ReactNode;
  ttlMs?: number;
};

export const UserProvider = ({
  children,
  ttlMs = DEFAULT_TTL_MS,
}: UserProviderProps) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [tornUserProfile, setTornUserProfile] =
    useState<TornUserProfile | null>(null);
  const [dotNetUserDetails, setDotNetUserDetails] =
    useState<DotNetUserDetails | null>(null);

  const [loadingTornUserProfile, setLoadingTornUserProfile] = useState(false);
  const [errorTornUserProfile, setErrorTornUserProfile] = useState<
    string | null
  >(null);

  const [loadingDotNetUserDetails, setLoadingDotNetUserDetails] =
    useState(false);
  const [errorDotNetUserDetails, setErrorDotNetUserDetails] = useState<
    string | null
  >(null);

  const abortRef = useRef<AbortController | null>(null);

  // --- helpers for cache management ---

  const updateCacheTimestamp = useCallback(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_USER_CACHE_TS,
      Date.now().toString()
    );
  }, []);

  const clearAllUserData = useCallback(() => {
    // Abort any in-flight Torn request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    localStorage.clear();

    setApiKeyState(null);
    setTornUserProfile(null);
    setDotNetUserDetails(null);
    setLoadingTornUserProfile(false);
    setLoadingDotNetUserDetails(false);
    setErrorTornUserProfile(null);
    setErrorDotNetUserDetails(null);
  }, []);

  const updateDotNetUserDetails = useCallback(
    (details: DotNetUserDetails | null) => {
      setDotNetUserDetails(details);
      if (details) {
        localStorage.setItem(
          LOCAL_STORAGE_KEY_DOTNET_USER_DETAILS,
          JSON.stringify(details)
        );
        updateCacheTimestamp();
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_DOTNET_USER_DETAILS);
      }
    },
    [updateCacheTimestamp]
  );

  // --- Torn profile fetch ---

  const fetchTornProfileAsync = useCallback(
    async (key: string) => {
      setLoadingTornUserProfile(true);
      setErrorTornUserProfile(null);

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      try {
        const tornUserDetails = await fetchTornUserDetails(
          key,
          abortRef.current.signal
        );

        const profile = tornUserDetails.profile ?? null;

        setTornUserProfile(profile);
        localStorage.setItem(
          LOCAL_STORAGE_KEY_TORN_USER_DETAILS,
          JSON.stringify(profile)
        );
        updateCacheTimestamp();
      } catch (e) {
        // If deliberately cancelled, don't show an error
        if ((e as any)?.name === "AbortError") {
          return;
        }
        if (e instanceof Error) {
          setErrorTornUserProfile(e.message);
        } else {
          setErrorTornUserProfile("Unknown error");
        }
      } finally {
        setLoadingTornUserProfile(false);
      }
    },
    [updateCacheTimestamp]
  );

  // --- public setter for API key (called from UI when user types/pastes key) ---

  const setApiKey = useCallback(
    async (key: string | null) => {
      if (!key) {
        // Treat null/empty as logout
        clearAllUserData();
        return;
      }

      // New key: store it, reset dotnet details (they haven't agreed yet)
      setApiKeyState(key);
      localStorage.setItem(LOCAL_STORAGE_KEY_TORN_API_KEY, key);
      setDotNetUserDetails(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY_DOTNET_USER_DETAILS);

      updateCacheTimestamp();

      // Fetch Torn profile for this key
      await fetchTornProfileAsync(key);
    },
    [clearAllUserData, fetchTornProfileAsync, updateCacheTimestamp]
  );

  // --- "I agree to add this API key" flow ---

  const confirmApiKeyAsync = useCallback(async () => {
    if (!apiKey || !tornUserProfile) {
      console.warn(
        "Cannot confirm API key: missing apiKey or tornUserProfile"
      );
      return;
    }

    setLoadingDotNetUserDetails(true);
    setErrorDotNetUserDetails(null);

    try {
      const userData = await postUserDetails(apiKey, tornUserProfile);
      if (userData) {
        updateDotNetUserDetails(userData);
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErrorDotNetUserDetails(e.message);
      } else {
        setErrorDotNetUserDetails("Unknown error");
      }
    } finally {
      setLoadingDotNetUserDetails(false);
    }
  }, [apiKey, tornUserProfile, updateDotNetUserDetails]);

  // --- favourites toggle ---

  const toggleFavouriteItemAsync = useCallback(
    async (itemId: number) => {
      if (!dotNetUserDetails) {
        console.warn(
          "toggleFavouriteItemAsync called but dotNetUserDetails is null"
        );
        return;
      }

      const favourites = new Set(dotNetUserDetails.favouriteItems ?? []);
      let userData: DotNetUserDetails | null = null;

      try {
        if (favourites.has(itemId)) {
          userData = await postRemoveUserFavourite(dotNetUserDetails.id!, itemId);
        } else {
          userData = await postAddUserFavourite(dotNetUserDetails.id!, itemId);
        }
      } catch (error) {
        console.error("Failed to toggle favourite:", error);
        return;
      }

      if (userData) {
        updateDotNetUserDetails(userData);
      }
    },
    [dotNetUserDetails, updateDotNetUserDetails]
  );

  // --- initial load: restore from cache if within TTL ---

  useEffect(() => {
    const tsRaw = localStorage.getItem(LOCAL_STORAGE_KEY_USER_CACHE_TS);
    const ts = tsRaw ? Number(tsRaw) : 0;
    const age = ts ? Date.now() - ts : Infinity;

    if (!ts || age > ttlMs) {
      // Cache too old or missing – start from a clean slate
      console.log("User cache expired or missing; clearing user data");
      clearAllUserData();
      return;
    }

    // Cache is valid; restore what we have
    const cachedApiKey = localStorage.getItem(LOCAL_STORAGE_KEY_TORN_API_KEY);
    const cachedTornProfile = localStorage.getItem(
      LOCAL_STORAGE_KEY_TORN_USER_DETAILS
    );
    const cachedDotNet = localStorage.getItem(
      LOCAL_STORAGE_KEY_DOTNET_USER_DETAILS
    );

    if (cachedApiKey) {
      setApiKeyState(cachedApiKey);
    }

    if (cachedTornProfile) {
      try {
        setTornUserProfile(JSON.parse(cachedTornProfile));
      } catch {
        console.warn("Failed to parse cached Torn user profile");
      }
    }

    if (cachedDotNet) {
      try {
        setDotNetUserDetails(JSON.parse(cachedDotNet));
      } catch {
        console.warn("Failed to parse cached dotnet user details");
      }
    }
  }, [clearAllUserData, ttlMs]);

  const contextValue = useMemo(
    () => ({
      // data
      apiKey,
      tornUserProfile,
      dotNetUserDetails,

      // loading / errors
      loadingTornUserProfile,
      errorTornUserProfile,
      loadingDotNetUserDetails,
      errorDotNetUserDetails,

      // profile update
      fetchTornProfileAsync,

      // actions
      setApiKey, // user types/pastes key here
      confirmApiKeyAsync, // "I agree" button
      toggleFavouriteItemAsync,

      // optional: expose an explicit logout if you like
      clearAllUserData,
      updateDotNetUserDetails,
    }),
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
      clearAllUserData,
      updateDotNetUserDetails,
    ]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
