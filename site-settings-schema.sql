-- Pengaturan SEO Metadata Website Global
-- Jalankan di Supabase SQL Editor

create table if not exists public.site_settings (
  id text primary key default 'global',
  site_title text,
  meta_description text,
  meta_image_url text,
  favicon_url text,
  loading_logo_url text,
  disable_crawler boolean default false,
  disable_right_click boolean default false,
  updated_at timestamptz default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
  on public.site_settings
  for all
  to authenticated
  using (
    auth.jwt() ->> 'email' in (
      'desaingracious3@gmail.com'
    )
  )
  with check (
    auth.jwt() ->> 'email' in (
      'desaingracious3@gmail.com'
    )
  );

insert into public.site_settings (
  id,
  site_title,
  meta_description,
  disable_crawler,
  disable_right_click
)
values (
  'global',
  'naikcetak — HPP & ERP Kemasan',
  'Hitung biaya cetak 10x lebih cepat. Kalkulator potong kertas, HPP, invoice, quotation, tracking order, dan AI assistant untuk percetakan Indonesia.',
  false,
  false
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Site assets public read" on storage.objects;
create policy "Site assets public read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'site-assets');

drop policy if exists "Admins upload site assets" on storage.objects;
create policy "Admins upload site assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'site-assets'
    and split_part(name, '/', 1) = auth.uid()::text
    and auth.jwt() ->> 'email' in (
      'desaingracious3@gmail.com'
    )
  );

drop policy if exists "Admins update site assets" on storage.objects;
create policy "Admins update site assets"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'site-assets'
    and split_part(name, '/', 1) = auth.uid()::text
    and auth.jwt() ->> 'email' in (
      'desaingracious3@gmail.com'
    )
  )
  with check (
    bucket_id = 'site-assets'
    and split_part(name, '/', 1) = auth.uid()::text
    and auth.jwt() ->> 'email' in (
      'desaingracious3@gmail.com'
    )
  );

drop policy if exists "Admins delete site assets" on storage.objects;
create policy "Admins delete site assets"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'site-assets'
    and split_part(name, '/', 1) = auth.uid()::text
    and auth.jwt() ->> 'email' in (
      'desaingracious3@gmail.com'
    )
  );
