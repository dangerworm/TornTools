import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Card, Chip, Grid, Typography } from "@mui/material";
import Loading from "../components/Loading";
import { useItems } from "../hooks/useItems";
import type { Item } from "../types/items";

interface InfoCardProps {
  heading: string;
  isCurrency?: boolean;
  isProfitable?: boolean;
  value?: number | null;
}

const InfoCard = ({
  heading,
  isCurrency,
  isProfitable = false,
  value,
}: InfoCardProps) => {
  return (
    <Grid size={{ xs: 12, md: 3 }}>
      <Card
        elevation={2}
        sx={{
          backgroundColor: "background.paper",
          p: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="h6" gutterBottom>
          {heading}
        </Typography>
        <Typography variant="h5" gutterBottom>
          {value ? (
            isProfitable ? (
              <Chip
                color="success"
                label={`$${value.toLocaleString()}`}
                size="medium"
                sx={{ fontSize: "1em", mr: 1 }}
              />
            ) : isCurrency ? (
              `$${value.toLocaleString()}`
            ) : (
              value.toLocaleString()
            )
          ) : (
            <span>&mdash;</span>
          )}
        </Typography>
      </Card>
    </Grid>
  );
};

const ItemDetails = () => {
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
        <Grid sx={{ width: 80 }}>
          <img
            alt=""
            src={`https://www.torn.com/images/items/${item!.id}/large.png`}
            style={{ borderRadius: 4 }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </Grid>
        <Grid sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ ml: 2, mt: 0.6 }} gutterBottom>
            {item?.name}
            {item?.type && !item?.subType && ` (${item.type})`}
            {item?.type && item?.subType && ` (${item.type} – ${item.subType})`}
          </Typography>
        </Grid>
        <Grid size={{ xs: 2 }} sx={{ textAlign: "right", mt: 1, mr: 4 }}>
          {item?.isTradable && <Chip label="Tradable" color="primary" />}
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="body1" gutterBottom>
            <>{item?.description}</>
            {item?.valueVendorCountry && (
              <>
                {" "}
                Available from{" "}
                {item?.valueVendorName?.startsWith("the ")
                  ? item?.valueVendorName.substring(4)
                  : item?.valueVendorName}
                {" in "}
                {item?.valueVendorCountry === "Torn"
                  ? "Torn City"
                  : item?.valueVendorCountry}
                .
              </>
            )}
            {item.effect ? <>{" "}{item.effect}</> : ""}
            {item.requirement ? <>{" "}{item.requirement}</> : ""}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <InfoCard
              heading="Buy Price"
              isCurrency={true}
              isProfitable={
                !item.valueBuyPrice ||
                !item.valueMarketPrice ||
                item.valueMarketPrice > item.valueBuyPrice
              }
              value={item?.valueBuyPrice}
            />
            <InfoCard
              heading="Sell Price"
              isCurrency={true}
              value={item?.valueSellPrice}
            />
            <InfoCard
              heading="Market Price"
              isCurrency={true}
              isProfitable={
                !item.valueBuyPrice ||
                !item.valueMarketPrice ||
                item.valueMarketPrice > item.valueBuyPrice
              }
              value={item?.valueMarketPrice}
            />
            <InfoCard
              heading="Circulation"
              isCurrency={false}
              value={item?.circulation}
            />
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ItemDetails;
