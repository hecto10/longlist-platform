// ─── APP ─────────────────────────────────────────────────
function App() {
  const { useState, useEffect } = React;
  const [selected,     setSelected]     = useState(null);
  const [session,      setSession]      = useState(undefined); // undefined = 로딩 중
  const [profile,      setProfile]      = useState(null);

  // 세션 초기 확인 + 변경 구독
  useEffect(() => {
    // 1) 현재 세션 확인
    authService.getSession().then(s => {
      setSession(s);
      if (s?.user) loadProfile(s.user.id);
    }).catch(() => setSession(null));

    // 2) 세션 변경 감지 (Magic Link 클릭 후 리다이렉트 포함)
    const sub = authService.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id);
      } else {
        setProfile(null);
        setSelected(null);
      }
    });

    return () => sub.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    try {
      const p = await authService.getProfile(userId);
      setProfile(p);
    } catch(e) {
      // profile이 아직 없으면 트리거가 생성 중 — 잠시 후 재시도
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

  // 로딩 중
  if (session === undefined) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
        <div className="spinner"/>
      </div>
    );
  }

  // 미로그인
  if (!session) {
    return <LoginView/>;
  }

  const isAdmin = profile?.role === 'admin';
  const userName = profile?.name || session.user.email;

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <span>●</span> Longlist <span style={{color:'var(--text3)',fontWeight:400}}>Platform</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{fontSize:12,color:'var(--text3)',fontFamily:'MaruBuri,sans-serif'}}>
            {new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'})}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{fontSize:12,color:'var(--text2)'}}>
              {isAdmin && (
                <span style={{fontSize:10,background:'rgba(255,106,0,0.1)',color:'var(--accent)',border:'1px solid rgba(255,106,0,0.3)',borderRadius:4,padding:'1px 6px',marginRight:6,fontWeight:600}}>
                  ADMIN
                </span>
              )}
              {userName}
            </div>
            <button
              onClick={handleSignOut}
              style={{fontSize:11,color:'var(--text3)',background:'none',border:'1px solid var(--border)',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontFamily:'inherit'}}
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="main">
        {selected ? (
          <DetailView
            company={selected}
            onBack={()=>setSelected(null)}
            isAdmin={isAdmin}
            userProfile={profile}
          />
        ) : (
          <ListView onSelect={setSelected} isAdmin={isAdmin}/>
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
