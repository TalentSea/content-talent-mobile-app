export function getRelativeTimeString(dateString?: string | null): string {
  if (!dateString) return '2 weeks ago';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '2 weeks ago';

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    const years = Math.floor(days / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  } catch (err) {
    return '2 weeks ago';
  }
}

export function formatViews(views?: number): string {
  if (views == null) return '14.2K views';
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K views`;
  }
  return `${views} views`;
}

export function formatDurationString(duration?: string | null): string {
  if (!duration) return '12:00';
  const trimmed = String(duration).trim();
  if (!trimmed) return '12:00';
  if (trimmed.includes(':')) return trimmed;
  const num = parseInt(trimmed, 10);
  if (isNaN(num)) return '12:00';
  const mins = Math.floor(num / 60);
  const secs = num % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
