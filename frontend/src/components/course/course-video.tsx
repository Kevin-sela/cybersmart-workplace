type CourseVideoDetails = {
  id: string;
  title: string;
  description: string;
};

export function CourseVideo({ video }: { video: CourseVideoDetails }) {
  return (
    <section className="course-lesson-video" aria-label={`Course video: ${video.title}`}>
      <div className="course-lesson-video-copy">
        <p className="eyebrow">WATCH THE VIDEO</p>
        <h2>{video.title}</h2>
        <p>{video.description}</p>
      </div>
      <div className="course-lesson-video-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.id}`}
          title={video.title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </section>
  );
}
