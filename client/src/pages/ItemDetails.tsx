import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Favorite from "@mui/icons-material/Favorite";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import Loading from "../components/Loading";
import {
  useItemPriceHistory,
  useItemVelocityHistory,
} from "../hooks/useItemHistory";
import { useItems } from "../hooks/useItems";
import type { HistoryWindow } from "../types/history";
import { isItemProfitable, type Item } from "../types/items";
import { useUser } from "../hooks/useUser";
import { getFormattedText } from "../lib/textFormat";
import type {
  NameType,
  Payload,
} from "recharts/types/component/DefaultTooltipContent";

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
    <Grid size={{ xs: 6, md: 3 }}>
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
                label={getFormattedText("$", value, "")}
                size="medium"
                sx={{ fontSize: "1em", mr: 1 }}
              />
            ) : (
              getFormattedText(isCurrency ? "$" : "", value, "")
            )
          ) : (
            <span>&mdash;</span>
          )}
        </Typography>
      </Card>
    </Grid>
  );
};

const HISTORY_WINDOWS: { label: string; value: HistoryWindow }[] = [
  { label: "30m", value: "30m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "Day", value: "1d" },
  { label: "Week", value: "1w" },
  { label: "Month", value: "1m" },
  { label: "3m", value: "3m" },
  { label: "Year", value: "1y" },
];

interface ItemDetailsProps {
  inputItem?: Item;
  inlineView?: boolean;
}

const ItemDetails = ({ inputItem, inlineView = false }: ItemDetailsProps) => {
  const { itemId: urlItemId } = useParams<{ itemId: string }>();

  const [item, setItem] = useState<Item | null>(null);
  const [itemId, setItemId] = useState<number | undefined>(
    inputItem ? inputItem.id : urlItemId ? parseInt(urlItemId, 10) : undefined
  );

  const [priceWindow, setPriceWindow] = useState<HistoryWindow>("1w");
  const [velocityWindow, setVelocityWindow] = useState<HistoryWindow>("1w");

  const { itemsById } = useItems();
  const {
    data: priceHistory,
    loading: priceHistoryLoading,
    error: priceHistoryError,
  } = useItemPriceHistory(itemId, priceWindow);
  const {
    data: velocityHistory,
    loading: velocityHistoryLoading,
    error: velocityHistoryError,
  } = useItemVelocityHistory(itemId, velocityWindow);
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser();
  const theme = useTheme();

  useEffect(() => {
    if (urlItemId) {
      const parsedId = parseInt(urlItemId, 10);
      setItemId((prev) => (prev !== parsedId ? parsedId : prev));
    }
  }, [urlItemId, itemId]);

  useEffect(() => {
    if (inputItem?.id) {
      setItemId((prev) => (prev !== inputItem.id ? inputItem.id : prev));
    }
  }, [inputItem, itemId]);

  useEffect(() => {
    if (itemId && itemsById[itemId]) {
      setItem(itemsById[itemId]);
    }
  }, [itemId, itemsById]);

  const timestampFormatter = useMemo(
    () =>
      priceWindow === "30m" || priceWindow === "1h" || priceWindow === "4h"
        ? new Intl.DateTimeFormat(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })
        : new Intl.DateTimeFormat(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
    [priceWindow]
  );

  const priceSeries = useMemo(
    () =>
      priceHistory
        .filter((point) => typeof point.price === "number")
        .map((point) => ({
          time: new Date(point.timestamp).getTime(),
          price: point.price ?? 0,
        })),
    [priceHistory]
  );

  const velocitySeries = useMemo(
    () =>
      velocityHistory
        .filter((point) => typeof point.velocity === "number")
        .map((point) => ({
          time: new Date(point.timestamp).getTime(),
          velocity: point.velocity ?? 0,
        })),
    [velocityHistory]
  );

  const gridColor = alpha(theme.palette.text.primary, 0.12);
  const axisColor = theme.palette.text.secondary;
  const areaStroke = theme.palette.primary.main;
  const barColor = theme.palette.secondary.main;

  const renderWindowToggle = (
    selected: HistoryWindow,
    onChange: (window: HistoryWindow) => void
  ) => (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={selected}
      color="primary"
      onChange={(_, value) => value && onChange(value)}
    >
      {HISTORY_WINDOWS.map((window) => (
        <ToggleButton key={window.value} value={window.value}>
          {window.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Payload<number, NameType>[];
    label?: number;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;

    const price = payload[0].value;

    return (
      <div
        style={{
          padding: "4px 8px",
          background: "rgba(0,0,0,0.85)",
          border: "1px solid #444",
          borderRadius: 6,
          fontSize: "0.8rem",
          color: "#fff",
        }}
      >
        <div>{formatTimestamp(label!)}</div>
        <div>Price: {getFormattedText("$", price!, "")}</div>
      </div>
    );
  };

  const formatTimestamp = (value: number) =>
    timestampFormatter.format(new Date(value));

  if (!itemsById || !item) return <Loading message="Loading items..." />;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2, mt: inlineView ? 2 : 0 }}>
        {!inlineView && (
          <>
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
                {item?.type &&
                  item?.subType &&
                  ` (${item.type} – ${item.subType})`}
              </Typography>
            </Grid>

            <Grid sx={{ flexGrow: 0, mt: 1, mr: 4, textAlign: "right" }}>
              {item?.isTradable && <Chip label="Tradable" color="primary" />}
            </Grid>

            <Grid sx={{ flexGrow: 0, mt: 1, mr: 4, textAlign: "right" }}>
              {dotNetUserDetails && (
                <Chip
                  label={
                    dotNetUserDetails.favouriteItems?.includes(item.id)
                      ? "Favourited"
                      : "Favourite"
                  }
                  icon={
                    dotNetUserDetails.favouriteItems?.includes(item.id) ? (
                      <Favorite sx={{ cursor: "pointer", color: "red" }} />
                    ) : (
                      <FavoriteBorder
                        sx={{ cursor: "pointer", color: "gray" }}
                      />
                    )
                  }
                  color={
                    dotNetUserDetails.favouriteItems?.includes(item.id)
                      ? "secondary"
                      : "default"
                  }
                  onClick={() => toggleFavouriteItemAsync(item.id)}
                  sx={{ pl: 0.5 }}
                />
              )}
            </Grid>
          </>
        )}

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
            {item.effect ? <> {item.effect}</> : ""}
            {item.requirement ? <> {item.requirement}</> : ""}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <InfoCard
              heading="Buy Price"
              isCurrency={true}
              isProfitable={isItemProfitable(item)}
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
              isProfitable={isItemProfitable(item)}
              value={item?.valueMarketPrice}
            />
            <InfoCard
              heading="Circulation"
              isCurrency={false}
              value={item?.circulation}
            />
          </Grid>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                elevation={2}
                sx={{ backgroundColor: "background.paper", height: "100%" }}
              >
                <CardHeader
                  title="Price history"
                  action={renderWindowToggle(priceWindow, setPriceWindow)}
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  {priceHistoryLoading ? (
                    <Loading message="Loading price history..." />
                  ) : priceHistoryError ? (
                    <Alert severity="error">{priceHistoryError}</Alert>
                  ) : priceSeries.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart
                        data={priceSeries}
                        margin={{
                          left:
                            Math.max(
                              ...priceSeries.map((p) => p.price)
                            ).toLocaleString().length * 4,
                          right: 10,
                          top: 10,
                        }}
                      >
                        <defs>
                          <linearGradient
                            id="priceGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={areaStroke}
                              stopOpacity={0.6}
                            />
                            <stop
                              offset="95%"
                              stopColor={areaStroke}
                              stopOpacity={0.05}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke={gridColor}
                          strokeDasharray="3 3"
                        />
                        <XAxis
                          dataKey="time"
                          type="number"
                          domain={["dataMin", "dataMax"]}
                          tickFormatter={formatTimestamp}
                          stroke={axisColor}
                        />
                        <YAxis
                          tickFormatter={(value) =>
                            getFormattedText("$", value, "")
                          }
                          stroke={axisColor}
                        />
                        <Tooltip content={CustomTooltip} />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={areaStroke}
                          fill="url(#priceGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      No price history available.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                elevation={2}
                sx={{ backgroundColor: "background.paper", height: "100%" }}
              >
                <CardHeader
                  title="Market velocity"
                  action={renderWindowToggle(velocityWindow, setVelocityWindow)}
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  {velocityHistoryLoading ? (
                    <Loading message="Loading market velocity..." />
                  ) : velocityHistoryError ? (
                    <Alert severity="error">{velocityHistoryError}</Alert>
                  ) : velocitySeries.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={velocitySeries}
                        margin={{ top: 10, right: 10, left: 20 }}
                      >
                        <CartesianGrid
                          stroke={gridColor}
                          strokeDasharray="3 3"
                        />
                        <XAxis
                          dataKey="time"
                          type="number"
                          domain={["dataMin", "dataMax"]}
                          tickFormatter={formatTimestamp}
                          stroke={axisColor}
                        />
                        <YAxis
                          allowDecimals={false}
                          label={{
                            value: "Number of changes",
                            angle: -90,
                            position: "insideLeft",
                          }}
                          stroke={axisColor}
                        />
                        <Tooltip content={CustomTooltip} />
                        <Bar
                          dataKey="velocity"
                          fill={barColor}
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      No recent change data available.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ItemDetails;
