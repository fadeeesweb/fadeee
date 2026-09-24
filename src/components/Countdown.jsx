import useNow from '../hooks/useNow.js';
import { formatDuration } from '../lib/format.js';

export default function Countdown({ target, className = '' }) {
  const now = useNow(1000);
  const remaining = Math.max(0, (target || 0) - now);
  return <span className={`countdown ${className}`.trim()}>{formatDuration(remaining)}</span>;
}
