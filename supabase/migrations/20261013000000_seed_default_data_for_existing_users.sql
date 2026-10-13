CREATE TABLE public.user_default_data_initializations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  initialized_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_default_data_initializations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_default_data_initializations FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.ensure_user_default_data() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  current_user_id uuid := auth.uid();
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
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to initialize semester data';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  IF EXISTS (
    SELECT 1 FROM public.user_default_data_initializations
    WHERE user_id = current_user_id
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.profiles (
    id, full_name, email, college, semester, section, semester_start, semester_end
  )
  SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    COALESCE(u.email, ''),
    'Sample Institute of Technology',
    '4-1',
    'A',
    CURRENT_DATE - INTERVAL '70 days',
    CURRENT_DATE + INTERVAL '50 days'
  FROM auth.users AS u
  WHERE u.id = current_user_id
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1 FROM public.subjects WHERE user_id = current_user_id
  ) THEN
    FOR s IN
      SELECT * FROM jsonb_to_recordset(seed_subjects) AS x(
        name text, code text, faculty text, color text, rate numeric,
        day int, start text, "end" text, room text
      )
    LOOP
      INSERT INTO public.subjects (user_id, name, code, faculty, color)
      VALUES (current_user_id, s.name, s.code, s.faculty, s.color)
      RETURNING id INTO sid;

      INSERT INTO public.timetable_entries (
        user_id, subject_id, day_of_week, start_time, end_time, room, faculty
      )
      VALUES
        (current_user_id, sid, s.day, s.start::time, s."end"::time, s.room, s.faculty),
        (
          current_user_id,
          sid,
          ((s.day + 2) % 5) + 1,
          (s.start::time + INTERVAL '2 hours')::time,
          (s."end"::time + INTERVAL '2 hours')::time,
          s.room,
          s.faculty
        );

      target_rate := s.rate;
      n := 0;
      FOR d IN
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '70 days',
          CURRENT_DATE - INTERVAL '1 day',
          INTERVAL '1 day'
        )::date
      LOOP
        IF EXTRACT(ISODOW FROM d)::int = s.day THEN
          n := n + 1;
          INSERT INTO public.attendance_records (
            user_id, subject_id, date, status, class_number
          )
          VALUES (
            current_user_id, sid, d,
            CASE WHEN random() < target_rate THEN 'present' ELSE 'absent' END,
            n
          );

          n := n + 1;
          INSERT INTO public.attendance_records (
            user_id, subject_id, date, status, class_number
          )
          VALUES (
            current_user_id, sid, d,
            CASE WHEN random() < target_rate THEN 'present' ELSE 'absent' END,
            n
          );
        END IF;
      END LOOP;
    END LOOP;

    INSERT INTO public.notifications (user_id, title, message, category) VALUES
      (current_user_id, 'Welcome to AttendMate', 'Your demo semester is ready. Review your subjects and set your attendance target.', 'info'),
      (current_user_id, 'Operating Systems needs attention', 'Attendance is close to the 75% minimum requirement.', 'warning'),
      (current_user_id, 'Great work in Software Testing', 'You are comfortably above your target attendance.', 'success');
  END IF;

  INSERT INTO public.user_default_data_initializations (user_id)
  VALUES (current_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_default_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_default_data() TO authenticated;
