


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."contact_method" AS ENUM (
    'phone',
    'email',
    'whatsapp',
    'sms'
);


ALTER TYPE "public"."contact_method" OWNER TO "postgres";


CREATE TYPE "public"."currency" AS ENUM (
    'CLP',
    'USD'
);


ALTER TYPE "public"."currency" OWNER TO "postgres";


CREATE TYPE "public"."member_status" AS ENUM (
    'invited',
    'active',
    'removed'
);


ALTER TYPE "public"."member_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'property_expiring',
    'property_expired',
    'new_favorite',
    'price_change',
    'new_message',
    'payment_success',
    'payment_failed',
    'listing_approved',
    'listing_rejected'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."org_role" AS ENUM (
    'owner',
    'admin',
    'agent'
);


ALTER TYPE "public"."org_role" OWNER TO "postgres";


CREATE TYPE "public"."org_type" AS ENUM (
    'brokerage',
    'company'
);


ALTER TYPE "public"."org_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."property_operation" AS ENUM (
    'sale',
    'rent'
);


ALTER TYPE "public"."property_operation" OWNER TO "postgres";


CREATE TYPE "public"."property_status" AS ENUM (
    'active',
    'expired',
    'sold',
    'rented',
    'pending_review',
    'rejected'
);


ALTER TYPE "public"."property_status" OWNER TO "postgres";


CREATE TYPE "public"."property_type" AS ENUM (
    'house',
    'apartment',
    'land',
    'office',
    'commercial',
    'warehouse'
);


ALTER TYPE "public"."property_type" OWNER TO "postgres";


CREATE TYPE "public"."review_status" AS ENUM (
    'published',
    'flagged',
    'removed'
);


ALTER TYPE "public"."review_status" OWNER TO "postgres";


CREATE TYPE "public"."subscription_type" AS ENUM (
    'free',
    'premium'
);


ALTER TYPE "public"."subscription_type" OWNER TO "postgres";


CREATE TYPE "public"."user_type" AS ENUM (
    'individual',
    'agent',
    'company'
);


ALTER TYPE "public"."user_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_pending_invites"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_email text;
  v_user_id uuid := auth.uid();
begin
  select email into v_email from public.profiles where id = v_user_id;
  if v_email is null then
    return;
  end if;

  insert into public.organization_members (org_id, user_id, role, status)
  select i.org_id, v_user_id, i.role, 'active'
  from public.org_invites i
  where lower(i.email) = lower(v_email)
    and i.status = 'pending'
    and i.expires_at > now()
  on conflict (org_id, user_id)
  do update set role = excluded.role, status = 'active';

  update public.org_invites set status = 'accepted'
  where lower(email) = lower(v_email) and status = 'pending';
end $$;


ALTER FUNCTION "public"."accept_pending_invites"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_users"("search_term" "text" DEFAULT ''::"text") RETURNS TABLE("id" "uuid", "email" "text", "name" "text", "user_type" "text", "platform_role" "text", "company_name" "text", "license_number" "text", "is_email_verified" boolean, "is_phone_verified" boolean, "created_at" timestamp with time zone, "total_listings" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;
  return query
    select p.id,
           p.email::text,
           p.name::text,
           p.user_type::text,
           p.platform_role::text,
           p.company_name::text,
           p.license_number::text,
           p.is_email_verified::boolean,
           p.is_phone_verified::boolean,
           p.created_at,
           p.total_listings::bigint
    from public.profiles p
    where search_term = ''
       or p.email ilike '%' || search_term || '%'
       or p.name  ilike '%' || search_term || '%'
    order by p.created_at desc
    limit 200;
end;
$$;


ALTER FUNCTION "public"."admin_list_users"("search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_platform_role"("target_user_id" "uuid", "new_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;
  if new_role not in ('user', 'superadmin') then
    raise exception 'Rol inválido';
  end if;
  update public.profiles
     set platform_role = new_role, updated_at = now()
   where id = target_user_id;
end;
$$;


ALTER FUNCTION "public"."admin_set_platform_role"("target_user_id" "uuid", "new_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_review_status"("review_id" "uuid", "new_status" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;
  if new_status not in ('published', 'flagged', 'removed') then
    raise exception 'Estado inválido';
  end if;
  update public.reviews set status = new_status, updated_at = now() where id = review_id;
end;
$$;


ALTER FUNCTION "public"."admin_set_review_status"("review_id" "uuid", "new_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_toggle_verified"("target_user_id" "uuid", "field" "text", "value" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;
  if field = 'is_email_verified' then
    update public.profiles set is_email_verified = value, updated_at = now()
     where id = target_user_id;
  elsif field = 'is_phone_verified' then
    update public.profiles set is_phone_verified = value, updated_at = now()
     where id = target_user_id;
  else
    raise exception 'Campo inválido';
  end if;
end;
$$;


ALTER FUNCTION "public"."admin_toggle_verified"("target_user_id" "uuid", "field" "text", "value" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_user_publish"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Premium subscription active
  IF v_profile.subscription_type = 'premium'
     AND v_profile.subscription_expires_at > NOW() THEN
    RETURN TRUE;
  END IF;

  -- Trial period active (10 days)
  IF v_profile.trial_expires_at > NOW() THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."can_user_publish"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_org_invite"("inv_org_id" "uuid", "inv_email" "text", "inv_role" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  actor_role text;
  gen_token text := encode(gen_random_bytes(24), 'hex');
begin
  select m.role::text into actor_role
  from public.organization_members m
  where m.org_id = inv_org_id
    and m.user_id = auth.uid()
    and m.status = 'active';

  if actor_role is null or actor_role not in ('owner','admin') then
    raise exception 'No autorizado para invitar';
  end if;
  if inv_role not in ('admin','agent') then
    raise exception 'Rol inválido';
  end if;
  if actor_role = 'admin' and inv_role = 'admin' then
    raise exception 'Un admin solo puede invitar agentes';
  end if;

  insert into public.org_invites (org_id, email, role, token, created_by, expires_at)
  values (inv_org_id, lower(inv_email), inv_role::public.org_role, gen_token, auth.uid(), now() + interval '7 days');

  return gen_token;
end $$;


ALTER FUNCTION "public"."create_org_invite"("inv_org_id" "uuid", "inv_email" "text", "inv_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_review_subject_is_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  owner_of uuid;
begin
  if new.property_id is not null then
    select p.owner_id into owner_of
      from public.properties p
     where p.id = new.property_id;
    if owner_of is null then
      raise exception 'Propiedad no encontrada';
    end if;
    if new.subject_id <> owner_of then
      raise exception 'Solo se puede reseñar al dueño de la propiedad';
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_review_subject_is_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_stale_listings"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  expired_count INT;
BEGIN
  UPDATE properties
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;


ALTER FUNCTION "public"."expire_stale_listings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_user_for_org"("search_email" "text") RETURNS TABLE("id" "uuid", "name" "text", "email" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not (public.is_superadmin() or public.is_org_admin_any()) then
    raise exception 'No autorizado';
  end if;

  return query
    select p.id, p.name, p.email
    from public.profiles p
    where lower(p.email) = lower(search_email)
    limit 1;
end;
$$;


ALTER FUNCTION "public"."find_user_for_org"("search_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_global_views"("days" integer DEFAULT 30) RETURNS TABLE("day" "date", "count" bigint)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select
    created_at::date as day,
    count(*) as count
  from public.property_views
  where created_at >= now() - make_interval(days => days)
  group by created_at::date
  order by day;
$$;


ALTER FUNCTION "public"."get_global_views"("days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_org_members"("org_id" "uuid") RETURNS TABLE("user_id" "uuid", "name" "text", "email" "text", "role" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not (public.is_superadmin() or public.is_org_admin(org_id)) then
    raise exception 'No autorizado';
  end if;
  return query
    select m.user_id, p.name::text, p.email::text, m.role::text
    from public.organization_members m
    join public.profiles p on p.id = m.user_id
    where m.org_id = get_org_members.org_id
      and m.status = 'active'
    order by p.name;
end;
$$;


ALTER FUNCTION "public"."get_org_members"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_org_views"("org_id" "uuid", "days" integer DEFAULT 30) RETURNS TABLE("day" "date", "count" bigint)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select
    pv.created_at::date as day,
    count(*) as count
  from public.property_views pv
  join public.properties p on p.id = pv.property_id
  where p.organization_id = get_org_views.org_id
    and pv.created_at >= now() - make_interval(days => days)
  group by pv.created_at::date
  order by day;
$$;


ALTER FUNCTION "public"."get_org_views"("org_id" "uuid", "days" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "avatar_url" "text",
    "user_type" "public"."user_type" DEFAULT 'individual'::"public"."user_type" NOT NULL,
    "phone" "text",
    "whatsapp" "text",
    "company_name" "text",
    "company_logo" "text",
    "license_number" "text",
    "subscription_type" "public"."subscription_type" DEFAULT 'free'::"public"."subscription_type" NOT NULL,
    "subscription_started_at" timestamp with time zone,
    "subscription_expires_at" timestamp with time zone,
    "trial_started_at" timestamp with time zone DEFAULT "now"(),
    "trial_expires_at" timestamp with time zone DEFAULT ("now"() + '10 days'::interval),
    "total_listings" integer DEFAULT 0,
    "total_views" integer DEFAULT 0,
    "rating" numeric(3,2),
    "review_count" integer DEFAULT 0,
    "preferred_language" "text" DEFAULT 'es'::"text",
    "preferred_currency" "public"."currency" DEFAULT 'CLP'::"public"."currency",
    "notifications_email" boolean DEFAULT true,
    "notifications_push" boolean DEFAULT true,
    "push_token" "text",
    "is_email_verified" boolean DEFAULT false,
    "is_phone_verified" boolean DEFAULT false,
    "is_identity_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "platform_role" "text" DEFAULT 'user'::"text" NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_own_profile"() RETURNS "public"."profiles"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select * from public.profiles where id = auth.uid();
$$;


ALTER FUNCTION "public"."get_own_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_owner_views"("owner_id" "uuid", "days" integer DEFAULT 30) RETURNS TABLE("day" "date", "count" bigint)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select
    pv.created_at::date as day,
    count(*) as count
  from public.property_views pv
  join public.properties p on p.id = pv.property_id
  where p.owner_id = get_owner_views.owner_id
    and pv.created_at >= now() - make_interval(days => days)
  group by pv.created_at::date
  order by day;
$$;


ALTER FUNCTION "public"."get_owner_views"("owner_id" "uuid", "days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_property_views"("property_id" "uuid", "days" integer DEFAULT 30) RETURNS TABLE("day" "date", "count" bigint)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select
    created_at::date as day,
    count(*) as count
  from public.property_views
  where property_id = get_property_views.property_id
    and created_at >= now() - make_interval(days => days)
  group by created_at::date
  order by day;
$$;


ALTER FUNCTION "public"."get_property_views"("property_id" "uuid", "days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, name, user_type)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuario'
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'user_type', ''),
      'individual'
    )::user_type
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_property_views"("property_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.properties
     set views = coalesce(views, 0) + 1
   where id = increment_property_views.property_id;

  insert into public.property_views (property_id)
  values (increment_property_views.property_id);
end;
$$;


ALTER FUNCTION "public"."increment_property_views"("property_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_admin"("org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.organization_members
    where org_id = is_org_admin.org_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'admin')
  );
$$;


ALTER FUNCTION "public"."is_org_admin"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_admin_any"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.organization_members
    where user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'admin')
  );
$$;


ALTER FUNCTION "public"."is_org_admin_any"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_member"("org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.organization_members
    where org_id = is_org_member.org_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;


ALTER FUNCTION "public"."is_org_member"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_subscription_active"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT can_user_publish(p_user_id);
$$;


ALTER FUNCTION "public"."is_subscription_active"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_superadmin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and platform_role = 'superadmin'
  );
$$;


ALTER FUNCTION "public"."is_superadmin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_profile_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.profiles p
  set rating = (
    select round(avg(r.rating)::numeric, 1)
    from public.reviews r
    where r.subject_id = p.id and r.status = 'published'
  ),
  review_count = (
    select count(*) from public.reviews r
    where r.subject_id = p.id and r.status = 'published'
  )
  where p.id = coalesce(new.subject_id, old.subject_id);
  return null;
end;
$$;


ALTER FUNCTION "public"."refresh_profile_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_member_role"("org_id" "uuid", "target_user_id" "uuid", "new_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  actor_role  text;
  target_role text;
  actor_is_super boolean := public.is_superadmin();
begin
  -- Rol del actor en la org
  select m.role::text into actor_role
  from public.organization_members m
  where m.org_id = set_member_role.org_id
    and m.user_id = auth.uid()
    and m.status = 'active';

  if not actor_is_super and (actor_role is null or actor_role not in ('owner','admin')) then
    raise exception 'No autorizado para gestionar miembros';
  end if;

  if new_role is not null and new_role not in ('owner','admin','agent') then
    raise exception 'Rol inválido';
  end if;

  select m.role::text into target_role
  from public.organization_members m
  where m.org_id = set_member_role.org_id
    and m.user_id = target_user_id;

  -- Superadmin: control total
  if actor_is_super then
    if new_role is null then
      delete from public.organization_members
      where org_id = set_member_role.org_id and user_id = target_user_id;
    else
      insert into public.organization_members (org_id, user_id, role, status)
      values (set_member_role.org_id, target_user_id, new_role::public.org_role, 'active')
      on conflict (org_id, user_id)
      do update set role = excluded.role, status = 'active';
    end if;
    return;
  end if;

  -- Jerarquía para no-superadmin
  if target_role = 'owner' then
    raise exception 'El dueño de la corredora no puede ser modificado';
  end if;

  if new_role = 'owner' then
    raise exception 'Solo un superadministrador puede designar al dueño';
  end if;

  if actor_role = 'admin' then
    -- admin no toca a otros admins ni promueve a admin
    if target_role = 'admin' then
      raise exception 'Un admin no puede gestionar a otro admin';
    end if;
    if new_role = 'admin' then
      raise exception 'Un admin solo puede agregar o gestionar agentes';
    end if;
  end if;

  if new_role is null then
    delete from public.organization_members
    where org_id = set_member_role.org_id and user_id = target_user_id;
  else
    insert into public.organization_members (org_id, user_id, role, status)
    values (set_member_role.org_id, target_user_id, new_role::public.org_role, 'active')
    on conflict (org_id, user_id)
    do update set role = excluded.role, status = 'active';
  end if;
end;
$$;


ALTER FUNCTION "public"."set_member_role"("org_id" "uuid", "target_user_id" "uuid", "new_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_favorites_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE properties SET favorites_count = favorites_count + 1 WHERE id = NEW.property_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE properties SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = OLD.property_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."sync_favorites_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text",
    "name" "text",
    "route" "text",
    "message" "text",
    "stack" "text",
    "context" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."org_role" DEFAULT 'agent'::"public"."org_role" NOT NULL,
    "token" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."org_role" DEFAULT 'agent'::"public"."org_role" NOT NULL,
    "status" "public"."member_status" DEFAULT 'active'::"public"."member_status" NOT NULL,
    "invited_by" "uuid",
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."org_type" NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "description" "text",
    "website" "text",
    "phone" "text",
    "license_number" "text",
    "rut" "text",
    "is_verified" boolean DEFAULT false NOT NULL,
    "rating" numeric,
    "review_count" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mp_preference_id" "text",
    "mp_payment_id" "text",
    "amount" bigint NOT NULL,
    "currency" "text" DEFAULT 'CLP'::"text" NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "plan" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "type" "public"."property_type" NOT NULL,
    "operation" "public"."property_operation" NOT NULL,
    "status" "public"."property_status" DEFAULT 'active'::"public"."property_status" NOT NULL,
    "latitude" double precision NOT NULL,
    "longitude" double precision NOT NULL,
    "address_street" "text",
    "address_number" "text",
    "address_commune" "text",
    "address_city" "text" DEFAULT 'Santiago'::"text",
    "address_region" "text" DEFAULT 'Metropolitana'::"text",
    "address_postal_code" "text",
    "price" bigint NOT NULL,
    "currency" "public"."currency" DEFAULT 'CLP'::"public"."currency" NOT NULL,
    "price_per_sqm" bigint,
    "monthly_rent" bigint,
    "deposit" bigint,
    "maintenance_fee" bigint,
    "is_negotiable" boolean DEFAULT false,
    "bedrooms" integer,
    "bathrooms" integer,
    "area" numeric(10,2) NOT NULL,
    "built_area" numeric(10,2),
    "lot_size" numeric(10,2),
    "parking_spots" integer DEFAULT 0,
    "floors" integer,
    "year_built" integer,
    "has_garden" boolean DEFAULT false,
    "has_pool" boolean DEFAULT false,
    "has_gym" boolean DEFAULT false,
    "has_security" boolean DEFAULT false,
    "has_elevator" boolean DEFAULT false,
    "has_balcony" boolean DEFAULT false,
    "has_terrace" boolean DEFAULT false,
    "has_air_conditioning" boolean DEFAULT false,
    "has_heating" boolean DEFAULT false,
    "pet_friendly" boolean DEFAULT false,
    "furnished" boolean DEFAULT false,
    "new_construction" boolean DEFAULT false,
    "images" "jsonb" DEFAULT '[]'::"jsonb",
    "videos" "jsonb" DEFAULT '[]'::"jsonb",
    "virtual_tour_url" "text",
    "floor_plan_url" "text",
    "contact_name" "text",
    "contact_phone" "text",
    "contact_email" "text",
    "contact_whatsapp" "text",
    "preferred_contact" "public"."contact_method" DEFAULT 'whatsapp'::"public"."contact_method",
    "published_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    "is_premium" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "views" integer DEFAULT 0,
    "favorites_count" integer DEFAULT 0,
    "contacts_count" integer DEFAULT 0,
    "search_vector" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"spanish"'::"regconfig", ((((((((COALESCE("title", ''::"text") || ' '::"text") || COALESCE("description", ''::"text")) || ' '::"text") || COALESCE("address_commune", ''::"text")) || ' '::"text") || COALESCE("address_city", ''::"text")) || ' '::"text") || COALESCE("address_region", ''::"text")))) STORED,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "organization_id" "uuid"
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_views" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "viewer_id" "uuid",
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."property_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "property_id" "uuid",
    "rating" integer NOT NULL,
    "comment" "text" NOT NULL,
    "status" "public"."review_status" DEFAULT 'published'::"public"."review_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reviews_check" CHECK (("author_id" <> "subject_id")),
    CONSTRAINT "reviews_comment_check" CHECK (("char_length"("comment") >= 10)),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_property_id_key" UNIQUE ("user_id", "property_id");



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("org_id", "user_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_mp_payment_id_key" UNIQUE ("mp_payment_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_views"
    ADD CONSTRAINT "property_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_author_id_subject_id_property_id_key" UNIQUE ("author_id", "subject_id", "property_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



CREATE INDEX "error_logs_created_at_idx" ON "public"."error_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "error_logs_user_id_idx" ON "public"."error_logs" USING "btree" ("user_id");



CREATE UNIQUE INDEX "favorites_user_property_unique_idx" ON "public"."favorites" USING "btree" ("user_id", "property_id");



CREATE INDEX "idx_favorites_property" ON "public"."favorites" USING "btree" ("property_id");



CREATE INDEX "idx_favorites_user" ON "public"."favorites" USING "btree" ("user_id");



CREATE INDEX "idx_payments_mp" ON "public"."payments" USING "btree" ("mp_preference_id");



CREATE INDEX "idx_payments_user" ON "public"."payments" USING "btree" ("user_id");



CREATE INDEX "idx_properties_expires" ON "public"."properties" USING "btree" ("expires_at") WHERE ("status" = 'active'::"public"."property_status");



CREATE INDEX "idx_properties_location" ON "public"."properties" USING "btree" ("latitude", "longitude");



CREATE INDEX "idx_properties_owner" ON "public"."properties" USING "btree" ("owner_id");



CREATE INDEX "idx_properties_search" ON "public"."properties" USING "gin" ("search_vector");



CREATE INDEX "idx_properties_status" ON "public"."properties" USING "btree" ("status");



CREATE INDEX "idx_properties_type_op" ON "public"."properties" USING "btree" ("type", "operation");



CREATE INDEX "idx_views_property" ON "public"."property_views" USING "btree" ("property_id");



CREATE UNIQUE INDEX "reviews_one_per_property_idx" ON "public"."reviews" USING "btree" ("author_id", "subject_id", "property_id");



CREATE UNIQUE INDEX "reviews_one_per_target_idx" ON "public"."reviews" USING "btree" ("author_id", "subject_id") WHERE ("property_id" IS NULL);



CREATE OR REPLACE TRIGGER "reviews_subject_must_be_owner" BEFORE INSERT OR UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_review_subject_is_owner"();



CREATE OR REPLACE TRIGGER "reviews_update_profile_rating" AFTER INSERT OR DELETE OR UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."refresh_profile_rating"();



CREATE OR REPLACE TRIGGER "trg_favorites_count" AFTER INSERT OR DELETE ON "public"."favorites" FOR EACH ROW EXECUTE FUNCTION "public"."sync_favorites_count"();



CREATE OR REPLACE TRIGGER "trg_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_properties_updated_at" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_views"
    ADD CONSTRAINT "property_views_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_views"
    ADD CONSTRAINT "property_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."profiles"("id");



CREATE POLICY "authenticated insert error logs" ON "public"."error_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "author can edit own review" ON "public"."reviews" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "author_id"));



ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "favorites own delete" ON "public"."favorites" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "favorites own insert" ON "public"."favorites" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "favorites own select" ON "public"."favorites" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "invites readable by superadmin or org admin" ON "public"."org_invites" FOR SELECT TO "authenticated" USING (("public"."is_superadmin"() OR "public"."is_org_admin"("org_id")));



CREATE POLICY "members managed by superadmin or org admin" ON "public"."organization_members" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_superadmin"() OR "public"."is_org_admin"("org_id")));



CREATE POLICY "members readable by superadmin or org members" ON "public"."organization_members" FOR SELECT TO "authenticated" USING (("public"."is_superadmin"() OR "public"."is_org_member"("org_id")));



CREATE POLICY "members updated by superadmin or org admin" ON "public"."organization_members" FOR UPDATE TO "authenticated" USING (("public"."is_superadmin"() OR "public"."is_org_admin"("org_id")));



CREATE POLICY "org admin read org properties" ON "public"."properties" FOR SELECT TO "authenticated" USING ("public"."is_org_admin"("organization_id"));



CREATE POLICY "org members read property_views of their org" ON "public"."property_views" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "property_views"."property_id") AND ("p"."organization_id" IS NOT NULL) AND "public"."is_org_member"("p"."organization_id")))));



ALTER TABLE "public"."org_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orgs readable by authenticated" ON "public"."organizations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "orgs writable by superadmin or org admin" ON "public"."organizations" TO "authenticated" USING (("public"."is_superadmin"() OR "public"."is_org_admin"("id")));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles insert own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles own row select" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles public select" ON "public"."profiles" FOR SELECT TO "anon" USING (true);



CREATE POLICY "profiles readable by authenticated" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles update own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK ((("id" = "auth"."uid"()) AND ("platform_role" = 'user'::"text")));



CREATE POLICY "profiles_public_read" ON "public"."profiles" FOR SELECT USING (true);



ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "properties delete own" ON "public"."properties" FOR DELETE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "properties insert own" ON "public"."properties" FOR INSERT TO "authenticated" WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "properties own select" ON "public"."properties" FOR SELECT TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "properties public select active" ON "public"."properties" FOR SELECT TO "authenticated", "anon" USING (("status" = 'active'::"public"."property_status"));



CREATE POLICY "properties update own" ON "public"."properties" FOR UPDATE TO "authenticated" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "properties_public_read" ON "public"."properties" FOR SELECT USING ((("status" = 'active'::"public"."property_status") OR ("owner_id" = "auth"."uid"())));



ALTER TABLE "public"."property_views" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "property_views insert authenticated" ON "public"."property_views" FOR INSERT TO "authenticated" WITH CHECK (true);



ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reviews readable by all" ON "public"."reviews" FOR SELECT USING ((("status" = 'published'::"public"."review_status") OR "public"."is_superadmin"()));



CREATE POLICY "superadmin can read error logs" ON "public"."error_logs" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "superadmin full access organizations" ON "public"."organizations" USING ("public"."is_superadmin"());



CREATE POLICY "superadmin full access profiles" ON "public"."profiles" USING ("public"."is_superadmin"());



CREATE POLICY "superadmin full access properties" ON "public"."properties" USING ("public"."is_superadmin"());



CREATE POLICY "superadmin moderates reviews" ON "public"."reviews" FOR UPDATE TO "authenticated" USING ("public"."is_superadmin"());



CREATE POLICY "superadmin read payments" ON "public"."payments" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "superadmin read property_views" ON "public"."property_views" FOR SELECT TO "authenticated" USING ("public"."is_superadmin"());



CREATE POLICY "users can insert reviews" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "author_id") AND ("status" = 'published'::"public"."review_status")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."accept_pending_invites"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_pending_invites"() TO "anon";
GRANT ALL ON FUNCTION "public"."accept_pending_invites"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_pending_invites"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_users"("search_term" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_users"("search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_list_users"("search_term" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_set_platform_role"("target_user_id" "uuid", "new_role" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_set_platform_role"("target_user_id" "uuid", "new_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_platform_role"("target_user_id" "uuid", "new_role" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_set_review_status"("review_id" "uuid", "new_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_set_review_status"("review_id" "uuid", "new_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_review_status"("review_id" "uuid", "new_status" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_toggle_verified"("target_user_id" "uuid", "field" "text", "value" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_toggle_verified"("target_user_id" "uuid", "field" "text", "value" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_toggle_verified"("target_user_id" "uuid", "field" "text", "value" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."can_user_publish"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_publish"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_publish"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_org_invite"("inv_org_id" "uuid", "inv_email" "text", "inv_role" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_org_invite"("inv_org_id" "uuid", "inv_email" "text", "inv_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_org_invite"("inv_org_id" "uuid", "inv_email" "text", "inv_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_org_invite"("inv_org_id" "uuid", "inv_email" "text", "inv_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_review_subject_is_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_review_subject_is_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_review_subject_is_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_stale_listings"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_stale_listings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_stale_listings"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."find_user_for_org"("search_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."find_user_for_org"("search_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_user_for_org"("search_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_global_views"("days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_global_views"("days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_global_views"("days" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_org_members"("org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_org_members"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_org_members"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_org_views"("org_id" "uuid", "days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_org_views"("org_id" "uuid", "days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_org_views"("org_id" "uuid", "days" integer) TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."profiles" TO "anon";
GRANT SELECT("id"),INSERT("id") ON TABLE "public"."profiles" TO "authenticated";



GRANT INSERT("email") ON TABLE "public"."profiles" TO "authenticated";



GRANT SELECT("name") ON TABLE "public"."profiles" TO "anon";
GRANT SELECT("name"),INSERT("name"),UPDATE("name") ON TABLE "public"."profiles" TO "authenticated";



GRANT SELECT("avatar_url") ON TABLE "public"."profiles" TO "anon";
GRANT SELECT("avatar_url"),UPDATE("avatar_url") ON TABLE "public"."profiles" TO "authenticated";



GRANT INSERT("user_type") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("phone") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("whatsapp") ON TABLE "public"."profiles" TO "authenticated";



GRANT SELECT("rating") ON TABLE "public"."profiles" TO "anon";
GRANT SELECT("rating") ON TABLE "public"."profiles" TO "authenticated";



GRANT SELECT("review_count") ON TABLE "public"."profiles" TO "anon";
GRANT SELECT("review_count") ON TABLE "public"."profiles" TO "authenticated";



GRANT INSERT("updated_at"),UPDATE("updated_at") ON TABLE "public"."profiles" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_own_profile"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_own_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_own_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_owner_views"("owner_id" "uuid", "days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_owner_views"("owner_id" "uuid", "days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_owner_views"("owner_id" "uuid", "days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_property_views"("property_id" "uuid", "days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_property_views"("property_id" "uuid", "days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_property_views"("property_id" "uuid", "days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."increment_property_views"("property_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."increment_property_views"("property_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_property_views"("property_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."increment_property_views"("property_id" "uuid") TO "anon";



GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_admin_any"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_admin_any"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_admin_any"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_member"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_member"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_member"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_subscription_active"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_subscription_active"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_subscription_active"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_profile_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_profile_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_profile_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_member_role"("org_id" "uuid", "target_user_id" "uuid", "new_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_member_role"("org_id" "uuid", "target_user_id" "uuid", "new_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_favorites_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_favorites_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_favorites_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";



GRANT ALL ON TABLE "public"."org_invites" TO "anon";
GRANT ALL ON TABLE "public"."org_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."org_invites" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."property_views" TO "anon";
GRANT ALL ON TABLE "public"."property_views" TO "authenticated";
GRANT ALL ON TABLE "public"."property_views" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "service_role";
GRANT SELECT ON TABLE "public"."reviews" TO "anon";
GRANT SELECT ON TABLE "public"."reviews" TO "authenticated";



GRANT INSERT("author_id") ON TABLE "public"."reviews" TO "authenticated";



GRANT INSERT("subject_id") ON TABLE "public"."reviews" TO "authenticated";



GRANT INSERT("organization_id") ON TABLE "public"."reviews" TO "authenticated";



GRANT INSERT("property_id") ON TABLE "public"."reviews" TO "authenticated";



GRANT INSERT("rating") ON TABLE "public"."reviews" TO "authenticated";



GRANT INSERT("comment"),UPDATE("comment") ON TABLE "public"."reviews" TO "authenticated";



GRANT INSERT("status") ON TABLE "public"."reviews" TO "authenticated";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "properties public select active" on "public"."properties";

revoke delete on table "public"."organization_members" from "authenticated";

revoke insert on table "public"."organization_members" from "authenticated";

revoke update on table "public"."organization_members" from "authenticated";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."reviews" from "anon";

revoke insert on table "public"."reviews" from "anon";

revoke references on table "public"."reviews" from "anon";

revoke trigger on table "public"."reviews" from "anon";

revoke truncate on table "public"."reviews" from "anon";

revoke update on table "public"."reviews" from "anon";

revoke delete on table "public"."reviews" from "authenticated";

revoke insert on table "public"."reviews" from "authenticated";

revoke references on table "public"."reviews" from "authenticated";

revoke trigger on table "public"."reviews" from "authenticated";

revoke truncate on table "public"."reviews" from "authenticated";

revoke update on table "public"."reviews" from "authenticated";


  create policy "properties public select active"
  on "public"."properties"
  as permissive
  for select
  to anon, authenticated
using ((status = 'active'::public.property_status));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "owner can delete own images"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'property-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "property-images auth delete own"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'property-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "property-images auth update own"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'property-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
with check (((bucket_id = 'property-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "property-images auth upload own"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'property-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "property-images public read"
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'property-images'::text));



  create policy "public read property images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'property-images'::text));



  create policy "users can upload to own folder"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'property-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



