"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { api, ForumChannel, ForumPost } from "@/services/api";

type Message = { id: string; author: string; initials: string; role: string; body: string; time: string; isMine: boolean };

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
  const [activeChannel, setActiveChannel] = useState("");
  const [liveChannels, setLiveChannels] = useState<ForumChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [serverPosts, setServerPosts] = useState<ForumPost[] | null>(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const [channelFormOpen, setChannelFormOpen] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [channelLabel, setChannelLabel] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [notice, setNotice] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    api.discussionChannels()
      .then(items => {
        setLiveChannels(items);
        setActiveChannel(current => items.some(item => item.id === current) ? current : items[0]?.id ?? "");
      })
      .catch(e => setError(e instanceof Error ? e.message : "Discussion channels could not be loaded."))
      .finally(() => setChannelsLoading(false));
  }, []);
  useEffect(() => {
    if (!activeChannel) { setServerPosts([]); setPostsLoading(false); return; }
    let current = true;
    setServerPosts(null);
    setPostsLoading(true);
    setError("");
    api.discussionPosts(activeChannel)
      .then(items => { if (current) setServerPosts(items); })
      .catch(e => { if (current) { setServerPosts([]); setError(e instanceof Error ? e.message : "Messages could not be loaded."); } })
      .finally(() => { if (current) setPostsLoading(false); });
    return () => { current = false; };
  }, [activeChannel]);
  const channel = liveChannels.find(item => item.id === activeChannel);
  useEffect(() => { api.me().then(user => setCurrentUserId(user.id)).catch(() => setCurrentUserId("")); }, []);
  useEffect(() => {
    setMessages((serverPosts ?? []).map(post => ({
      id: post.id,
      author: post.author,
      initials: post.author.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase(),
      role: post.role,
      body: post.body,
      time: new Date(post.created_at).toLocaleString(),
      isMine: post.author_id === currentUserId,
    })));
  }, [serverPosts, currentUserId]);
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "end" });
  }, [activeChannel, messages.length]);

  async function createChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!channelLabel.trim() || !channelDescription.trim()) return;
    setCreatingChannel(true); setError(""); setNotice("");
    try {
      const created = await api.createDiscussionChannel({ label: channelLabel.trim(), description: channelDescription.trim() });
      setLiveChannels(current => [...current, created].sort((left, right) => left.module_week - right.module_week));
      setActiveChannel(created.id);
      setChannelLabel(""); setChannelDescription("");
      setChannelFormOpen(false);
      setNotice("Channel “" + created.label + "” created.");
    } catch (e) { setError(e instanceof Error ? e.message : "The channel could not be created."); }
    finally { setCreatingChannel(false); }
  }

  async function postMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setPosting(true); setError(""); setNotice("");
    try { const saved = await api.sendDiscussionPost(activeChannel, body); setServerPosts(current => [...(current ?? []), saved]); setDraft(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Your post could not be sent."); }
    finally { setPosting(false); }
  }

  return <div className="dashboard-page"><DashboardHeader/><main className="dashboard-main detail-page forum-page">
    <div className="dashboard-breadcrumb"><Link href="/dashboard">Overview</Link><span aria-hidden="true">/</span><strong>Discussions</strong></div>
    <section className="forum-workspace" aria-label="Course discussion forum">
      <aside className="forum-channel-rail">
        <div className="forum-course-heading"><span className="forum-course-icon"><ForumIcon kind="people"/></span><div><strong>Learning community</strong><small>CyberSmart course</small></div></div>
        <div className="forum-channel-heading"><span>CHANNELS</span><button type="button" aria-label={channelFormOpen ? "Close channel form" : "Create a channel"} aria-expanded={channelFormOpen} onClick={() => { setChannelFormOpen(value => !value); setError(""); }} title="Create a discussion channel"><ForumIcon kind="plus"/></button></div>
        {channelFormOpen && <form className="forum-channel-form" onSubmit={createChannel}>
          <label htmlFor="forum-channel-name">Channel name</label>
          <input id="forum-channel-name" value={channelLabel} onChange={event => setChannelLabel(event.target.value)} maxLength={60} placeholder="e.g. Safe browsing" required autoFocus />
          <label htmlFor="forum-channel-description">What is it for?</label>
          <textarea id="forum-channel-description" value={channelDescription} onChange={event => setChannelDescription(event.target.value)} maxLength={240} rows={2} placeholder="Add a short description" required />
          <div><button type="button" onClick={() => setChannelFormOpen(false)} disabled={creatingChannel}>Cancel</button><button type="submit" disabled={creatingChannel || !channelLabel.trim() || !channelDescription.trim()}>{creatingChannel ? "Creating…" : "Create channel"}</button></div>
        </form>}
        {channelsLoading ? <p className="forum-channel-status" role="status">Loading channels…</p> : liveChannels.length ? <nav aria-label="Discussion channels">{liveChannels.map(item=><button type="button" key={item.id} onClick={()=>setActiveChannel(item.id)} className={`forum-channel-button ${activeChannel===item.id?"forum-channel-active":""}`} aria-current={activeChannel===item.id?"page":undefined}><ForumIcon kind="hash"/><span>{item.label}</span></button>)}</nav> : <p className="forum-channel-status" role="status">No discussion channels are available.</p>}
        <div className="forum-rail-footer"><span className="forum-online-dot"/>Course discussion</div>
      </aside>

      {channel ? <section className="forum-chat-panel" aria-label={`${channel.label} chat`}>
        <header className="forum-chat-header"><span className="forum-channel-hash"><ForumIcon kind="hash"/></span><div><h1>{channel.label}</h1><p>{channel.description}</p></div><span className="forum-chat-online"><i/>Discussion open</span></header>
        {error && <p className="account-error" role="alert">{error}{error.toLowerCase().includes("sign in") && <> <Link href="/sign-in?next=%2Fdashboard%2Fforum">Sign in</Link></>}</p>}
        {notice && <p className="forum-notice" role="status">{notice}</p>}
        <div className="forum-message-list" aria-live="polite">
          <div className="forum-day-divider"><span>CONVERSATION</span></div>
          {postsLoading && <p className="forum-empty-state" role="status">Loading messages…</p>}
          {!postsLoading && serverPosts?.length === 0 && <p className="forum-empty-state">No messages yet. Start the conversation.</p>}
          {messages.map(message=><article key={message.id} className={"forum-message " + (message.isMine ? "forum-message-own" : "forum-message-other")}>
            {!message.isMine && <span className="forum-message-avatar">{message.initials}</span>}
            <div className="forum-message-body"><div className="forum-message-meta"><strong>{message.isMine ? "You" : message.author}</strong>{!message.isMine && <span className="forum-role-tag">{message.role}</span>}<time>{message.time}</time></div><p className="forum-message-bubble">{message.body}</p></div>
          </article>)}
          <div ref={messageEndRef} aria-hidden="true" />
        </div>
        <form className="forum-composer" onSubmit={postMessage}><label className="sr-only" htmlFor="forum-message">Message #{channel.label}</label><textarea id="forum-message" rows={2} maxLength={2000} value={draft} onChange={event=>setDraft(event.target.value)} placeholder={`Message #${channel.label}`} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();event.currentTarget.form?.requestSubmit();}}}/><div className="forum-composer-footer"><span>Enter to send · Shift + Enter for a new line</span><button type="submit" disabled={!draft.trim()||posting} aria-label="Send message">{posting?"…":<ForumIcon kind="send"/>}</button></div></form>
      </section> : <section className="forum-chat-panel forum-no-channel" role="status">{channelsLoading ? "Loading discussions…" : error || "No discussion channels are available."}{error.toLowerCase().includes("sign in") && <> <Link href="/sign-in?next=%2Fdashboard%2Fforum">Sign in</Link></>}</section>}

      {channel && <aside className="forum-details-panel"><div className="forum-details-title"><ForumIcon kind="info"/><h2>About this channel</h2></div><h3>{channel.label}</h3><p>{channel.description}. Share questions and practical ideas related to your course.</p><div className="forum-detail-rule"/><div className="forum-detail-members"><ForumIcon kind="people"/><strong>Course participants</strong><span>Facilitator and learners</span></div><div className="forum-details-note">Be respectful. Avoid sharing personal or sensitive workplace information.</div><Link className="forum-return-link" href="/dashboard">Back to overview <span aria-hidden="true">→</span></Link></aside>}
    </section>
  </main></div>;
}
