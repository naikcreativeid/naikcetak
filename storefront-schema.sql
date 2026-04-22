-- Mini Halaman Order Publik / Toko Saya
-- Jalankan di Supabase SQL Editor

alter table public.user_profiles
  add column if not exists store_slug varchar(60) unique,
  add column if not exists store_name varchar(200),
  add column if not exists store_tagline varchar(300),
  add column if not exists store_city varchar(100),
  add column if not exists store_whatsapp varchar(20),
  add column if not exists store_logo_url text,
  add column if not exists store_cover_url text,
  add column if not exists store_is_active boolean default true,
  add column if not exists store_instagram varchar(100),
  add column if not exists store_description text;

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(200) not null,
  category varchar(100),
  description text,
  min_price integer,
  max_price integer,
  min_order integer default 1,
  unit varchar(30) default 'pcs',
  lead_time_days integer default 3,
  is_available boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  store_user_id uuid not null references auth.users(id) on delete cascade,
  store_slug varchar(60) not null,
  client_name varchar(200) not null,
  client_phone varchar(20) not null,
  client_email varchar(200),
  product_name varchar(200) not null,
  quantity integer not null,
  unit varchar(30) default 'pcs',
  size varchar(100),
  finishing varchar(200),
  notes text,
  reference_image_url text,
  status varchar(30) default 'pending'
    check (status in ('pending', 'reviewed', 'accepted', 'rejected', 'in_progress', 'done')),
  admin_notes text,
  estimated_price integer,
  quoted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_store_products_user_id on public.store_products(user_id);
create index if not exists idx_store_orders_store_user_id on public.store_orders(store_user_id);
create index if not exists idx_store_orders_store_slug on public.store_orders(store_slug);
create index if not exists idx_user_profiles_store_slug on public.user_profiles(store_slug);

alter table public.store_products enable row level security;
alter table public.store_orders enable row level security;

drop policy if exists "Owner manages own products" on public.store_products;
create policy "Owner manages own products"
  on public.store_products
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Owner manages own store orders" on public.store_orders;
create policy "Owner manages own store orders"
  on public.store_orders
  for all
  to authenticated
  using (auth.uid() = store_user_id)
  with check (auth.uid() = store_user_id);

drop policy if exists "Public can create store orders" on public.store_orders;
create policy "Public can create store orders"
  on public.store_orders
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and exists (
      select 1
      from public.user_profiles up
      where up.id = store_user_id
        and up.store_slug = store_slug
        and coalesce(up.store_is_active, true) = true
    )
  );

drop function if exists public.generate_store_slug(text, uuid);
create function public.generate_store_slug(p_store_name text, p_user_id uuid)
returns text
language plpgsql
as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  base_slug := lower(regexp_replace(regexp_replace(coalesce(p_store_name, ''), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := trim(both '-' from left(base_slug, 50));
  if base_slug = '' then
    base_slug := 'toko-cetak';
  end if;

  final_slug := base_slug;

  while exists (
    select 1
    from public.user_profiles
    where store_slug = final_slug
      and id <> p_user_id
  ) loop
    counter := counter + 1;
    final_slug := left(base_slug, greatest(1, 57 - length(counter::text))) || '-' || counter;
  end loop;

  return final_slug;
end;
$$;

create or replace view public.public_store_profiles as
select
  id,
  store_slug,
  store_name,
  store_tagline,
  store_city,
  store_whatsapp,
  store_logo_url,
  store_cover_url,
  store_description,
  store_instagram,
  store_is_active
from public.user_profiles
where store_slug is not null
  and coalesce(store_is_active, true) = true;

grant select on public.public_store_profiles to anon, authenticated;

create or replace view public.public_store_products as
select
  sp.id,
  up.id as store_user_id,
  up.store_slug,
  sp.name,
  sp.category,
  sp.description,
  sp.min_price,
  sp.max_price,
  sp.min_order,
  sp.unit,
  sp.lead_time_days,
  sp.sort_order
from public.store_products sp
join public.user_profiles up on up.id = sp.user_id
where sp.is_available = true
  and up.store_slug is not null
  and coalesce(up.store_is_active, true) = true;

grant select on public.public_store_products to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Store assets are publicly readable" on storage.objects;
create policy "Store assets are publicly readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'store-assets');

drop policy if exists "Authenticated users upload own store assets" on storage.objects;
create policy "Authenticated users upload own store assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'store-assets'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Authenticated users update own store assets" on storage.objects;
create policy "Authenticated users update own store assets"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'store-assets'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'store-assets'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Authenticated users delete own store assets" on storage.objects;
create policy "Authenticated users delete own store assets"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'store-assets'
    and split_part(name, '/', 1) = auth.uid()::text
  );
