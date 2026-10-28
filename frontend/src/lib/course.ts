export const LESSON_PROGRESS_KEY = "cybersmart-lesson-1";

export const COURSE_MODULES = [
  { week: 1, title: "Recognise threats", detail: "Spot phishing signs and suspicious links", status: "Ready to begin", href: "/learn/first-steps" },
  { week: 2, title: "Choose safe actions", detail: "Protect accounts and workplace information", status: "Available", href: "/dashboard/modules/2" },
  { week: 3, title: "Respond together", detail: "Practise a calm, useful incident response", status: "Available", href: "/dashboard/modules/3" },
  { week: 4, title: "Final review", detail: "Bring your skills together in the final quiz", status: "Available", href: "/dashboard/modules/4" },
] as const;
