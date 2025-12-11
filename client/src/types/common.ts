export type LabelValue = {
  label: string;
  value: string | number;
};

export const saleOutletOptions: LabelValue[] = [
  { label: 'City', value: 'city' },
  { label: 'Market', value: 'market' },
]

export const taxTypeOptions: LabelValue[] = [
  { label: '5% (Market)', value: 0.05 },
  { label: '10% (Anonymous)', value: 0.1 },
]