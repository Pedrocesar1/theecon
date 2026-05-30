-- Enums
create type public.content_status as enum ('draft', 'published');
create type public.geo_level as enum ('state', 'municipality');
create type public.classification_method as enum ('equal_intervals', 'jenks');

-- Columns table (editorial articles)
create table public.columns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  slug text not null unique,
  category text,
  cover_url text,
  content_html text,
  inline_assets jsonb not null default '[]'::jsonb,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index columns_status_published_at_idx
  on public.columns (status, published_at desc);
create index columns_slug_idx on public.columns (slug);

-- Indexes table (economic indices)
create table public.indexes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  methodology text,
  level public.geo_level not null,
  color_scheme text not null default 'viridis',
  n_classes int not null default 5 check (n_classes between 3 and 7),
  classification_method public.classification_method not null default 'equal_intervals',
  unit_label text default 'Indice 0-1',
  variables jsonb not null default '[]'::jsonb,
  data jsonb not null default '[]'::jsonb,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index indexes_status_published_at_idx
  on public.indexes (status, published_at desc);
create index indexes_slug_idx on public.indexes (slug);

-- Grants (PostgREST needs explicit grants)
grant select on public.columns to anon;
grant select, insert, update, delete on public.columns to authenticated;
grant all on public.columns to service_role;

grant select on public.indexes to anon;
grant select, insert, update, delete on public.indexes to authenticated;
grant all on public.indexes to service_role;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger columns_set_updated_at
before update on public.columns
for each row execute function public.set_updated_at();

create trigger indexes_set_updated_at
before update on public.indexes
for each row execute function public.set_updated_at();

-- RLS
alter table public.columns enable row level security;
alter table public.indexes enable row level security;

-- Columns policies
create policy "Anyone can read published columns"
on public.columns for select
to anon
using (status = 'published');

create policy "Authenticated can read all columns"
on public.columns for select
to authenticated
using (true);

create policy "Authenticated can insert columns"
on public.columns for insert
to authenticated
with check (true);

create policy "Authenticated can update columns"
on public.columns for update
to authenticated
using (true)
with check (true);

create policy "Authenticated can delete columns"
on public.columns for delete
to authenticated
using (true);

-- Indexes policies
create policy "Anyone can read published indexes"
on public.indexes for select
to anon
using (status = 'published');

create policy "Authenticated can read all indexes"
on public.indexes for select
to authenticated
using (true);

create policy "Authenticated can insert indexes"
on public.indexes for insert
to authenticated
with check (true);

create policy "Authenticated can update indexes"
on public.indexes for update
to authenticated
using (true)
with check (true);

create policy "Authenticated can delete indexes"
on public.indexes for delete
to authenticated
using (true);

-- Storage buckets
insert into storage.buckets (id, name, public) values
  ('covers', 'covers', true),
  ('inline-images', 'inline-images', true),
  ('geojson', 'geojson', true)
on conflict (id) do nothing;

-- Storage policies: public read, authenticated write/delete
create policy "Public read covers"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'covers');

create policy "Authenticated manage covers"
on storage.objects for all
to authenticated
using (bucket_id = 'covers')
with check (bucket_id = 'covers');

create policy "Public read inline-images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'inline-images');

create policy "Authenticated manage inline-images"
on storage.objects for all
to authenticated
using (bucket_id = 'inline-images')
with check (bucket_id = 'inline-images');

create policy "Public read geojson"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'geojson');

create policy "Authenticated manage geojson"
on storage.objects for all
to authenticated
using (bucket_id = 'geojson')
with check (bucket_id = 'geojson');
