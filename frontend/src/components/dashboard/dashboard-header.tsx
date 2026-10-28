"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BookOpenText, Dumbbell, Home, MessagesSquare, Search, Settings, UserCircle2 } from "lucide-react";

import { api, UserProfile } from "@/services/api";
import { enablePushNotifications, isPushEnabled, loadOneSignal } from "./push-notifications";
import { ProfileChip } from "@/components/account/profile-chip";
import { COURSE_MODULES } from "@/lib/course";


type DashboardHeaderProps = { active?: "overview" | "modules" | "progress" };
type NavItem = { label: string; href: string; icon: "home" | "modules" | "practice" | "discussion" | "settings" | "user" };

const navItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: "home" },
  { label: "Modules", href: "/dashboard/modules", icon: "modules" },
  { label: "Practice", href: "/dashboard/quiz", icon: "practice" },
  { label: "Discussions", href: "/dashboard/forum", icon: "discussion" },
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
];

function Mark() {
  return (
    <svg viewBox="0 0 48 52" aria-hidden="true" className="dashboard-mark"><path d="M24 3 42 10v13c0 12-7.2 20-18 26C13.2 43 6 35 6 23V10L24 3Z" fill="currentColor"/><path d="M19 23v-4a5 5 0 0 1 10 0v4m-12 0h14v12H17z" fill="none" stroke="white" strokeWidth="2.8" strokeLinejoin="round"/><circle cx="24" cy="29" r="1.7" fill="white"/></svg>
  );
}

function Icon({ kind }: { kind: NavItem["icon"] }) {
  const className = "h-4 w-4";
  switch (kind) {
    case "home":
      return <Home className={className} />;
    case "modules":
      return <BookOpenText className={className} />;
    case "practice":
      return <Dumbbell className={className} />;
    case "discussion":
      return <MessagesSquare className={className} />;
    case "settings":
      return <Settings className={className} />;
    case "user":
      return <UserCircle2 className={className} />;
    default:
      return <Home className={className} />;
  }
}

export function DashboardHeader({ active }: DashboardHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.me().then(value => { if (mounted) setUser(value); }).catch(() => { if (mounted) setUser(null); }).finally(() => { if (mounted) setUserLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSidebarOpen(false); };
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target) && !sidebarRef.current?.contains(event.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => { document.removeEventListener("keydown", closeOnEscape); document.removeEventListener("pointerdown", closeOutside); };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const closeOutside = (event: PointerEvent) => { if (event.target instanceof Node && !notificationsRef.current?.contains(event.target)) setNotificationsOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setNotificationsOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const closeOutside = (event: PointerEvent) => { if (event.target instanceof Node && !searchRef.current?.contains(event.target)) setSearchOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSearchOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, [searchOpen]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    if (!notificationsOpen || !process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) return;
    loadOneSignal().then(() => setPushEnabled(isPushEnabled())).catch(() => setPushMessage("Could not connect to the push notification service."));
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
    } finally {
      setPushBusy(false);
    }
  };

  const isCurrent = (item: NavItem) => pathname
    ? pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
    : (active === "overview" && item.href === "/dashboard");
  const searchItems = useMemo(() => [
    ...navItems.map(item => ({ label: item.label, detail: "CyberSmart section", href: item.href })),
    ...COURSE_MODULES.map(item => ({ label: item.title, detail: item.detail, href: item.href })),
  ], []);
  const searchResults = searchValue.trim()
    ? searchItems.filter(item => `${item.label} ${item.detail}`.toLowerCase().includes(searchValue.trim().toLowerCase())).slice(0, 6)
    : [];

  return (
    <>
      <header className="dashboard-header sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="dashboard-header-inner mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="dashboard-header-left flex items-center gap-3">
            <div className="dashboard-menu-control" ref={menuRef}>
              <button
                type="button"
                className="dashboard-menu-button"
                aria-expanded={sidebarOpen}
                aria-controls="dashboard-learning-sidebar"
                aria-label={sidebarOpen ? "Close learning navigation" : "Open learning navigation"}
                onClick={() => setSidebarOpen((value) => !value)}
              >
                <span className={`hamburger-icon ${sidebarOpen ? "hamburger-open" : ""}`}>
                  <span className={`block h-0.5 w-4 rounded-full bg-current transition ${sidebarOpen ? "translate-y-1.5 rotate-45" : ""}`} />
                  <span className={`block h-0.5 w-4 rounded-full bg-current transition ${sidebarOpen ? "opacity-0" : ""}`} />
                  <span className={`block h-0.5 w-4 rounded-full bg-current transition ${sidebarOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
                </span>
              </button>
              {sidebarOpen && (
                <aside
                  className="dashboard-menu-popover"
                  id="dashboard-learning-sidebar"
                  ref={sidebarRef}
                >
                  <div className="menu-popover-heading"><Mark /><div><strong>CyberSmart</strong><small>WORKPLACE</small></div></div>
                  <p className="menu-section-label">LEARNING</p>
                  <nav className="dashboard-menu-list" aria-label="Main learning navigation">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`menu-item ${
                          isCurrent(item)
                            ? "menu-item-active"
                            : ""
                        }`}
                      >
                        <Icon kind={item.icon} />
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </aside>
              )}
            </div>

            <Link href="/" className="dashboard-brand flex items-center gap-3 text-foreground no-underline">
              <Mark />
              <div className="leading-none">
                <span className="block text-sm font-bold tracking-tight">CyberSmart</span>
                <small className="mt-1 block text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">WORKPLACE</small>
              </div>
            </Link>
          </div>

          <div className="dashboard-search-wrap" ref={searchRef}>
            <form className="dashboard-search" role="search" onSubmit={event => { event.preventDefault(); if (searchResults[0]) { router.push(searchResults[0].href); setSearchOpen(false); } }}>
              <Search className="dashboard-search-icon" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="search"
                role="combobox"
                aria-autocomplete="list"
                aria-label="Search lessons and sections"
                aria-controls="dashboard-search-results"
                aria-expanded={searchOpen && searchValue.trim().length > 0}
                placeholder="Search lessons and sections"
                value={searchValue}
                onFocus={() => setSearchOpen(true)}
                onChange={event => { setSearchValue(event.target.value); setSearchOpen(true); }}
              />
              <kbd>Ctrl K</kbd>
            </form>
            {searchOpen && searchValue.trim() && <div className="dashboard-search-results" id="dashboard-search-results" role="listbox" aria-label="Search results">
              {searchResults.length ? searchResults.map(item => <Link key={`${item.href}-${item.label}`} href={item.href} role="option" onClick={() => setSearchOpen(false)}><span>{item.label}</span><small>{item.detail}</small></Link>) : <p>No matching lessons or sections.</p>}
            </div>}
          </div>

          <div className="dashboard-header-actions flex items-center gap-3" ref={notificationsRef}>
            <div className="relative">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/30 hover:text-primary"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((value) => !value)}
              >
                <Bell className="h-4 w-4" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full z-50 mt-3 w-72 rounded-xl border border-border bg-card p-4 shadow-lg">
                  <div className="mb-3">
                    <p className="text-sm font-semibold">Notifications</p>
                    <p className="mt-1 text-xs text-muted-foreground">Get course updates and reminders.</p>
                  </div>
                  <button
                    type="button"
                    onClick={turnOnPush}
                    disabled={pushBusy}
                    className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {pushBusy ? "Enabling…" : pushEnabled ? "Push enabled" : "Enable notifications"}
                  </button>
                  {pushMessage && <p className="mt-3 text-xs text-muted-foreground">{pushMessage}</p>}
                </div>
              )}
            </div>

            {userLoading ? (
              <span className="h-9 w-9 animate-pulse rounded-full bg-muted" aria-label="Loading account" />
            ) : (
              <ProfileChip name={user?.full_name ?? "Sign in"} badge={user ? `${user.role[0].toUpperCase()}${user.role.slice(1)}` : "Guest"} />
            )}
          </div>
        </div>
      </header>
    </>
  );
}
