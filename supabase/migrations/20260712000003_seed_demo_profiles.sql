-- Auth users were created through the Supabase dashboard for the demo.
insert into public.profiles (id, organization_id, department_id, full_name, initials, title, role) values
  ('92d71628-a8f8-4e35-9a42-7e4e65dddc65', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Alex Rivera', 'AR', 'ESG Director', 'admin'),
  ('e8b08ca2-d653-4419-aee8-0da22ab60428', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Maya Chen', 'MC', 'Operations Manager', 'manager'),
  ('84cf2591-6171-4068-9b3e-7fc527dde253', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'Jordan Lee', 'JL', 'People Operations', 'employee');
