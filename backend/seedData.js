// Seed generator: creates a realistic initial semester for new students
// Identical to the original SQL schema from Supabase migrations.

import crypto from "crypto";

export function generateSeedData(userId, fullName = "Demo Student", email = "demo@college.edu") {
  const profile = {
    id: userId,
    full_name: fullName,
    email: email,
    college: "Institute of Technology",
    semester: "4-1",
    section: "A",
    min_attendance: 75,
    target_attendance: 80,
    semester_start: new Date(Date.now() - 70 * 86400000).toISOString().slice(0, 10),
    semester_end: new Date(Date.now() + 50 * 86400000).toISOString().slice(0, 10),
    onboarded: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const seedSubjects = [
    { name: "Data Structures", code: "CS201", faculty: "Dr. R. Menon", color: "cyan", rate: 0.86, day: 1, start: "09:00", end: "10:00", room: "C-302" },
    { name: "Database Management Systems", code: "CS203", faculty: "Prof. A. Iyer", color: "violet", rate: 0.81, day: 2, start: "10:00", end: "11:00", room: "C-105" },
    { name: "Operating Systems", code: "CS205", faculty: "Dr. S. Rao", color: "amber", rate: 0.76, day: 3, start: "11:00", end: "12:00", room: "B-210" },
    { name: "Computer Networks", code: "CS207", faculty: "Prof. K. Nair", color: "emerald", rate: 0.89, day: 4, start: "09:00", end: "10:00", room: "B-114" },
    { name: "Software Testing", code: "CS209", faculty: "Dr. M. Gupta", color: "blue", rate: 0.92, day: 5, start: "14:00", end: "15:00", room: "A-401" },
  ];

  const subjects = [];
  const timetable = [];
  const records = [];

  const today = new Date();
  const startDate = new Date(Date.now() - 70 * 86400000);

  for (const s of seedSubjects) {
    const subjectId = crypto.randomUUID();
    subjects.push({
      id: subjectId,
      user_id: userId,
      name: s.name,
      code: s.code,
      faculty: s.faculty,
      color: s.color,
      target_percentage: 75,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Timetable entry 1
    timetable.push({
      id: crypto.randomUUID(),
      user_id: userId,
      subject_id: subjectId,
      day_of_week: s.day,
      start_time: s.start,
      end_time: s.end,
      room: s.room,
      faculty: s.faculty,
      created_at: new Date().toISOString(),
    });

    // Timetable entry 2
    const secondDay = ((s.day + 2) % 5) + 1;
    timetable.push({
      id: crypto.randomUUID(),
      user_id: userId,
      subject_id: subjectId,
      day_of_week: secondDay,
      start_time: "11:00",
      end_time: "12:00",
      room: s.room,
      faculty: s.faculty,
      created_at: new Date().toISOString(),
    });

    // Attendance records generation for the past 70 days
    let classNum = 0;
    const cur = new Date(startDate);
    while (cur < today) {
      const isoDay = cur.getUTCDay() === 0 ? 7 : cur.getUTCDay();
      if (isoDay === s.day || isoDay === secondDay) {
        classNum += 1;
        const dateStr = cur.toISOString().slice(0, 10);
        const isPresent = Math.random() < s.rate;
        records.push({
          id: crypto.randomUUID(),
          user_id: userId,
          subject_id: subjectId,
          date: dateStr,
          status: isPresent ? "present" : "absent",
          class_number: classNum,
          notes: "",
          created_at: new Date().toISOString(),
        });
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  const notifications = [
    {
      id: crypto.randomUUID(),
      user_id: userId,
      title: "Welcome to AttendMate",
      message: "Your semester is ready. Review your subjects and track your attendance.",
      category: "info",
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      user_id: userId,
      title: "Operating Systems needs attention",
      message: "Attendance is close to the 75% minimum requirement.",
      category: "warning",
      read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      user_id: userId,
      title: "Great work in Software Testing",
      message: "You are comfortably above your target attendance.",
      category: "success",
      read: false,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  return { profile, subjects, timetable, records, notifications, goals: [] };
}
