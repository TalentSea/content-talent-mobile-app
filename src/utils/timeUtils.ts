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
  if (views == null || isNaN(views) || views < 0) return '0 views';
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K views`;
  }
  return `${views} ${views === 1 ? 'view' : 'views'}`;
}

export function formatLikes(likes?: number): string {
  if (likes == null || likes <= 0) return '0';
  if (likes >= 1000000) {
    return `${(likes / 1000000).toFixed(1)}M`;
  }
  if (likes >= 1000) {
    return `${(likes / 1000).toFixed(1)}K`;
  }
  return `${likes}`;
}

export function formatDurationString(duration?: string | number | null): string {
  if (duration == null) return '00:00';
  const trimmed = String(duration).trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return '00:00';

  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map(p => p.trim());
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10) || 0;
      const s = parseInt(parts[1], 10) || 0;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const s = parseInt(parts[2], 10) || 0;
      if (h === 0) {
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return trimmed;
  }

  const num = parseFloat(trimmed);
  if (isNaN(num) || num < 0) return '00:00';
  const totalSeconds = Math.floor(num);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
