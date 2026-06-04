// ─── BOARD MEMBER MODAL (단일 수정 전용) ──────────────────
function BoardMemberModal({ company, record, onClose, onSave, session }) {
  const { useState } = React;

  const [form, setForm] = useState({
    as_of_date:                    record?.as_of_date                    ?? '',
    member_type:                   record?.member_type                   ?? '',
    name:                          record?.name                          ?? '',
    birth_year:                    record?.birth_year                    ?? '',
    registration_status:           record?.registration_status           ?? '',
    responsibility:                record?.responsibility                ?? '',
    relation_to_major_shareholder: record?.relation_to_major_shareholder ?? '',
    note:                          record?.note                          ?? '',
  });
  const [reason,  setReason]  = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.member_type)  return alert('구분을 선택해주세요');
    if (!form.name.trim())  return alert('성명을 입력해주세요');
    if (!reason.trim())     return alert('수정 사유를 입력해주세요');
    setLoading(true);
    try {
      const payload = {
        member_type:                   form.member_type,
        name:                          form.name.trim(),
        birth_year:                    form.birth_year !== '' ? Number(form.birth_year) : null,
        registration_status:           form.registration_status           || null,
        responsibility:                form.responsibility                || null,
        relation_to_major_shareholder: form.relation_to_major_shareholder || null,
        note:                          form.note                          || null,
      };
      await companyService.updateBoardMember(record.id, payload);
      await companyService.logDataChange({
        target_table: 'board_members', target_id: record.id, company_id: company.id,
        action_type:  'UPDATE',
        old_snapshot: record, new_snapshot: { ...record, ...payload },
        changed_by:   session?.user?.email || null,
        reason:       reason.trim(),
      });
      onSave(); onClose();
    } catch(e) {
      alert('저장 실패: ' + e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div className="modal-title">경영진 수정 · {company.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {record?.as_of_date && (
            <div style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', borderRadius: 6, padding: '6px 12px', marginBottom: 14 }}>
              기준일: <strong style={{ color: 'var(--text)' }}>{record.as_of_date}</strong>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">구분 <span style={{ color: 'var(--red)' }}>*</span></label>
              <select className="form-input" value={form.member_type} onChange={e => set('member_type', e.target.value)}>
                <option value="">선택</option>
                {['대표이사','사내이사','사외이사','기타비상무','감사','감사위원'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">성명 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">출생연도</label>
              <input type="number" className="form-input" placeholder="예: 1975" value={form.birth_year} onChange={e => set('birth_year', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">등기여부</label>
              <select className="form-input" value={form.registration_status} onChange={e => set('registration_status', e.target.value)}>
                <option value="">선택</option>
                <option value="등기">등기</option>
                <option value="미등기">미등기</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">담당업무</label>
              <input className="form-input" placeholder="예: 경영총괄, 재무" value={form.responsibility} onChange={e => set('responsibility', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">최대주주관계</label>
              <input className="form-input" placeholder="예: 본인, 타인" value={form.relation_to_major_shareholder} onChange={e => set('relation_to_major_shareholder', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">비고</label>
            <input className="form-input" value={form.note} onChange={e => set('note', e.target.value)} />
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
              수정자: <span style={{ color: 'var(--text2)' }}>{session?.user?.email || '—'}</span>
              <span style={{ marginLeft: 8, fontSize: 11 }}>· 자동 기록됩니다</span>
            </div>
            <div className="form-group">
              <label className="form-label">수정 사유 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="form-input" placeholder="수정 사유 입력" value={reason} onChange={e => setReason(e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>취소</button>
            <button className="btn btn-primary" onClick={submit} disabled={loading}>
              {loading ? '저장 중...' : '수정 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
