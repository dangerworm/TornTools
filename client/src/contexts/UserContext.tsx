import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { UserContext } from "../hooks/useUser";
import { fetchUserDetails, type TornUserProfile } from "../lib/tornapi";

const LOCAL_STORAGE_KEY_USER_API_KEY = "torntools:user:apiKey:v1";
const LOCAL_STORAGE_KEY_USER_DETAILS = "torntools:user:details:v1";
const LOCAL_STORAGE_KEY_USER_DETAILS_TIME_SERVED =
  "torntools:user:details:v1:ts";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

type UserProviderProps = {
  children: ReactNode;
  ttlMs?: number;
};

export const UserProvider = ({
  children,
  ttlMs = DEFAULT_TTL_MS,
}: UserProviderProps) => {
  const [apiKey, setApiKeyState] = useState<string | null>(() =>
    localStorage.getItem(LOCAL_STORAGE_KEY_USER_API_KEY)
  );
  const [userDetails, setUserDetails] = useState<TornUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    const ts = Number(
      localStorage.getItem(LOCAL_STORAGE_KEY_USER_DETAILS_TIME_SERVED) ?? 0
    );
    const age = Date.now() - ts;

    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_USER_DETAILS);
    if (cached && age < ttlMs) {
      setUserDetails(JSON.parse(cached));
    }

    void revalidate();
  }, [apiKey, ttlMs]);

  const revalidate = useCallback(async () => {
    if (!apiKey) return;

    setLoading(true);
    setError(null);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const userDetails = await fetchUserDetails(
        apiKey,
        abortRef.current.signal
      );

      localStorage.setItem(
        LOCAL_STORAGE_KEY_USER_DETAILS,
        JSON.stringify(userDetails.profile ?? null)
      );
      localStorage.setItem(
        LOCAL_STORAGE_KEY_USER_DETAILS_TIME_SERVED,
        Date.now().toString()
      );

      setUserDetails(userDetails.profile ?? null);
    } catch (e: unknown) {
      // If the request was deliberately cancelled, don't show an error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((e as any).name === "AbortError") {
        return;
      }
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  const refresh = useMemo(() => async () => revalidate(), [revalidate]);

  const setApiKey = useCallback(
    (key: string | null) => {
      const isNewKey = key && key !== apiKey;

      setApiKeyState(key);
      if (isNewKey) {
        localStorage.setItem(LOCAL_STORAGE_KEY_USER_API_KEY, key);
        void refresh();
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_USER_API_KEY);
        setUserDetails(null);
      }
    },
    [apiKey, refresh]
  );

  const contextValue = useMemo(
    () => ({
      apiKey,
      userDetails,
      loading,
      error,
      refresh,
      setApiKey,
    }),
    [apiKey, userDetails, loading, error, refresh, setApiKey]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
