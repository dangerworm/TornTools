CREATE TABLE public.queue_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	call_type int4 NOT NULL,
	endpoint_url text NOT NULL,
  http_method varchar(255) NOT NULL,
  headers_json jsonb NULL,
	payload_json jsonb NULL,
  item_status int4 NOT NULL DEFAULT 0,
  attempts int4 NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  last_attempt_at timestamp NULL,
  processed_at timestamp NULL,
  next_attempt_at timestamp NULL,
	queue_index int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	
  CONSTRAINT call_queue_pk PRIMARY KEY (id)
);

CREATE INDEX ix_queue_items_item_status_next_attempt_at_created_at
  ON public.queue_items(item_status, next_attempt_at, created_at);