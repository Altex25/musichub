-- ============================================================================
-- Migration: init schema (tables only)
-- ============================================================================

-- Extensions utiles pour UUID
create extension if not exists pgcrypto;

-- =========================
-- TABLE: profiles
-- =========================
create table if not exists public.profiles (
                                               user_id uuid primary key,
                                               username text not null unique
);

-- =========================
-- TABLE: albums
-- =========================
create table if not exists public.albums (
                                             id uuid primary key default gen_random_uuid(),
    source text not null,
    source_id uuid not null,
    title text not null,
    primary_artist_name text not null,
    first_release_date date not null,
    cover_url text not null,
    raw jsonb,
    created_at timestamptz not null default now(),
    constraint albums_source_source_id_key unique (source, source_id)
    );

-- =========================
-- TABLE: ratings
-- =========================
create table if not exists public.ratings (
                                              id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    album_id uuid not null,
    rating smallint not null check (rating between 1 and 5),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint ratings_user_id_fkey
    foreign key (user_id) references public.profiles(user_id) on delete cascade,

    constraint ratings_album_id_fkey
    foreign key (album_id) references public.albums(id) on delete cascade,

    constraint ratings_user_album_unique unique (user_id, album_id)
    );

-- =========================
-- TABLE: reviews
-- =========================
create table if not exists public.reviews (
                                              id uuid primary key default gen_random_uuid(),
    rating_id uuid not null,
    user_id uuid not null,
    album_id uuid not null,
    context text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint reviews_rating_id_fkey
    foreign key (rating_id) references public.ratings(id) on delete cascade,

    constraint reviews_user_id_fkey
    foreign key (user_id) references public.profiles(user_id) on delete cascade,

    constraint reviews_album_id_fkey
    foreign key (album_id) references public.albums(id) on delete cascade
    );

-- =========================
-- TABLE: album_rating_stats
-- =========================
create table if not exists public.album_rating_stats (
                                                         album_id uuid primary key,
                                                         rating_count int not null default 0,
                                                         rating_sum int not null default 0,
                                                         rating_avg double precision not null default 0,
                                                         updated_at timestamptz not null default now(),

    constraint album_rating_stats_album_id_fkey
    foreign key (album_id) references public.albums(id) on delete cascade
    );

-- =========================
-- INDEXES
-- =========================
create index if not exists idx_ratings_album_id on public.ratings(album_id);
create index if not exists idx_ratings_user_id on public.ratings(user_id);
create index if not exists idx_reviews_album_id on public.reviews(album_id);
create index if not exists idx_reviews_user_id on public.reviews(user_id);
create index if not exists idx_reviews_rating_id on public.reviews(rating_id);