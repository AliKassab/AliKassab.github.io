begin;

create table public.perspectives (
    id uuid primary key default gen_random_uuid(),
    category text not null,
    question text not null,
    response text not null,
    created_at timestamptz not null default now(),
    approved boolean not null default false,
    featured boolean not null default false,
    constraint perspectives_response_length check (
        char_length(response) between 1 and 5000
        and response ~ '[^[:space:]]'
    ),
    constraint perspectives_question_length check (char_length(question) between 1 and 500),
    constraint perspectives_category check (category in (
        'Narrative', 'Mechanics', 'World Building', 'Technology serving the design'
    ))
);

alter table public.perspectives enable row level security;
-- Remove default broad grants, including authenticated clients and PUBLIC.
revoke all on public.perspectives from public, anon, authenticated;
-- Clients cannot supply IDs, timestamps, or moderation flags at all.
grant insert (category, question, response) on public.perspectives to anon;
create policy anonymous_insert_only on public.perspectives
    for insert to anon
    with check (approved = false and featured = false);
-- No SELECT, UPDATE, or DELETE policies. Dashboard administration uses privileged roles.
grant all on public.perspectives to service_role;
create index perspectives_created_at_idx on public.perspectives (created_at desc);

commit;
