// ─── REQUEST MANAGEMENT VIEW (admin 전용) ────────────────
function RequestManagementView({ session, onNavigate }) {
  const { useState, useEffect } = React;
  const [requests,         setRequests]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [filter,           setFilter]           = useState('pending');
  const [toast,            setToast]            = useState(null);
  // 기업 연결 UI: { requestId, searchQuery, results, selectedId }
  const [linkUI, setLinkUI] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await requestService.fetchAllRequests();
      setRequests(data);
    } catch(e) {
      setToast({ msg: '불러오기 실패: ' + e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ADD_COMPANY 처리 완료 버튼 클릭
  async function handleDoneAddCompany(request) {
    const wantLink = window.confirm('결과 기업이 연결되지 않았습니다. 이미 등록된 기업과 연결하시겠습니까?');
    if (wantLink) {
      // payload 회사명/브랜드명으로 초기 검색어 세팅
      const initQuery = request.payload?.company_name || request.payload?.brand_name || '';
      const results = initQuery ? await searchCompanies(initQuery) : [];
      setLinkUI({ requestId: request.id, searchQuery: initQuery, results, selectedId: '' });
    } else {
      const confirmed = window.confirm('결과 연결 없이 처리 완료하시겠습니까?');
      if (!confirmed) return;
      await completeDone(request.id, null);
    }
  }

  // UPDATE_* 처리 완료 버튼 클릭
  async function handleDoneUpdate(request) {
    const resolvedCompanyId = request.company_id || null;
    await completeDone(request.id, resolvedCompanyId);
  }

  // 기업 검색
  async function searchCompanies(query) {
    try {
      const all = await companyService.fetchAll();
      const q = query.trim().toLowerCase();
      return q ? all.filter(c => c.name.toLowerCase().includes(q)) : all.slice(0, 10);
    } catch { return []; }
  }

  // 기업 검색어 변경
  async function handleLinkSearch(query) {
    const results = await searchCompanies(query);
    setLinkUI(prev => ({ ...prev, searchQuery: query, results, selectedId: '' }));
  }

  // 기업 연결 확정
  async function handleLinkConfirm() {
    if (!linkUI?.selectedId) return alert('연결할 기업을 선택해주세요');
    const selected = linkUI.results.find(c => String(c.id) === linkUI.selectedId);
    const confirmed = window.confirm(`"${selected?.name}"과 이 요청을 연결하고 처리 완료하시겠습니까?`);
    if (!confirmed) return;
    await completeDone(linkUI.requestId, linkUI.selectedId);
    setLinkUI(null);
  }

  // 연결 없이 완료 (연결 UI에서 취소)
  async function handleLinkSkip() {
    const confirmed = window.confirm('결과 연결 없이 처리 완료하시겠습니까?');
    if (!confirmed) return;
    await completeDone(linkUI.requestId, null);
    setLinkUI(null);
  }

  // 실제 done 처리
  async function completeDone(requestId, resolvedCompanyId) {
    try {
      await requestService.updateRequestStatus(requestId, 'done', session.user.id, null, resolvedCompanyId);
      setRequests(rs => rs.map(r => r.id === requestId
        ? { ...r, status: 'done', resolved_company_id: resolvedCompanyId }
        : r
      ));
      setToast({ msg: '처리 완료로 변경됐어요', type: 'success' });
    } catch(e) {
      setToast({ msg: '변경 실패: ' + e.message, type: 'error' });
    }
  }

  const typeLabel = {
    ADD_COMPANY:       '기업 추가',
    UPDATE_FINANCIALS: '재무실적 업데이트',
    UPDATE_VALUATION:  '기업가치 업데이트',
  };

  const filtered = requests.filter(r =>
    filter === 'all' ? true : r.status === filter
  );

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          요청 관리
          {pendingCount > 0 && (
            <span style={{ marginLeft: 8, fontSize: 12, background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '2px 8px', fontWeight: 600 }}>
              {pendingCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['pending', 'done', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: 12, padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                background: filter === f ? 'var(--accent)' : 'var(--bg2)',
                color: filter === f ? '#fff' : 'var(--text2)',
                border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
                fontWeight: filter === f ? 600 : 400,
              }}
            >{{ pending: '대기중', done: '완료', all: '전체' }[f]}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><span>불러오는 중...</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📋</div><div>요청이 없습니다</div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(r => (
            <div key={r.id} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px',
              borderLeft: `3px solid ${r.status === 'pending' ? 'var(--accent)' : 'var(--border2)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>

                  {/* 상단: 유형 + 상태 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                      background: r.status === 'pending' ? 'rgba(255,106,0,0.1)' : 'rgba(22,163,74,0.1)',
                      color: r.status === 'pending' ? 'var(--accent)' : 'var(--green)',
                      border: `1px solid ${r.status === 'pending' ? 'rgba(255,106,0,0.3)' : 'rgba(22,163,74,0.3)'}`,
                    }}>
                      {r.status === 'pending' ? '대기중' : '완료'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {typeLabel[r.request_type] || r.request_type}
                    </span>
                    {r.company_name && (
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>· {r.company_name}</span>
                    )}
                  </div>

                  {/* 요청자 + 날짜 */}
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
                    {r.requester_name} · {new Date(r.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>

                  {/* 목적 태그 */}
                  {r.request_purposes?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {r.request_purposes.map((p, i) => (
                        <span key={i} style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 12,
                          background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)',
                        }}>{p}</span>
                      ))}
                    </div>
                  )}

                  {/* 기업 추가 요청 payload */}
                  {r.request_type === 'ADD_COMPANY' && r.payload && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
                      {r.payload.company_name && <span style={{ marginRight: 12 }}>회사명: {r.payload.company_name}</span>}
                      {r.payload.brand_name   && <span style={{ marginRight: 12 }}>브랜드: {r.payload.brand_name}</span>}
                      {r.payload.website      && <span style={{ marginRight: 12 }}>웹사이트: {r.payload.website}</span>}
                      {r.payload.ceo          && <span>대표: {r.payload.ceo}</span>}
                    </div>
                  )}

                  {/* UPDATE 요청 구분 + 선택 row */}
                  {(r.request_type === 'UPDATE_FINANCIALS' || r.request_type === 'UPDATE_VALUATION') && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                        {r.payload?.update_type === 'new' ? '최신 데이터 업데이트'
                          : r.payload?.update_type === 'fix' ? '기존 데이터 수정'
                          : '업데이트 요청'}
                      </span>
                      {r.payload?.update_type === 'fix' && r.payload?.old_snapshot && (() => {
                        const s = r.payload.old_snapshot;
                        const parts = r.request_type === 'UPDATE_FINANCIALS'
                          ? [
                              s.fiscal_date?.slice(0, 4),
                              s.quarter,
                              s.revenue        != null && `매출 ${Number(s.revenue).toLocaleString()}억`,
                              s.operating_profit != null && `영업이익 ${Number(s.operating_profit).toLocaleString()}억`,
                            ].filter(Boolean)
                          : [
                              s.valuation_date?.slice(0, 10),
                              s.valuation  != null && `기업가치 ${Number(s.valuation).toLocaleString()}억`,
                              s.pe_multiple != null && `P/E ${s.pe_multiple}x`,
                            ].filter(Boolean);
                        return <span style={{ color: 'var(--text3)', marginLeft: 8 }}>→ {parts.join(' / ')}</span>;
                      })()}
                    </div>
                  )}

                  {/* 메모 */}
                  {r.memo && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', fontStyle: 'italic' }}>
                      "{r.memo}"
                    </div>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  {r.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onNavigate && onNavigate(r)}
                        style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                      >
                        {{ ADD_COMPANY: '기업 추가 이동', UPDATE_FINANCIALS: '재무 이동', UPDATE_VALUATION: '기업가치 이동' }[r.request_type] || '이동'}
                      </button>
                      <button
                        onClick={() => r.request_type === 'ADD_COMPANY' ? handleDoneAddCompany(r) : handleDoneUpdate(r)}
                        style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(22,163,74,0.4)', background: 'rgba(22,163,74,0.08)', color: 'var(--green)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                      >처리 완료</button>
                    </>
                  )}
                  {r.status === 'done' && (
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {r.reviewed_at && new Date(r.reviewed_at).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>
              </div>

              {/* 기업 연결 인라인 UI — ADD_COMPANY 요청에서 "연결" 선택 시 표시 */}
              {linkUI?.requestId === r.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>기업 검색 및 연결</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      className="form-input"
                      style={{ flex: 1, fontSize: 12, padding: '6px 10px' }}
                      placeholder="기업명으로 검색..."
                      value={linkUI.searchQuery}
                      onChange={e => handleLinkSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {linkUI.results.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text3)', padding: '4px 0 8px' }}>검색 결과가 없습니다</div>
                  ) : (
                    <div style={{ marginBottom: 10, maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6 }}>
                      {linkUI.results.map(c => (
                        <div
                          key={c.id}
                          onClick={() => setLinkUI(prev => ({ ...prev, selectedId: String(c.id) }))}
                          style={{
                            padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                            background: linkUI.selectedId === String(c.id) ? 'rgba(255,106,0,0.08)' : 'var(--bg2)',
                            borderBottom: '1px solid var(--border)',
                            color: linkUI.selectedId === String(c.id) ? 'var(--accent)' : 'var(--text)',
                            fontWeight: linkUI.selectedId === String(c.id) ? 600 : 400,
                          }}
                        >
                          {c.name}
                          {c.industry && <span style={{ marginLeft: 8, color: 'var(--text3)', fontWeight: 400 }}>{c.industry}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleLinkConfirm}
                      disabled={!linkUI.selectedId}
                      style={{ fontSize: 11, padding: '5px 14px', borderRadius: 6, border: '1px solid rgba(22,163,74,0.4)', background: 'rgba(22,163,74,0.08)', color: 'var(--green)', cursor: linkUI.selectedId ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 500, opacity: linkUI.selectedId ? 1 : 0.5 }}
                    >연결 후 완료</button>
                    <button
                      onClick={handleLinkSkip}
                      style={{ fontSize: 11, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit' }}
                    >연결 없이 완료</button>
                    <button
                      onClick={() => setLinkUI(null)}
                      style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, border: 'none', background: 'none', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit' }}
                    >취소</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
