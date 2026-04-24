import { createContext, useContext } from 'react'
import type { DotNetUserDetails } from '../lib/dotnetapi'
import type { TornUserProfile } from '../lib/tornapi'

export interface UserContextModel {
  tornUserProfile: TornUserProfile | null
  loadingTornUserProfile: boolean
  errorTornUserProfile: string | null
  dotNetUserDetails: DotNetUserDetails | null
  loadingDotNetUserDetails: boolean
  errorDotNetUserDetails: string | null
  // True until the initial getMe() cookie check resolves. Pages that
  // redirect unauthenticated users should wait for this to become false
  // before doing so — otherwise a valid session cookie loses a race
  // against the first paint.
  sessionChecking: boolean
  // Sign in with a plaintext key. The key leaves the browser exactly
  // once — in the POST body to /auth/login — and is never stored
  // anywhere on the client side. Backend persists the encrypted copy.
  signInAsync: (apiKey: string) => Promise<void>
  toggleFavouriteItemAsync: (itemId: number) => Promise<void>
  updateDotNetUserDetails: (details: DotNetUserDetails | null) => void
  logoutAsync: () => Promise<void>
}

export const UserContext = createContext<UserContextModel | null>(null)

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used inside UserProvider')
  }
  return context
}
