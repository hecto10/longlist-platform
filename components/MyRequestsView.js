// ─── MY REQUESTS VIEW (user 전용) ────────────────────────
function MyRequestsView({ session }) {
  const { useState, useEffect } = React;
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);

  useEffect(() => {
    requestService.fetchMyRequests(session.user.id)
      .then(data => setRequests(data))
      .catch(e => setToast({ msg: '불러오기 실패: ' + e.message, type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const typeLabel = {
    ADD_COMPANY:       '기업 추가',
    UPDATE_FINANCIALS: '재무실적 업데이트',
    UPDATE_VALUATION:  '기업가치 업데이트',
  };

  const updateTypeLabel = { new: '최신 데이터 업데이트', fix: '기존 데이터 수정' };

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>내 요청 목록</div>

      {loading ? (
        <div className="loading"><div className="spinner" /><span>불러오는 중...</span></div>
      ) : requests.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📋</div><div>등록한 요청이 없습니다</div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requests.map(r => (
            <div key={r.id} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
              padding: '16px 20px',
              borderLeft: `3px solid ${r.status === 'pending' ? 'var(--accent)' : 'var(--border2)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>

                  {/* 유형 + 상태 badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                      background: r.status === 'pending' ? 'rgba(255,106,0,0.1)' : 'rgba(22,163,74,0.1)',
                      color: r.status === 'pending' ? 'var(--accent)' : 'var(--green)',
                      border: `1px solid ${r.status === 'pending' ? 'rgba(255,106,0,0.3)' : 'rgba(22,163,74,0.3)'}`,
                    }}>
                      {r.status === 'pending' ? '대기중' : '처리완료'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {typeLabel[r.request_type] || r.request_type}
                    </span>
                    {r.company_name && (
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>· {r.company_name}</span>
                    )}
                  </div>

                  {/* 요청 구분 (UPDATE 계열) */}
                  {r.payload?.update_type && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
                      구분: {updateTypeLabel[r.payload.update_type] || r.payload.update_type}
                      {r.payload.old_snapshot && (
                        <span style={{ marginLeft: 8, color: 'var(--text3)' }}>
                          ({r.payload.old_snapshot.fiscal_date || r.payload.old_snapshot.valuation_date || ''})
                        </span>
                      )}
                    </div>
                  )}

                  {/* 목적 태그 */}
                  {r.request_purposes?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                      {r.request_purposes.map((p, i) => (
                        <span key={i} style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 12,
                          background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)',
                        }}>{p}</span>
                      ))}
                    </div>
                  )}

                  {/* 메모 */}
                  {r.memo && (
                    <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>"{r.memo}"</div>
                  )}
                </div>

                {/* 날짜 */}
                <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {new Date(r.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
