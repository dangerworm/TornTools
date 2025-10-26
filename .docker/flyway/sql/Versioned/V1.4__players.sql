CREATE TABLE public.players (
	id int8 NOT NULL,
	"name" text NOT NULL,
	"level" int4 NOT NULL,
	gender text NOT NULL,
	CONSTRAINT players_pk PRIMARY KEY (id)
);