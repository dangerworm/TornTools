import { createContext, useContext } from "react";
import type { DotNetUserDetails } from "../lib/dotnetapi";

interface UserContextModel {
  apiKey: string | null;
  dotNetUserDetails: DotNetUserDetails | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setApiKey: (key: string | null) => void;
}

export const UserContext = createContext<UserContextModel | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used inside UserProvider");
  }
  return context;
};
