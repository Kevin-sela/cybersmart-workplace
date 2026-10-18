"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { api, UserProfile } from "@/services/api";
import { enablePushNotifications, isPushEnabled, loadOneSignal } from "./push-notifications";
import { ProfileChip } from "@/components/account/profile-chip";

type DashboardHeaderProps = { active?: "overview" | "modules" | "progress" };
type NavItem = { label: string; href: string; icon: "home" | "modules" | "practice" | "discussion" | "settings" | "user" };

const navItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: "home" },
  { label: "Modules", href: "/dashboard/modules", icon: "modules" },
  { label: "Practice", href: "/dashboard/quiz", icon: "practice" },
  { label: "Discussions", href: "/dashboard/forum", icon: "discussion" },
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
];

function Icon({ kind }: { kind: NavItem["icon"] }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    modules: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    practice: <><path d="M4 19V5m0 14h16"/><path d="m7 15 4-4 3 2 5-6"/></>,
    discussion: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.5-.7L4 20l1.4-3.3A7.1 7.1 0 0 1 4 12c0-4.1 3.6-7.5 8-7.5s8 3.1 8 7Z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a7.5 7.5 0 0 0 0-6l1.3-1-1.8-3.1-1.6.7a7.5 7.5 0 0 0-5.2-3L11.8.8h-3.6L8 2.6a7.5 7.5 0 0 0-5.2 3l-1.6-.7L-.6 8l1.3 1a7.5 7.5 0 0 0 0 6l-1.3 1 1.8 3.1 1.6-.7a7.5 7.5 0 0 0 5.2 3l.2 1.8h3.6l.3-1.8a7.5 7.5 0 0 0 5.2-3l1.6.7 1.8-3.1z" transform="translate(2 0) scale(.9)"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>;
}

function Mark() {
  return <svg className="dashboard-mark" viewBox="0 0 40 44" aria-hidden="true"><path d="M20 2 36 8v12c0 10-6.4 17-16 22C10.4 37 4 30 4 20V8L20 2Z" fill="currentColor"/><path d="m13 21 5 5 10-11" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function DashboardHeader({ active }: DashboardHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  useEffect(() => { api.me().then(setUser).catch(() => setUser(null)); }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const updateViewport = () => { setIsMobile(query.matches); setSidebarOpen(!query.matches); };
    updateViewport();
    query.addEventListener("change", updateViewport);
    return () => query.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!sidebarOpen || !isMobile) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSidebarOpen(false); };
    const closeOutside = (event: PointerEvent) => { if (event.target instanceof Node && !menuRef.current?.contains(event.target) && !sidebarRef.current?.contains(event.target)) setSidebarOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => { document.removeEventListener("keydown", closeOnEscape); document.removeEventListener("pointerdown", closeOutside); };
  }, [sidebarOpen, isMobile]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const closeOutside = (event: PointerEvent) => { if (event.target instanceof Node && !notificationsRef.current?.contains(event.target)) setNotificationsOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setNotificationsOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen || !process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) return;
    loadOneSignal().then(() => {
      // OneSignal owns the subscription and permission state after initialization.
      setPushEnabled(isPushEnabled());
    }).catch(() => setPushMessage("Could not connect to the push notification service."));
  }, [notificationsOpen]);

  const turnOnPush = async () => {
    setPushBusy(true);
    setPushMessage("");
    try {
      await enablePushNotifications();
      setPushEnabled(isPushEnabled());
      setPushMessage(isPushEnabled() ? "Push notifications are enabled on this device." : "Permission wasn’t granted. You can change this in your browser settings.");
    } catch (error) {
      setPushMessage(error instanceof Error ? error.message : "Could not enable push notifications.");
    } finally { setPushBusy(false); }
  };

  const isCurrent = (item: NavItem) => pathname ? pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)) : (active === "overview" && item.href === "/dashboard") || (active === "modules" && item.href === "/dashboard/modules") || (active === "progress" && item.href === "/dashboard/progress");

  return <>
    <header className="dashboard-header">
      <div className="dashboard-header-inner">
        <div className="dashboard-menu-control" ref={menuRef}>
          <button className="dashboard-menu-button" type="button" aria-expanded={sidebarOpen} aria-controls="dashboard-learning-sidebar" aria-label={sidebarOpen ? "Close learning navigation" : "Open learning navigation"} onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span className={`hamburger-icon ${sidebarOpen ? "hamburger-open" : ""}`} aria-hidden="true"><i/><i/><i/></span>
          </button>
        </div>
        <Link className="dashboard-brand" href="/" aria-label="CyberSmart Workplace course website" title="Go to the CyberSmart course website"><Mark/><span>CyberSmart<small>WORKPLACE LEARNING</small></span></Link>
        <div className="dashboard-header-actions">
          <div className="dashboard-notification-wrap" ref={notificationsRef}>
            <button type="button" className="dashboard-notification-button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={()=>setNotificationsOpen(!notificationsOpen)}>
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
            </button>
            {notificationsOpen&&<div className="dashboard-notification-popover" role="dialog" aria-label="Notification settings"><strong>Notifications</strong><p>Get course updates and reminders on this device.</p>{process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ? <><button type="button" className="dashboard-push-button" onClick={turnOnPush} disabled={pushBusy || pushEnabled}>{pushBusy ? "Connecting…" : pushEnabled ? "Push notifications enabled" : "Enable push notifications"}</button>{pushMessage&&<small>{pushMessage}</small>}</> : <small>Push setup is pending. Add NEXT_PUBLIC_ONESIGNAL_APP_ID to the frontend environment.</small>}</div>}
          </div>
          <ProfileChip name={user?.full_name ?? "Sign in"} badge={user ? `${user.role[0].toUpperCase()}${user.role.slice(1)}` : "Learner"} href={user ? "/dashboard/profile" : "/sign-in"} signedIn={Boolean(user)} className="dashboard-profile-chip" ariaLabel={user ? `Open ${user.role} profile for ${user.full_name}` : "Sign in to your learner account"}/>
        </div>
      </div>
    </header>
    {isMobile && sidebarOpen && <button className="dashboard-sidebar-scrim" aria-label="Close learning navigation" onClick={() => setSidebarOpen(false)}/>}
    <aside className={`dashboard-sidebar ${sidebarOpen ? "dashboard-sidebar-open" : "dashboard-sidebar-closed"}`} id="dashboard-learning-sidebar" ref={sidebarRef}>
      <div className="dashboard-sidebar-heading"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5.5c3.5-1 6.5-.2 9 2v13c-2.5-2.2-5.5-3-9-2z"/><path d="M21 5.5c-3.5-1-6.5-.2-9 2v13c2.5-2.2 5.5-3 9-2z"/></svg><span>Learning</span></div>
      <nav aria-label="Main learning navigation">{navItems.map(item => <Link key={item.href} href={item.href} className={`dashboard-sidebar-link ${isCurrent(item) ? "dashboard-sidebar-link-active" : ""}`} aria-current={isCurrent(item) ? "page" : undefined} onClick={() => isMobile && setSidebarOpen(false)}><Icon kind={item.icon}/><span>{item.label}</span></Link>)}</nav>
      <div className="dashboard-sidebar-bottom"><span className="sidebar-course-mark"><Mark/></span><span>CYBERSMART<small>WORKPLACE</small></span></div>
    </aside>
  </>;
}
