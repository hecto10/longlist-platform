// ─── LOGIN VIEW ───────────────────────────────────────────
const COMPANY_DOMAIN = 'hecto.co.kr';

function LoginView() {
  const { useState } = React;
  const [localPart, setLocalPart] = useState(''); // ID 부분만 (도메인 제외)
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const email = localPart.trim() ? `${localPart.trim()}@${COMPANY_DOMAIN}` : '';

  function handleChange(e) {
    let v = e.target.value;
    if (v.includes('@')) {
      const [local, domain] = v.split('@');
      v = local;
      if (domain && domain.length > 0 && domain !== COMPANY_DOMAIN) {
        setError(`사내 계정(@${COMPANY_DOMAIN})만 로그인할 수 있어요`);
      } else {
        setError(`@${COMPANY_DOMAIN} 부분은 입력하지 않아도 자동으로 붙어요`);
      }
    } else if (error) {
      setError('');
    }
    setLocalPart(v);
  }

  async function submit() {
    if (!localPart.trim()) return setError('아이디를 입력해주세요');
    setLoading(true);
    setError('');
    try {
      console.log('[login email]', email);
      console.log('[login] window.supabase 존재:', !!window.supabase);
      console.log('[login] supabase 변수(클라이언트) 존재:', typeof supabase !== 'undefined' ? !!supabase : 'supabase 변수 자체가 없음');
      console.log('[login] supabase.auth 존재:', typeof supabase !== 'undefined' ? !!supabase?.auth : 'N/A');
      await authService.signInWithMagicLink(email);
      setSent(true);
    } catch(e) {
      console.error('[login error]', e);
      setError('발송 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') submit();
  }

  if (sent) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:16,padding:'48px 40px',maxWidth:400,width:'100%',textAlign:'center'}}>
          <div style={{fontSize:36,marginBottom:16}}>📬</div>
          <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>메일을 확인해주세요</div>
          <div style={{fontSize:14,color:'var(--text2)',lineHeight:1.7}}>
            <strong>{email}</strong>으로<br/>로그인 링크를 발송했습니다.<br/>
            메일의 링크를 클릭하면 자동으로 로그인됩니다.
          </div>
          <button
            style={{marginTop:24,fontSize:13,color:'var(--text3)',background:'none',border:'none',cursor:'pointer',textDecoration:'underline'}}
            onClick={()=>setSent(false)}
          >
            다른 계정으로 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:16,padding:'48px 40px',maxWidth:400,width:'100%'}}>
        <div style={{marginBottom:32,textAlign:'center'}}>
          <div style={{fontSize:15,fontWeight:700,letterSpacing:'-0.02em',marginBottom:6}}>
            <span style={{color:'var(--accent)'}}>●</span> Longlist Platform
          </div>
          <div style={{fontSize:13,color:'var(--text3)'}}>사내 계정으로 로그인 링크를 받으세요</div>
        </div>

        <div className="form-group">
          <label className="form-label">아이디</label>
          <div style={{display:'flex',alignItems:'center',border:'1px solid var(--border2)',borderRadius:8,overflow:'hidden',background:'var(--bg)'}}>
            <input
              className="form-input"
              style={{border:'none',borderRadius:0,flex:1,minWidth:0}}
              type="text"
              placeholder="hecto.id"
              value={localPart}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <span style={{padding:'0 12px',fontSize:13,color:'var(--text3)',whiteSpace:'nowrap',userSelect:'none'}}>
              @{COMPANY_DOMAIN}
            </span>
          </div>
        </div>

        {error && (
          <div style={{fontSize:12,color:'var(--red)',marginBottom:12,marginTop:-8}}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{width:'100%',justifyContent:'center',marginTop:8}}
          onClick={submit}
          disabled={loading}
        >
          {loading ? '발송 중...' : '로그인 링크 받기'}
        </button>
      </div>
    </div>
  );
}
