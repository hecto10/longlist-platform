// ─── SHAREHOLDER BULK MODAL ───────────────────────────────
function ShareholderBulkModal({ company, existingShareholders, onClose, onSave }) {
  const { useState } = React;

  const emptyRow = () => ({
    _id: Math.random().toString(36).slice(2),
    shareholder_name: '', shareholder_type: '',
    common_shares: '', preferred_shares: '',
    relation_to_major_shareholder: '', note: '',
  });

  const [asOfDate,        setAsOfDate]        = useState('');
  const [totalCommon,     setTotalCommon]      = useState('');
  const [totalPreferred,  setTotalPreferred]   = useState('');
  const [source,          setSource]           = useState('');
  const [rows,            setRows]             = useState([emptyRow()]);
  const [loading,         setLoading]          = useState(false);

  const tc = Number(totalCommon)    || 0;
  const tp = Number(totalPreferred) || 0;
  const ta = tc + tp;

  // 지분율 실시간 계산
  function calcRatios(r) {
    const cs = Number(r.common_shares)    || 0;
    const ps = Number(r.preferred_shares) || 0;
    const ts = cs + ps;
    const cr = tc > 0 ? (cs / tc * 100).toFixed(2) : null;
    const pr = tp > 0 ? (ps / tp * 100).toFixed(2) : null;
    const tr = ta > 0 ? (ts / ta * 100).toFixed(2) : null;
    return { cr, pr, tr };
  }

  function setRow(id, key, val) {
    setRows(prev => prev.map(r => r._id === id ? { ...r, [key]: val } : r));
  }
  function addRow()    { setRows(prev => [...prev, emptyRow()]); }
  function removeRow(id) { setRows(prev => prev.filter(r => r._id !== id)); }

  // validation
  function validate() {
    const errors = [], warnings = [];
    if (!asOfDate) { errors.push('기준일을 입력해주세요'); }

    const namesInModal = [];
    const existingNames = new Set(
      (existingShareholders || [])
        .filter(s => s.as_of_date === asOfDate)
        .map(s => s.shareholder_name)
    );

    rows.forEach((r, i) => {
      const label = `${i+1}행`;
      if (!r.shareholder_name.trim()) errors.push(`${label}: 주주명 필수`);
      if (!r.shareholder_type)        errors.push(`${label}: 구분 필수`);

      if (r.shareholder_name.trim()) {
        if (existingNames.has(r.shareholder_name.trim()))
          warnings.push(`${label}: "${r.shareholder_name}" 동일 기준일에 이미 존재`);
        if (namesInModal.includes(r.shareholder_name.trim()))
          warnings.push(`${label}: "${r.shareholder_name}" 모달 내 중복`);
        namesInModal.push(r.shareholder_name.trim());
      }
    });

    if (tc === 0 && tp === 0 && rows.some(r => Number(r.common_shares)||Number(r.preferred_shares)))
      warnings.push('총 발행주식수가 0이라 지분율이 계산되지 않습니다');

    const totalRatio = rows.reduce((sum, r) => {
      const { tr } = calcRatios(r);
      return sum + (Number(tr) || 0);
    }, 0);
    if (totalRatio > 100.01) warnings.push(`지분율 합계 ${totalRatio.toFixed(2)}% — 100% 초과`);

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
      await companyService.insertSnapshotWithShareholders(
        {
          company_id:             Number(company.id),
          as_of_date:             asOfDate,
          total_common_shares:    tc,
          total_preferred_shares: tp,
          source:                 source || null,
        },
        rows.filter(r => r.shareholder_name.trim())
      );
      onSave(); onClose();
    } catch(e) {
      if (e.message?.includes('unique')) alert('저장 실패: 동일 기준일 snapshot이 이미 존재합니다');
      else alert('저장 실패: ' + e.message);
    } finally { setLoading(false); }
  }

  const { errors, warnings } = validate();
  const hasError = errors.length > 0;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 860 }}>
        <div className="modal-header">
          <div className="modal-title">주주 현황 일괄 입력 · {company.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          {/* 기준일 + 총 발행주식수 */}
          <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>기준 정보</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">기준일 <span style={{ color: 'var(--red)' }}>*</span></label>
                <input type="date" className="form-input" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">총 보통주 발행수</label>
                <input type="number" className="form-input" placeholder="0" value={totalCommon} onChange={e => setTotalCommon(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">총 우선주 발행수</label>
                <input type="number" className="form-input" placeholder="0" value={totalPreferred} onChange={e => setTotalPreferred(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">출처</label>
                <input className="form-input" placeholder="예: DART, CRETOP" value={source} onChange={e => setSource(e.target.value)} />
              </div>
            </div>
            {ta > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                총 발행주식수: <strong style={{ color: 'var(--text)' }}>{(tc + tp).toLocaleString()}주</strong>
                {tc > 0 && <span style={{ marginLeft: 10 }}>보통주 {tc.toLocaleString()}</span>}
                {tp > 0 && <span style={{ marginLeft: 6 }}>우선주 {tp.toLocaleString()}</span>}
              </div>
            )}
          </div>

          {/* 주주 입력 테이블 */}
          <div style={{ overflowX: 'auto', marginBottom: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--bg3)' }}>
                  {['주주명 *','구분 *','보통주 수','우선주 수','지분율','최대주주 관계','비고',''].map((h,i) => (
                    <th key={i} style={{ padding: '8px 8px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const { cr, pr, tr } = calcRatios(r);
                  const { warnings: rowWarns } = (() => {
                    const w = [];
                    const existingNames = new Set((existingShareholders||[]).filter(s=>s.as_of_date===asOfDate).map(s=>s.shareholder_name));
                    if (r.shareholder_name && existingNames.has(r.shareholder_name.trim())) w.push('기존 중복');
                    if (r.shareholder_name && rows.filter(x=>x._id!==r._id&&x.shareholder_name.trim()===r.shareholder_name.trim()).length) w.push('내부 중복');
                    return { warnings: w };
                  })();
                  const hasWarn = rowWarns.length > 0;
                  return (
                    <tr key={r._id} style={{ borderBottom: '1px solid var(--border)', background: hasWarn ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
                      <td style={{ padding: '4px 6px' }}>
                        <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                          placeholder="주주명" value={r.shareholder_name}
                          onChange={e => setRow(r._id, 'shareholder_name', e.target.value)} />
                        {hasWarn && <div style={{ fontSize: 10, color: 'var(--amber)', marginTop: 2 }}>⚠️ {rowWarns.join(', ')}</div>}
                      </td>
                      <td style={{ padding: '4px 6px' }}>
                        <select className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                          value={r.shareholder_type} onChange={e => setRow(r._id, 'shareholder_type', e.target.value)}>
                          <option value="">선택</option>
                          {['최대주주','특수관계인','기관','개인','기타'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '4px 6px', width: 110 }}>
                        <input type="number" className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                          placeholder="0" value={r.common_shares}
                          onChange={e => setRow(r._id, 'common_shares', e.target.value)} />
                      </td>
                      <td style={{ padding: '4px 6px', width: 110 }}>
                        <input type="number" className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                          placeholder="0" value={r.preferred_shares}
                          onChange={e => setRow(r._id, 'preferred_shares', e.target.value)} />
                      </td>
                      <td style={{ padding: '4px 6px', minWidth: 90, textAlign: 'center', fontFamily: 'MaruBuri,sans-serif', fontSize: 12 }}>
                        {tr !== null ? (
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{tr}%</span>
                        ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                        {cr !== null && <div style={{ fontSize: 10, color: 'var(--text3)' }}>보통 {cr}%</div>}
                        {pr !== null && <div style={{ fontSize: 10, color: 'var(--text3)' }}>우선 {pr}%</div>}
                      </td>
                      <td style={{ padding: '4px 6px' }}>
                        <input className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                          placeholder="예: 본인" value={r.relation_to_major_shareholder}
                          onChange={e => setRow(r._id, 'relation_to_major_shareholder', e.target.value)} />
                      </td>
                      <td style={{ padding: '4px 6px' }}>
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
            + 주주 추가
          </button>

          {/* validation 요약 */}
          {(errors.length > 0 || warnings.length > 0) && (
            <div style={{ marginBottom: 12, fontSize: 12 }}>
              {errors.map((e,i)   => <div key={i} style={{ color: 'var(--red)',   marginBottom: 2 }}>❌ {e}</div>)}
              {warnings.map((w,i) => <div key={i} style={{ color: 'var(--amber)', marginBottom: 2 }}>⚠️ {w}</div>)}
            </div>
          )}

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>취소</button>
            <button className="btn btn-primary" onClick={submit} disabled={loading || hasError}>
              {loading ? '저장 중...' : `${rows.filter(r=>r.shareholder_name.trim()).length}명 저장`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
