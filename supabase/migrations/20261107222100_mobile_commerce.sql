-- Provider callbacks are authenticated by the Worker before this service-role RPC.
create table private.commerce_receipts(ref text primary key, created_at timestamptz not null default now());
grant select,insert on private.commerce_receipts to service_role;
alter table public.profiles add column pass_event_at bigint not null default 0;

create function public.commerce_command(p_credit jsonb) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare
 p public.profiles;
 ts bigint=(extract(epoch from clock_timestamp())*1000)::bigint;
 kind text=p_credit->>'kind';
 receipt text=p_credit->>'ref';
 credited text;
 amount int;
 reason text;
 day_start bigint;
 stamp text=p_credit->>'stamp';
begin
 if kind not in ('ad','pack','pass') or receipt is null or length(receipt)>220 then raise exception 'INVALID_CREDIT';end if;
 select * into p from public.profiles where app_id=(p_credit->>'id')::uuid for update;
 if not found or not p.age13_confirmed then return '{"ok":true,"ignored":true}'::jsonb;end if;
 if kind='ad' then
  amount=2;reason='ad_reward';
  day_start=(extract(epoch from (date_trunc('day',clock_timestamp() at time zone 'America/Montevideo') at time zone 'America/Montevideo'))*1000)::bigint;
  if (select count(*) from public.wallet_tx where user_id=p.user_id and wallet_tx.reason='ad_reward' and created_at>=day_start)>=5 then
   return '{"ok":true,"limited":true}'::jsonb;
  end if;
 elsif kind='pack' then
  amount=(p_credit->>'amount')::int;reason='play_purchase';
  if amount is null or amount not in (20,60,150) then raise exception 'INVALID_CREDIT';end if;
 end if;
 insert into private.commerce_receipts(ref) values(receipt) on conflict do nothing returning ref into credited;
 if credited is null then return '{"ok":true,"duplicate":true}'::jsonb;end if;
 if kind='pass' then
  update public.profiles set
   pass_until=case when (p_credit->>'at')::bigint>pass_event_at and (not p_credit ? 'periodEnd' or pass_until<=(p_credit->>'periodEnd')::bigint) then (p_credit->>'expires')::bigint else pass_until end,
   pass_event_at=case when not p_credit ? 'periodEnd' or pass_until<=(p_credit->>'periodEnd')::bigint then greatest(pass_event_at,(p_credit->>'at')::bigint) else pass_event_at end,
   inventory=case when stamp ~ '^pass_stamp:[0-9]{4}-(0[1-9]|1[0-2])$' and not inventory ? stamp then inventory||jsonb_build_array(stamp) else inventory end
  where user_id=p.user_id;
 else
  insert into public.wallet_tx values(p.user_id,amount,reason,p.app_id||':'||receipt,ts) on conflict do nothing;
 end if;
 return '{"ok":true}'::jsonb;
end $$;
revoke all on function public.commerce_command(jsonb) from public,anon,authenticated;
grant execute on function public.commerce_command(jsonb) to service_role;
