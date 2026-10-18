export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: "learner" | "instructor" | "admin";
  bio: string | null;
  locale: string;
  created_at: string;
  profile_updated_at: string | null;
};
export type ProgressSummary = {
  completed_lessons: number;
  total_lessons: number;
  completed_modules: number;
  total_modules: number;
  quiz_attempts_count: number;
  passed_quizzes_count: number;
  latest_quiz: { score_percent: number; passed: boolean; submitted_at: string | null } | null;
  completed_activities: number;
  total_activities: number;
  percent_complete: number;
  items: Array<{ lesson_id: string; lesson_slug: string; lesson_title: string; estimated_minutes: number | null; module_week: number; status: string; completed_at?: string | null }>;
};
export type CourseContent = { id: string; slug: string; title: string; description: string; duration_weeks: number; modules: Array<{ id: string; week_number: number; title: string; summary: string | null; position: number; lessons: Array<{ id: string; slug: string; title: string; content_type: string; body: string | null; transcript: string | null; estimated_minutes: number | null; position: number }> }> };
export type QuizContent = { id: string; title: string; instructions: string | null; pass_mark_percent: number; questions: Array<{ id: string; prompt: string; position: number; options: Array<{ id: string; text: string; position: number }> }> };
export type QuizSubmission = { attempt_id: string; correct_count: number; total_questions: number; score_percent: number; passed: boolean; pass_mark_percent: number; feedback: Array<{ question_id: string; selected_option_id: string; correct_option_id: string; correct_answer: string; is_correct: boolean; explanation: string; answer_feedback: string | null }> };
export type ForumChannel = { id: string; label: string; description: string; module_week: number };
export type ForumPost = { id: string; author: string; role: string; body: string; created_at: string };
export type GroupTask = { task_id: string; title: string; brief: string; steps: string[]; saved_at: string | null };

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/session/renew", { method: "POST", credentials: "same-origin" })
      .then(response => response.ok)
      .catch(() => false)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

function notifyLearningUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("cybersmart:learning-updated"));
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const options: RequestInit = {
    ...init,
    credentials: "same-origin",
    headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
  };
  let response = await fetch(`/api${path}`, options);
  if (response.status === 401 && !["/session/start", "/session/register", "/session/renew", "/session/end"].includes(path)) {
    if (await refreshSession()) response = await fetch(`/api${path}`, options);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload.detail === "string" ? payload.detail : "We couldn’t complete that request. Check your details and try again.";
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

export const api = {
  signIn: (email: string, password: string) => request<{ user: UserProfile; message: string }>("/session/start", { method: "POST", body: JSON.stringify({ email, password }) }),
  signUp: (data: { email: string; full_name: string; password: string; confirm_password: string }) => request<{ user: UserProfile; message: string }>("/session/register", { method: "POST", body: JSON.stringify(data) }),
  signOut: () => request<{ message: string }>("/session/end", { method: "POST" }),
  me: () => request<UserProfile>("/session/current"),
  profile: () => request<UserProfile>("/account"),
  updateProfile: (data: { full_name: string; bio: string | null; locale: string }) => request<UserProfile>("/account", { method: "PATCH", body: JSON.stringify(data) }),
  courses: () => request<CourseContent[]>("/learning/catalog"),
  course: (slug: string) => request<CourseContent>(`/learning/catalog/${encodeURIComponent(slug)}`),
  lesson: (slug: string) => request<CourseContent["modules"][number]["lessons"][number]>(`/learning/lessons/${encodeURIComponent(slug)}`),
  progress: () => request<ProgressSummary>("/learning/progress"),
  updateLessonProgress: async (lessonId: string, data: { status: "in_progress" | "completed"; time_spent_seconds: number }) => {
    const progress = await request<ProgressSummary>(`/learning/progress/lessons/${encodeURIComponent(lessonId)}`, { method: "PUT", body: JSON.stringify(data) });
    notifyLearningUpdated();
    return progress;
  },
  finalQuiz: () => request<QuizContent>("/learning/assessment"),
  submitFinalQuiz: async (answers: Array<{ question_id: string; selected_option_id: string }>) => {
    const result = await request<QuizSubmission>("/learning/assessment/attempts", { method: "POST", body: JSON.stringify({ answers }) });
    notifyLearningUpdated();
    return result;
  },
  discussionChannels: () => request<ForumChannel[]>("/community/channels"),
  discussionPosts: (channel: string) => request<ForumPost[]>(`/community/channels/${encodeURIComponent(channel)}/posts`),
  sendDiscussionPost: (channel: string, body: string) => request<ForumPost>(`/community/channels/${encodeURIComponent(channel)}/posts`, { method: "POST", body: JSON.stringify({ body }) }),
  groupTask: () => request<GroupTask>("/learning/team-checklist"),
  saveGroupTask: (content: { steps: string[]; reflection?: string }) => request<GroupTask>("/learning/team-checklist", { method: "PUT", body: JSON.stringify(content) }),
};
