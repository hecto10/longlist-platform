// ─── COMPANY SEARCH CELL ──────────────────────────────────
// 테이블 셀 안에서 기업명을 검색/선택하는 공통 컴포넌트
// 드롭다운은 position:fixed + 좌표 계산으로 부모의 overflow/max-height를 완전히 벗어납니다.
function CompanySearchCell({ companies, value, onChange, placeholder }) {
  const { useState, useRef, useEffect, useLayoutEffect } = React;
  const [query,    setQuery]    = useState(value?.name || '');
  const [open,     setOpen]     = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [coords,   setCoords]   = useState({ top: 0, left: 0, width: 140 });
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setFiltered(companies.slice(0, 8)); return; }
    setFiltered(companies.filter(c => c.name.toLowerCase().includes(q)).slice(0, 8));
  }, [query, companies]);

  // 드롭다운 열릴 때 + 스크롤/리사이즈 시 위치 재계산
  useLayoutEffect(() => {
    if (!open) return;
    function updatePosition() {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = window.innerHeight - rect.bottom;
      const maxH = 280;
      // 아래 공간이 부족하면 위로 펼침
      const openUpward = spaceBelow < maxH && rect.top > maxH;
      setCoords({
        top:   openUpward ? rect.top - 4 : rect.bottom + 4,
        left:  rect.left,
        width: Math.max(rect.width, 220),
        openUpward,
      });
    }
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, filtered.length]);

  // 외부 클릭 닫기 (input + 드롭다운 둘 다 체크)
  useEffect(() => {
    if (!open) return;
    const fn = e => {
      if (wrapRef.current?.contains(e.target)) return;
      if (e.target.closest?.('[data-company-search-dropdown]')) return;
      setOpen(false);
    };
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

  const dropdown = open && filtered.length > 0 && (
    <div
      data-company-search-dropdown
      style={{
        position: 'fixed',
        top: coords.openUpward ? 'auto' : coords.top,
        bottom: coords.openUpward ? (window.innerHeight - coords.top) : 'auto',
        left: coords.left,
        width: coords.width,
        zIndex: 9999,
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        maxHeight: 280, overflowY: 'auto',
      }}
    >
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
  );

  return (
    <div ref={wrapRef} style={{ position: 'relative', minWidth: 140 }}>
      <input
        ref={inputRef}
        className="form-input"
        style={{ fontSize: 12, padding: '5px 8px' }}
        placeholder={placeholder || '기업명 검색'}
        value={query}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {dropdown && ReactDOM.createPortal(dropdown, document.body)}
    </div>
  );
}
