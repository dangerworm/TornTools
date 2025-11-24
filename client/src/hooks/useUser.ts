import { createContext, useContext } from "react";
import type { DotNetUserDetails } from "../lib/dotnetapi";
import type { TornUserProfile } from "../lib/tornapi";

interface UserContextModel {
  apiKey: string | null;
  tornUserProfile: TornUserProfile | null;
  loadingTornUserProfile: boolean;
  errorTornUserProfile: string | null;
  dotNetUserDetails: DotNetUserDetails | null;
  loadingDotNetUserDetails: boolean;
  errorDotNetUserDetails: string | null;
  setApiKey: (key: string | null) => void;
  confirmApiKeyAsync: () => Promise<void>;
  toggleFavouriteItemAsync: (itemId: number) => Promise<void>;
  clearAllUserData: () => void;
}

export const UserContext = createContext<UserContextModel | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used inside UserProvider");
  }
  return context;
};
