
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  college text NOT NULL DEFAULT '',
  semester text NOT NULL DEFAULT '',
  section text NOT NULL DEFAULT '',
  min_attendance numeric NOT NULL DEFAULT 75,
  target_attendance numeric NOT NULL DEFAULT 80,
  semester_start date,
  semester_end date,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL DEFAULT '',
  faculty text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'cyan',
  target_percentage numeric NOT NULL DEFAULT 75,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subjects" ON public.subjects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','cancelled')),
  class_number integer NOT NULL DEFAULT 1,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX attendance_user_subject_idx ON public.attendance_records (user_id, subject_id, date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attendance" ON public.attendance_records FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text NOT NULL DEFAULT '',
  faculty text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_entries TO authenticated;
GRANT ALL ON public.timetable_entries TO service_role;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own timetable" ON public.timetable_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.attendance_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  target_percentage numeric NOT NULL DEFAULT 75,
  deadline date,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_goals TO authenticated;
GRANT ALL ON public.attendance_goals TO service_role;
ALTER TABLE public.attendance_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.attendance_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'info' CHECK (category IN ('info','success','warning','danger')),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'insight',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','success','warning','danger')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_insights TO authenticated;
GRANT ALL ON public.ai_insights TO service_role;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own insights" ON public.ai_insights FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER subjects_updated BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s record;
  sid uuid;
  d date;
  n int;
  target_rate numeric;
  seed_subjects jsonb := '[
    {"name":"Data Structures","code":"CS201","faculty":"Dr. R. Menon","color":"cyan","rate":0.86,"day":1,"start":"09:00","end":"10:00","room":"C-302"},
    {"name":"Database Management Systems","code":"CS203","faculty":"Prof. A. Iyer","color":"violet","rate":0.81,"day":2,"start":"10:00","end":"11:00","room":"C-105"},
    {"name":"Operating Systems","code":"CS205","faculty":"Dr. S. Rao","color":"amber","rate":0.76,"day":3,"start":"11:00","end":"12:00","room":"B-210"},
    {"name":"Computer Networks","code":"CS207","faculty":"Prof. K. Nair","color":"emerald","rate":0.89,"day":4,"start":"09:00","end":"10:00","room":"B-114"},
    {"name":"Software Testing","code":"CS209","faculty":"Dr. M. Gupta","color":"blue","rate":0.92,"day":5,"start":"14:00","end":"15:00","room":"A-401"}
  ]'::jsonb;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, college, semester, section, semester_start, semester_end)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    'Sample Institute of Technology', '4-1', 'A',
    CURRENT_DATE - INTERVAL '70 days', CURRENT_DATE + INTERVAL '50 days'
  );

  FOR s IN SELECT * FROM jsonb_to_recordset(seed_subjects)
      AS x(name text, code text, faculty text, color text, rate numeric, day int, start text, "end" text, room text)
  LOOP
    INSERT INTO public.subjects (user_id, name, code, faculty, color)
    VALUES (NEW.id, s.name, s.code, s.faculty, s.color) RETURNING id INTO sid;

    INSERT INTO public.timetable_entries (user_id, subject_id, day_of_week, start_time, end_time, room, faculty)
    VALUES (NEW.id, sid, s.day, s.start::time, s."end"::time, s.room, s.faculty);
    INSERT INTO public.timetable_entries (user_id, subject_id, day_of_week, start_time, end_time, room, faculty)
    VALUES (NEW.id, sid, ((s.day + 2) % 5) + 1, (s.start::time + INTERVAL '2 hours')::time, (s."end"::time + INTERVAL '2 hours')::time, s.room, s.faculty);

    target_rate := s.rate;
    n := 0;
    FOR d IN SELECT generate_series(CURRENT_DATE - INTERVAL '70 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day')::date
    LOOP
      IF EXTRACT(ISODOW FROM d)::int = s.day THEN
        n := n + 1;
        INSERT INTO public.attendance_records (user_id, subject_id, date, status, class_number)
        VALUES (NEW.id, sid, d, CASE WHEN random() < target_rate THEN 'present' ELSE 'absent' END, n);
        n := n + 1;
        INSERT INTO public.attendance_records (user_id, subject_id, date, status, class_number)
        VALUES (NEW.id, sid, d, CASE WHEN random() < target_rate THEN 'present' ELSE 'absent' END, n);
      END IF;
    END LOOP;
  END LOOP;

  INSERT INTO public.notifications (user_id, title, message, category) VALUES
    (NEW.id, 'Welcome to AttendMate', 'Your demo semester is ready. Review your subjects and set your attendance target.', 'info'),
    (NEW.id, 'Operating Systems needs attention', 'Attendance is close to the 75% minimum requirement.', 'warning'),
    (NEW.id, 'Great work in Software Testing', 'You are comfortably above your target attendance.', 'success');

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
