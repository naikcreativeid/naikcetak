-- Jalankan di Supabase Dashboard → SQL Editor

create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  product_name  text,
  target_qty    integer,
  hpp           numeric,
  selling_price numeric,
  total_cost    numeric,
  margin        numeric,
  payload       jsonb,          -- seluruh data kalkulasi tersimpan di sini
  created_at    timestamptz default now()
);

-- Row Level Security: user hanya bisa akses data miliknya sendiri
alter table public.projects enable row level security;

create policy "Users can manage own projects"
  on public.projects
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Invoices Table ────────────────────────────────────────────────────────────

create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  invoice_number text,
  status         text default 'Pending',
  invoice_type   text default 'full',
  template       text default 'minimalis',
  theme_color    text,
  date           text,
  due_date       text,
  from_name      text,
  from_info      text,
  to_name        text,
  to_address     text,
  items          jsonb,
  tax            numeric default 0,
  discount       numeric default 0,
  notes          text,
  logo           text,
  subtotal       numeric,
  total          numeric,
  amount_due     numeric,
  created_at     timestamptz default now()
);

alter table public.invoices enable row level security;

create policy "Users can manage own invoices"
  on public.invoices
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
