// ─── FINANCIAL MODAL (신규 + 수정 공용) ──────────────────
function FinancialModal({ company, record, onClose, onSave, isAdmin, session }) {
  const { useState } = React;
  const isEdit = !!record;

  const [form, setForm] = useState({
    quarter:          isEdit ? (record.quarter          ?? '') : '',
    fiscal_date:      isEdit ? (record.fiscal_date      ?? '') : '',
    revenue:          isEdit ? (record.revenue          ?? '') : '',
    operating_profit: isEdit ? (record.operating_profit ?? '') : '',
    total_assets:     isEdit ? (record.total_assets     ?? '') : '',
    net_assets:       isEdit ? (record.net_assets       ?? '') : '',
    source:           isEdit ? (record.source           ?? '') : '',
    memo:             isEdit ? (record.memo             ?? '') : '',
  });

  const getStoredUser = () =>
    (typeof localStorage !== 'undefined' && localStorage.getItem('userName')) || '';

  const [changedBy,        setChangedBy]        = useState(isEdit ? getStoredUser() : '');
  const [reason,           setReason]           = useState('');
  const [loading,          setLoading]          = useState(false);
  const [linkedRequestId,  setLinkedRequestId]  = useState('');

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  function handleChangedByBlur(v) {
    if (v && typeof localStorage !== 'undefined') localStorage.setItem('userName', v);
  }

  async function submit() {
    if (!form.fiscal_date || !form.quarter) return alert('분기와 결산기준일을 입력해주세요');
    if (isEdit && !changedBy.trim()) return alert('수정자를 입력해주세요');
    if (isEdit && !reason.trim())    return alert('수정 사유를 입력해주세요');
    setLoading(true);
    try {
      const payload = {
        quarter:          form.quarter,
        fiscal_date:      form.fiscal_date,
        revenue:          form.revenue          !== '' ? form.revenue          : null,
        operating_profit: form.operating_profit !== '' ? form.operating_profit : null,
        total_assets:     form.total_assets     !== '' ? form.total_assets     : null,
        net_assets:       form.net_assets       !== '' ? form.net_assets       : null,
        source:           form.source           || null,
        memo:             form.memo             || null,
      };
      if (isEdit) {
        await companyService.updateFinancial(record.id, payload);
        await companyService.logDataChange({
          target_table: 'financials', target_id: record.id, company_id: company.id,
          action_type:  'UPDATE',
          old_snapshot: record, new_snapshot: { ...record, ...payload },
          changed_by:   changedBy.trim(), reason: reason.trim(),
          request_id:   linkedRequestId || null,
        });
      } else {
        const newRow = await companyService.insertFinancial({ company_id: company.id, ...payload });
        await companyService.logDataChange({
          target_table: 'financials', target_id: newRow?.id ?? null, company_id: company.id,
          action_type:  'INSERT',
          old_snapshot: null, new_snapshot: newRow || { company_id: company.id, ...payload },
          changed_by:   session?.user?.email || null,
          reason:       linkedRequestId ? '요청 기반 신규 추가' : '일반 신규 추가',
          request_id:   linkedRequestId || null,
        });
      }
      // 요청 연결 처리
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
          <div className="modal-title">{isEdit ? '재무실적 수정' : '수치 업데이트'} · {company.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">분기</label>
              <input className="form-input" placeholder="예: 2025 Q1" value={form.quarter} onChange={e=>set('quarter',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">결산기준일</label>
              <input type="date" className="form-input" value={form.fiscal_date} onChange={e=>set('fiscal_date',e.target.value)}/>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">매출 (억원)</label>
              <input type="number" className="form-input" placeholder="0" value={form.revenue} onChange={e=>set('revenue',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">영업이익 (억원)</label>
              <input type="number" className="form-input" placeholder="0" value={form.operating_profit} onChange={e=>set('operating_profit',e.target.value)}/>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">총자산 (억원)</label>
              <input type="number" className="form-input" placeholder="0" value={form.total_assets} onChange={e=>set('total_assets',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">순자산 (억원)</label>
              <input type="number" className="form-input" placeholder="0" value={form.net_assets} onChange={e=>set('net_assets',e.target.value)}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">출처</label>
            <input className="form-input" placeholder="예: 다트전자공시, 크레탑" value={form.source} onChange={e=>set('source',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">메모 (변화 이유)</label>
            <textarea className="form-textarea" placeholder="주요 변화 내용, 특이사항 등" value={form.memo} onChange={e=>set('memo',e.target.value)}/>
          </div>

          {isEdit && (
            <div style={{borderTop:'1px solid var(--border)',paddingTop:16,marginTop:4}}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>수정 이력</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">수정자 <span style={{color:'var(--red)'}}>*</span></label>
                  <input className="form-input" placeholder="이름 입력" value={changedBy}
                    onChange={e=>setChangedBy(e.target.value)}
                    onBlur={e=>handleChangedByBlur(e.target.value)}/>
                </div>
                <div className="form-group">
                  <label className="form-label">수정 사유 <span style={{color:'var(--red)'}}>*</span></label>
                  <input className="form-input" placeholder="수정 사유 입력" value={reason} onChange={e=>setReason(e.target.value)}/>
                </div>
              </div>
            </div>
          )}

          {isAdmin && (
            <RequestLinkSection
              requestType="UPDATE_FINANCIALS"
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
