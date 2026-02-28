export function formatRelative(dateString: string | null) {
  if (!dateString) return "never";

  const ms = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatTimestamp(dateString: string | null) {
  if (!dateString) return "n/a";
  return new Date(dateString).toLocaleString();
}
