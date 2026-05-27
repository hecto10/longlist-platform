// ─── ADD COMPANY REQUEST MODAL ────────────────────────────
function AddCompanyRequestModal({ session, profile, onClose, onSave }) {
  const { useState } = React;

  const PURPOSE_OPTIONS = [
    '경쟁사 분석',
    'M&A/투자 검토',
    '제휴/시너지 검토',
    '시장/산업 리서치',
    '기타',
  ];

  const [form, setForm] = useState({
    company_name: '',
    brand_name:   '',
    website:      '',
    ceo:          '',
  });
  const [purposes, setPurposes]   = useState([]);
  const [etcMemo,  setEtcMemo]    = useState('');
  const [memo,     setMemo]       = useState('');
  const [loading,  setLoading]    = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function togglePurpose(p) {
    setPurposes(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  }

  // 최소 2개 입력 검증
  const filledCount = Object.values(form).filter(v => v.trim()).length;
  const canSubmit   = filledCount >= 2 && purposes.length > 0;

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const purposeList = purposes.includes('기타') && etcMemo.trim()
        ? purposes.map(p => p === '기타' ? `기타: ${etcMemo.trim()}` : p)
        : purposes;

      await requestService.insertRequest({
        request_type:     'ADD_COMPANY',
        requester_id:     session.user.id,
        requester_name:   profile?.name || session.user.email,
        payload: {
          company_name: form.company_name.trim() || null,
          brand_name:   form.brand_name.trim()   || null,
          website:      form.website.trim()       || null,
          ceo:          form.ceo.trim()           || null,
        },
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
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-title">기업 추가 요청</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.6 }}>
            추가를 원하는 기업 정보를 입력해주세요. 아래 항목 중 <strong style={{ color: 'var(--text)' }}>2개 이상</strong> 입력이 필요합니다.
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">회사명</label>
              <input className="form-input" placeholder="(주)○○○" value={form.company_name} onChange={e => set('company_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">브랜드명</label>
              <input className="form-input" placeholder="브랜드 또는 서비스명" value={form.brand_name} onChange={e => set('brand_name', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">웹사이트</label>
              <input className="form-input" placeholder="https://..." value={form.website} onChange={e => set('website', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">대표이사</label>
              <input className="form-input" placeholder="대표이사 이름" value={form.ceo} onChange={e => set('ceo', e.target.value)} />
            </div>
          </div>

          {/* 입력 진행 표시 */}
          <div style={{ fontSize: 11, color: filledCount >= 2 ? 'var(--green)' : 'var(--text3)', marginTop: -8, marginBottom: 16 }}>
            {filledCount}개 입력됨 {filledCount >= 2 ? '✓' : `(최소 2개 필요)`}
          </div>

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
              <input
                className="form-input"
                style={{ marginTop: 8 }}
                placeholder="기타 목적을 간단히 입력해주세요"
                value={etcMemo}
                onChange={e => setEtcMemo(e.target.value)}
              />
            )}
          </div>

          {/* 추가 메모 */}
          <div className="form-group">
            <label className="form-label">추가 메모 <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(선택)</span></label>
            <textarea
              className="form-textarea"
              placeholder="왜 이 기업의 검토가 필요한지 간단히 설명해주세요"
              value={memo}
              onChange={e => setMemo(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>취소</button>
            <button
              className="btn btn-primary"
              onClick={submit}
              disabled={loading || !canSubmit}
              style={{ opacity: canSubmit ? 1 : 0.5 }}
            >
              {loading ? '제출 중...' : '요청 제출'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
