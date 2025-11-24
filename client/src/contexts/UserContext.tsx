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
const LOCAL_STORAGE_KEY_DOTNET_USER_DETAILS_TIME_SERVED =
  "torntools:user:dotnet:details:v1:ts";

const LOCAL_STORAGE_KEY_TORN_API_KEY = "torntools:user:torn:apiKey:v1";
const LOCAL_STORAGE_KEY_TORN_USER_DETAILS = "torntools:user:torn:details:v1";
const LOCAL_STORAGE_KEY_TORN_USER_DETAILS_TIME_SERVED =
  "torntools:user:torn:details:v1:ts";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

type UserProviderProps = {
  children: ReactNode;
  ttlMs?: number;
};

export const UserProvider = ({
  children,
  ttlMs = DEFAULT_TTL_MS,
}: UserProviderProps) => {
  const [apiKey, setApiKey] = useState<string | null>(() =>
    localStorage.getItem(LOCAL_STORAGE_KEY_TORN_API_KEY)
  );
  const [dotNetUserDetails, setDotNetUserDetails] =
    useState<DotNetUserDetails | null>(null);
  const [tornUserProfile, setTornUserProfile] =
    useState<TornUserProfile | null>(null);

  const [loadingTornUserProfile, setLoadingTornUserProfile] = useState(false);
  const [errorTornUserProfile, setErrorTornUserProfile] = useState<string | null>(null);

  const [loadingDotNetUserDetails, setLoadingDotNetUserDetails] = useState(false);
  const [errorDotNetUserDetails, setErrorDotNetUserDetails] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const clearApiKey = useCallback(() => {
    console.log("Clearing API key");
    localStorage.removeItem(LOCAL_STORAGE_KEY_TORN_API_KEY);
    setApiKey(null);
  }, [setApiKey]);

  const clearTornUserProfile = useCallback(() => {
    console.log("Clearing torn user profile");
    localStorage.removeItem(LOCAL_STORAGE_KEY_TORN_USER_DETAILS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_TORN_USER_DETAILS_TIME_SERVED);
    setTornUserProfile(null);
  }, [setTornUserProfile]);

  const clearDotNetUserDetails = useCallback(() => {
    console.log("Clearing dotnet user details");
    localStorage.removeItem(LOCAL_STORAGE_KEY_DOTNET_USER_DETAILS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_DOTNET_USER_DETAILS_TIME_SERVED);
    setDotNetUserDetails(null);
  }, [setDotNetUserDetails]);

  const getTornUserProfileAsync = useCallback(async (apiKey: string) => {
    console.log("Fetching torn user profile");
    setLoadingTornUserProfile(true);
    setErrorTornUserProfile(null);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const tornUserDetails = await fetchTornUserDetails(
        apiKey,
        abortRef.current.signal
      );

      localStorage.setItem(
        LOCAL_STORAGE_KEY_TORN_USER_DETAILS,
        JSON.stringify(tornUserDetails.profile ?? null)
      );
      localStorage.setItem(
        LOCAL_STORAGE_KEY_TORN_USER_DETAILS_TIME_SERVED,
        Date.now().toString()
      );

      setTornUserProfile(tornUserDetails.profile ?? null);
    } catch (e: unknown) {
      // If the request was deliberately cancelled, don't show an error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((e as any).name === "AbortError") {
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
  }, []);

  const handleApiKeyChanged = useCallback(
    async (key: string | null) => {
      console.log("Handling API key change:", key);
      if (!key) {
        clearApiKey();
        clearTornUserProfile();
        clearDotNetUserDetails();
        return;
      }

      if (key && (key !== apiKey || !tornUserProfile)) {
        setApiKey(key);
        localStorage.setItem(LOCAL_STORAGE_KEY_TORN_API_KEY, key);
        await getTornUserProfileAsync(key);
      }
    },
    [
      apiKey,
      tornUserProfile,
      clearApiKey,
      clearDotNetUserDetails,
      clearTornUserProfile,
      getTornUserProfileAsync,
    ]
  );

  const updateUserDetailsAsync = useCallback(async () => {
    console.log("Updating user details");
    if (!apiKey || !tornUserProfile) {
      return;
    }

    setLoadingDotNetUserDetails(true);
    setErrorDotNetUserDetails(null);

    try {
      const userData = await postUserDetails(apiKey, tornUserProfile);
      setDotNetUserDetails(userData ?? null);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErrorDotNetUserDetails(e.message);
      } else {
        setErrorDotNetUserDetails("Unknown error");
      }
    } finally {
      setLoadingDotNetUserDetails(false);
    }
  }, [apiKey, tornUserProfile]);

  const toggleFavouriteItemAsync = useCallback(
    async (itemId: number) => {
      if (!dotNetUserDetails) {
        return Promise.resolve();
      }

      const favourites = new Set(dotNetUserDetails.favourites ?? []);
      let userData: DotNetUserDetails | null = null;
      if (favourites.has(itemId)) {
        userData = await postRemoveUserFavourite(dotNetUserDetails.id!, itemId);
      } else {
        userData = await postAddUserFavourite(dotNetUserDetails.id!, itemId);
      }
      setDotNetUserDetails(userData ?? null);
    },
    [dotNetUserDetails]
  );

  useEffect(() => {
    const cachedApiKey = localStorage.getItem(LOCAL_STORAGE_KEY_TORN_API_KEY);
    const ts = Number(
      localStorage.getItem(LOCAL_STORAGE_KEY_TORN_USER_DETAILS_TIME_SERVED) ?? 0
    );

    const age = Date.now() - ts;
    if (!cachedApiKey || age > ttlMs) {
      setApiKey(cachedApiKey);
    }
  }, [handleApiKeyChanged, ttlMs]);

  useEffect(() => {
    handleApiKeyChanged(apiKey);
  }, [apiKey, handleApiKeyChanged]);
  
  useEffect(() => {
    if (!dotNetUserDetails) {
      clearDotNetUserDetails();
      return;
    }

    localStorage.setItem(
      LOCAL_STORAGE_KEY_DOTNET_USER_DETAILS,
      JSON.stringify(dotNetUserDetails ?? null)
    );
    localStorage.setItem(
      LOCAL_STORAGE_KEY_DOTNET_USER_DETAILS_TIME_SERVED,
      Date.now().toString()
    );
  }, [dotNetUserDetails, clearDotNetUserDetails]);

  const contextValue = useMemo(
    () => ({
      apiKey,
      tornUserProfile,
      loadingTornUserProfile,
      errorTornUserProfile,
      dotNetUserDetails,
      loadingDotNetUserDetails,
      errorDotNetUserDetails,
      setApiKey: handleApiKeyChanged,
      updateUserDetailsAsync,
      toggleFavouriteItemAsync,
    }),
    [
      apiKey,
      tornUserProfile,
      loadingTornUserProfile,
      errorTornUserProfile,
      dotNetUserDetails,
      loadingDotNetUserDetails,
      errorDotNetUserDetails,
      handleApiKeyChanged,
      updateUserDetailsAsync,
      toggleFavouriteItemAsync,
    ]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
