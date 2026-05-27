// ─── SOFT DELETE MODAL ───────────────────────────────────
function SoftDeleteModal({ company, session, onClose, onDeleted }) {
  const { useState } = React;
  const [reason,  setReason]  = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!reason.trim()) return alert('삭제 사유를 입력해주세요');
    setLoading(true);
    try {
      await companyService.softDelete(company.id, session.user.id, reason.trim());
      onDeleted();
    } catch(e) {
      alert('삭제 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div className="modal-title" style={{ color: 'var(--red)' }}>기업 삭제 · {company.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text)' }}>⚠️ 삭제된 기업은 목록에서 숨겨집니다.</strong><br/>
            재무실적, 기업가치, 보고이력 등 하위 데이터는 유지됩니다.<br/>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>복구가 필요하면 관리자에게 문의하세요.</span>
          </div>
          <div className="form-group">
            <label className="form-label">삭제 사유 <span style={{ color: 'var(--red)' }}>*</span></label>
            <textarea
              className="form-textarea"
              placeholder="삭제 사유를 입력해주세요 (필수)"
              value={reason}
              onChange={e => setReason(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
            ※ 삭제 이력이 기록되며, 하위 데이터는 보존됩니다.
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>취소</button>
            <button
              className="btn"
              style={{ background: 'var(--red)', color: '#fff', opacity: reason.trim() ? 1 : 0.5 }}
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
