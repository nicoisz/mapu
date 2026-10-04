insert into auth.users(id,email,raw_user_meta_data) values
 ('91919191-9191-4191-8191-919191919191','mobile-owner@mapu.test','{}'),
 ('22222222-2222-4222-8222-222222222222','mobile-buyer@mapu.test','{}'),
 ('33333333-3333-4333-8333-333333333333','mobile-other@mapu.test','{}');
insert into public.profiles(id,email,name) values
 ('91919191-9191-4191-8191-919191919191','mobile-owner@mapu.test','Owner'),
 ('22222222-2222-4222-8222-222222222222','mobile-buyer@mapu.test','Buyer'),
 ('33333333-3333-4333-8333-333333333333','mobile-other@mapu.test','Other') on conflict(id) do update set name=excluded.name,email=excluded.email;
insert into public.properties(id,owner_id,title,description,type,operation,status,latitude,longitude,area,price,currency,published_at)
values ('44444444-4444-4444-8444-444444444444','91919191-9191-4191-8191-919191919191','Mobile SQL fixture','Test fixture','house','sale','active',-39.8,-73.2,100,100,'CLP',now());
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ declare f jsonb := '{"version":1,"operation":"sale","types":["house"],"communes":["Valdivia","La Unión"],"alternativeCommunes":[],"currency":"CLP","budgetFlexibility":0,"features":[],"required":[]}'; begin
 perform public.save_property_interest('55555555-5555-4555-8555-555555555555',f,auth.uid());
 perform public.save_property_interest('55555555-5555-4555-8555-555555555555',f,auth.uid());
 assert (select count(*) from public.property_interests where id='55555555-5555-4555-8555-555555555555')=1,'retry does not duplicate interest';
 perform public.send_conversation_message('44444444-4444-4444-8444-444444444444',null,'Hello','66666666-6666-4666-8666-666666666666',auth.uid());
 perform public.send_conversation_message('44444444-4444-4444-8444-444444444444',null,'Hello','66666666-6666-4666-8666-666666666666',auth.uid());
 assert (select count(*) from public.messages)=1,'retry does not duplicate message';
 perform public.capture_error_log('Save failed',null,'/intereses','{"operation":"save"}',auth.uid());
 assert (select count(*) from public.error_logs)=0,'normal user cannot read logs';
 begin perform public.set_error_log_resolved('77777777-7777-4777-8777-777777777777',true); raise exception 'normal resolution allowed'; exception when raise_exception then if sqlerrm='normal resolution allowed' then raise;end if;end;
 begin insert into public.error_logs(message) values('forged');raise exception 'direct logs insert allowed';exception when insufficient_privilege then null;end;
 begin perform public.send_conversation_message('44444444-4444-4444-8444-444444444444',null,'spoof','88888888-8888-4888-8888-888888888888','91919191-9191-4191-8191-919191919191');raise exception 'spoof allowed';exception when raise_exception then if sqlerrm='spoof allowed' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub','91919191-9191-4191-8191-919191919191',true);
do $$ declare r jsonb; begin
 assert public.inbox_unread_count()=1,'publisher has incoming unread';
 r:=public.conversation_messages('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222');
 perform public.mark_conversation_seen('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222',(r->>'seen_before')::timestamptz);
 assert public.inbox_unread_count()=0,'reading marks incoming seen';
 perform public.send_conversation_message('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','Reply','77777777-7777-4777-8777-777777777777',auth.uid());
 assert jsonb_array_length(public.list_conversations())=1,'publisher sees conversation';
 begin perform public.save_property_interest('55555555-5555-4555-8555-555555555555','{"version":1,"operation":"sale","types":["house"],"communes":[],"alternativeCommunes":[],"currency":"CLP","budgetFlexibility":0,"features":[],"required":[]}',auth.uid());raise exception 'foreign draft overwritten';exception when raise_exception then if sqlerrm='foreign draft overwritten' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$ begin
 assert (select count(*) from public.messages)=0,'third party RLS';
 assert jsonb_array_length(public.list_conversations())=0,'third party inbox empty';
 begin perform public.conversation_messages('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222');raise exception 'foreign conversation read';exception when raise_exception then if sqlerrm='foreign conversation read' then raise;end if;end;
 begin perform public.send_conversation_message('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','intrude',gen_random_uuid(),auth.uid());raise exception 'third intruded';exception when raise_exception then if sqlerrm='third intruded' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ declare r jsonb; c uuid; begin
 assert public.inbox_unread_count()=1,'buyer sees publisher reply unread';
 for i in 1..51 loop perform public.send_conversation_message('44444444-4444-4444-8444-444444444444',null,'Page '||i,gen_random_uuid(),auth.uid());end loop;
 r:=public.conversation_messages('44444444-4444-4444-8444-444444444444','91919191-9191-4191-8191-919191919191');
 assert jsonb_array_length(r->'items')=50,'first message page bounded';c:=(r->'items'->49->>'id')::uuid;
 r:=public.conversation_messages('44444444-4444-4444-8444-444444444444','91919191-9191-4191-8191-919191919191',c);
 assert jsonb_array_length(r->'items')=3,'older messages not lost';
end $$;
reset role;
do $$ begin
 assert (select contacts_count from public.properties where id='44444444-4444-4444-8444-444444444444')=1,'replies/repeated messages do not inflate contacts';
 assert (select name from public.error_logs where user_id='22222222-2222-4222-8222-222222222222' limit 1)='Buyer','logger actor comes from server profile';
end $$;
update public.properties set status='pending_review' where id='44444444-4444-4444-8444-444444444444';
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$ begin
 begin perform public.send_conversation_message('44444444-4444-4444-8444-444444444444','91919191-9191-4191-8191-919191919191','private listing',gen_random_uuid(),auth.uid());raise exception 'unpublished listing contacted';exception when raise_exception then if sqlerrm='unpublished listing contacted' then raise;end if;end;
 assert not has_function_privilege('anon','public.send_conversation_message(uuid,uuid,text,uuid,uuid)','EXECUTE'),'anonymous cannot send';
end $$;
reset role;
update public.profiles set platform_role='superadmin' where id='33333333-3333-4333-8333-333333333333';
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$ declare log uuid; begin
 select id into log from public.error_logs where user_id='22222222-2222-4222-8222-222222222222' limit 1;assert log is not null,'admin reads logs';
 perform public.set_error_log_resolved(log,true);assert (select resolved from public.error_logs where id=log),'admin resolves';
 perform public.set_error_log_resolved(log,false);assert (select not resolved and resolved_at is null and resolved_by is null from public.error_logs where id=log),'admin reopens';
end $$;
reset role;
