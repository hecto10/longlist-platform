// ─── VALUATION MODAL (신규 + 수정 공용) ──────────────────
function ValuationModal({ company, record, onClose, onSave, isAdmin, session }) {
  const { useState, useEffect } = React;
  const isEdit = !!record;

  const [form, setForm] = useState({
    valuation_date: isEdit ? (record.valuation_date ?? '') : '',
    valuation:      isEdit ? (record.valuation      ?? '') : '',
    memo:           isEdit ? (record.memo            ?? '') : '', // 거래유형
    source_link:    isEdit ? (record.source_link     ?? '') : '', // 출처
  });
  const [reason,           setReason]           = useState('');
  const [loading,          setLoading]          = useState(false);
  const [linkedRequestId,  setLinkedRequestId]  = useState('');
  const [financials,       setFinancials]        = useState([]);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  // 해당 기업 재무 데이터 로드 (P/E 자동 계산용)
  useEffect(() => {
    companyService.fetchFinancialsByCompany(company.id)
      .then(setFinancials)
      .catch(() => {});
  }, [company.id]);

  // P/E 자동 계산
  function calcPE(valuationDate, valuationAmt, financialsList) {
    if (!valuationDate || !valuationAmt || !financialsList.length) return { pe: null, basis: null };
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

  const { pe, basis } = calcPE(form.valuation_date, form.valuation, financials);

  async function submit() {
    if (!form.valuation_date) return alert('기준일을 입력해주세요');
    if (isEdit && !reason.trim()) return alert('수정 사유를 입력해주세요');
    setLoading(true);
    try {
      const payload = {
        valuation_date: form.valuation_date,
        valuation:      form.valuation    !== '' ? form.valuation    : null,
        pe_multiple:    pe                 !== null ? Number(pe)      : null,
        memo:           form.memo         || null,
        source_link:    form.source_link  || null,
      };
      if (isEdit) {
        await companyService.updateValuation(record.id, payload);
        await companyService.logDataChange({
          target_table: 'valuations', target_id: record.id, company_id: company.id,
          action_type:  'UPDATE',
          old_snapshot: record, new_snapshot: { ...record, ...payload },
          changed_by:   session?.user?.email || null, reason: reason.trim(),
          request_id:   linkedRequestId || null,
        });
      } else {
        const newRow = await companyService.insertValuation({ company_id: company.id, ...payload });
        await companyService.logDataChange({
          target_table: 'valuations', target_id: newRow?.id ?? null, company_id: company.id,
          action_type:  'INSERT',
          old_snapshot: null, new_snapshot: newRow || { company_id: company.id, ...payload },
          changed_by:   session?.user?.email || null,
          reason:       linkedRequestId ? '요청 기반 신규 추가' : '일반 신규 추가',
          request_id:   linkedRequestId || null,
        });
      }
      if (isAdmin && session && linkedRequestId) {
        await requestService.updateRequestStatus(
          linkedRequestId, 'done', session.user.id, null, String(company.id)
        );
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
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? '기업가치 수정' : '기업가치 업데이트'} · {company.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">기준일</label>
              <input type="date" className="form-input" value={form.valuation_date} onChange={e=>set('valuation_date',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">기업가치 (억원)</label>
              <input type="number" className="form-input" placeholder="0" value={form.valuation} onChange={e=>set('valuation',e.target.value)}/>
            </div>
          </div>

          {/* P/E 자동 계산 표시 */}
          <div style={{background:'var(--bg3)',borderRadius:6,padding:'8px 12px',marginBottom:12,fontSize:12}}>
            <span style={{color:'var(--text3)'}}>P/E 자동 계산: </span>
            {pe !== null ? (
              <>
                <strong style={{color:'var(--accent)',fontFamily:'MaruBuri,sans-serif'}}>{pe}x</strong>
                {basis && (
                  <span style={{fontSize:11,color:'var(--text3)',marginLeft:8}}>
                    ({basis.fiscal_date} 영업이익 {Number(basis.operating_profit).toLocaleString()}억 기준)
                  </span>
                )}
              </>
            ) : (
              <span style={{color:'var(--text3)'}}>— {!form.valuation_date || !form.valuation ? '기준일·기업가치 입력 후 계산' : '영업이익 데이터 없음 (null 저장)'}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">거래유형</label>
              <input className="form-input" placeholder="예: 신주 투자, Series B, M&A" value={form.memo} onChange={e=>set('memo',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">출처</label>
              <input className="form-input" placeholder="예: 혁신의숲, DART, IR자료" value={form.source_link} onChange={e=>set('source_link',e.target.value)}/>
            </div>
          </div>

          {isEdit && (
            <div style={{borderTop:'1px solid var(--border)',paddingTop:16,marginTop:4}}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>수정 이력</div>
              <div style={{fontSize:12,color:'var(--text3)',marginBottom:10}}>
                수정자: <span style={{color:'var(--text2)'}}>{session?.user?.email || '—'}</span>
                <span style={{marginLeft:8,fontSize:11}}>· 자동 기록됩니다</span>
              </div>
              <div className="form-group">
                <label className="form-label">수정 사유 <span style={{color:'var(--red)'}}>*</span></label>
                <input className="form-input" placeholder="수정 사유 입력" value={reason} onChange={e=>setReason(e.target.value)}/>
              </div>
            </div>
          )}

          {isAdmin && (
            <RequestLinkSection
              requestType="UPDATE_VALUATION"
              companyId={company.id}
              onSelect={id => setLinkedRequestId(id)}
            />
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
