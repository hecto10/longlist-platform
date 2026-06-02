// ─── VALUATION BULK VIEW ──────────────────────────────────
function ValuationBulkView({ companies }) {
  const { useState, useEffect, useRef } = React;

  const emptyRow = () => ({
    _id:            Math.random().toString(36).slice(2),
    company:        null,
    valuation_date: '',
    valuation:      '',
    memo:           '',   // 거래유형
    source_link:    '',   // 출처
  });

  const [rows,       setRows]       = useState([emptyRow()]);
  const [result,     setResult]     = useState(null);
  const [saving,     setSaving]     = useState(false);
  // 기업별 financials 캐시: { [companyId]: [...] }
  const financialsCache = useRef({});

  const set = (id, key, val) => setRows(prev => prev.map(r => r._id === id ? { ...r, [key]: val } : r));
  const addRow    = ()   => { setRows(prev => [...prev, emptyRow()]); setResult(null); };
  const removeRow = (id) => { setRows(prev => prev.filter(r => r._id !== id)); setResult(null); };

  // 기업 선택 시 financials 사전 로드 (P/E 계산용)
  async function handleCompanySelect(rowId, company) {
    set(rowId, 'company', company);
    if (!company) return;
    const cid = String(company.id);
    if (!financialsCache.current[cid]) {
      try {
        const data = await companyService.fetchFinancialsByCompany(company.id);
        financialsCache.current[cid] = data;
        setRows(prev => [...prev]); // 리렌더 트리거
      } catch {}
    }
  }

  // P/E 자동 계산 (ValuationModal과 동일 로직)
  function calcPE(valuationDate, valuationAmt, financialsList) {
    if (!valuationDate || !valuationAmt || !financialsList?.length) return { pe: null, basis: null };
    const vDate = new Date(valuationDate);
    const nearest = financialsList.reduce((best, f) => {
      if (!f.operating_profit || Number(f.operating_profit) <= 0) return best;
      const fDate = new Date(f.fiscal_date);
      if (fDate > vDate) return best;
      const diff = vDate - fDate;
      const bestDiff = best ? vDate - new Date(best.fiscal_date) : Infinity;
      return diff < bestDiff ? f : best;
    }, null);
    if (!nearest) return { pe: null, basis: null };
    const pe = (Number(valuationAmt) / Number(nearest.operating_profit)).toFixed(1);
    return { pe, basis: nearest };
  }

  // row별 validation
  function validateRow(r) {
    const errs = [];
    if (!r.company)        errs.push('기업명 필수');
    if (!r.valuation_date) errs.push('기준일 필수');
    if (r.valuation !== '' && isNaN(Number(r.valuation))) errs.push('기업가치 숫자 형식 오류');
    return errs;
  }

  const rowErrors = rows.map(r => validateRow(r));
  const validRows = rows.filter((r, i) => rowErrors[i].length === 0 && r.company);

  async function save() {
    if (!validRows.length) return;
    setSaving(true);
    setResult(null);
    const failed = [];
    let saved = 0;
    try {
      const payload = validRows.map(r => {
        const fins = financialsCache.current[String(r.company.id)] || [];
        const { pe } = calcPE(r.valuation_date, r.valuation, fins);
        return {
          company_id:     Number(r.company.id),
          valuation_date: r.valuation_date,
          valuation:      r.valuation !== '' ? Number(r.valuation) : null,
          pe_multiple:    pe !== null ? Number(pe) : null,
          memo:           r.memo        || null,
          source_link:    r.source_link || null,
        };
      });
      await companyService.insertValuationsBulk(payload);
      saved = payload.length;
      setRows([emptyRow()]);
      financialsCache.current = {};
    } catch(e) {
      failed.push({ rowIdx: '전체', reason: e.message });
    }
    setResult({ saved, failed });
    setSaving(false);
  }

  const COL = { company: 160, date: 120, val: 100, pe: 160, type: 140, src: 140, del: 36 };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>기업가치 일괄 등록</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          여러 기업의 기업가치를 한 번에 입력하고 저장합니다. P/E는 재무 데이터 기준으로 자동 계산됩니다.
        </div>
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
              {[
                ['기업명 *', COL.company], ['기준일 *', COL.date],
                ['기업가치 (억)', COL.val], ['P/E (자동)', COL.pe],
                ['거래유형', COL.type], ['출처', COL.src], ['', COL.del]
              ].map(([h, w], i) => (
                <th key={i} style={{ padding: '8px 8px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', width: w }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const errs    = rowErrors[i];
              const hasErr  = errs.length > 0 && (r.company || r.valuation_date);
              const fins    = financialsCache.current[String(r.company?.id)] || [];
              const { pe, basis } = calcPE(r.valuation_date, r.valuation, fins);
              return (
                <tr key={r._id} style={{ borderBottom: '1px solid var(--border)', background: hasErr ? 'rgba(220,38,38,0.03)' : 'transparent' }}>
                  <td style={{ padding: '4px 6px' }}>
                    <CompanySearchCell companies={companies} value={r.company}
                      onChange={c => handleCompanySelect(r._id, c)} />
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input type="date" className="form-input"
                      style={{ fontSize: 12, padding: '5px 8px', width: COL.date - 12 }}
                      value={r.valuation_date}
                      onChange={e => set(r._id, 'valuation_date', e.target.value)} />
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input type="number" className="form-input"
                      style={{ fontSize: 12, padding: '5px 8px', width: COL.val - 12 }}
                      placeholder="0" value={r.valuation}
                      onChange={e => set(r._id, 'valuation', e.target.value)} />
                  </td>
                  {/* P/E 자동 계산 표시 */}
                  <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>
                    {pe !== null ? (
                      <div>
                        <span style={{ fontFamily: 'MaruBuri,sans-serif', fontWeight: 600, color: 'var(--accent)' }}>{pe}x</span>
                        {basis && (
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, lineHeight: 1.3 }}>
                            {basis.fiscal_date}<br/>영업이익 기준
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input className="form-input"
                      style={{ fontSize: 12, padding: '5px 8px', width: COL.type - 12 }}
                      placeholder="예: 신주 투자, Series B" value={r.memo}
                      onChange={e => set(r._id, 'memo', e.target.value)} />
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <input className="form-input"
                      style={{ fontSize: 12, padding: '5px 8px', width: COL.src - 12 }}
                      placeholder="예: 혁신의숲, DART" value={r.source_link}
                      onChange={e => set(r._id, 'source_link', e.target.value)} />
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
        <button onClick={addRow}
          style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit' }}>
          + 행 추가
        </button>
        <button onClick={save} disabled={saving || !validRows.length} className="btn btn-primary"
          style={{ opacity: !validRows.length ? 0.5 : 1 }}>
          {saving ? '저장 중...' : `정상 ${validRows.length}건 저장`}
        </button>
        {rows.length - validRows.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>오류 {rows.length - validRows.length}행 제외</span>
        )}
      </div>
    </div>
  );
}
