// ─── REPORT BULK VIEW ─────────────────────────────────────
function ReportBulkView({ companies }) {
  const { useState } = React;

  const emptyRow = () => ({
    _id:          Math.random().toString(36).slice(2),
    company:      null,
    report_date:  '',
    report_type:  '',
    report_target:'',
    ppt_link:     '',
    notes:        '',
  });

  const [rows,   setRows]   = useState([emptyRow()]);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (id, key, val) => setRows(prev => prev.map(r => r._id === id ? { ...r, [key]: val } : r));
  const addRow    = ()   => { setRows(prev => [...prev, emptyRow()]); setResult(null); };
  const removeRow = (id) => { setRows(prev => prev.filter(r => r._id !== id)); setResult(null); };

  function validateRow(r) {
    const errs = [];
    if (!r.company)     errs.push('기업명 필수');
    if (!r.report_date) errs.push('보고일 필수');
    if (r.ppt_link && !/^https?:\/\/.+/.test(r.ppt_link)) errs.push('ppt_link URL 형식 오류');
    return errs;
  }

  const rowErrors = rows.map(r => validateRow(r));
  const validRows = rows.filter((r, i) => rowErrors[i].length === 0 && r.company);

  async function save() {
    if (!validRows.length) return;
    setSaving(true);
    setResult(null);
    let saved = 0;
    const failed = [];
    try {
      const payload = validRows.map(r => ({
        company_id:    Number(r.company.id),
        report_date:   r.report_date,
        report_type:   r.report_type   || null,
        report_target: r.report_target || null,
        ppt_link:      r.ppt_link      || null,
        notes:         r.notes         || null,
      }));
      await companyService.insertReportsBulk(payload);
      saved = payload.length;
      setRows([emptyRow()]);
    } catch(e) {
      failed.push({ rowIdx: '전체', reason: e.message });
    }
    setResult({ saved, failed });
    setSaving(false);
  }

  const COL_W = { company: 160, date: 120, type: 160, target: 160, link: 180, notes: 160, del: 36 };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>보고이력 일괄 등록</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>여러 기업의 보고이력을 한 번에 입력하고 저장합니다. 정상 행만 저장됩니다.</div>
      </div>

      {result && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          background: result.failed.length ? 'rgba(220,38,38,0.06)' : 'rgba(22,163,74,0.06)',
          border: `1px solid ${result.failed.length ? 'rgba(220,38,38,0.25)' : 'rgba(22,163,74,0.25)'}`,
          color: result.failed.length ? 'var(--red)' : 'var(--green)' }}>
          {result.saved > 0 && <div>✅ 보고이력 {result.saved}건이 저장되었습니다.</div>}
          {result.failed.map((f, i) => <div key={i}>❌ {f.rowIdx}행: {f.reason}</div>)}
        </div>
      )}

      <div style={{ overflowX: 'auto', marginBottom: 12 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--bg3)' }}>
              {[['기업명 *', COL_W.company],['보고일 *', COL_W.date],['보고유형', COL_W.type],['보고대상', COL_W.target],['PPT 링크', COL_W.link],['메모', COL_W.notes],['', COL_W.del]].map(([h, w], i) => (
                <th key={i} style={{ padding: '8px 8px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', width: w }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const errs   = rowErrors[i];
              const hasErr = errs.length > 0 && (r.company || r.report_date);
              return (
                <tr key={r._id} style={{ borderBottom: '1px solid var(--border)', background: hasErr ? 'rgba(220,38,38,0.03)' : 'transparent' }}>
                  <td style={{ padding: '4px 6px' }}>
                    <CompanySearchCell companies={companies} value={r.company}
                      onChange={c => set(r._id, 'company', c)} />
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input type="date" className="form-input" style={{ fontSize: 12, padding: '5px 8px', width: COL_W.date - 12 }}
                      value={r.report_date} onChange={e => set(r._id, 'report_date', e.target.value)} />
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input className="form-input" style={{ fontSize: 12, padding: '5px 8px', width: COL_W.type - 12 }}
                      placeholder="예: CM 경영기획" value={r.report_type} onChange={e => set(r._id, 'report_type', e.target.value)} />
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input className="form-input" style={{ fontSize: 12, padding: '5px 8px', width: COL_W.target - 12 }}
                      placeholder="예: 경영진 주간보고" value={r.report_target} onChange={e => set(r._id, 'report_target', e.target.value)} />
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input className="form-input" style={{ fontSize: 12, padding: '5px 8px', width: COL_W.link - 12 }}
                      placeholder="https://" value={r.ppt_link} onChange={e => set(r._id, 'ppt_link', e.target.value)} />
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input className="form-input" style={{ fontSize: 12, padding: '5px 8px', width: COL_W.notes - 12 }}
                      placeholder="메모" value={r.notes} onChange={e => set(r._id, 'notes', e.target.value)} />
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

      {rows.some((r, i) => rowErrors[i].length > 0 && (r.company || r.report_date)) && (
        <div style={{ marginBottom: 12, fontSize: 12 }}>
          {rows.map((r, i) => rowErrors[i].length > 0 && (r.company || r.report_date) ? (
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
