// ─── EMPLOYEE HISTORY MODAL (신규 + 수정 공용) ───────────
function EmployeeHistoryModal({ company, record, onClose, onSave, session }) {
  const { useState } = React;
  const isEdit = !!record;

  const [form, setForm] = useState({
    as_of_date:     isEdit ? (record.as_of_date     ?? '') : '',
    employee_count: isEdit ? (record.employee_count ?? '') : '',
    source:         isEdit ? (record.source         ?? '') : '',
    note:           isEdit ? (record.note           ?? '') : '',
  });
  const [reason,  setReason]  = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.as_of_date)     return alert('기준일을 입력해주세요');
    if (!form.employee_count) return alert('임직원 수를 입력해주세요');
    if (isNaN(Number(form.employee_count))) return alert('임직원 수는 숫자로 입력해주세요');
    if (isEdit && !reason.trim()) return alert('수정 사유를 입력해주세요');

    setLoading(true);
    try {
      const payload = {
        company_id:     Number(company.id),
        as_of_date:     form.as_of_date,
        employee_count: Number(form.employee_count),
        source:         form.source || null,
        note:           form.note   || null,
      };
      if (isEdit) {
        await companyService.updateEmployeeHistory(record.id, payload);
        await companyService.logDataChange({
          target_table: 'employee_history', target_id: record.id, company_id: company.id,
          action_type:  'UPDATE',
          old_snapshot: record, new_snapshot: { ...record, ...payload },
          changed_by:   session?.user?.email || null,
          reason:       reason.trim(),
        });
      } else {
        await companyService.insertEmployeeHistory(payload);
      }
      await companyService.syncLatestEmployeeCount(company.id);
      onSave();
      onClose();
    } catch(e) {
      if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
        alert('저장 실패: 같은 기준일 데이터가 이미 존재합니다');
      } else {
        alert('저장 실패: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div className="modal-title">{isEdit ? '임직원 수 수정' : '임직원 수 추가'} · {company.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">기준일 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input type="date" className="form-input" value={form.as_of_date} onChange={e => set('as_of_date', e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">임직원 수 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input type="number" className="form-input" placeholder="0" value={form.employee_count} onChange={e => set('employee_count', e.target.value)}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">출처</label>
            <input className="form-input" placeholder="예: 다트전자공시, 링크드인" value={form.source} onChange={e => set('source', e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">메모</label>
            <textarea className="form-textarea" placeholder="변화 이유, 특이사항 등" value={form.note} onChange={e => set('note', e.target.value)}/>
          </div>
          {isEdit && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
                수정자: <span style={{ color: 'var(--text2)' }}>{session?.user?.email || '—'}</span>
                <span style={{ marginLeft: 8 }}>· 자동 기록됩니다</span>
              </div>
              <div className="form-group">
                <label className="form-label">수정 사유 <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="form-input" placeholder="수정 사유 입력" value={reason} onChange={e => setReason(e.target.value)}/>
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
