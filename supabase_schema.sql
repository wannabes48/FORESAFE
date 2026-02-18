-- Create the tags table
create table public.tags (
  tag_id text primary key,
  whatsapp_number text,
  is_registered boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.tags enable row level security;

-- Create policies

-- 1. Allow public read access to tags (needed for scanning and registration checking)
create policy "Allow public read access"
on public.tags
for select
to public
using (true);

-- 2. Allow public update access only if the tag is not registered yet (for registration)
-- This allows anyone to claim an unclaimed tag.
create policy "Allow public registration of unclaimed tags"
on public.tags
for update
to public
using (is_registered = false)
with check (is_registered = true);

-- 3. Allow service_role to manage all tags (for admin import)
-- Note: service_role bypasses RLS by default, but explicit policy can be good documentation.
-- No explicit policy needed for service_role usually if not restrictive.

-- Create an index on tag_id for faster lookups (though primary key is already indexed)
-- create index tags_tag_id_idx on public.tags (tag_id);
