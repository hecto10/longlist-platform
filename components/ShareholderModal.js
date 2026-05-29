// ─── SHAREHOLDER MODAL (신규 + 수정 공용) ─────────────────
function ShareholderModal({ company, record, onClose, onSave }) {
  const { useState } = React;
  const isEdit = !!record;

  const [form, setForm] = useState({
    as_of_date:                    isEdit ? (record.as_of_date                    ?? '') : '',
    shareholder_name:              isEdit ? (record.shareholder_name              ?? '') : '',
    shareholder_type:              isEdit ? (record.shareholder_type              ?? '') : '',
    common_shares:                 isEdit ? (record.common_shares                 ?? '') : '',
    preferred_shares:              isEdit ? (record.preferred_shares              ?? '') : '',
    total_shares:                  isEdit ? (record.total_shares                  ?? '') : '',
    common_ratio:                  isEdit ? (record.common_ratio                  ?? '') : '',
    preferred_ratio:               isEdit ? (record.preferred_ratio               ?? '') : '',
    total_ratio:                   isEdit ? (record.total_ratio                   ?? '') : '',
    relation_to_major_shareholder: isEdit ? (record.relation_to_major_shareholder ?? '') : '',
    note:                          isEdit ? (record.note                          ?? '') : '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toNum = v => v !== '' && v != null ? Number(v) : null;

  async function submit() {
    if (!form.as_of_date)       return alert('기준일을 입력해주세요');
    if (!form.shareholder_name) return alert('주주명을 입력해주세요');
    setLoading(true);
    try {
      const payload = {
        company_id:                    Number(company.id),
        as_of_date:                    form.as_of_date,
        shareholder_name:              form.shareholder_name.trim(),
        shareholder_type:              form.shareholder_type              || null,
        common_shares:                 toNum(form.common_shares),
        preferred_shares:              toNum(form.preferred_shares),
        total_shares:                  toNum(form.total_shares),
        common_ratio:                  toNum(form.common_ratio),
        preferred_ratio:               toNum(form.preferred_ratio),
        total_ratio:                   toNum(form.total_ratio),
        relation_to_major_shareholder: form.relation_to_major_shareholder || null,
        note:                          form.note                          || null,
      };
      if (isEdit) {
        await companyService.updateShareholder(record.id, payload);
      } else {
        await companyService.insertShareholder(payload);
      }
      onSave(); onClose();
    } catch(e) {
      alert('저장 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const numInput = (key, placeholder) => (
    <input type="number" className="form-input" placeholder={placeholder}
      value={form[key]} onChange={e => set(key, e.target.value)}/>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div className="modal-title">{isEdit ? '주주 수정' : '주주 추가'} · {company.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">기준일 <span style={{color:'var(--red)'}}>*</span></label>
              <input type="date" className="form-input" value={form.as_of_date} onChange={e=>set('as_of_date',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">구분</label>
              <select className="form-input" value={form.shareholder_type} onChange={e=>set('shareholder_type',e.target.value)}>
                <option value="">선택</option>
                {['최대주주','특수관계인','기관','개인','기타'].map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{flex:2}}>
              <label className="form-label">주주명 <span style={{color:'var(--red)'}}>*</span></label>
              <input className="form-input" placeholder="주주명 입력" value={form.shareholder_name} onChange={e=>set('shareholder_name',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">최대주주와의 관계</label>
              <input className="form-input" placeholder="예: 본인, 배우자, 타인" value={form.relation_to_major_shareholder} onChange={e=>set('relation_to_major_shareholder',e.target.value)}/>
            </div>
          </div>

          {/* 소유주식수 */}
          <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8,marginTop:4}}>소유주식수 (주)</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">보통주</label>
              {numInput('common_shares','0')}
            </div>
            <div className="form-group">
              <label className="form-label">우선주</label>
              {numInput('preferred_shares','0')}
            </div>
            <div className="form-group">
              <label className="form-label">합계</label>
              {numInput('total_shares','0')}
            </div>
          </div>

          {/* 지분율 */}
          <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8,marginTop:4}}>지분율 (%)</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">보통주</label>
              {numInput('common_ratio','0.00')}
            </div>
            <div className="form-group">
              <label className="form-label">우선주</label>
              {numInput('preferred_ratio','0.00')}
            </div>
            <div className="form-group">
              <label className="form-label">합계</label>
              {numInput('total_ratio','0.00')}
            </div>
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
