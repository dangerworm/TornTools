CREATE TABLE public.item_change_logs (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	item_id int4 NOT NULL,
  "source" text NOT NULL,
	change_time timestamptz NOT NULL,
  new_price int8 NOT NULL,

	CONSTRAINT item_change_logs PRIMARY KEY (id)
);
