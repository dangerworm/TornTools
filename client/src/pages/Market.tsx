import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Grid, Typography } from "@mui/material";
import Loading from "../components/Loading";
import { useItems } from "../hooks/useItems";
import type { Item } from "../types/items";

const Market =() => {
  const { itemId } = useParams<{ itemId: string }>();
  const { itemsById } = useItems();

  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    setItem(itemsById[Number(itemId)] || null);
  }, [itemId, itemsById]);

  if (!itemsById || !item) return <Loading message="Loading items..." />;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid sx={{ width: 80}}>
          <img
            alt=""
            src={`https://www.torn.com/images/items/${item!.id}/large.png`}
            style={{ borderRadius: 4 }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </Grid>
        <Grid>
          <Typography variant="h4" sx={{ ml: 2, mt: 0.6 }} gutterBottom>
            {item?.name || "Market Item"}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="body1" gutterBottom>
            Coming soon!
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Market;