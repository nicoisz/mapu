-- Run in Supabase SQL Editor as postgres. Only these two TEST accounts change.
-- Password for both: 123qweasd. Hash generated and verified with bcrypt, cost 10.
-- Existing UUID, profile name, properties and social identities are preserved.
begin;
do $$
declare
  target_email text; target_id uuid; profile_name text;
  password_hash constant text := '$2b$10$CZ3QC154zeU5x19nvCM4BepEoB7ZxhuuWf.2z3P2qpAv4UGSCHuAq';
begin
  if not exists(select 1 from information_schema.columns where table_schema='auth' and table_name='identities' and column_name='provider_id') then
    raise exception 'Unsupported Auth schema: provider_id missing. Use Supabase Admin Auth instead.';
  end if;
  foreach target_email in array array['mapu.probe.claude@gmail.com','prueba2@mapu.test'] loop
    select id into target_id from auth.users where lower(email)=target_email;
    if (select count(*) from auth.users where lower(email)=target_email)>1 then raise exception 'Duplicate test email: %',target_email; end if;
    profile_name:=case when target_email='prueba2@mapu.test' then 'MapU Prueba 2' else 'MapU Prueba 1' end;
    if target_id is null then
      target_id:=gen_random_uuid();
      insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
        raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
        confirmation_token,recovery_token,email_change_token_new,email_change)
      values('00000000-0000-0000-0000-000000000000',target_id,'authenticated','authenticated',target_email,password_hash,now(),
        '{"provider":"email","providers":["email"]}',jsonb_build_object('name',profile_name,'user_type','individual'),now(),now(),'','','','');
    else
      update auth.users set encrypted_password=password_hash,email_confirmed_at=coalesce(email_confirmed_at,now()),updated_at=now(),
        raw_user_meta_data=coalesce(raw_user_meta_data,'{}') || '{"user_type":"individual"}',
        raw_app_meta_data=jsonb_set(coalesce(raw_app_meta_data,'{}'),'{providers}',
          (select jsonb_agg(distinct v) from jsonb_array_elements(coalesce(raw_app_meta_data->'providers','[]') || '["email"]') v)),
        confirmation_token=coalesce(confirmation_token,''),recovery_token=coalesce(recovery_token,''),
        email_change_token_new=coalesce(email_change_token_new,''),email_change=coalesce(email_change,'')
      where id=target_id;
    end if;
    if exists(select 1 from auth.identities where provider='email' and provider_id=target_id::text and user_id<>target_id) then
      raise exception 'Conflicting email identity for %',target_email;
    end if;
    insert into auth.identities(id,user_id,provider_id,provider,identity_data,created_at,updated_at)
    select gen_random_uuid(),target_id,target_id::text,'email',jsonb_build_object('sub',target_id::text,'email',target_email,'email_verified',true),now(),now()
    where not exists(select 1 from auth.identities where user_id=target_id and provider='email');
    update auth.identities set identity_data=identity_data || jsonb_build_object('sub',target_id::text,'email',target_email,'email_verified',true),updated_at=now()
      where user_id=target_id and provider='email';
    insert into public.profiles(id,email,name,user_type,platform_role,is_email_verified)
      values(target_id,target_email,profile_name,'individual','user',true)
      on conflict(id) do update set user_type='individual',platform_role='user',is_email_verified=true,updated_at=now();
  end loop;
end $$;
commit;
select email,user_type,platform_role from public.profiles
where lower(email) in ('mapu.probe.claude@gmail.com','prueba2@mapu.test');
