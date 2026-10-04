-- Run as postgres against a local migrated database. All fixtures roll back.
begin;
insert into auth.users(id,aud,role,email,raw_user_meta_data,created_at,updated_at)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','authenticated','authenticated','interest-a@mapu.test','{"name":"Interest A"}',now(),now()),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','authenticated','authenticated','interest-b@mapu.test','{"name":"Interest B"}',now(),now());
insert into public.profiles(id,email,name) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','interest-a@mapu.test','Interest A'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','interest-b@mapu.test','Interest B') on conflict(id) do nothing;
insert into public.properties(id,owner_id,title,description,type,operation,status,latitude,longitude,area,price,currency,address_commune,bedrooms,has_garden,published_at,expires_at)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Test house','SQL fixture','house','sale','active',-39.8,-73.2,100,100,'CLP','Valdivia',3,true,now()-interval '1 minute',now()+interval '1 day');

do $$
declare p public.properties; f jsonb; score_value integer; result jsonb;
begin
 select * into p from public.properties where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 f:='{"version":1,"operation":"sale","types":["house"],"communes":[],"alternativeCommunes":[],"currency":"CLP","budgetFlexibility":0,"features":[],"required":[]}';
 assert public.valid_interest_filters(f),'valid filters';
 assert not public.valid_interest_filters(f || '{"maxPrice":null}'),'reject explicit null budget';
 assert not public.valid_interest_filters(f || '{"operation":null}'),'reject null operation';
 assert not public.valid_interest_filters(f || '{"minBedrooms":1.5}'),'reject fractional bedrooms';
 assert not public.valid_interest_filters(f || '{"required":["has_pool"]}'),'required must be selected';
 assert not public.valid_interest_filters(f || '{"unknown":true}'),'closed schema';
 select score into score_value from public.score_property_interest(p,f); assert score_value=100,'unanswered criteria do not penalize';
 p.price:=105;
 select score into score_value from public.score_property_interest(p,f || '{"maxPrice":100,"budgetFlexibility":10}'); assert score_value=88,'linear flexible budget';
 assert not exists(select 1 from public.score_property_interest(p,f || '{"maxPrice":100,"budgetFlexibility":10,"required":["maxPrice"]}')),'hard budget wins';
 p.price:=111;
 assert not exists(select 1 from public.score_property_interest(p,f || '{"maxPrice":100,"budgetFlexibility":10}')),'outside allowed tolerance';
 p.price:=100;p.currency:='USD';
 assert not exists(select 1 from public.score_property_interest(p,f || '{"maxPrice":100}')),'do not compare different currencies';
 p.currency:='CLP';p.operation:='rent';p.monthly_rent:=90;p.price:=999999;
 select score into score_value from public.score_property_interest(p,f || '{"operation":"rent","maxPrice":100}');assert score_value=100,'rent uses monthly_rent';
 p.monthly_rent:=null;
 assert not exists(select 1 from public.score_property_interest(p,f || '{"operation":"rent","maxPrice":100}')),'rent without amount cannot fit budget';
 p.operation:='sale';p.price:=100;
 select score into score_value from public.score_property_interest(p,f || '{"communes":["Osorno"],"alternativeCommunes":["Valdivia"]}'); assert score_value=80,'alternative commune score';
 assert not exists(select 1 from public.score_property_interest(p,f || '{"communes":["Osorno"],"alternativeCommunes":["Valdivia"],"required":["communes"]}')),'hard commune wins';
 p.bedrooms:=null;
 select reasons into result from public.score_property_interest(p,f || '{"minBedrooms":3}');assert result @> '[{"key":"minBedrooms","status":"unknown"}]','missing is not false success';
 assert not exists(select 1 from public.score_property_interest(p,f || '{"minBedrooms":3,"required":["minBedrooms"]}')),'missing mandatory excluded';
 p.type:='land';
 select score into score_value from public.score_property_interest(p,f || '{"types":["house","land"],"minBedrooms":3}'); assert score_value=100,'housing questions in mixed interests do not penalize land';
 assert not exists(select 1 from public.score_property_interest(p,f || '{"types":["house","land"],"minBedrooms":3,"required":["minBedrooms"]}')),'mixed types cannot bypass indispensable bedrooms';
 p.type:='apartment';p.area:=33.33;
 select score into score_value from public.score_property_interest(p,f || '{"minArea":100,"features":["has_garden"]}');assert score_value=30,'visible boundary 30';
 p.area:=37;
 select score into score_value from public.score_property_interest(p,f || '{"minArea":100,"features":["has_garden"]}');assert score_value=31,'visible boundary 31';
 assert not exists(select 1 from public.score_property_interest(p,f || '{"required":["types"]}')),'hard property type';
 p.status:='pending_review';assert not exists(select 1 from public.score_property_interest(p,f)),'unpublished properties excluded';
 p.status:='active';p.expires_at:=now()-interval '1 second';assert not exists(select 1 from public.score_property_interest(p,f)),'expired excluded';
 p.expires_at:=null;p.published_at:=null;assert not exists(select 1 from public.score_property_interest(p,f)),'not published excluded';
end $$;

insert into public.property_interests(id,user_id,filters,effective_at) values
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"version":1,"operation":"sale","types":["house"],"communes":[],"alternativeCommunes":[],"currency":"CLP","budgetFlexibility":0,"features":[],"required":[]}',now()-interval '1 day'),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"version":1,"operation":"sale","types":["house"],"communes":[],"alternativeCommunes":[],"currency":"CLP","budgetFlexibility":0,"features":[],"required":[]}',now()-interval '1 day');
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$ declare result jsonb; begin
 result:=public.get_interest_matches();assert jsonb_array_length(result->'items')=1,'deduplicate property';
 assert (result->'items'->0->>'score')::int=100,'server score';assert result ? 'seen_before','server clock boundary';
 assert public.get_interest_match_count()=1,'deduplicate unread';
 perform public.mark_interest_matches_seen(now()-interval '2 minutes');assert public.get_interest_match_count()=1,'publication after read boundary remains new';
 perform public.mark_interest_matches_seen(now());assert public.get_interest_match_count()=0,'mark seen';
 begin perform public.get_owned_property_demand(array['cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid]);raise exception 'unauthorized demand accepted';exception when raise_exception then if sqlerrm='unauthorized demand accepted' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$ declare d record; begin
 select * into d from public.get_owned_property_demand(array['cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid]);
 assert d.users=1 and d.exact_users=1 and d.partial_users=0,'distinct user demand';
 assert public.get_interest_match_count()=0,'owner not a buyer of own property';
end $$;
update public.property_interests set is_active=false;
do $$ declare d record; begin
 select * into d from public.get_owned_property_demand(array['cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid]); assert d.users=0,'paused interests excluded';
end $$;
update public.property_interests set is_active=true;
do $$ begin assert (select bool_and(effective_at > now()-interval '1 minute') from public.property_interests),'reactivation resets effective date';end $$;

-- Test the public threshold too, not only the internal scoring function.
update public.properties set type='apartment',area=33.33 where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
update public.property_interests set filters=filters || '{"minArea":100,"features":["has_garden"]}';
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$ begin assert jsonb_array_length(public.get_interest_matches()->'items')=0,'RPC excludes visible 30 percent';end $$;
update public.properties set area=37 where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
do $$ begin assert jsonb_array_length(public.get_interest_matches()->'items')=1,'RPC includes visible 31 percent';end $$;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$ declare d record; begin
 select * into d from public.get_owned_property_demand(array['cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid]);
 assert d.users=1 and d.exact_users=0 and d.partial_users=1,'same partial threshold for distinct demand';
end $$;

set local role authenticated;
do $$ begin
 assert (select count(*) from public.property_interests)=0,'RLS hides other users interests';
 assert not has_function_privilege(current_user,'public.interest_matches_for(uuid)','execute'),'private matching helper';
 assert not has_function_privilege(current_user,'public.score_property_interest(public.properties,jsonb)','execute'),'private scoring helper';
 begin
   insert into public.property_interests(user_id,filters) select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"version":1,"operation":"sale","types":["house"],"communes":[],"alternativeCommunes":[],"currency":"CLP","budgetFlexibility":0,"features":[],"required":[]}';
   raise exception 'cross-user insertion accepted';
 exception when insufficient_privilege then null;end;
 begin update public.property_interests set effective_at='2000-01-01';raise exception 'effective timestamp spoof allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
-- More than one page, with duplicate interests and equal scores/publication times.
insert into public.properties(id,owner_id,title,description,type,operation,status,latitude,longitude,area,price,currency,address_commune,bedrooms,has_garden,published_at,expires_at)
select gen_random_uuid(),'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Page ' || n,'SQL fixture','house','sale','active',-39.8,-73.2,100,100,'CLP','Valdivia',3,true,now(),now()+interval '1 day'
from generate_series(1,21) n;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$ declare first_page jsonb; second_page jsonb; begin
 first_page:=public.get_interest_matches(20,0)->'items';
 second_page:=public.get_interest_matches(20,20)->'items';
 assert jsonb_array_length(first_page)=20 and jsonb_array_length(second_page)=2,'pagination includes 22 unique properties';
 assert first_page=public.get_interest_matches(20,0)->'items','stable ordering for tied scores';
 assert (second_page->1->>'score')::int=31,'lower scores sorted last';
 assert (select count(distinct item->>'property_id')=22 from jsonb_array_elements(first_page || second_page) item),'no duplicate across pages or interests';
 begin perform public.get_interest_matches(21,0);raise exception 'oversized page accepted';exception when raise_exception then if sqlerrm='oversized page accepted' then raise;end if;end;
end $$;
rollback;
