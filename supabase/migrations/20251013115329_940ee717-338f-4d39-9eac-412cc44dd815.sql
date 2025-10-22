-- Seed sample employees
INSERT INTO public.employees (employee_id, full_name, email, phone, department, position, join_date, salary, status) VALUES
('EMP001', 'John Smith', 'john.smith@company.com', '+1-555-0101', 'Engineering', 'Senior Developer', '2022-01-15', 95000, 'active'),
('EMP002', 'Sarah Johnson', 'sarah.j@company.com', '+1-555-0102', 'Engineering', 'Team Lead', '2021-06-20', 110000, 'active'),
('EMP003', 'Michael Chen', 'michael.chen@company.com', '+1-555-0103', 'HR', 'HR Manager', '2020-03-10', 85000, 'active'),
('EMP004', 'Emily Davis', 'emily.davis@company.com', '+1-555-0104', 'Marketing', 'Marketing Manager', '2021-11-05', 92000, 'active'),
('EMP005', 'David Wilson', 'david.w@company.com', '+1-555-0105', 'Sales', 'Sales Executive', '2023-02-14', 75000, 'active'),
('EMP006', 'Jennifer Brown', 'jen.brown@company.com', '+1-555-0106', 'Engineering', 'Frontend Developer', '2022-08-22', 82000, 'active'),
('EMP007', 'Robert Taylor', 'robert.t@company.com', '+1-555-0107', 'Finance', 'Financial Analyst', '2021-04-18', 78000, 'active'),
('EMP008', 'Lisa Anderson', 'lisa.a@company.com', '+1-555-0108', 'HR', 'Recruiter', '2023-01-09', 65000, 'active'),
('EMP009', 'James Martinez', 'james.m@company.com', '+1-555-0109', 'Engineering', 'Backend Developer', '2022-05-30', 88000, 'active'),
('EMP010', 'Maria Garcia', 'maria.g@company.com', '+1-555-0110', 'Sales', 'Sales Manager', '2020-09-12', 95000, 'active'),
('EMP011', 'Christopher Lee', 'chris.lee@company.com', '+1-555-0111', 'Engineering', 'DevOps Engineer', '2021-12-03', 92000, 'active'),
('EMP012', 'Amanda White', 'amanda.w@company.com', '+1-555-0112', 'Marketing', 'Content Writer', '2023-03-25', 58000, 'active'),
('EMP013', 'Daniel Harris', 'daniel.h@company.com', '+1-555-0113', 'Finance', 'Accountant', '2022-07-11', 72000, 'active'),
('EMP014', 'Jessica Clark', 'jessica.c@company.com', '+1-555-0114', 'Engineering', 'QA Engineer', '2023-05-08', 76000, 'active'),
('EMP015', 'Matthew Lewis', 'matthew.l@company.com', '+1-555-0115', 'Sales', 'Sales Representative', '2022-10-19', 68000, 'active');

-- Seed attendance records for the past month
INSERT INTO public.attendance (employee_id, date, check_in, check_out, status) 
SELECT 
  id,
  CURRENT_DATE - (n || ' days')::interval,
  '09:00:00'::time,
  '18:00:00'::time,
  CASE 
    WHEN random() < 0.95 THEN 'present'
    WHEN random() < 0.5 THEN 'sick'
    ELSE 'absent'
  END
FROM public.employees
CROSS JOIN generate_series(1, 30) n
WHERE EXTRACT(DOW FROM CURRENT_DATE - (n || ' days')::interval) NOT IN (0, 6);

-- Seed performance reviews
INSERT INTO public.performance_reviews (employee_id, review_period, rating, strengths, areas_for_improvement, goals, comments)
SELECT 
  id,
  'Q1 2024',
  (3 + random() * 2)::integer,
  'Strong technical skills, good team collaboration, meets deadlines consistently',
  'Could improve communication with stakeholders, needs to take more initiative in meetings',
  'Lead at least one major project, mentor junior developers, improve presentation skills',
  'Overall solid performance with room for growth in leadership areas'
FROM public.employees
WHERE position IN ('Senior Developer', 'Team Lead', 'Manager', 'Frontend Developer', 'Backend Developer');

-- Seed job postings
INSERT INTO public.job_postings (title, department, location, job_type, description, requirements, salary_range, status)
VALUES
('Senior Full Stack Developer', 'Engineering', 'San Francisco, CA', 'Full-time', 'We are looking for an experienced full-stack developer to join our growing engineering team.', 'Bachelor''s degree in Computer Science, 5+ years experience, React, Node.js, PostgreSQL', '$120,000 - $150,000', 'open'),
('Marketing Specialist', 'Marketing', 'Remote', 'Full-time', 'Join our marketing team to drive brand awareness and customer engagement.', '3+ years in digital marketing, SEO/SEM experience, excellent communication skills', '$70,000 - $90,000', 'open'),
('HR Coordinator', 'HR', 'New York, NY', 'Full-time', 'Support our HR team with recruitment, onboarding, and employee relations.', 'Bachelor''s degree, 2+ years HR experience, strong organizational skills', '$55,000 - $70,000', 'open'),
('Sales Executive', 'Sales', 'Chicago, IL', 'Full-time', 'Drive sales growth by building relationships with enterprise clients.', 'Proven sales track record, B2B experience, excellent negotiation skills', '$80,000 - $110,000 + commission', 'open');

-- Seed leave requests
INSERT INTO public.leave_requests (employee_id, leave_type, start_date, end_date, reason, status)
SELECT 
  id,
  (ARRAY['sick', 'vacation', 'personal'])[1 + floor(random() * 3)],
  CURRENT_DATE + (floor(random() * 30) || ' days')::interval,
  CURRENT_DATE + (floor(random() * 30 + 3) || ' days')::interval,
  'Personal matters',
  (ARRAY['pending', 'approved', 'rejected'])[1 + floor(random() * 3)]
FROM public.employees
WHERE random() < 0.4;

-- Seed interviews
INSERT INTO public.interviews (candidate_name, candidate_email, job_posting_id, interview_date, interview_type, status, notes)
SELECT 
  'Candidate ' || n,
  'candidate' || n || '@email.com',
  (SELECT id FROM public.job_postings ORDER BY random() LIMIT 1),
  CURRENT_DATE + (n || ' days')::interval + '14:00:00'::time,
  (ARRAY['phone', 'video', 'in-person'])[1 + floor(random() * 3)],
  (ARRAY['scheduled', 'completed', 'cancelled'])[1 + floor(random() * 3)],
  'Initial screening interview'
FROM generate_series(1, 10) n;

-- Seed announcements
INSERT INTO public.announcements (title, content, priority, target_roles)
VALUES
('Company Holiday Schedule', 'Our offices will be closed for the holidays from December 24-26. Please plan accordingly.', 'high', ARRAY['employee', 'hr', 'manager', 'admin']),
('New Health Benefits', 'We are pleased to announce enhanced health insurance coverage starting next month.', 'normal', ARRAY['employee', 'hr', 'manager', 'admin']),
('Performance Review Cycle', 'Q2 performance reviews will begin next week. Please complete your self-assessments.', 'normal', ARRAY['employee', 'manager']),
('System Maintenance', 'The HRMS will undergo maintenance this Saturday from 2-4 AM EST.', 'high', ARRAY['employee', 'hr', 'manager', 'admin']);

-- Seed resume screenings
INSERT INTO public.resume_screenings (candidate_name, email, phone, position_applied, resume_url, ai_score, ai_analysis, status)
VALUES
('Alex Thompson', 'alex.t@email.com', '+1-555-1001', 'Senior Full Stack Developer', 'https://example.com/resume1.pdf', 92, 'Strong technical background with 6 years experience in React and Node.js. Good cultural fit.', 'shortlisted'),
('Rachel Kim', 'rachel.k@email.com', '+1-555-1002', 'Marketing Specialist', 'https://example.com/resume2.pdf', 85, 'Excellent marketing experience with proven SEO results. Strong communication skills.', 'shortlisted'),
('Marcus Johnson', 'marcus.j@email.com', '+1-555-1003', 'HR Coordinator', 'https://example.com/resume3.pdf', 78, 'Solid HR background but lacks specific HRIS experience. Worth interviewing.', 'pending'),
('Nina Patel', 'nina.p@email.com', '+1-555-1004', 'Sales Executive', 'https://example.com/resume4.pdf', 88, 'Impressive B2B sales track record with major accounts. Highly recommended.', 'shortlisted');