// ─── DELETE CONFIRM MODAL ────────────────────────────────
function DeleteConfirmModal({ company, record, tableType, onClose, onDelete }) {
  const { useState } = React;
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const tableLabel = {
    financials: '재무실적',
    valuations: '기업가치',
    reports:    '보고 이력',
  }[tableType] || tableType;

  const recordLabel = {
    financials: record.fiscal_date   ? `${record.quarter || ''} (${fmtDate(record.fiscal_date)})` : record.id,
    valuations: record.valuation_date ? fmtDate(record.valuation_date) : record.id,
    reports:    record.report_date    ? fmtDate(record.report_date)    : record.id,
  }[tableType] || record.id;

  async function submit() {
    if (!reason.trim()) return alert('삭제 사유를 입력해주세요');
    setLoading(true);
    try {
      await onDelete(reason.trim());
      onClose();
    } catch(e) {
      alert('삭제 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:440}}>
        <div className="modal-header">
          <div className="modal-title" style={{color:'var(--red)'}}>삭제 확인</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{background:'rgba(220,38,38,0.06)',border:'1px solid rgba(220,38,38,0.2)',borderRadius:8,padding:'12px 16px',marginBottom:20,fontSize:13,color:'var(--text2)',lineHeight:1.6}}>
            <strong style={{color:'var(--text)'}}>{company.name}</strong>의{' '}
            <strong style={{color:'var(--text)'}}>{tableLabel}</strong> 데이터를 삭제합니다.<br/>
            <span style={{fontSize:12,color:'var(--text3)'}}>대상: {recordLabel}</span>
          </div>
          <div className="form-group">
            <label className="form-label">삭제 사유 <span style={{color:'var(--red)'}}>*</span></label>
            <textarea
              className="form-textarea"
              placeholder="삭제 사유를 입력해주세요 (필수)"
              value={reason}
              onChange={e => setReason(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:8}}>
            ※ 삭제된 데이터는 복구할 수 없으며, 삭제 로그가 기록됩니다.
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>취소</button>
            <button
              className="btn"
              style={{background:'var(--red)',color:'#fff'}}
              onClick={submit}
              disabled={loading || !reason.trim()}
            >
              {loading ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
