export interface BargainAlert {
  id: number
  itemId: number
  listingPrice: number
  marketValue: number
  profit: number
  foundAt: string
  expiredAt: string | null
  dismissedAt: string | null
  status: 'active' | 'expired' | 'dismissed'
}
