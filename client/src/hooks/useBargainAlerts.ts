import { createContext, useContext } from 'react'
import type { BargainAlert } from '../types/bargainAlerts'

export interface BargainAlertsContextModel {
  authorised: boolean
  alerts: BargainAlert[]
  dismiss: (id: number) => Promise<void>
}

export const BargainAlertsContext = createContext<BargainAlertsContextModel | null>(null)

export const useBargainAlerts = () => {
  const ctx = useContext(BargainAlertsContext)
  if (!ctx) {
    throw new Error('useBargainAlerts must be used inside BargainAlertsProvider')
  }
  return ctx
}
