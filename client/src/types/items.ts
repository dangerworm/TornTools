export interface Vendor { country: string; name: string }
export interface Value { vendor: Vendor; buy_price: number; sell_price: number; market_price: number }
export interface Item {
  id: number
  name: string
  description: string | null
  effect: string | null
  requirement: string | null
  image: string | null
  type: string | null
  sub_type?: string | null
  is_masked?: boolean
  is_tradable?: boolean
  is_found_in_city?: boolean
  value?: Value | null
  circulation?: number
}
export interface ItemsFile { items: Item[] }
