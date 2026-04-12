CREATE TABLE public.item_change_log_summaries (
  "item_id"      int4        NOT NULL,
  "source"       text        NOT NULL,
  "bucket_start" timestamptz NOT NULL,
  "change_count" int4        NOT NULL,
  "sum_price"    int8        NOT NULL,
  "min_price"    int8        NOT NULL,
  "max_price"    int8        NOT NULL,

  CONSTRAINT item_change_log_summaries_pk
    PRIMARY KEY (item_id, source, bucket_start)
);

CREATE INDEX IF NOT EXISTS idx_icls_item_id      ON public.item_change_log_summaries (item_id);
CREATE INDEX IF NOT EXISTS idx_icls_bucket_start ON public.item_change_log_summaries (bucket_start);
