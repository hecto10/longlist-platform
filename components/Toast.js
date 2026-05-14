// ─── UTILS ───────────────────────────────────────────────
function fmt(v) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (isNaN(n)) return v;
  if (Math.abs(n) >= 1000) return (n/1000).toFixed(1) + '조';
  return n.toLocaleString('ko-KR', {maximumFractionDigits:1}) + '억';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ko-KR', {year:'numeric',month:'2-digit',day:'2-digit'});
}

function calcChange(curr, prev) {
  if (curr == null || prev == null || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev) * 100).toFixed(1);
}

function getStatusBadge(status) {
  if (!status || status === 'X' || status === '-') return null;
  if (status.includes('완료') || status.includes('진행중')) return <span className="status-badge status-ongoing">{status}</span>;
  if (status.includes('종결')) return <span className="status-badge status-closed">{status}</span>;
  if (status.includes('보류')) return <span className="status-badge status-hold">{status}</span>;
  if (status.includes('검토')) return <span className="status-badge status-ongoing">{status}</span>;
  return <span className="status-badge status-hold">{status}</span>;
}

function getListingBadge(s) {
  if (!s) return null;
  if (s.includes('코스피') || s.includes('코스닥')) return <span className="listing-badge listing-kospi">{s}</span>;
  if (s.includes('외감X')) return <span className="listing-badge listing-private">{s}</span>;
  return <span className="listing-badge listing-private-audit">{s}</span>;
}

// ─── TOAST ───────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  const { useEffect } = React;
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, []);
  return <div className={`toast ${type}`}>{type === 'success' ? '✓ ' : '✗ '}{msg}</div>;
}
