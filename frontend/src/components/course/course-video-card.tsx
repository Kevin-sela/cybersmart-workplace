const videoTopics = {
  1: { label: "Spot the clues", mark: <><path d="M5 8h14v10H5z"/><path d="m5 9 7 5 7-5"/></> },
  2: { label: "Choose a safe action", mark: <><rect x="6" y="10" width="12" height="10" rx="2"/><path d="M9 10V7a3 3 0 0 1 6 0v3m-3 4v2"/></> },
  3: { label: "Respond together", mark: <><path d="M5 6h14v10h-8l-5 4z"/><path d="M9 10h6m-6 3h4"/></> },
  4: { label: "Review your skills", mark: <><path d="M12 3 20 6v6c0 4.5-3 7-8 9-5-2-8-4.5-8-9V6z"/><path d="m8.5 12 2.3 2.3 4.8-5"/></> },
} as const;

export function CourseVideoCard({ week, title, description }: { week: 1 | 2 | 3 | 4; title: string; description: string }) {
  const topic = videoTopics[week];

  return (
    <section className="course-video-section" aria-labelledby={`course-video-title-${week}`}>
      <div className="course-video-section-heading">
        <div>
          <p className="dashboard-eyebrow">VIDEO LESSON</p>
          <h2 id={`course-video-title-${week}`}>Watch this module</h2>
          <p>A short visual walkthrough to support the lesson.</p>
        </div>
        <span className="course-video-coming">Coming soon</span>
      </div>
      <article className={`course-video-card course-video-card-${week}`}>
        <div className="course-video-thumbnail" role="img" aria-label={`Preview artwork for ${title}`}>
          <span className="course-video-thumb-label">CYBERSMART <i>·</i> MODULE {String(week).padStart(2, "0")}</span>
          <div className="course-video-artwork" aria-hidden="true">
            <span className="course-video-art-orbit" />
            <span className="course-video-art-window">
              <span className="course-video-art-window-top"><i /><i /><i /></span>
              <span className="course-video-art-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{topic.mark}</svg></span>
              <span className="course-video-art-lines"><i /><i /><i /></span>
            </span>
          </div>
          <span className="course-video-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.8c0-.8.9-1.3 1.6-.8l9.1 6.2c.6.4.6 1.2 0 1.6l-9.1 6.2c-.7.5-1.6 0-1.6-.8z" /></svg></span>
          <span className="course-video-duration">Coming soon</span>
        </div>
        <div className="course-video-copy">
          <div className="course-video-topic-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{topic.mark}</svg></div>
          <div className="course-video-text"><h3>{title}</h3><p>{description}</p><span>{topic.label} <i>·</i> Video lesson</span></div>
        </div>
      </article>
    </section>
  );
}
