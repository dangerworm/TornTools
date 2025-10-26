CREATE TABLE public.listings (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	correlation_id uuid NOT NULL,
	player_id int8 NULL,
	item_id int4 NOT NULL,
	listing_position int4 NOT NULL,
	time_seen timestamp NOT NULL,
	price int8 NULL,
	quantity int4 NULL,
	CONSTRAINT listings_pk PRIMARY KEY (id)
);