CREATE TABLE public.listings (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	correlation_id uuid NOT NULL,
  source text NOT NULL,
	player_id int8 NULL,
	item_id int4 NOT NULL,
	listing_position int4 NOT NULL,
	time_seen timestamptz NOT NULL,
	price int8 NOT NULL,
	quantity int4 NOT NULL,
	CONSTRAINT listings_pk PRIMARY KEY (id)
);
