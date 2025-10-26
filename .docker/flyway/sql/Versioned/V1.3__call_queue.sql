CREATE TABLE public.call_queue (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	call_type int4 NOT NULL,
	url text NOT NULL,
	created timestamp NOT NULL,
	queue_index int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	CONSTRAINT call_queue_pk PRIMARY KEY (id)
);