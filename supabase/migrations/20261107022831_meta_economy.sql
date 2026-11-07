-- Only the Worker service role can mutate meta/economy. Client JWTs get own reads.
alter table public.profiles add column app_id uuid not null default gen_random_uuid() unique,
 add column character text not null default 'washington' check(character in ('washington','marta')),
 add column wallet integer not null default 0 check(wallet>=0),
 add column regen_at bigint not null default (extract(epoch from clock_timestamp())*1000)::bigint,
 add column loadout jsonb not null default '{"character":"char_don_washington","environment":"env_galpon","cardSkin":"cards_clasica"}',
 add column inventory jsonb not null default '[]', add column settings jsonb not null default '{"fast":false,"reduced":false,"haptics":false,"quality":"auto","telemetry":false}',
 add column age13_confirmed boolean not null default false,add column tutorial_done boolean not null default false,
 add column wins integer not null default 0,add column losses integer not null default 0,add column pass_until bigint not null default 0;
create table public.wallet_tx(user_id uuid not null references public.profiles(user_id) on delete cascade,delta integer not null,reason text not null,ref text primary key,created_at bigint not null);
create index wallet_tx_owner_time on public.wallet_tx(user_id,created_at desc);
create table public.match_results(ref text primary key,result jsonb not null,created_at bigint not null);
create table public.weekly_stats(user_id uuid not null references public.profiles(user_id) on delete cascade,week date not null,points integer not null default 0,wins integer not null default 0,losses integer not null default 0,primary key(week,user_id));
create index weekly_owner on public.weekly_stats(user_id,week);
create index weekly_leaders on public.weekly_stats(week,points desc,wins desc);
alter table public.wallet_tx enable row level security;
alter table public.match_results enable row level security;
alter table public.weekly_stats enable row level security;
revoke all on public.wallet_tx,public.match_results,public.weekly_stats from public,anon,authenticated;
grant select on public.wallet_tx,public.weekly_stats to authenticated;
create policy own_wallet on public.wallet_tx for select to authenticated using((select auth.uid())=user_id);
create policy own_week on public.weekly_stats for select to authenticated using((select auth.uid())=user_id);
grant select,insert,update,delete on public.profiles,public.wallet_tx,public.match_results,public.weekly_stats,public.economy_config to service_role;
insert into public.economy_config values('default','{"welcome":10,"entry":1,"regenMs":7200000,"regenCap":5,"xpWin":50,"xpLoss":20,"eloK":32,"levelThresholds":[0,100,250,450,700,1000],"levelStepXp":500}') on conflict(id) do nothing;
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
grant usage on schema private to service_role;
create function private.wallet_balance() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if TG_OP='INSERT' then update public.profiles set wallet=wallet+NEW.delta where user_id=NEW.user_id;return NEW;end if;
 -- Account erasure cascades are allowed after the parent is removed. Ordinary ledger edits are forbidden.
 if TG_OP='DELETE' and not exists(select 1 from public.profiles where user_id=OLD.user_id) then return OLD;end if;
 raise exception 'APPEND_ONLY';
end $$;
create trigger wallet_insert after insert on public.wallet_tx for each row execute function private.wallet_balance();
create trigger wallet_immutable before update or delete on public.wallet_tx for each row execute function private.wallet_balance();
create function private.profile_json(p public.profiles) returns jsonb language sql immutable set search_path=public,pg_temp as $$
 select jsonb_build_object('id',p.app_id,'nickname',p.nickname,'character',p.character,'wallet',p.wallet,'xp',p.xp,'mmr',p.mmr,'createdAt',(extract(epoch from p.created_at)*1000)::bigint,'regenAt',p.regen_at,'loadout',p.loadout,'inventory',p.inventory,'settings',p.settings,'age13Confirmed',p.age13_confirmed,'tutorialDone',p.tutorial_done,'wins',p.wins,'losses',p.losses,'passUntil',p.pass_until)
$$;
create function private.refresh_profile(p_id uuid) returns public.profiles language plpgsql set search_path=public,pg_temp as $$
declare p public.profiles;ts bigint=(extract(epoch from clock_timestamp())*1000)::bigint;cfg jsonb;period_ms bigint;cap integer;amount integer;anchor bigint;
begin
 select * into p from public.profiles where app_id=p_id for update;if not found then return null;end if;
 select ec.config into cfg from public.economy_config ec where ec.id='default';period_ms=(cfg->>'regenMs')::bigint;cap=(cfg->>'regenCap')::integer;
 if p.wallet>=cap then update public.profiles set regen_at=ts where app_id=p_id returning * into p;return p;end if;
 amount=least(cap-p.wallet,greatest(0,(ts-p.regen_at)/period_ms)::integer);anchor=case when p.wallet+amount>=cap then ts else p.regen_at+amount*period_ms end;
 update public.profiles set regen_at=anchor where app_id=p_id;
 if amount>0 then insert into public.wallet_tx values(p.user_id,amount,'regeneration',p.app_id||':regen:'||anchor,ts) on conflict(ref) do nothing;end if;
 select * into p from public.profiles where app_id=p_id;return p;
end $$;
create function public.meta_command(p_command jsonb) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare op text=p_command->>'op';p public.profiles;seed jsonb=p_command->'profile';item jsonb;entry public.wallet_tx;id uuid;uid uuid;ids uuid[];ts bigint=(extract(epoch from clock_timestamp())*1000)::bigint;cfg jsonb;business_ref text=p_command->>'ref';result jsonb;member jsonb;history_entry jsonb;won boolean;bonus jsonb;extra integer;opponent numeric;change integer;wk date;inserted text;rows jsonb;category_key text;equipped_value jsonb;level_no integer;last_threshold integer;catalog jsonb=p_command->'catalog';
begin
 select ec.config into cfg from public.economy_config ec where ec.id='default';
 if op='config' then return cfg;elsif op='bootstrap' then
  uid=(p_command->>'uid')::uuid;select * into p from public.profiles where user_id=uid for update;
  if found then return private.profile_json(p);end if;
  insert into public.profiles(user_id,app_id,nickname,character,xp,mmr,regen_at,loadout,inventory,settings,age13_confirmed,tutorial_done,wins,losses,pass_until)
  values(uid,(seed->>'id')::uuid,seed->>'nickname',seed->>'character',coalesce((seed->>'xp')::int,0),coalesce((seed->>'mmr')::int,1000),coalesce((seed->>'regenAt')::bigint,ts),seed->'loadout',coalesce(seed->'inventory','[]'),seed->'settings',coalesce((seed->>'age13Confirmed')::boolean,false),coalesce((seed->>'tutorialDone')::boolean,false),coalesce((seed->>'wins')::int,0),coalesce((seed->>'losses')::int,0),coalesce((seed->>'passUntil')::bigint,0)) returning * into p;
  if jsonb_array_length(coalesce(p_command->'history'->'ledger','[]'))>0 then
   for history_entry in select value from jsonb_array_elements(p_command->'history'->'ledger') order by (value->>'createdAt')::bigint,(value->>'delta')::integer desc loop insert into public.wallet_tx values(uid,(history_entry->>'delta')::integer,history_entry->>'reason',p.app_id||':'||(history_entry->>'ref'),(history_entry->>'createdAt')::bigint) on conflict do nothing;end loop;
   for history_entry in select value from jsonb_array_elements(coalesce(p_command->'history'->'results','[]')) loop insert into public.match_results values(history_entry->>'ref',history_entry,(history_entry->>'at')::bigint) on conflict do nothing;end loop;
   if (select wallet from public.profiles where user_id=uid)<>(seed->>'wallet')::integer then raise exception 'MIGRATION_BALANCE';end if;
  else insert into public.wallet_tx values(uid,coalesce((seed->>'wallet')::int,(cfg->>'welcome')::int),'welcome',p.app_id||':welcome',ts);end if;
  select * into p from public.profiles where user_id=uid;return private.profile_json(p);
 elsif op='profile' then p=private.refresh_profile((p_command->>'id')::uuid);if p.user_id is null then return null;end if;return private.profile_json(p);
 elsif op in ('reserve','refund') then
  select coalesce(array_agg(distinct value::uuid order by value::uuid),'{}'::uuid[]) into ids from jsonb_array_elements_text(p_command->'ids');
  -- A consistent lock order prevents cross-room deadlocks.
  perform 1 from public.profiles where app_id=any(ids) order by app_id for update;
  foreach id in array ids loop
   p=private.refresh_profile(id);if p.user_id is null then if op='reserve' then raise exception 'PROFILE';else continue;end if;end if;
   if op='reserve' and not exists(select 1 from public.wallet_tx where wallet_tx.ref=id||':'||business_ref) and p.pass_until<=ts and p.wallet<(cfg->>'entry')::int then raise exception 'BALANCE';end if;
  end loop;
  foreach id in array ids loop
   select * into p from public.profiles where app_id=id;if not found then continue;end if;
   if op='reserve' then insert into public.wallet_tx values(p.user_id,case when p.pass_until>ts then 0 else -(cfg->>'entry')::int end,'entry',id||':'||business_ref,ts) on conflict do nothing;
   else select * into entry from public.wallet_tx where wallet_tx.ref=id||':'||business_ref and reason='entry';if found then insert into public.wallet_tx values(p.user_id,-entry.delta,'server_refund',id||':refund:'||business_ref,ts) on conflict do nothing;end if;end if;
  end loop;return '{"ok":true}';
 elsif op='result' then
  result=p_command->'result';business_ref=result->>'ref';insert into public.match_results values(business_ref,result,(result->>'at')::bigint) on conflict do nothing returning match_results.ref into inserted;
  if inserted is null then return '{"ok":true,"duplicate":true}';end if;
  for member in select value from jsonb_array_elements(result->'members') order by value->>'id' loop
   if (member->>'originalBot')::boolean then continue;end if;id=(member->>'id')::uuid;p=private.refresh_profile(id);if p.user_id is null then continue;end if;
   won=not (member->>'abandoned')::boolean and (member->>'seat')::int%2=(result->>'winner')::int;bonus=coalesce(result->'bonuses'->(member->>'id'),'{"flor":0,"truco":0}');extra=case when won then least(10,greatest(0,(bonus->>'flor')::int)*2+greatest(0,(bonus->>'truco')::int)*3) else 0 end;
   update public.profiles set xp=xp+case when won then (cfg->>'xpWin')::int else (cfg->>'xpLoss')::int end+extra,wins=wins+case when won then 1 else 0 end,losses=losses+case when won then 0 else 1 end where app_id=id;
   if not (result->>'hasBots')::boolean then
    select avg((value->>'mmr')::numeric) into opponent from jsonb_array_elements(result->'members') where (value->>'seat')::int%2<>(member->>'seat')::int%2;
    change=round((cfg->>'eloK')::numeric*((case when won then 1 else 0 end)-1/(1+power(10,(opponent-(member->>'mmr')::numeric)/400))));
    update public.profiles set mmr=greatest(0,mmr+change) where app_id=id;
    wk=date_trunc('week',to_timestamp((result->>'at')::numeric/1000) at time zone 'America/Montevideo')::date;
    insert into public.weekly_stats values(p.user_id,wk,case when won then 3 else 0 end,case when won then 1 else 0 end,case when won then 0 else 1 end) on conflict(week,user_id) do update set points=weekly_stats.points+excluded.points,wins=weekly_stats.wins+excluded.wins,losses=weekly_stats.losses+excluded.losses;
   end if;
  end loop;return '{"ok":true,"duplicate":false}';
 elsif op='ranking' then
  wk=date_trunc('week',now() at time zone 'America/Montevideo')::date;
  select coalesce(jsonb_agg(row),'[]') into rows from (select pr.app_id as "profileId",pr.nickname,w.points,w.wins,w.losses,w.week from public.weekly_stats w join public.profiles pr using(user_id) where w.week=wk order by w.points desc,w.wins desc,pr.app_id limit 50) row;return jsonb_build_object('week',wk,'rows',rows);
 elsif op='ledger' then select coalesce(jsonb_agg(row),'[]') into rows from (select (p_command->>'id') as "profileId",w.delta,w.reason,substring(w.ref from 38) as ref,w.created_at as "createdAt" from public.wallet_tx w join public.profiles pr using(user_id) where pr.app_id=(p_command->>'id')::uuid order by w.created_at desc limit 100) row;return rows;
 elsif op='update' then
  id=(seed->>'id')::uuid;p=private.refresh_profile(id);if p.user_id is null then raise exception 'PROFILE';end if;
  select count(*) into level_no from jsonb_array_elements_text(cfg->'levelThresholds') threshold where threshold::integer<=p.xp;select max(threshold::integer) into last_threshold from jsonb_array_elements_text(cfg->'levelThresholds') threshold;if p.xp>=last_threshold then level_no=level_no+(p.xp-last_threshold)/coalesce((cfg->>'levelStepXp')::int,500);end if;
  if catalog is null then raise exception 'ITEM_LOCKED';end if;
  for category_key,equipped_value in select * from jsonb_each(seed->'loadout') loop
   if category_key like '%Variant' then continue;end if;
   select v into item from jsonb_array_elements(catalog) v where v->>'id'=equipped_value#>>'{}' and v->>'category'=category_key;
   if item is null or not ((item->'unlock'->>'type')='default' or (item->'unlock'->>'type')='level' and level_no>=(item->'unlock'->>'level')::int or p.inventory ? (item->>'id')) then raise exception 'ITEM_LOCKED';end if;
   if seed->'loadout' ? (category_key||'Variant') and not ((item->'variants') ? (seed->'loadout'->>(category_key||'Variant'))) then raise exception 'ITEM_LOCKED';end if;
  end loop;
  update public.profiles set nickname=seed->>'nickname',character=case when seed->'loadout'->>'character'='char_marta' then 'marta' else 'washington' end,loadout=seed->'loadout',settings=seed->'settings',age13_confirmed=age13_confirmed or coalesce((seed->>'age13Confirmed')::boolean,false),tutorial_done=tutorial_done or coalesce((seed->>'tutorialDone')::boolean,false) where app_id=id returning * into p;return private.profile_json(p);
 elsif op='delete' then
  id=(p_command->>'id')::uuid;select * into p from public.profiles where app_id=id;
  if p.user_id is not null then delete from public.profiles where app_id=id;end if;
  -- Results only retain game aggregates after erasure; remove identity and bonus keys.
  update public.match_results mr set result=jsonb_set(mr.result,'{members}',(select jsonb_agg(case when v->>'id'=id::text then jsonb_set(v,'{id}','"deleted"') else v end) from jsonb_array_elements(mr.result->'members') v)) where mr.result->'members' @> jsonb_build_array(jsonb_build_object('id',id::text));
  update public.match_results mr set result=jsonb_set(mr.result,'{bonuses}',(mr.result->'bonuses')-id::text) where mr.result->'bonuses' ? id::text;
  return '{"ok":true}';
 end if;raise exception 'UNKNOWN_META_OP';
end $$;
revoke all on function public.meta_command(jsonb) from public,anon,authenticated;
revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function public.meta_command(jsonb) to service_role;
grant execute on all functions in schema private to service_role;
