// ─── ADMIN DASHBOARD ──────────────────────────────────────
function AdminDashboard({ onNavigate }) {
  const { useState, useEffect } = React;

  const [kpi,          setKpi]          = useState(null);
  const [pending,      setPending]      = useState([]);
  const [typeCounts,   setTypeCounts]   = useState({});
  const [changeLogs,   setChangeLogs]   = useState([]);
  const [recentCos,    setRecentCos]    = useState([]);
  const [recentDone,   setRecentDone]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState(null);

  useEffect(() => {
    Promise.all([
      dashboardService.fetchKPI(),
      dashboardService.fetchPendingRequests(),
      dashboardService.fetchRequestTypeCounts(),
      dashboardService.fetchRecentChangeLogs(),
      dashboardService.fetchRecentCompanies(),
      dashboardService.fetchRecentDoneRequests(),
    ]).then(([k, p, t, c, rc, rd]) => {
      setKpi(k); setPending(p); setTypeCounts(t);
      setChangeLogs(c); setRecentCos(rc); setRecentDone(rd);
    }).catch(e => setToast({ msg: '데이터 로드 실패: ' + e.message, type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const typeLabel = { ADD_COMPANY: '기업 추가', UPDATE_FINANCIALS: '재무 업데이트', UPDATE_VALUATION: '기업가치 업데이트' };
  const tableLabel = { financials: '재무실적', valuations: '기업가치', reports: '보고이력', companies: '기업정보' };

  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }
  function fmtDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }

  if (loading) return <div className="loading"><div className="spinner"/><span>대시보드 불러오는 중...</span></div>;

  const totalRequests = Object.values(typeCounts).reduce((a,b) => a+b, 0);

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>대시보드</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 기준
        </div>
      </div>

      {/* ── KPI 카드 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: '전체 기업', value: kpi?.totalCompanies, sub: `최근 7일 +${kpi?.recentCompanies}`, accent: true },
          { label: '활성 사용자', value: kpi?.totalActiveUsers, sub: 'active 계정' },
          { label: '대기 요청', value: kpi?.pendingRequests, sub: '처리 필요', red: (kpi?.pendingRequests || 0) > 0 },
          { label: '오늘 처리', value: kpi?.todayDone, sub: '오늘 완료', green: true },
          { label: '신규 기업', value: kpi?.recentCompanies, sub: '최근 7일' },
        ].map((card, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `2px solid ${card.accent ? 'var(--accent)' : card.red && card.value > 0 ? 'var(--red)' : card.green ? 'var(--green)' : 'var(--border)'}` }}>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value" style={{ color: card.red && card.value > 0 ? 'var(--red)' : card.green && card.value > 0 ? 'var(--green)' : 'var(--text)' }}>
              {card.value ?? '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── 메인 그리드 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* 왼쪽 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* pending 요청 리스트 */}
          <div className="detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>
                대기 요청
                {pending.length > 0 && <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontWeight: 600 }}>{kpi?.pendingRequests}</span>}
              </div>
              <button onClick={() => onNavigate('requests')} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>전체 보기 →</button>
            </div>
            {pending.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: 13, padding: '12px 0' }}>대기 중인 요청이 없습니다 ✓</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {pending.map(r => (
                  <div key={r.id} onClick={() => onNavigate('requests')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff5f0'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(255,106,0,0.1)', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {typeLabel[r.request_type] || r.request_type}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.company_name || '(기업명 없음)'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {r.requester_name} · {(r.request_purposes||[]).slice(0,2).join(', ')}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 요청 유형 비중 */}
          <div className="detail-section">
            <div className="section-title">요청 유형 현황</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['ADD_COMPANY', '기업 추가'],
                ['UPDATE_FINANCIALS', '재무 업데이트'],
                ['UPDATE_VALUATION', '기업가치 업데이트'],
              ].map(([key, label]) => {
                const count = typeCounts[key] || 0;
                const pct = totalRequests > 0 ? Math.round(count / totalRequests * 100) : 0;
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
                      <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{count}건 <span style={{ color: 'var(--text3)', fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: 'var(--accent)', borderRadius: 3, transition: 'width 0.4s' }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 최근 수정 이력 */}
          <div className="detail-section">
            <div className="section-title">최근 수정 이력</div>
            {changeLogs.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>수정 이력이 없습니다</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {changeLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: log.action_type === 'INSERT' ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)', color: log.action_type === 'INSERT' ? 'var(--green)' : 'var(--amber)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {log.action_type}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.company_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{tableLabel[log.target_table] || log.target_table} · {log.changed_by || '—'}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{fmtDateTime(log.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 최근 등록 기업 */}
          <div className="detail-section">
            <div className="section-title">최근 등록 기업</div>
            {recentCos.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>등록된 기업이 없습니다</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {recentCos.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                      {c.industry && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.industry}</div>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', marginLeft: 8 }}>{fmtDate(c.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 최근 처리 요청 */}
          <div className="detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>최근 처리 완료</div>
              <button onClick={() => onNavigate('requests')} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>전체 →</button>
            </div>
            {recentDone.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>처리된 요청이 없습니다</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {recentDone.map(r => (
                  <div key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{r.company_name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmtDate(r.reviewed_at)}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{typeLabel[r.request_type] || r.request_type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
