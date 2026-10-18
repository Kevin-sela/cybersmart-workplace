"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { api, ForumChannel, ForumPost } from "@/services/api";

const channels = [
  { id: "welcome", label: "Welcome", description: "Introductions and course notes" },
  { id: "spot-the-phish", label: "Spot the phish", description: "Compare suspicious message clues" },
  { id: "account-safety", label: "Account safety", description: "Passwords and multi-factor sign-in" },
  { id: "team-response", label: "Team response", description: "What to do when something happens" },
] as const;

type Message = { id: string | number; author: string; initials: string; role: string; body: string; time: string; tone: "facilitator" | "learner" | "local" };

const channelMessages: Record<string, Message[]> = {
  welcome: [
    { id: 1, author: "Course facilitator", initials: "CF", role: "Facilitator", body: "Welcome to the CyberSmart learning space. Use these channels to discuss the examples and share practical questions.", time: "Today · 9:30 AM", tone: "facilitator" },
    { id: 2, author: "Course facilitator", initials: "CF", role: "Discussion prompt", body: "When you receive an unexpected request at work, what is the first thing you usually check?", time: "Today · 9:32 AM", tone: "facilitator" },
  ],
  "spot-the-phish": [
    { id: 1, author: "Course facilitator", initials: "CF", role: "Facilitator", body: "What details would make you pause before opening a message? Consider the sender, unexpected urgency, and where a link leads.", time: "Today · 9:30 AM", tone: "facilitator" },
    { id: 2, author: "Course participant", initials: "CP", role: "Learner", body: "I would check whether the sender address matches the person or organisation they claim to be.", time: "Today · 9:38 AM", tone: "learner" },
    { id: 3, author: "Course facilitator", initials: "CF", role: "Facilitator", body: "Good clue. It also helps to verify unusual requests through a separate, trusted contact method.", time: "Today · 9:41 AM", tone: "facilitator" },
  ],
  "account-safety": [
    { id: 1, author: "Course facilitator", initials: "CF", role: "Facilitator", body: "What makes a sign-in request or password reset message worth checking before you act?", time: "Today · 9:30 AM", tone: "facilitator" },
    { id: 2, author: "Course participant", initials: "CP", role: "Learner", body: "A request I did not start, especially if it asks me to share a verification code, would be a warning sign.", time: "Today · 9:36 AM", tone: "learner" },
  ],
  "team-response": [
    { id: 1, author: "Course facilitator", initials: "CF", role: "Facilitator", body: "If you think you opened a suspicious link, what information would help your support team respond?", time: "Today · 9:30 AM", tone: "facilitator" },
    { id: 2, author: "Course participant", initials: "CP", role: "Learner", body: "I would note the time, the message, and what I clicked, then report it using the approved channel.", time: "Today · 9:35 AM", tone: "learner" },
  ],
};

function ForumIcon({ kind }: { kind: "hash" | "plus" | "send" | "people" | "info" }) {
  const paths = {
    hash: <path d="M4 9h16M3 15h16M10 3 8 21M16 3l-2 18"/>,
    plus: <path d="M12 5v14m-7-7h14"/>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1zM16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.5V20h-3"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>;
}

export default function ForumPage() {
  const [activeChannel, setActiveChannel] = useState<string>("spot-the-phish");
  const [liveChannels, setLiveChannels] = useState<ForumChannel[]>(channels.map((item, index) => ({ ...item, module_week: index + 1 })));
  const [serverPosts, setServerPosts] = useState<ForumPost[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  useEffect(() => { api.discussionChannels().then(items => { if (items.length) { setLiveChannels(items); setActiveChannel(current => items.some(item => item.id === current) ? current : items[0].id); } }).catch(e => setError(e instanceof Error ? e.message : "Sign in to join the discussion.")); }, []);
  useEffect(() => { setServerPosts(null); api.discussionPosts(activeChannel).then(setServerPosts).catch(e => { setServerPosts([]); setError(e instanceof Error ? e.message : "Messages could not be loaded."); }); }, [activeChannel]);
  const channel = liveChannels.find(item => item.id === activeChannel) ?? liveChannels[1] ?? liveChannels[0];
  const messages: Message[] = serverPosts === null ? (channelMessages[activeChannel] ?? []) : serverPosts.map((post: ForumPost) => ({ id: post.id, author: post.author, initials: post.author.slice(0, 2).toUpperCase(), role: post.role, body: post.body, time: new Date(post.created_at).toLocaleString(), tone: "learner" }));

  async function postMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setPosting(true); setError("");
    try { const saved = await api.sendDiscussionPost(activeChannel, body); setServerPosts(current => [...(current ?? []), saved]); setDraft(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Your post could not be sent."); }
    finally { setPosting(false); }
  }

  return <div className="dashboard-page"><DashboardHeader/><main className="dashboard-main detail-page forum-page">
    <div className="dashboard-breadcrumb"><Link href="/dashboard">Overview</Link><span aria-hidden="true">/</span><strong>Discussions</strong></div>
    <section className="forum-workspace" aria-label="Course discussion forum">
      <aside className="forum-channel-rail">
        <div className="forum-course-heading"><span className="forum-course-icon"><ForumIcon kind="people"/></span><div><strong>Learning community</strong><small>CyberSmart course</small></div></div>
        <div className="forum-channel-heading"><span>CHANNELS</span><button type="button" aria-label="Add a channel" title="Channels are managed by your facilitator"><ForumIcon kind="plus"/></button></div>
        <nav aria-label="Discussion channels">{liveChannels.map(item=><button type="button" key={item.id} onClick={()=>setActiveChannel(item.id)} className={`forum-channel-button ${activeChannel===item.id?"forum-channel-active":""}`} aria-current={activeChannel===item.id?"page":undefined}><ForumIcon kind="hash"/><span>{item.label}</span></button>)}</nav>
        <div className="forum-rail-footer"><span className="forum-online-dot"/>Course preview</div>
      </aside>

      {channel && <section className="forum-chat-panel" aria-label={`${channel.label} chat`}>
        <header className="forum-chat-header"><span className="forum-channel-hash"><ForumIcon kind="hash"/></span><div><h1>{channel.label}</h1><p>{channel.description}</p></div><span className="forum-chat-online"><i/>Discussion open</span></header>
        {error && <p className="account-error" role="alert">{error}{error.toLowerCase().includes("sign in") && <> <Link href="/sign-in?next=%2Fdashboard%2Fforum">Sign in</Link></>}</p>}
        <div className="forum-message-list" aria-live="polite">
          <div className="forum-day-divider"><span>WELCOME TO #{channel.label.toUpperCase()}</span></div>
          {serverPosts?.length === 0 && <p className="forum-empty-state">No messages yet. Start the conversation with a course question or observation.</p>}
          {messages.map(message=><article key={message.id} className={`forum-message forum-message-${message.tone}`}>
            <span className={`forum-message-avatar forum-avatar-${message.tone}`}>{message.initials}</span>
            <div className="forum-message-body"><div className="forum-message-meta"><strong>{message.author}</strong><span className="forum-role-tag">{message.role}</span><time>{message.time}</time></div><p>{message.body}</p></div>
          </article>)}
        </div>
        <form className="forum-composer" onSubmit={postMessage}><label className="sr-only" htmlFor="forum-message">Message #{channel.label}</label><textarea id="forum-message" rows={2} maxLength={2000} value={draft} onChange={event=>setDraft(event.target.value)} placeholder={`Message #${channel.label}`} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();event.currentTarget.form?.requestSubmit();}}}/><div className="forum-composer-footer"><span>Enter to send · Shift + Enter for a new line</span><button type="submit" disabled={!draft.trim()||posting} aria-label="Send message">{posting?"…":<ForumIcon kind="send"/>}</button></div></form>
      </section>}

      <aside className="forum-details-panel"><div className="forum-details-title"><ForumIcon kind="info"/><h2>About this channel</h2></div><h3>{channel.label}</h3><p>{channel.description}. Share questions and practical ideas related to your course.</p><div className="forum-detail-rule"/><div className="forum-detail-members"><ForumIcon kind="people"/><strong>Course participants</strong><span>Facilitator and learners</span></div><div className="forum-details-note">Be respectful. Avoid sharing personal or sensitive workplace information.</div><Link className="forum-return-link" href="/dashboard">Back to overview <span aria-hidden="true">→</span></Link></aside>
    </section>
  </main></div>;
}
