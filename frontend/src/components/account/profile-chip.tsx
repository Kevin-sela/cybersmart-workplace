import Link from "next/link";

type ProfileAvatarProps = { name: string; status?: boolean; className?: string };

function getInitials(name: string): string {
  const source = name.includes("@") ? name.split("@")[0].replace(/[._+-]+/g, " ") : name;
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0] ?? "CS").slice(0, 2).toUpperCase();
}

export function ProfileAvatar({ name, status = false, className = "" }: ProfileAvatarProps) {
  return <span className={`profile-chip-avatar ${className}`} aria-hidden="true"><span className="profile-chip-initials">{getInitials(name)}</span>{status && <i className="profile-chip-status"/>}</span>;
}

type ProfileChipProps = {
  name: string;
  badge?: string;
  href?: string;
  onClick?: () => void;
  signedIn?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function ProfileChip({ name, badge = "Learner", href, onClick, signedIn = false, className = "", ariaLabel }: ProfileChipProps) {
  const content = <><ProfileAvatar name={name} status={signedIn}/><span className="account-profile-chip-copy"><span className="account-profile-chip-name">{name}</span><span className="account-profile-chip-badge">{badge}</span></span><svg className="account-profile-chip-chevron" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></>;
  const classNames = `account-profile-chip ${className}`;
  if (href) return <Link className={classNames} href={href} aria-label={ariaLabel ?? `${name}, ${badge}`} title={ariaLabel ?? `${name}, ${badge}`}>{content}</Link>;
  if (onClick) return <button className={classNames} type="button" onClick={onClick} aria-label={ariaLabel ?? `${name}, ${badge}`}>{content}</button>;
  return <div className={classNames} aria-label={ariaLabel}>{content}</div>;
}
