export function formatDuration(ms) {
  let remaining = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(remaining / 3600);
  remaining -= hours * 3600;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining - minutes * 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDateTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return '';
  }
}

export function truncate(text, length = 90) {
  const value = String(text ?? '');
  if (value.length <= length) return value;
  return `${value.slice(0, length)}…`;
}
