// ─── VALUATION MODAL ─────────────────────────────────────
function ValuationModal({ company, onClose, onSave }) {
  const { useState } = React;
  const [form, setForm] = useState({ valuation_date: '', valuation: '', pe_multiple: '', memo: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  async function submit() {
    if (!form.valuation_date) return alert('기준일을 입력해주세요');
    setLoading(true);
    try {
      await companyService.insertValuation({
        company_id: company.id,
        valuation_date: form.valuation_date,
        valuation: form.valuation || null,
        pe_multiple: form.pe_multiple || null,
        memo: form.memo || null,
      });
      onSave(); onClose();
    } catch(e) {
      alert('저장 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">기업가치 업데이트 · {company.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">기준일</label>
              <input type="date" className="form-input" value={form.valuation_date} onChange={e=>set('valuation_date',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">기업가치 (억원)</label>
              <input type="number" className="form-input" placeholder="0" value={form.valuation} onChange={e=>set('valuation',e.target.value)}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">P/E 멀티플</label>
            <input type="number" className="form-input" placeholder="0" value={form.pe_multiple} onChange={e=>set('pe_multiple',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">메모</label>
            <textarea className="form-textarea" placeholder="기업가치 산정 근거 등" value={form.memo} onChange={e=>set('memo',e.target.value)}/>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>취소</button>
            <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? '저장 중...' : '저장'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
