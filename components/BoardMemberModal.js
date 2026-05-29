// ─── BOARD MEMBER MODAL (신규 + 수정 공용) ────────────────
function BoardMemberModal({ company, record, onClose, onSave }) {
  const { useState } = React;
  const isEdit = !!record;

  const [form, setForm] = useState({
    as_of_date:                    isEdit ? (record.as_of_date                    ?? '') : '',
    member_type:                   isEdit ? (record.member_type                   ?? '') : '',
    name:                          isEdit ? (record.name                          ?? '') : '',
    birth_year:                    isEdit ? (record.birth_year                    ?? '') : '',
    registration_status:           isEdit ? (record.registration_status           ?? '') : '',
    position:                      isEdit ? (record.position                      ?? '') : '',
    responsibility:                isEdit ? (record.responsibility                ?? '') : '',
    tenure_years:                  isEdit ? (record.tenure_years                  ?? '') : '',
    relation_to_major_shareholder: isEdit ? (record.relation_to_major_shareholder ?? '') : '',
    note:                          isEdit ? (record.note                          ?? '') : '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.as_of_date)   return alert('기준일을 입력해주세요');
    if (!form.member_type)  return alert('구분을 선택해주세요');
    if (!form.name.trim())  return alert('성명을 입력해주세요');
    setLoading(true);
    try {
      const payload = {
        company_id:                    Number(company.id),
        as_of_date:                    form.as_of_date,
        member_type:                   form.member_type,
        name:                          form.name.trim(),
        birth_year:                    form.birth_year !== '' ? Number(form.birth_year) : null,
        registration_status:           form.registration_status           || null,
        position:                      form.position                      || null,
        responsibility:                form.responsibility                || null,
        tenure_years:                  form.tenure_years !== '' ? Number(form.tenure_years) : null,
        relation_to_major_shareholder: form.relation_to_major_shareholder || null,
        note:                          form.note                          || null,
      };
      if (isEdit) {
        await companyService.updateBoardMember(record.id, payload);
      } else {
        await companyService.insertBoardMember(payload);
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
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-title">{isEdit ? '경영진 수정' : '경영진 추가'} · {company.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">기준일 <span style={{color:'var(--red)'}}>*</span></label>
              <input type="date" className="form-input" value={form.as_of_date} onChange={e=>set('as_of_date',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">구분 <span style={{color:'var(--red)'}}>*</span></label>
              <select className="form-input" value={form.member_type} onChange={e=>set('member_type',e.target.value)}>
                <option value="">선택</option>
                {['대표이사','사내이사','사외이사','기타비상무','감사','감사위원'].map(v=>(
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">성명 <span style={{color:'var(--red)'}}>*</span></label>
              <input className="form-input" placeholder="성명 입력" value={form.name} onChange={e=>set('name',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">출생연도</label>
              <input type="number" className="form-input" placeholder="예: 1975" value={form.birth_year} onChange={e=>set('birth_year',e.target.value)}/>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">등기여부</label>
              <select className="form-input" value={form.registration_status} onChange={e=>set('registration_status',e.target.value)}>
                <option value="">선택</option>
                <option value="등기">등기</option>
                <option value="미등기">미등기</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">직위</label>
              <input className="form-input" placeholder="예: 대표이사, CFO" value={form.position} onChange={e=>set('position',e.target.value)}/>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">담당업무</label>
              <input className="form-input" placeholder="예: 경영총괄, 재무" value={form.responsibility} onChange={e=>set('responsibility',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">근속연수</label>
              <input type="number" className="form-input" placeholder="예: 3.5" step="0.1" value={form.tenure_years} onChange={e=>set('tenure_years',e.target.value)}/>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">최대주주와의 관계</label>
            <input className="form-input" placeholder="예: 본인, 배우자, 타인, 기타" value={form.relation_to_major_shareholder} onChange={e=>set('relation_to_major_shareholder',e.target.value)}/>
          </div>

          <div className="form-group">
            <label className="form-label">비고</label>
            <textarea className="form-textarea" placeholder="특이사항" value={form.note} onChange={e=>set('note',e.target.value)}/>
          </div>

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
