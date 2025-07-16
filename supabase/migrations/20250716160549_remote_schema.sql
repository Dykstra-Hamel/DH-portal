drop trigger if exists "update_projects_updated_at" on "public"."projects";

drop policy "Only admins and requesters can delete projects" on "public"."projects";

drop policy "Users can create projects for their companies or admins can cre" on "public"."projects";

drop policy "Users can update projects they have permission for" on "public"."projects";

drop policy "Users can view projects they have access to" on "public"."projects";

revoke delete on table "public"."projects" from "anon";

revoke insert on table "public"."projects" from "anon";

revoke references on table "public"."projects" from "anon";

revoke select on table "public"."projects" from "anon";

revoke trigger on table "public"."projects" from "anon";

revoke truncate on table "public"."projects" from "anon";

revoke update on table "public"."projects" from "anon";

revoke delete on table "public"."projects" from "authenticated";

revoke insert on table "public"."projects" from "authenticated";

revoke references on table "public"."projects" from "authenticated";

revoke select on table "public"."projects" from "authenticated";

revoke trigger on table "public"."projects" from "authenticated";

revoke truncate on table "public"."projects" from "authenticated";

revoke update on table "public"."projects" from "authenticated";

revoke delete on table "public"."projects" from "service_role";

revoke insert on table "public"."projects" from "service_role";

revoke references on table "public"."projects" from "service_role";

revoke select on table "public"."projects" from "service_role";

revoke trigger on table "public"."projects" from "service_role";

revoke truncate on table "public"."projects" from "service_role";

revoke update on table "public"."projects" from "service_role";

alter table "public"."projects" drop constraint "projects_assigned_to_fkey";

alter table "public"."projects" drop constraint "projects_company_id_fkey";

alter table "public"."projects" drop constraint "projects_dates_check";

alter table "public"."projects" drop constraint "projects_priority_check";

alter table "public"."projects" drop constraint "projects_requested_by_fkey";

alter table "public"."projects" drop constraint "projects_status_check";

alter table "public"."projects" drop constraint "projects_pkey";

drop index if exists "public"."idx_projects_assigned_status";

drop index if exists "public"."idx_projects_assigned_to";

drop index if exists "public"."idx_projects_attachments";

drop index if exists "public"."idx_projects_company_due_date";

drop index if exists "public"."idx_projects_company_id";

drop index if exists "public"."idx_projects_company_status";

drop index if exists "public"."idx_projects_created_at";

drop index if exists "public"."idx_projects_due_date";

drop index if exists "public"."idx_projects_priority";

drop index if exists "public"."idx_projects_project_type";

drop index if exists "public"."idx_projects_requested_by";

drop index if exists "public"."idx_projects_status";

drop index if exists "public"."idx_projects_tags";

drop index if exists "public"."projects_pkey";

-- Drop storage policies that depend on the projects table
drop policy if exists "Users can view project files they have access to" on "storage"."objects";
drop policy if exists "Users can upload project files for their companies" on "storage"."objects";
drop policy if exists "Users can update project files they have access to" on "storage"."objects";
drop policy if exists "Users can delete project files they have access to" on "storage"."objects";

drop table "public"."projects";

create table "public"."roles" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


alter table "public"."roles" enable row level security;

create table "public"."users_roles" (
    "id" uuid not null default gen_random_uuid(),
    "role_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


alter table "public"."users_roles" enable row level security;

CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id);

CREATE UNIQUE INDEX users_roles_pkey ON public.users_roles USING btree (id);

CREATE INDEX users_roles_role_id_idx ON public.users_roles USING btree (role_id);

CREATE INDEX users_roles_user_id_idx ON public.users_roles USING btree (user_id);

alter table "public"."roles" add constraint "roles_pkey" PRIMARY KEY using index "roles_pkey";

alter table "public"."users_roles" add constraint "users_roles_pkey" PRIMARY KEY using index "users_roles_pkey";

alter table "public"."users_roles" add constraint "users_roles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE not valid;

alter table "public"."users_roles" validate constraint "users_roles_role_id_fkey";

alter table "public"."users_roles" add constraint "users_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users_roles" validate constraint "users_roles_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_complete_schema()
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    result jsonb;
BEGIN
    -- Get all enums
    WITH enum_types AS (
        SELECT 
            t.typname as enum_name,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        GROUP BY t.typname
    )
    SELECT jsonb_build_object(
        'enums',
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'name', enum_name,
                    'values', to_jsonb(enum_values)
                )
            ),
            '[]'::jsonb
        )
    )
    FROM enum_types
    INTO result;

    -- Get all tables with their details
    WITH RECURSIVE 
    columns_info AS (
        SELECT 
            c.oid as table_oid,
            c.relname as table_name,
            a.attname as column_name,
            format_type(a.atttypid, a.atttypmod) as column_type,
            a.attnotnull as notnull,
            pg_get_expr(d.adbin, d.adrelid) as column_default,
            CASE 
                WHEN a.attidentity != '' THEN true
                WHEN pg_get_expr(d.adbin, d.adrelid) LIKE 'nextval%' THEN true
                ELSE false
            END as is_identity,
            EXISTS (
                SELECT 1 FROM pg_constraint con 
                WHERE con.conrelid = c.oid 
                AND con.contype = 'p' 
                AND a.attnum = ANY(con.conkey)
            ) as is_pk
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_attribute a ON a.attrelid = c.oid
        LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
        WHERE n.nspname = 'public' 
        AND c.relkind = 'r'
        AND a.attnum > 0 
        AND NOT a.attisdropped
    ),
    fk_info AS (
        SELECT 
            c.oid as table_oid,
            jsonb_agg(
                jsonb_build_object(
                    'name', con.conname,
                    'column', col.attname,
                    'foreign_schema', fs.nspname,
                    'foreign_table', ft.relname,
                    'foreign_column', fcol.attname,
                    'on_delete', CASE con.confdeltype
                        WHEN 'a' THEN 'NO ACTION'
                        WHEN 'c' THEN 'CASCADE'
                        WHEN 'r' THEN 'RESTRICT'
                        WHEN 'n' THEN 'SET NULL'
                        WHEN 'd' THEN 'SET DEFAULT'
                        ELSE NULL
                    END
                )
            ) as foreign_keys
        FROM pg_class c
        JOIN pg_constraint con ON con.conrelid = c.oid
        JOIN pg_attribute col ON col.attrelid = con.conrelid AND col.attnum = ANY(con.conkey)
        JOIN pg_class ft ON ft.oid = con.confrelid
        JOIN pg_namespace fs ON fs.oid = ft.relnamespace
        JOIN pg_attribute fcol ON fcol.attrelid = con.confrelid AND fcol.attnum = ANY(con.confkey)
        WHERE con.contype = 'f'
        GROUP BY c.oid
    ),
    index_info AS (
        SELECT 
            c.oid as table_oid,
            jsonb_agg(
                jsonb_build_object(
                    'name', i.relname,
                    'using', am.amname,
                    'columns', (
                        SELECT jsonb_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum))
                        FROM unnest(ix.indkey) WITH ORDINALITY as u(attnum, ord)
                        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = u.attnum
                    )
                )
            ) as indexes
        FROM pg_class c
        JOIN pg_index ix ON ix.indrelid = c.oid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_am am ON am.oid = i.relam
        WHERE NOT ix.indisprimary
        GROUP BY c.oid
    ),
    policy_info AS (
        SELECT 
            c.oid as table_oid,
            jsonb_agg(
                jsonb_build_object(
                    'name', pol.polname,
                    'command', CASE pol.polcmd
                        WHEN 'r' THEN 'SELECT'
                        WHEN 'a' THEN 'INSERT'
                        WHEN 'w' THEN 'UPDATE'
                        WHEN 'd' THEN 'DELETE'
                        WHEN '*' THEN 'ALL'
                    END,
                    'roles', (
                        SELECT string_agg(quote_ident(r.rolname), ', ')
                        FROM pg_roles r
                        WHERE r.oid = ANY(pol.polroles)
                    ),
                    'using', pg_get_expr(pol.polqual, pol.polrelid),
                    'check', pg_get_expr(pol.polwithcheck, pol.polrelid)
                )
            ) as policies
        FROM pg_class c
        JOIN pg_policy pol ON pol.polrelid = c.oid
        GROUP BY c.oid
    ),
    trigger_info AS (
        SELECT 
            c.oid as table_oid,
            jsonb_agg(
                jsonb_build_object(
                    'name', t.tgname,
                    'timing', CASE 
                        WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
                        WHEN t.tgtype & 4 = 4 THEN 'AFTER'
                        WHEN t.tgtype & 64 = 64 THEN 'INSTEAD OF'
                    END,
                    'events', (
                        CASE WHEN t.tgtype & 1 = 1 THEN 'INSERT'
                             WHEN t.tgtype & 8 = 8 THEN 'DELETE'
                             WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
                             WHEN t.tgtype & 32 = 32 THEN 'TRUNCATE'
                        END
                    ),
                    'statement', pg_get_triggerdef(t.oid)
                )
            ) as triggers
        FROM pg_class c
        JOIN pg_trigger t ON t.tgrelid = c.oid
        WHERE NOT t.tgisinternal
        GROUP BY c.oid
    ),
    table_info AS (
        SELECT DISTINCT 
            c.table_oid,
            c.table_name,
            jsonb_agg(
                jsonb_build_object(
                    'name', c.column_name,
                    'type', c.column_type,
                    'notnull', c.notnull,
                    'default', c.column_default,
                    'identity', c.is_identity,
                    'is_pk', c.is_pk
                ) ORDER BY c.column_name
            ) as columns,
            COALESCE(fk.foreign_keys, '[]'::jsonb) as foreign_keys,
            COALESCE(i.indexes, '[]'::jsonb) as indexes,
            COALESCE(p.policies, '[]'::jsonb) as policies,
            COALESCE(t.triggers, '[]'::jsonb) as triggers
        FROM columns_info c
        LEFT JOIN fk_info fk ON fk.table_oid = c.table_oid
        LEFT JOIN index_info i ON i.table_oid = c.table_oid
        LEFT JOIN policy_info p ON p.table_oid = c.table_oid
        LEFT JOIN trigger_info t ON t.table_oid = c.table_oid
        GROUP BY c.table_oid, c.table_name, fk.foreign_keys, i.indexes, p.policies, t.triggers
    )
    SELECT result || jsonb_build_object(
        'tables',
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'name', table_name,
                    'columns', columns,
                    'foreign_keys', foreign_keys,
                    'indexes', indexes,
                    'policies', policies,
                    'triggers', triggers
                )
            ),
            '[]'::jsonb
        )
    )
    FROM table_info
    INTO result;

    -- Get all functions
    WITH function_info AS (
        SELECT 
            p.proname AS name,
            pg_get_functiondef(p.oid) AS definition
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'
    )
    SELECT result || jsonb_build_object(
        'functions',
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'name', name,
                    'definition', definition
                )
            ),
            '[]'::jsonb
        )
    )
    FROM function_info
    INTO result;

    RETURN result;
END;
$function$
;

grant delete on table "public"."roles" to "anon";

grant insert on table "public"."roles" to "anon";

grant references on table "public"."roles" to "anon";

grant select on table "public"."roles" to "anon";

grant trigger on table "public"."roles" to "anon";

grant truncate on table "public"."roles" to "anon";

grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";

grant insert on table "public"."roles" to "authenticated";

grant references on table "public"."roles" to "authenticated";

grant select on table "public"."roles" to "authenticated";

grant trigger on table "public"."roles" to "authenticated";

grant truncate on table "public"."roles" to "authenticated";

grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."roles" to "service_role";

grant insert on table "public"."roles" to "service_role";

grant references on table "public"."roles" to "service_role";

grant select on table "public"."roles" to "service_role";

grant trigger on table "public"."roles" to "service_role";

grant truncate on table "public"."roles" to "service_role";

grant update on table "public"."roles" to "service_role";

grant delete on table "public"."users_roles" to "anon";

grant insert on table "public"."users_roles" to "anon";

grant references on table "public"."users_roles" to "anon";

grant select on table "public"."users_roles" to "anon";

grant trigger on table "public"."users_roles" to "anon";

grant truncate on table "public"."users_roles" to "anon";

grant update on table "public"."users_roles" to "anon";

grant delete on table "public"."users_roles" to "authenticated";

grant insert on table "public"."users_roles" to "authenticated";

grant references on table "public"."users_roles" to "authenticated";

grant select on table "public"."users_roles" to "authenticated";

grant trigger on table "public"."users_roles" to "authenticated";

grant truncate on table "public"."users_roles" to "authenticated";

grant update on table "public"."users_roles" to "authenticated";

grant delete on table "public"."users_roles" to "service_role";

grant insert on table "public"."users_roles" to "service_role";

grant references on table "public"."users_roles" to "service_role";

grant select on table "public"."users_roles" to "service_role";

grant trigger on table "public"."users_roles" to "service_role";

grant truncate on table "public"."users_roles" to "service_role";

grant update on table "public"."users_roles" to "service_role";

create policy "Public can view roles"
on "public"."roles"
as permissive
for select
to authenticated, anon
using (true);


create policy "Service role can delete roles"
on "public"."roles"
as permissive
for delete
to service_role
using (true);


create policy "Service role can insert roles"
on "public"."roles"
as permissive
for insert
to service_role
with check (true);


create policy "Service role can update roles"
on "public"."roles"
as permissive
for update
to service_role
using (true)
with check (true);


create policy "Public can view users_roles"
on "public"."users_roles"
as permissive
for select
to authenticated, anon
using (true);


create policy "Service role can delete users_roles"
on "public"."users_roles"
as permissive
for delete
to service_role
using (true);


create policy "Service role can insert users_roles"
on "public"."users_roles"
as permissive
for insert
to service_role
with check (true);


create policy "Service role can update users_roles"
on "public"."users_roles"
as permissive
for update
to service_role
using (true)
with check (true);



