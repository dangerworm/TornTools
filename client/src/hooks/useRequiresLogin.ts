import { menuItems } from '../components/Menu'
import { useUser } from './useUser'

// True when the menu entry for this route requires login AND the visitor isn't
// signed in. Lets pages keep the menu-config as the single source of truth for
// access requirements without inlining the menuItems lookup at every callsite.
export const useRequiresLogin = (menuAddress: string): boolean => {
  const { dotNetUserDetails } = useUser()
  if (menuItems.length === 0) return false
  const entry = menuItems.find((item) => item.address === menuAddress)
  if (!entry?.requiresLogin) return false
  return !dotNetUserDetails
}
