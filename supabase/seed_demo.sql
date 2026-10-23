-- OPTIONAL: demo data so the "reported by other students" feature shows up in your live demo.
-- These are fake reports for the sample "Fee scam" message. Delete them before real use:
--   delete from public.reports where reporter_hash like 'seed-%';

insert into public.reports (indicator_type, indicator_value, scam_type, reporter_hash) values
  ('email', 'hr.globaltech.jobs@gmail.com', 'Asks you to pay money', 'seed-1'),
  ('email', 'hr.globaltech.jobs@gmail.com', 'Asks you to pay money', 'seed-2'),
  ('email', 'hr.globaltech.jobs@gmail.com', 'Asks you to pay money', 'seed-3'),
  ('domain', 'brightpath-digital.co', 'Requires you to buy something', 'seed-1'),
  ('domain', 'brightpath-digital.co', 'Requires you to buy something', 'seed-2')
on conflict do nothing;
