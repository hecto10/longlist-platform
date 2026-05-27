// ─── UPDATE REQUEST MODAL ─────────────────────────────────
function UpdateRequestModal({ session, profile, company, requestType, onClose, onSave }) {
  const { useState, useEffect } = React;

  const PURPOSE_OPTIONS = [
    '경쟁사 분석', 'M&A/투자 검토', '제휴/시너지 검토', '시장/산업 리서치', '기타',
  ];

  const typeLabel = {
    UPDATE_FINANCIALS: '재무실적 업데이트',
    UPDATE_VALUATION:  '기업가치 업데이트',
  }[requestType] || requestType;

  const [updateType,    setUpdateType]    = useState('');   // 'new' | 'fix'
  const [existingRows,  setExistingRows]  = useState([]);
  const [selectedRowId, setSelectedRowId] = useState('');
  const [loadingRows,   setLoadingRows]   = useState(false);
  const [purposes,      setPurposes]      = useState([]);
  const [etcMemo,       setEtcMemo]       = useState('');
  const [memo,          setMemo]          = useState('');
  const [loading,       setLoading]       = useState(false);

  // 기존 데이터 수정 선택 시 row 목록 로드
  useEffect(() => {
    if (updateType !== 'fix') { setExistingRows([]); setSelectedRowId(''); return; }
    setLoadingRows(true);
    const fetch = requestType === 'UPDATE_FINANCIALS'
      ? companyService.fetchFinancialsByCompany(company.id)
      : companyService.fetchValuationsByCompany(company.id);
    fetch
      .then(rows => setExistingRows(rows))
      .catch(() => {})
      .finally(() => setLoadingRows(false));
  }, [updateType]);

  function togglePurpose(p) {
    setPurposes(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  // row label 가공
  function makeRowLabel(row) {
    if (requestType === 'UPDATE_FINANCIALS') {
      const parts = [];
      if (row.fiscal_date) parts.push(row.fiscal_date.slice(0, 4));
      if (row.quarter)     parts.push(row.quarter);
      if (row.revenue)     parts.push(`매출 ${Number(row.revenue).toLocaleString()}억`);
      if (row.operating_profit != null) parts.push(`영업이익 ${Number(row.operating_profit).toLocaleString()}억`);
      return parts.join(' / ') || row.id;
    } else {
      const parts = [];
      if (row.valuation_date) parts.push(row.valuation_date.slice(0, 10));
      if (row.valuation)      parts.push(`기업가치 ${Number(row.valuation).toLocaleString()}억`);
      if (row.pe_multiple)    parts.push(`P/E ${row.pe_multiple}x`);
      return parts.join(' / ') || row.id;
    }
  }

  const canSubmit = updateType !== '' && purposes.length > 0 &&
    (updateType === 'new' || (updateType === 'fix' && selectedRowId !== ''));

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const purposeList = purposes.includes('기타') && etcMemo.trim()
        ? purposes.map(p => p === '기타' ? `기타: ${etcMemo.trim()}` : p)
        : purposes;

      const selectedRow = existingRows.find(r => String(r.id) === selectedRowId);
      const payload = {
        update_type: updateType,
        ...(updateType === 'fix' && selectedRow ? {
          target_id:    String(selectedRow.id),
          old_snapshot: selectedRow,
        } : {}),
      };

      await requestService.insertRequest({
        request_type:     requestType,
        requester_id:     session.user.id,
        requester_name:   profile?.name || session.user.email,
        company_id:       String(company.id),
        company_name:     company.name,
        payload,
        request_purposes: purposeList,
        memo: memo.trim() || null,
      });
      onSave();
      onClose();
    } catch(e) {
      alert('요청 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-title">{typeLabel} 요청 · {company.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.6 }}>
            수치를 직접 입력하지 않아도 됩니다.<br/>
            관리자가 요청을 확인 후 직접 조사하여 업데이트합니다.
          </div>

          {/* 요청 구분 */}
          <div className="form-group">
            <label className="form-label">요청 구분 <span style={{ color: 'var(--red)' }}>*</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['new', '최신 데이터 업데이트'], ['fix', '기존 데이터 수정']].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setUpdateType(val)}
                  style={{
                    flex: 1, fontSize: 13, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                    background: updateType === val ? 'rgba(255,106,0,0.12)' : 'var(--bg3)',
                    border: `1px solid ${updateType === val ? 'rgba(255,106,0,0.4)' : 'var(--border)'}`,
                    color: updateType === val ? 'var(--accent)' : 'var(--text2)',
                    fontWeight: updateType === val ? 600 : 400,
                  }}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* 기존 데이터 선택 */}
          {updateType === 'fix' && (
            <div className="form-group">
              <label className="form-label">
                수정 대상 {requestType === 'UPDATE_FINANCIALS' ? '재무실적' : '기업가치'} 선택
                <span style={{ color: 'var(--red)' }}> *</span>
              </label>
              {loadingRows ? (
                <div style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0' }}>불러오는 중...</div>
              ) : existingRows.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0' }}>등록된 데이터가 없습니다</div>
              ) : (
                <select
                  className="form-input"
                  value={selectedRowId}
                  onChange={e => setSelectedRowId(e.target.value)}
                >
                  <option value="">선택해주세요</option>
                  {existingRows.map(row => (
                    <option key={row.id} value={String(row.id)}>{makeRowLabel(row)}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* 요청 목적 */}
          <div className="form-group">
            <label className="form-label">요청 목적 <span style={{ color: 'var(--red)' }}>*</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PURPOSE_OPTIONS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePurpose(p)}
                  style={{
                    fontSize: 12, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
                    background: purposes.includes(p) ? 'rgba(255,106,0,0.12)' : 'var(--bg3)',
                    border: `1px solid ${purposes.includes(p) ? 'rgba(255,106,0,0.4)' : 'var(--border)'}`,
                    color: purposes.includes(p) ? 'var(--accent)' : 'var(--text2)',
                    fontWeight: purposes.includes(p) ? 600 : 400,
                  }}
                >{p}</button>
              ))}
            </div>
            {purposes.includes('기타') && (
              <input className="form-input" style={{ marginTop: 8 }}
                placeholder="기타 목적을 간단히 입력해주세요"
                value={etcMemo} onChange={e => setEtcMemo(e.target.value)} />
            )}
          </div>

          {/* 추가 메모 */}
          <div className="form-group">
            <label className="form-label">추가 메모 <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(선택)</span></label>
            <textarea className="form-textarea"
              placeholder="업데이트가 필요한 이유나 참고 사항을 입력해주세요"
              value={memo} onChange={e => setMemo(e.target.value)} />
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>취소</button>
            <button className="btn btn-primary" onClick={submit}
              disabled={loading || !canSubmit} style={{ opacity: canSubmit ? 1 : 0.5 }}>
              {loading ? '제출 중...' : '요청 제출'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
