// ─── USER MANAGEMENT VIEW (admin 전용) ───────────────────
function UserManagementView({ onBack, currentUserId }) {
  const { useState, useEffect } = React;
  const [profiles, setProfiles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await authService.fetchAllProfiles();
      setProfiles(data);
    } catch(e) {
      setToast({ msg: '불러오기 실패: ' + e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRoleChange(userId, newRole) {
    if (userId === currentUserId) return alert('본인 role은 변경할 수 없습니다');
    try {
      await authService.updateProfileRole(userId, newRole);
      setProfiles(ps => ps.map(p => p.id === userId ? { ...p, role: newRole } : p));
      setToast({ msg: 'Role이 변경됐어요', type: 'success' });
    } catch(e) {
      setToast({ msg: '변경 실패: ' + e.message, type: 'error' });
    }
  }

  async function handleStatusChange(userId, newStatus) {
    if (userId === currentUserId) return alert('본인 상태는 변경할 수 없습니다');
    try {
      await authService.updateProfileStatus(userId, newStatus);
      setProfiles(ps => ps.map(p => p.id === userId ? { ...p, status: newStatus } : p));
      setToast({ msg: '상태가 변경됐어요', type: 'success' });
    } catch(e) {
      setToast({ msg: '변경 실패: ' + e.message, type: 'error' });
    }
  }

  const statusLabel = { pending: '대기중', active: '활성', blocked: '차단' };
  const statusColor = {
    pending: 'var(--amber)',
    active:  'var(--green)',
    blocked: 'var(--red)',
  };
  const statusBg = {
    pending: 'rgba(245,158,11,0.1)',
    active:  'rgba(22,163,74,0.1)',
    blocked: 'rgba(220,38,38,0.1)',
  };

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="back-btn" onClick={onBack}>← 돌아가기</button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>사용자 관리</div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><span>불러오는 중...</span></div>
      ) : (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>

          {/* 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 180px', padding: '10px 20px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
            {['사용자', 'Role', '상태', '액션'].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
            ))}
          </div>

          {/* 목록 */}
          {profiles.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👤</div><div>사용자가 없습니다</div></div>
          ) : profiles.map(p => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 180px', padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>

              {/* 사용자 정보 */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                  {p.name || '(이름 없음)'}
                  {p.id === currentUserId && (
                    <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 6 }}>(나)</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'MaruBuri, sans-serif' }}>
                  {new Date(p.created_at).toLocaleDateString('ko-KR')}
                </div>
              </div>

              {/* Role */}
              <div>
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600,
                  background: p.role === 'admin' ? 'rgba(255,106,0,0.1)' : 'var(--bg3)',
                  color: p.role === 'admin' ? 'var(--accent)' : 'var(--text2)',
                  border: `1px solid ${p.role === 'admin' ? 'rgba(255,106,0,0.3)' : 'var(--border)'}`,
                }}>
                  {p.role === 'admin' ? 'ADMIN' : 'USER'}
                </span>
              </div>

              {/* 상태 */}
              <div>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
                  background: statusBg[p.status] || 'var(--bg3)',
                  color: statusColor[p.status] || 'var(--text3)',
                  border: `1px solid ${statusColor[p.status] || 'var(--border)'}33`,
                }}>
                  {statusLabel[p.status] || p.status}
                </span>
              </div>

              {/* 액션 */}
              {p.id === currentUserId ? (
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>변경 불가</div>
              ) : (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {/* 상태 버튼 */}
                  {p.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(p.id, 'active')}
                      style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px solid rgba(22,163,74,0.4)', background: 'rgba(22,163,74,0.08)', color: 'var(--green)', cursor: 'pointer', fontFamily: 'inherit' }}
                    >승인</button>
                  )}
                  {p.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(p.id, 'blocked')}
                      style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: 'var(--red)', cursor: 'pointer', fontFamily: 'inherit' }}
                    >차단</button>
                  )}
                  {p.status === 'blocked' && (
                    <button
                      onClick={() => handleStatusChange(p.id, 'active')}
                      style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px solid rgba(22,163,74,0.4)', background: 'rgba(22,163,74,0.08)', color: 'var(--green)', cursor: 'pointer', fontFamily: 'inherit' }}
                    >복구</button>
                  )}
                  {/* Role 버튼 */}
                  {p.status === 'active' && (
                    <button
                      onClick={() => handleRoleChange(p.id, p.role === 'admin' ? 'user' : 'admin')}
                      style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit' }}
                    >{p.role === 'admin' ? '→ USER' : '→ ADMIN'}</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
