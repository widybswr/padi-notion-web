-- ==============================================================================
-- Schema for Notion Clone (PaDi Design - Q4 2026 Tasks)
-- Target: Supabase (PostgreSQL)
-- ==============================================================================

-- Drop existing table if needed
drop table if exists tasks cascade;

-- Create tasks table
create table tasks (
    id text primary key,
    title text not null,
    status text not null default 'Not started',
    priority text not null default 'Medium',
    quarter text not null default 'Q4 2026',
    wbs text default '',
    squads text[] default array[]::text[],
    pms text[] default array[]::text[],
    assignees text[] default array[]::text[],
    start_date date,
    end_date date,
    figma_url text default '',
    prd_url text default '',
    taiga_url text default '',
    userflow_url text default '',
    other_docs text default '',
    description text default '',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Helpful indexes for filtering & search
create index idx_tasks_status on tasks(status);
create index idx_tasks_priority on tasks(priority);
create index idx_tasks_wbs on tasks(wbs);
create index idx_tasks_assignees on tasks using gin(assignees);
create index idx_tasks_squads on tasks using gin(squads);
create index idx_tasks_created_at on tasks(created_at desc);

-- Automatically update updated_at on change
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger trigger_tasks_updated_at
    before update on tasks
    for each row
    execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table tasks enable row level security;

-- Policy 1: Anyone can read tasks (perfect for public / team read-only or dashboard)
create policy "Allow public read access"
    on tasks for select
    using (true);

-- Policy 2: Allow insert/update/delete (anon key or authenticated user)
-- For production restricted editing, replace with `to authenticated`
create policy "Allow public write access"
    on tasks for all
    using (true)
    with check (true);
