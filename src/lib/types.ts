export type ProfileRow = {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar: string | null;
  major: string | null;
  academic_year: number | null;
  target_role: string | null;
  language: string | null;
  courses: string[] | null;
  skills: string[] | null;
};

export type Role = {
  title: string;
  why: string;
  demand: 'high' | 'medium' | 'low';
  skills: string[];
};

export type ScorePoint = { score: number; created_at: string };

export type Achievement = {
  id: string;
  target_role: string;
  step_id: string;
  step_title: string;
  project_title: string;
  description: string;
  project_url: string | null;
  kind: 'project' | 'course' | 'certification';
  provider: string | null;
  issued_on: string | null;
  created_at: string;
};
