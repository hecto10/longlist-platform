// ─── APP ─────────────────────────────────────────────────
function App() {
  const { useState, useEffect } = React;
  const [selected,    setSelected]    = useState(null);
  const [session,     setSession]     = useState(undefined);
  const [profile,     setProfile]     = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'users' | 'requests'

  useEffect(() => {
    authService.getSession().then(s => {
      setSession(s);
      if (s?.user) loadProfile(s.user.id);
    }).catch(() => setSession(null));

    const sub = authService.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id);
      } else {
        setProfile(null);
        setSelected(null);
        setView('list');
      }
    });

    return () => sub.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    try {
      const p = await authService.getProfile(userId);
      setProfile(p);
    } catch(e) {
      setTimeout(() => {
        authService.getProfile(userId)
          .then(setProfile)
          .catch(() => {});
      }, 1500);
    }
  }

  async function handleSignOut() {
    await authService.signOut();
  }

  // ── 로딩 중 ───────────────────────────────────────────
  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  // ── 미로그인 ──────────────────────────────────────────
  if (!session) return <LoginView />;

  // ── 접근 제한 (pending / blocked) ────────────────────
  if (profile && profile.status !== 'active') {
    const isPending = profile.status === 'pending';
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>{isPending ? '⏳' : '🚫'}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            {isPending ? '승인 대기 중' : '접근이 제한된 계정'}
          </div>
          {isPending ? (
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.9 }}>
              관리자 승인 후 서비스를 이용할 수 있습니다.<br/>
              승인 요청은 이미 접수되었습니다.<br/>
              추가 로그인 링크 요청은 필요하지 않습니다.<br/>
              <br/>
              문의: <a href="mailto:mgtplan_of@hecto.co.kr" style={{ color: 'var(--accent)', textDecoration: 'none' }}>mgtplan_of@hecto.co.kr</a>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.9 }}>
              계정 접근이 제한되었습니다.<br/>
              사유 확인 또는 재승인이 필요한 경우<br/>
              담당자에게 문의해주세요.<br/>
              <br/>
              문의: <a href="mailto:mgtplan_of@hecto.co.kr" style={{ color: 'var(--accent)', textDecoration: 'none' }}>mgtplan_of@hecto.co.kr</a>
            </div>
          )}
          <button
            onClick={handleSignOut}
            style={{ marginTop: 28, fontSize: 13, color: 'var(--text3)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontFamily: 'inherit' }}
          >로그아웃</button>
        </div>
      </div>
    );
  }

  const isAdmin  = profile?.role === 'admin';
  const userName = profile?.name || session.user.email;

  return (
    <div className="app">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="header-logo">
            <span>●</span> Longlist <span style={{ color: 'var(--text3)', fontWeight: 400 }}>Platform</span>
          </div>
          {isAdmin && (
            <nav style={{ display: 'flex', gap: 2 }}>
              <button
                className={`nav-btn ${view === 'list' ? 'active' : ''}`}
                onClick={() => { setView('list'); setSelected(null); }}
              >기업 목록</button>
              <button
                className={`nav-btn ${view === 'requests' ? 'active' : ''}`}
                onClick={() => { setView('requests'); setSelected(null); }}
              >요청 관리</button>
              <button
                className={`nav-btn ${view === 'users' ? 'active' : ''}`}
                onClick={() => { setView('users'); setSelected(null); }}
              >사용자 관리</button>
            </nav>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'MaruBuri,sans-serif' }}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              {isAdmin && (
                <span style={{ fontSize: 10, background: 'rgba(255,106,0,0.1)', color: 'var(--accent)', border: '1px solid rgba(255,106,0,0.3)', borderRadius: 4, padding: '1px 6px', marginRight: 6, fontWeight: 600 }}>
                  ADMIN
                </span>
              )}
              {userName}
            </div>
            <button
              onClick={handleSignOut}
              style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
            >로그아웃</button>
          </div>
        </div>
      </header>

      <main className="main">
        {view === 'users' && isAdmin ? (
          <UserManagementView
            onBack={() => setView('list')}
            currentUserId={session.user.id}
          />
        ) : view === 'requests' && isAdmin ? (
          <RequestManagementView session={session} />
        ) : selected ? (
          <DetailView
            company={selected}
            onBack={() => setSelected(null)}
            isAdmin={isAdmin}
            session={session}
            userProfile={profile}
          />
        ) : (
          <ListView onSelect={setSelected} isAdmin={isAdmin} session={session} profile={profile} />
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
