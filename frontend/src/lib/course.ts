export const LESSON_PROGRESS_KEY = "cybersmart-lesson-1";

export const COURSE_MODULES = [
  { week: 1, title: "Recognise threats", detail: "Spot phishing signs and suspicious links", status: "Ready to begin", href: "/learn/first-steps" },
  { week: 2, title: "Choose safe actions", detail: "Protect accounts and workplace information", status: "Available", href: "/dashboard/modules/2" },
  { week: 3, title: "Respond together", detail: "Practise a calm, useful incident response", status: "Available", href: "/dashboard/modules/3" },
  { week: 4, title: "Final review", detail: "Bring your skills together in the final quiz", status: "Available", href: "/dashboard/modules/4" },
] as const;

export const COURSE_VIDEOS = {
  phishing: {
    id: "9pTW-F6V2N0",
    title: "Recognize and Report Phishing",
    description: "Learn how to spot suspicious messages and report them at work.",
  },
  mfa: {
    id: "QWwaidg3AtY",
    title: "How to Turn on MFA!",
    description: "See how multi-factor authentication adds another layer of account protection.",
  },
  secureHabits: {
    id: "kWJa_tMg7ZM",
    title: "We Can Secure Our World",
    description: "A short CISA animation about everyday ways to stay safer online.",
  },
} as const;
