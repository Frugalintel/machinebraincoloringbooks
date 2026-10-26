alter table public.collectibles add column if not exists slug text;

update public.collectibles set slug = case name
  when 'Rover-X' then 'rover-x'
  when 'Cyber-Spaniel' then 'cyber-spaniel'
  when 'Atomic-Poodle' then 'atomic-poodle'
  when 'Quantum-Bulldog' then 'quantum-bulldog'
  when 'Alpha-Wing' then 'alpha-wing'
  when 'Beta-Destroyer' then 'beta-destroyer'
  when 'Gamma-Scout' then 'gamma-scout'
  when 'Delta-Cruiser' then 'delta-cruiser'
  when 'Omega-Station' then 'omega-station'
end
where slug is null and name in ('Rover-X','Cyber-Spaniel','Atomic-Poodle','Quantum-Bulldog','Alpha-Wing','Beta-Destroyer','Gamma-Scout','Delta-Cruiser','Omega-Station');

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'collectibles_slug_key' and conrelid = 'public.collectibles'::regclass) then
    alter table public.collectibles add constraint collectibles_slug_key unique (slug);
  end if;
end $$;
