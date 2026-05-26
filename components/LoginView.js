// ─── LOGIN VIEW ───────────────────────────────────────────
function LoginView() {
  const { useState } = React;
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function submit() {
    if (!email.trim()) return setError('이메일을 입력해주세요');
    setLoading(true);
    setError('');
    try {
      await authService.signInWithMagicLink(email.trim());
      setSent(true);
    } catch(e) {
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
            다른 이메일로 시도
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
          <div style={{fontSize:13,color:'var(--text3)'}}>이메일로 로그인 링크를 받으세요</div>
        </div>

        <div className="form-group">
          <label className="form-label">이메일</label>
          <input
            className="form-input"
            type="email"
            placeholder="your@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
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
