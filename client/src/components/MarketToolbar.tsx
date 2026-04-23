import { Box, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material'
import type { ChangeEvent, MouseEvent } from 'react'
import OptionGroup from './OptionGroup'
import { saleOutletOptions } from '../types/common'
import type { SaleOutlet } from '../types/markets'

interface MarketToolbarProps {
  saleOutlet: SaleOutlet
  onSaleOutletChange: (event: MouseEvent<HTMLElement>, newOutlet: string | number) => void
  // Restricts which sale outlets to render. Defaults to bazaar / market / anon market.
  availableSaleOutlets?: SaleOutlet[]
  showProfitableOnly: boolean
  onShowProfitableOnlyChange: (next: boolean) => void
  searchTerm: string
  onSearchTermChange: (value: string) => void
  // Shown below the search field when the selected outlet has a caveat.
  saleOutletHint?: string
}

const DEFAULT_AVAILABLE: SaleOutlet[] = ['bazaar', 'market', 'anonymousMarket']

const MarketToolbar = ({
  availableSaleOutlets = DEFAULT_AVAILABLE,
  onSaleOutletChange,
  onSearchTermChange,
  onShowProfitableOnlyChange,
  saleOutlet,
  saleOutletHint,
  searchTerm,
  showProfitableOnly,
}: MarketToolbarProps) => {
  const options = saleOutletOptions.filter((o) =>
    availableSaleOutlets.includes(o.value as SaleOutlet),
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <OptionGroup
        options={options}
        selectedOption={saleOutlet}
        title="Sell via"
        handleOptionChange={onSaleOutletChange}
      />

      {saleOutletHint && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {saleOutletHint}
        </Typography>
      )}

      <FormControlLabel
        control={
          <Checkbox
            checked={showProfitableOnly}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onShowProfitableOnlyChange(e.target.checked)
            }
          />
        }
        label="Show profitable items only"
      />

      <TextField
        label="Search"
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        fullWidth
      />
    </Box>
  )
}

export default MarketToolbar
