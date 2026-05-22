// ─── VALUATION MODAL (신규 + 수정 공용) ──────────────────
function ValuationModal({ company, record, onClose, onSave }) {
  const { useState } = React;
  const isEdit = !!record;

  const [form, setForm] = useState({
    valuation_date: isEdit ? (record.valuation_date ?? '') : '',
    valuation:      isEdit ? (record.valuation      ?? '') : '',
    pe_multiple:    isEdit ? (record.pe_multiple     ?? '') : '',
    memo:           isEdit ? (record.memo            ?? '') : '',
  });

  const getStoredUser = () =>
    (typeof localStorage !== 'undefined' && localStorage.getItem('userName')) || '';

  const [changedBy, setChangedBy] = useState(isEdit ? getStoredUser() : '');
  const [reason,    setReason]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  function handleChangedByBlur(v) {
    if (v && typeof localStorage !== 'undefined') localStorage.setItem('userName', v);
  }

  async function submit() {
    if (!form.valuation_date) return alert('기준일을 입력해주세요');
    if (isEdit && !changedBy.trim()) return alert('수정자를 입력해주세요');
    if (isEdit && !reason.trim())    return alert('수정 사유를 입력해주세요');
    setLoading(true);
    try {
      const payload = {
        valuation_date: form.valuation_date,
        valuation:      form.valuation   !== '' ? form.valuation   : null,
        pe_multiple:    form.pe_multiple !== '' ? form.pe_multiple : null,
        memo:           form.memo        || null,
      };
      if (isEdit) {
        await companyService.updateValuation(record.id, payload);
        await companyService.logDataChange({
          target_table: 'valuations',
          target_id:    record.id,
          company_id:   company.id,
          old_snapshot: record,
          new_snapshot: { ...record, ...payload },
          changed_by:   changedBy.trim(),
          reason:       reason.trim(),
        });
      } else {
        await companyService.insertValuation({ company_id: company.id, ...payload });
      }
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
          <div className="modal-title">
            {isEdit ? '기업가치 수정' : '기업가치 업데이트'} · {company.name}
          </div>
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

          {isEdit && (
            <div style={{borderTop:'1px solid var(--border)',paddingTop:16,marginTop:4}}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>수정 이력</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">수정자 <span style={{color:'var(--red)'}}>*</span></label>
                  <input className="form-input" placeholder="이름 입력" value={changedBy}
                    onChange={e=>setChangedBy(e.target.value)}
                    onBlur={e=>handleChangedByBlur(e.target.value)}/>
                </div>
                <div className="form-group">
                  <label className="form-label">수정 사유 <span style={{color:'var(--red)'}}>*</span></label>
                  <input className="form-input" placeholder="수정 사유 입력" value={reason} onChange={e=>setReason(e.target.value)}/>
                </div>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>취소</button>
            <button className="btn btn-primary" onClick={submit} disabled={loading}>
              {loading ? '저장 중...' : isEdit ? '수정 저장' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
