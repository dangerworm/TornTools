CREATE TABLE public.foreign_stock_items (
  item_id int4 NOT NULL,
  country text NOT NULL,
  item_name text NOT NULL,
  quantity int4 NOT NULL,
  "cost" int8 NOT NULL,
  last_updated timestamptz NOT NULL,
	
  CONSTRAINT foreign_stock_items_pk PRIMARY KEY (item_id, country),
  CONSTRAINT foreign_stock_items_item_fk FOREIGN KEY (item_id) REFERENCES public.items(id)
);