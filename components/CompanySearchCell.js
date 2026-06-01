// ─── COMPANY SEARCH CELL ──────────────────────────────────
// 테이블 셀 안에서 기업명을 검색/선택하는 공통 컴포넌트
function CompanySearchCell({ companies, value, onChange, placeholder }) {
  const { useState, useRef, useEffect } = React;
  const [query,  setQuery]  = useState(value?.name || '');
  const [open,   setOpen]   = useState(false);
  const [filtered, setFiltered] = useState([]);
  const wrapRef = useRef(null);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setFiltered(companies.slice(0, 8)); return; }
    setFiltered(companies.filter(c => c.name.toLowerCase().includes(q)).slice(0, 10));
  }, [query, companies]);

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const fn = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  function select(company) {
    setQuery(company.name);
    setOpen(false);
    onChange(company);
  }

  function handleInput(e) {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value.trim()) onChange(null);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', minWidth: 140 }}>
      <input
        className="form-input"
        style={{ fontSize: 12, padding: '5px 8px' }}
        placeholder={placeholder || '기업명 검색'}
        value={query}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 200,
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          minWidth: 200, maxHeight: 220, overflowY: 'auto',
        }}>
          {filtered.map(c => (
            <div key={c.id}
              onMouseDown={() => select(c)}
              style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,106,0,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontWeight: 500 }}>{c.name}</div>
              {c.industry && <div style={{ fontSize: 10, color: 'var(--text3)' }}>{c.industry}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
