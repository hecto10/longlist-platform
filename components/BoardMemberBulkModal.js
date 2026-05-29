// ─── BOARD MEMBER BULK MODAL ──────────────────────────────
function BoardMemberBulkModal({ company, existingBoardMembers, onClose, onSave }) {
  const { useState } = React;

  const emptyRow = () => ({
    _id: Math.random().toString(36).slice(2),
    member_type: '', name: '', birth_year: '',
    registration_status: '', position: '', responsibility: '',
    relation_to_major_shareholder: '', note: '',
  });

  const [asOfDate, setAsOfDate] = useState('');
  const [rows,     setRows]     = useState([emptyRow()]);
  const [loading,  setLoading]  = useState(false);

  function setRow(id, key, val) {
    setRows(prev => prev.map(r => r._id === id ? { ...r, [key]: val } : r));
  }
  function addRow()      { setRows(prev => [...prev, emptyRow()]); }
  function removeRow(id) { setRows(prev => prev.filter(r => r._id !== id)); }

  function validate() {
    const errors = [], warnings = [];
    if (!asOfDate) errors.push('기준일을 입력해주세요');

    const namesInModal = [];
    const existingNames = new Set(
      (existingBoardMembers || [])
        .filter(m => m.as_of_date === asOfDate)
        .map(m => m.name)
    );

    rows.forEach((r, i) => {
      const label = `${i+1}행`;
      if (!r.member_type)  errors.push(`${label}: 구분 필수`);
      if (!r.name.trim())  errors.push(`${label}: 성명 필수`);
      if (r.birth_year && (isNaN(Number(r.birth_year)) || Number(r.birth_year) < 1900 || Number(r.birth_year) > 2010))
        warnings.push(`${label}: 출생연도 형식 확인 필요`);
      if (r.name.trim()) {
        if (existingNames.has(r.name.trim()))
          warnings.push(`${label}: "${r.name}" 동일 기준일에 이미 존재`);
        if (namesInModal.includes(r.name.trim()))
          warnings.push(`${label}: "${r.name}" 모달 내 중복`);
        namesInModal.push(r.name.trim());
      }
    });
    return { errors, warnings };
  }

  async function submit() {
    const { errors, warnings } = validate();
    if (errors.length) { alert('오류:\n' + errors.join('\n')); return; }
    if (warnings.length) {
      const ok = window.confirm('경고:\n' + warnings.join('\n') + '\n\n계속 저장하시겠습니까?');
      if (!ok) return;
    }
    setLoading(true);
    try {
      const payload = rows
        .filter(r => r.name.trim() && r.member_type)
        .map(r => ({
          company_id:                    Number(company.id),
          as_of_date:                    asOfDate,
          member_type:                   r.member_type,
          name:                          r.name.trim(),
          birth_year:                    r.birth_year ? Number(r.birth_year) : null,
          registration_status:           r.registration_status           || null,
          position:                      r.position                      || null,
          responsibility:                r.responsibility                || null,
          relation_to_major_shareholder: r.relation_to_major_shareholder || null,
          note:                          r.note                          || null,
        }));
      const { error } = await supabase.from('board_members').insert(payload);
      if (error) throw error;
      onSave(); onClose();
    } catch(e) {
      alert('저장 실패: ' + e.message);
    } finally { setLoading(false); }
  }

  const { errors, warnings } = validate();
  const hasError = errors.length > 0;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 900 }}>
        <div className="modal-header">
          <div className="modal-title">이사회/경영진 일괄 입력 · {company.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>기준 정보</div>
            <div style={{ maxWidth: 240 }}>
              <label className="form-label">기준일 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input type="date" className="form-input" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} />
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--bg3)' }}>
                  {['구분 *','성명 *','출생연도','등기여부','직위','담당업무','최대주주 관계','비고',''].map((h,i) => (
                    <th key={i} style={{ padding: '8px 8px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const dupExisting = r.name && (existingBoardMembers||[]).filter(m=>m.as_of_date===asOfDate&&m.name===r.name.trim()).length > 0;
                  const dupInternal = r.name && rows.filter(x=>x._id!==r._id&&x.name.trim()===r.name.trim()).length > 0;
                  const hasWarn = dupExisting || dupInternal;
                  return (
                    <tr key={r._id} style={{ borderBottom: '1px solid var(--border)', background: hasWarn ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
                      <td style={{ padding: '4px 6px', minWidth: 120 }}>
                        <select className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                          value={r.member_type} onChange={e => setRow(r._id, 'member_type', e.target.value)}>
                          <option value="">선택</option>
                          {['대표이사','사내이사','사외이사','기타비상무','감사','감사위원'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '4px 6px', minWidth: 100 }}>
                        <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                          placeholder="성명" value={r.name}
                          onChange={e => setRow(r._id, 'name', e.target.value)} />
                        {hasWarn && <div style={{ fontSize: 10, color: 'var(--amber)', marginTop: 2 }}>⚠️ {[dupExisting&&'기존 중복', dupInternal&&'내부 중복'].filter(Boolean).join(', ')}</div>}
                      </td>
                      <td style={{ padding: '4px 6px', width: 90 }}>
                        <input type="number" className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                          placeholder="예: 1975" value={r.birth_year}
                          onChange={e => setRow(r._id, 'birth_year', e.target.value)} />
                      </td>
                      <td style={{ padding: '4px 6px', width: 90 }}>
                        <select className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                          value={r.registration_status} onChange={e => setRow(r._id, 'registration_status', e.target.value)}>
                          <option value="">선택</option>
                          <option value="등기">등기</option>
                          <option value="미등기">미등기</option>
                        </select>
                      </td>
                      <td style={{ padding: '4px 6px', minWidth: 110 }}>
                        <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                          placeholder="예: 대표이사" value={r.position}
                          onChange={e => setRow(r._id, 'position', e.target.value)} />
                      </td>
                      <td style={{ padding: '4px 6px', minWidth: 100 }}>
                        <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                          placeholder="예: 경영총괄" value={r.responsibility}
                          onChange={e => setRow(r._id, 'responsibility', e.target.value)} />
                      </td>
                      <td style={{ padding: '4px 6px', minWidth: 100 }}>
                        <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                          placeholder="예: 본인" value={r.relation_to_major_shareholder}
                          onChange={e => setRow(r._id, 'relation_to_major_shareholder', e.target.value)} />
                      </td>
                      <td style={{ padding: '4px 6px', minWidth: 100 }}>
                        <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                          placeholder="비고" value={r.note}
                          onChange={e => setRow(r._id, 'note', e.target.value)} />
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        {rows.length > 1 && (
                          <button onClick={() => removeRow(r._id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button onClick={addRow} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>
            + 경영진 추가
          </button>

          {(errors.length > 0 || warnings.length > 0) && (
            <div style={{ marginBottom: 12, fontSize: 12 }}>
              {errors.map((e,i)   => <div key={i} style={{ color: 'var(--red)',   marginBottom: 2 }}>❌ {e}</div>)}
              {warnings.map((w,i) => <div key={i} style={{ color: 'var(--amber)', marginBottom: 2 }}>⚠️ {w}</div>)}
            </div>
          )}

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>취소</button>
            <button className="btn btn-primary" onClick={submit} disabled={loading || hasError}>
              {loading ? '저장 중...' : `${rows.filter(r=>r.name.trim()&&r.member_type).length}명 저장`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
