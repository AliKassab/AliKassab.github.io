-- Run against a database with the migration applied. All test rows roll back.
begin;
set local role anon;
insert into public.perspectives (category, question, response) values ('Narrative', 'Test question', 'Anonymous security test');
do $$
begin
    begin
        perform * from public.perspectives;
        raise exception 'SELECT unexpectedly allowed';
    exception when insufficient_privilege then null; end;
    begin
        update public.perspectives set response = 'Changed';
        raise exception 'UPDATE unexpectedly allowed';
    exception when insufficient_privilege then null; end;
    begin
        delete from public.perspectives;
        raise exception 'DELETE unexpectedly allowed';
    exception when insufficient_privilege then null; end;
    begin
        insert into public.perspectives (category, question, response, approved) values ('Narrative', 'Q', 'R', true);
        raise exception 'approved unexpectedly allowed';
    exception when insufficient_privilege then null; end;
    begin
        insert into public.perspectives (category, question, response, featured) values ('Narrative', 'Q', 'R', true);
        raise exception 'featured unexpectedly allowed';
    exception when insufficient_privilege then null; end;
    begin
        insert into public.perspectives (category, question, response) values ('Narrative', 'Q', E' \t\n');
        raise exception 'Whitespace unexpectedly allowed';
    exception when check_violation then null; end;
    begin
        insert into public.perspectives (category, question, response) values ('Narrative', 'Q', repeat('a', 5001));
        raise exception 'Overlength unexpectedly allowed';
    exception when check_violation then null; end;
end $$;
reset role;
do $$ begin
    if not exists (select 1 from public.perspectives where response = 'Anonymous security test' and not approved and not featured and id is not null and created_at is not null) then
        raise exception 'Defaults did not apply';
    end if;
end $$;
-- Verify the RLS check independently of column grants (temporary, rolled back).
grant insert (approved, featured) on public.perspectives to anon;
set local role anon;
do $$ begin
    begin
        insert into public.perspectives (category, question, response, approved) values ('Narrative', 'Q', 'R', true);
        raise exception 'RLS approved check unexpectedly allowed';
    exception when insufficient_privilege then null; end;
    begin
        insert into public.perspectives (category, question, response, featured) values ('Narrative', 'Q', 'R', true);
        raise exception 'RLS featured check unexpectedly allowed';
    exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
