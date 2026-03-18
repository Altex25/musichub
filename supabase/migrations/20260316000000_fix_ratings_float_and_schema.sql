
-- 1. Change ratings.rating from smallint to float8 to support half-star ratings
ALTER TABLE public.ratings
    ALTER COLUMN rating TYPE float8 USING rating::float8;

-- 2. Update the CHECK constraint to allow 0.5 increments (0.5 to 5.0)
ALTER TABLE public.ratings
    DROP CONSTRAINT IF EXISTS ratings_rating_check;

ALTER TABLE public.ratings
    ADD CONSTRAINT ratings_rating_check CHECK (rating >= 0.5 AND rating <= 5);

-- 3. Update album_rating_stats: change rating_sum and rating_count to float8
--    to support fractional sums from decimal ratings
ALTER TABLE public.album_rating_stats
    ALTER COLUMN rating_sum TYPE float8 USING rating_sum::float8;

-- 4. Add missing columns to albums table to match production schema
ALTER TABLE public.albums
    ADD COLUMN IF NOT EXISTS artist text,
    ADD COLUMN IF NOT EXISTS source_id uuid;
