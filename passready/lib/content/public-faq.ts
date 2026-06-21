/** Shared FAQ copy for marketing pages and FAQ structured data. */
export type PublicFaqItem = { q: string; a: string };

export const PUBLIC_FAQ: PublicFaqItem[] = [
  {
    q: "How much does Pass Pilot cost?",
    a: "Learners pay £6.99/month until they pass or cancel. Instructor and supervisor accounts are free.",
  },
  {
    q: "What is Pass Pilot?",
    a: "Pass Pilot is a driving education platform for learners, instructors and supervisors. It includes Pass Pilot Score assessments, Progress Insights, Coaching Tools and growing Learning Centre resources.",
  },
  {
    q: "Is this official DVSA guidance?",
    a: "No. Pass Pilot is independent and not affiliated with DVSA. It is produced by a DVSA-approved driving instructor to complement lessons.",
  },
  {
    q: "Does Pass Pilot guarantee I will pass?",
    a: "No. There is no pass guarantee. You still need real-road performance and professional instruction.",
  },
  {
    q: "Can I use Pass Pilot with my instructor?",
    a: "Yes. Many learners bring their Pass Pilot Score, reports and Progress Insights into lessons to agree focused practice.",
  },
  {
    q: "Can supervisors use Pass Pilot?",
    a: "Yes. Supervisors can link to a learner account to view Progress Insights, reports and coaching guidance for private practice.",
  },
  {
    q: "What happens when I pass my driving test?",
    a: "Record your pass in Graduate Mode and Pass Pilot automatically stops future billing. Your account and Learning Journey stay available.",
  },
  {
    q: "Is my report saved securely?",
    a: "Yes. Saved reports stay linked to your account. Only you access them while signed in.",
  },
];
