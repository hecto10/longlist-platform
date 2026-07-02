// ─── USER MANAGEMENT VIEW (admin 전용) ───────────────────
function UserManagementView({ onBack, currentUserId, session }) {
  const { useState, useEffect } = React;
  const [profiles,       setProfiles]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [toast,          setToast]          = useState(null);
  const [allowedEmails,  setAllowedEmails]  = useState([]);
  const [newEmail,       setNewEmail]       = useState('');
  const [newNote,        setNewNote]        = useState('');
  const [newRole,        setNewRole]        = useState('user');
  const [addingEmail,    setAddingEmail]    = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [data, emails] = await Promise.all([
        authService.fetchAllProfiles(),
        authService.fetchAllowedEmails(),
      ]);
      setProfiles(data);
      setAllowedEmails(emails);
    } catch(e) {
      setToast({ msg: '불러오기 실패: ' + e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAddAllowedEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!email) return alert('이메일을 입력해주세요');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('올바른 이메일 형식을 입력해주세요');
    setAddingEmail(true);
    try {
      await authService.addAllowedEmail(email, newNote, session?.user?.id, newRole);
      setNewEmail(''); setNewNote(''); setNewRole('user');
      await load();
      setToast({ msg: `${email} 사전 승인 등록 완료`, type: 'success' });
    } catch(e) {
      if (e.message?.includes('unique')) alert('이미 등록된 이메일입니다');
      else alert('등록 실패: ' + e.message);
    } finally { setAddingEmail(false); }
  }

  async function handleDeleteAllowedEmail(id, email) {
    if (!window.confirm(`${email}을 사전 승인 목록에서 제거하시겠습니까?`)) return;
    try {
      await authService.deleteAllowedEmail(id);
      await load();
      setToast({ msg: '삭제됐어요', type: 'success' });
    } catch(e) { alert('삭제 실패: ' + e.message); }
  }

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
                  {p.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(p.id, 'blocked')}
                      style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: 'var(--red)', cursor: 'pointer', fontFamily: 'inherit' }}
                    >차단</button>
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

      {/* ── 사전 승인 이메일 ── */}
      <div style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>사전 승인 이메일</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
          등록된 이메일은 최초 로그인 시 승인 대기 없이 바로 활성화됩니다.
        </div>

        {/* 추가 입력 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            className="form-input" style={{ flex: 2, minWidth: 200 }}
            placeholder="이메일 (예: yeeun.kim@hecto.co.kr)"
            value={newEmail} onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddAllowedEmail()}
          />
          <select
            className="form-input" style={{ width: 100, flexShrink: 0 }}
            value={newRole} onChange={e => setNewRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <input
            className="form-input" style={{ flex: 1, minWidth: 100 }}
            placeholder="메모 (선택)"
            value={newNote} onChange={e => setNewNote(e.target.value)}
          />
          <button
            className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}
            onClick={handleAddAllowedEmail} disabled={addingEmail}
          >{addingEmail ? '등록 중...' : '+ 등록'}</button>
        </div>

        {/* 등록된 목록 */}
        {allowedEmails.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>등록된 사전 승인 이메일이 없습니다</div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {allowedEmails.map((ae, idx) => (
              <div key={ae.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', fontSize: 13,
                borderBottom: idx < allowedEmails.length - 1 ? '1px solid var(--border)' : 'none',
                background: 'var(--bg2)',
              }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{ae.email}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, marginLeft: 8,
                    background: ae.initial_role === 'admin' ? 'rgba(255,106,0,0.12)' : 'var(--bg3)',
                    color: ae.initial_role === 'admin' ? 'var(--accent)' : 'var(--text3)',
                    border: `1px solid ${ae.initial_role === 'admin' ? 'rgba(255,106,0,0.3)' : 'var(--border)'}`,
                  }}>{ae.initial_role === 'admin' ? 'ADMIN' : 'USER'}</span>
                  {ae.note && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8 }}>{ae.note}</span>}
                </div>
                <button
                  onClick={() => handleDeleteAllowedEmail(ae.id, ae.email)}
                  style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: 'var(--red)', cursor: 'pointer', fontFamily: 'inherit' }}
                >삭제</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
