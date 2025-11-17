CREATE TABLE public.users (
	id int8 NOT NULL,
  api_key text NOT NULL,
  api_key_last_used timestamptz NULL,
	"name" text NOT NULL,
	"gender" text NOT NULL,
	
  CONSTRAINT users_pk PRIMARY KEY (id)
);