export type LabelValue = {
  label: string;
  value: string | number;
};

export const purchaseOutletOptions: LabelValue[] = [
  { label: 'City', value: 'city' },
  { label: 'Bazaar', value: 'bazaar' },
  { label: 'Market', value: 'market' },
]

export const saleOutletOptions: LabelValue[] = [
  { label: 'City', value: 'city' },
  { label: 'Bazaar', value: 'bazaar' },
  { label: 'Market (5%)', value: 'market' },
  { label: 'Anon (15%)', value: 'anonymousMarket' },
]
