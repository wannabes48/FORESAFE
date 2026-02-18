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


-- Create profiles to handle user roles
create table public.profiles (
  id uuid references auth.users not null primary key,
  role text not null default 'user',
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Secure the tags table for admins
-- Add policy to allow admins full access to tags
create policy "Admins can view all tags"
  on public.tags
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

