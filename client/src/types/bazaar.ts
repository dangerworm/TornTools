export interface BazaarListingSubmission {
  itemId: number;
  price: number;
  quantity: number;
  listingPosition?: number;
  playerId?: number;
  timeSeen?: Date;
}
