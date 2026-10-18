import Image from "next/image";
import Link from "next/link";

function ShieldMark() {
  return <svg viewBox="0 0 48 52" aria-hidden="true" className="shield-mark"><path d="M24 3 42 10v13c0 12-7.2 20-18 26C13.2 43 6 35 6 23V10L24 3Z" fill="currentColor"/><path d="M19 23v-4a5 5 0 0 1 10 0v4m-12 0h14v12H17z" fill="none" stroke="white" strokeWidth="2.8" strokeLinejoin="round"/><circle cx="24" cy="29" r="1.7" fill="white"/></svg>;
}

function TopicIcon({ kind }: { kind: "search" | "link" | "lock" | "alert" }) {
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/><path d="M8.7 10.8h4.2m-2.1-2.1v4.2"/></>,
    link: <><path d="m9.7 14.3-2 2a4.2 4.2 0 0 1-5.9-5.9l4-4a4.2 4.2 0 0 1 5.9 0"/><path d="m14.3 9.7 2-2a4.2 4.2 0 0 1 5.9 5.9l-4 4a4.2 4.2 0 0 1-5.9 0"/><path d="m8.5 15.5 7-7"/></>,
    lock: <><rect x="4" y="10" width="16" height="12" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></>,
    alert: <><path d="m12 3 9.2 16H2.8L12 3Z"/><path d="M12 9v4m0 3h.01"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="topic-icon" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>;
}

const modules = [
  { number: "01", title: "Recognising cyber threats", description: "Learn how to spot phishing, social engineering and other common threats.", time: "8 min", icon: "search" as const, color: "lilac", available: true },
  { number: "02", title: "Safe links and browsing", description: "Check destinations, question suspicious links and browse more safely.", time: "Coming soon", icon: "link" as const, color: "blue", available: false },
  { number: "03", title: "Protecting accounts", description: "Build safer habits with strong passwords and multi-factor authentication.", time: "Coming soon", icon: "lock" as const, color: "mint", available: false },
  { number: "04", title: "Reporting and responding", description: "Know what to do when you notice something suspicious at work.", time: "Coming soon", icon: "alert" as const, color: "gold", available: false },
];

export default function Home() {
  return <main className="landing-page" id="home">
    <header className="site-header">
      <div className="header-inner">
        <Link className="site-brand" href="/" aria-label="CyberSmart Workplace home"><ShieldMark/><span>CyberSmart<small>WORKPLACE</small></span></Link>
        <nav className="main-nav" aria-label="Main navigation"><a className="nav-current" href="#home">Home</a><a href="#learning-path">Courses</a><Link href="/dashboard">Dashboard</Link><a href="#about">About</a></nav>
        <div className="header-actions"><Link className="header-dashboard" href="/sign-in">Sign in</Link><Link className="header-cta" href="/sign-up">Get started</Link></div>
      </div>
    </header>

    <section className="hero-section" aria-labelledby="hero-title">
      <div className="hero-inner">
        <div className="hero-copy">
          <span className="hero-kicker"><span className="kicker-dot"/> Cybersecurity awareness training</span>
          <h1 id="hero-title">Build safer habits.<br/>Work smarter.</h1>
          <p className="hero-description">Practical cybersecurity learning for working professionals. Spot threats, protect your accounts and work with confidence.</p>
          <a className="hero-button" href="#learning-path">Start your learning journey <span aria-hidden="true">→</span></a>
          <div className="hero-facts" aria-label="Course details"><div className="hero-fact"><span className="fact-icon" aria-hidden="true">◷</span><span><strong>4 weeks</strong><small>self-paced learning</small></span></div><span className="fact-divider"/><div className="hero-fact"><span className="fact-icon book-icon" aria-hidden="true">▤</span><span><strong>4 modules</strong><small>practical topics</small></span></div><span className="fact-divider"/><div className="hero-fact"><span className="fact-icon check-icon" aria-hidden="true">✓</span><span><strong>Learn by doing</strong><small>realistic scenarios</small></span></div></div>
        </div>
        <div className="hero-visual"><Image src="/learning-hero-clean.webp" alt="A professional studying cybersecurity at her laptop" width={474} height={408} priority className="hero-image"/></div>
      </div>
    </section>

    <section className="learning-section" id="learning-path" aria-labelledby="learning-title">
      <div className="section-wrap">
        <div className="learning-heading"><div><p className="section-kicker">A clear path to practical skills</p><h2 id="learning-title">Your learning path</h2><p>Four focused modules to help you make safer choices every day.</p></div><Link className="text-link" href="/dashboard">View course overview <span aria-hidden="true">→</span></Link></div>
        <div className="module-grid">{modules.map((module) => <article className="path-card" key={module.number}>
          <div className={`path-icon ${module.color}`}><TopicIcon kind={module.icon}/></div>
          <div className="path-number">{module.number}</div>
          <h3>{module.title}</h3><p>{module.description}</p>
          <div className="path-card-footer"><span className="path-time">{module.available ? "◷" : "·"} &nbsp;{module.time}</span>{module.available ? <Link href="/learn/first-steps" aria-label="Open Recognising cyber threats lesson">Start <span aria-hidden="true">→</span></Link> : <span className="upcoming-label">Planned</span>}</div>
        </article>)}</div>
      </div>
    </section>

    <section className="impact-section" id="about" aria-label="Why cybersecurity awareness matters">
      <div className="impact-intro"><div className="impact-shield"><ShieldMark/></div><div><h2>Small actions. Big impact.</h2><p>Cybersecurity is not just about technology. It is about people making safer choices, every day.</p></div></div>
      <div className="impact-item"><span aria-hidden="true">♢</span><strong>Protect your<br/>accounts</strong></div><div className="impact-item"><span aria-hidden="true">♧</span><strong>Keep colleagues<br/>safer</strong></div><div className="impact-item"><span aria-hidden="true">⌂</span><strong>Help your<br/>organisation</strong></div><div className="impact-item"><span aria-hidden="true">✓</span><strong>Build a safer<br/>work culture</strong></div>
    </section>

    <footer className="site-footer"><div className="footer-top"><Link className="site-brand footer-brand" href="/" aria-label="CyberSmart Workplace home"><ShieldMark/><span>CyberSmart<small>WORKPLACE</small></span></Link><nav aria-label="Footer navigation"><a href="#home">Home</a><a href="#learning-path">Courses</a><Link href="/dashboard">Dashboard</Link><a href="#about">About</a></nav></div><div className="footer-bottom"><span>© 2026 CyberSmart Workplace · Practical learning for safer work</span><span>Learn <i>/</i> Protect <i>/</i> Work smarter</span></div></footer>
  </main>;
}
