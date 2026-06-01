// ─── VALUATION BULK VIEW ──────────────────────────────────
function ValuationBulkView({ companies }) {
  const { useState } = React;

  const emptyRow = () => ({
    _id:            Math.random().toString(36).slice(2),
    company:        null,   // { id, name }
    valuation_date: '',
    valuation:      '',
    pe_multiple:    '',
    memo:           '',
    source_link:    '',
  });

  const [rows,    setRows]    = useState([emptyRow()]);
  const [result,  setResult]  = useState(null); // { saved, failed: [{rowIdx, reason}] }
  const [saving,  setSaving]  = useState(false);

  const set = (id, key, val) => setRows(prev => prev.map(r => r._id === id ? { ...r, [key]: val } : r));
  const addRow    = ()  => { setRows(prev => [...prev, emptyRow()]); setResult(null); };
  const removeRow = (id) => { setRows(prev => prev.filter(r => r._id !== id)); setResult(null); };

  // row별 validation
  function validateRow(r, idx) {
    const errs = [];
    if (!r.company)        errs.push('기업명 필수');
    if (!r.valuation_date) errs.push('기준일 필수');
    if (r.valuation !== '' && isNaN(Number(r.valuation)))       errs.push('기업가치 숫자 형식 오류');
    if (r.pe_multiple !== '' && isNaN(Number(r.pe_multiple)))   errs.push('P/E 숫자 형식 오류');
    if (r.source_link && !/^https?:\/\/.+/.test(r.source_link)) errs.push('source_link URL 형식 오류');
    return errs;
  }

  // row별 오류 계산 (실시간)
  const rowErrors = rows.map((r, i) => validateRow(r, i));
  const validRows = rows.filter((r, i) => rowErrors[i].length === 0 && r.company);

  async function save() {
    if (!validRows.length) return;
    setSaving(true);
    setResult(null);
    const failed = [];
    let saved = 0;
    try {
      const payload = validRows.map(r => ({
        company_id:     Number(r.company.id),
        valuation_date: r.valuation_date,
        valuation:      r.valuation      !== '' ? Number(r.valuation)    : null,
        pe_multiple:    r.pe_multiple    !== '' ? Number(r.pe_multiple)  : null,
        memo:           r.memo           || null,
        source_link:    r.source_link    || null,
      }));
      await companyService.insertValuationsBulk(payload);
      saved = payload.length;
      setRows([emptyRow()]); // 성공 후 초기화
    } catch(e) {
      failed.push({ rowIdx: '전체', reason: e.message });
    }
    setResult({ saved, failed });
    setSaving(false);
  }

  const COL_W = { company: 160, date: 120, val: 100, pe: 80, memo: 160, link: 180, del: 36 };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>기업가치 일괄 등록</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>여러 기업의 기업가치를 한 번에 입력하고 저장합니다. 정상 행만 저장됩니다.</div>
      </div>

      {/* 결과 메시지 */}
      {result && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          background: result.failed.length ? 'rgba(220,38,38,0.06)' : 'rgba(22,163,74,0.06)',
          border: `1px solid ${result.failed.length ? 'rgba(220,38,38,0.25)' : 'rgba(22,163,74,0.25)'}`,
          color: result.failed.length ? 'var(--red)' : 'var(--green)' }}>
          {result.saved > 0 && <div>✅ 기업가치 {result.saved}건이 저장되었습니다.</div>}
          {result.failed.map((f, i) => <div key={i}>❌ {f.rowIdx}행: {f.reason}</div>)}
        </div>
      )}

      {/* 입력 테이블 */}
      <div style={{ overflowX: 'auto', marginBottom: 12 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--bg3)' }}>
              {[['기업명 *', COL_W.company],['기준일 *', COL_W.date],['기업가치 (억)', COL_W.val],['P/E', COL_W.pe],['메모', COL_W.memo],['출처 링크', COL_W.link],['', COL_W.del]].map(([h, w], i) => (
                <th key={i} style={{ padding: '8px 8px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', width: w }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const errs   = rowErrors[i];
              const hasErr = errs.length > 0 && (r.company || r.valuation_date); // 입력 시작했을 때만 오류 표시
              return (
                <tr key={r._id} style={{ borderBottom: '1px solid var(--border)', background: hasErr ? 'rgba(220,38,38,0.03)' : 'transparent' }}>
                  <td style={{ padding: '4px 6px' }}>
                    <CompanySearchCell companies={companies} value={r.company}
                      onChange={c => set(r._id, 'company', c)} />
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input type="date" className="form-input" style={{ fontSize: 12, padding: '5px 8px', width: COL_W.date - 12 }}
                      value={r.valuation_date} onChange={e => set(r._id, 'valuation_date', e.target.value)} />
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input type="number" className="form-input" style={{ fontSize: 12, padding: '5px 8px', width: COL_W.val - 12 }}
                      placeholder="0" value={r.valuation} onChange={e => set(r._id, 'valuation', e.target.value)} />
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input type="number" className="form-input" style={{ fontSize: 12, padding: '5px 8px', width: COL_W.pe - 12 }}
                      placeholder="0" value={r.pe_multiple} onChange={e => set(r._id, 'pe_multiple', e.target.value)} />
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input className="form-input" style={{ fontSize: 12, padding: '5px 8px', width: COL_W.memo - 12 }}
                      placeholder="메모" value={r.memo} onChange={e => set(r._id, 'memo', e.target.value)} />
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input className="form-input" style={{ fontSize: 12, padding: '5px 8px', width: COL_W.link - 12 }}
                      placeholder="https://" value={r.source_link} onChange={e => set(r._id, 'source_link', e.target.value)} />
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

      {/* 오류 요약 */}
      {rows.some((r, i) => rowErrors[i].length > 0 && (r.company || r.valuation_date)) && (
        <div style={{ marginBottom: 12, fontSize: 12 }}>
          {rows.map((r, i) => rowErrors[i].length > 0 && (r.company || r.valuation_date) ? (
            <div key={r._id} style={{ color: 'var(--red)', marginBottom: 2 }}>❌ {i+1}행: {rowErrors[i].join(' · ')}</div>
          ) : null)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={addRow} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit' }}>
          + 행 추가
        </button>
        <button onClick={save} disabled={saving || !validRows.length} className="btn btn-primary" style={{ opacity: !validRows.length ? 0.5 : 1 }}>
          {saving ? '저장 중...' : `정상 ${validRows.length}건 저장`}
        </button>
        {rows.length - validRows.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>오류 {rows.length - validRows.length}행 제외</span>
        )}
      </div>
    </div>
  );
}
