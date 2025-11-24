CREATE TABLE public.user_favourite_items (
	user_id int8 NOT NULL,
  item_id int4 NOT NULL,
	
  CONSTRAINT user_favourites_pk PRIMARY KEY (user_id, item_id),
  CONSTRAINT user_favourites_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_favourites_item_fk FOREIGN KEY (item_id) REFERENCES public.items(id)
);