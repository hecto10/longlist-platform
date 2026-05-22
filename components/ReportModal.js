// ─── REPORT MODAL (신규 + 수정 공용) ─────────────────────
function ReportModal({ company, record, onClose, onSave }) {
  const { useState } = React;
  const isEdit = !!record;

  const [form, setForm] = useState({
    report_date:   isEdit ? (record.report_date   ?? '') : '',
    report_type:   isEdit ? (record.report_type   ?? '') : '',
    report_target: isEdit ? (record.report_target ?? '') : '',
    ppt_link:      isEdit ? (record.ppt_link      ?? '') : '',
    notes:         isEdit ? (record.notes         ?? '') : '',
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
    if (!form.report_date) return alert('보고 날짜를 입력해주세요');
    if (isEdit && !changedBy.trim()) return alert('수정자를 입력해주세요');
    if (isEdit && !reason.trim())    return alert('수정 사유를 입력해주세요');
    setLoading(true);
    try {
      const payload = {
        report_date:   form.report_date,
        report_type:   form.report_type   || null,
        report_target: form.report_target || null,
        ppt_link:      form.ppt_link      || null,
        notes:         form.notes         || null,
      };
      if (isEdit) {
        await companyService.updateReport(record.id, payload);
        await companyService.logDataChange({
          target_table: 'reports',
          target_id:    record.id,
          company_id:   company.id,
          old_snapshot: record,
          new_snapshot: { ...record, ...payload },
          changed_by:   changedBy.trim(),
          reason:       reason.trim(),
        });
      } else {
        await companyService.insertReport({ company_id: company.id, ...payload });
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
            {isEdit ? '보고 이력 수정' : '보고 이력 추가'} · {company.name}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">보고 날짜</label>
              <input type="date" className="form-input" value={form.report_date} onChange={e=>set('report_date',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">보고 유형</label>
              <input className="form-input" placeholder="예: CM 경영기획, CMO 검토" value={form.report_type} onChange={e=>set('report_type',e.target.value)}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">보고 대상/상황</label>
            <input className="form-input" placeholder="예: 경영진 주간보고" value={form.report_target} onChange={e=>set('report_target',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">PPT 링크</label>
            <input className="form-input" placeholder="https://..." value={form.ppt_link} onChange={e=>set('ppt_link',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">비고</label>
            <textarea className="form-textarea" placeholder="추가 메모" value={form.notes} onChange={e=>set('notes',e.target.value)}/>
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
