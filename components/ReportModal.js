// ─── REPORT MODAL ────────────────────────────────────────
function ReportModal({ company, onClose, onSave }) {
  const { useState } = React;
  const [form, setForm] = useState({ report_date: '', report_type: '', report_target: '', ppt_link: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  async function submit() {
    if (!form.report_date) return alert('보고 날짜를 입력해주세요');
    setLoading(true);
    try {
      await companyService.insertReport({
        company_id: company.id,
        report_date: form.report_date,
        report_type: form.report_type || null,
        report_target: form.report_target || null,
        ppt_link: form.ppt_link || null,
        notes: form.notes || null,
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
          <div className="modal-title">보고 이력 추가 · {company.name}</div>
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
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>취소</button>
            <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? '저장 중...' : '저장'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
