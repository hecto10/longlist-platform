// ─── REQUEST LINK SECTION ─────────────────────────────────
// admin 전용 — 모달 하단에 삽입하는 요청 연결 UI
function RequestLinkSection({ requestType, companyId, onSelect }) {
  const { useState, useEffect } = React;
  const [mode,     setMode]     = useState('none'); // 'none' | 'linked'
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (mode !== 'linked') { setRequests([]); setSelected(''); return; }
    setLoading(true);
    requestService.fetchPendingByType(requestType, companyId || null)
      .then(data => setRequests(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mode]);

  useEffect(() => {
    onSelect(mode === 'linked' ? selected : '');
  }, [mode, selected]);

  function makeRequestLabel(r) {
    const date = new Date(r.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

    if (r.request_type === 'UPDATE_FINANCIALS' || r.request_type === 'UPDATE_VALUATION') {
      const updateType = r.payload?.update_type;
      const snapshot   = r.payload?.old_snapshot;

      let typeStr = updateType === 'new' ? '최신 데이터 업데이트'
                  : updateType === 'fix' ? '기존 데이터 수정'
                  : '업데이트 요청';

      let rowStr = '';
      if (updateType === 'fix' && snapshot) {
        if (r.request_type === 'UPDATE_FINANCIALS') {
          const parts = [
            snapshot.fiscal_date?.slice(0, 4),
            snapshot.quarter,
            snapshot.revenue        != null && `매출 ${Number(snapshot.revenue).toLocaleString()}억`,
            snapshot.operating_profit != null && `영업이익 ${Number(snapshot.operating_profit).toLocaleString()}억`,
          ].filter(Boolean);
          rowStr = parts.join(' / ');
        } else {
          const parts = [
            snapshot.valuation_date?.slice(0, 10),
            snapshot.valuation  != null && `기업가치 ${Number(snapshot.valuation).toLocaleString()}억`,
            snapshot.pe_multiple != null && `P/E ${snapshot.pe_multiple}x`,
          ].filter(Boolean);
          rowStr = parts.join(' / ');
        }
      }

      const purposes = (r.request_purposes || []).join(', ');
      return [
        `${r.requester_name} · ${date}`,
        typeStr,
        rowStr,
        purposes,
      ].filter(Boolean).join(' · ');
    }

    // ADD_COMPANY — 기존 방식
    const purposes = (r.request_purposes || []).join(', ');
    return `${r.requester_name} · ${date}${purposes ? ' · ' + purposes : ''}`;
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        요청 연결 <span style={{ fontWeight: 400, color: 'var(--text3)', textTransform: 'none', letterSpacing: 0 }}>(선택)</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: mode === 'linked' ? 10 : 0 }}>
        {[['none', '일반 작업'], ['linked', '요청 기반 작업']].map(([val, label]) => (
          <button key={val} type="button" onClick={() => setMode(val)}
            style={{
              fontSize: 12, padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
              background: mode === val ? 'rgba(255,106,0,0.1)' : 'var(--bg3)',
              border: `1px solid ${mode === val ? 'rgba(255,106,0,0.4)' : 'var(--border)'}`,
              color: mode === val ? 'var(--accent)' : 'var(--text2)',
              fontWeight: mode === val ? 600 : 400,
            }}>{label}</button>
        ))}
      </div>
      {mode === 'linked' && (
        loading ? (
          <div style={{ fontSize: 12, color: 'var(--text3)', padding: '6px 0' }}>불러오는 중...</div>
        ) : requests.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text3)', padding: '6px 0' }}>연결 가능한 pending 요청이 없습니다</div>
        ) : (
          <select className="form-input" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">요청 선택 (선택 안 하면 일반 저장)</option>
            {requests.map(r => (
              <option key={r.id} value={r.id}>{makeRequestLabel(r)}</option>
            ))}
          </select>
        )
      )}
    </div>
  );
}
