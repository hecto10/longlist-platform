// ─── DETAIL VIEW ─────────────────────────────────────────
function DetailView({ company: initialCompany, onBack, isAdmin = false, session, userProfile }) {
  const { useState, useEffect, useCallback } = React;
  const [company, setCompany] = useState(initialCompany);
  const [financials,       setFinancials]       = useState([]);
  const [valuations,       setValuations]       = useState([]);
  const [reports,          setReports]          = useState([]);
  const [employeeHistory,  setEmployeeHistory]  = useState([]);
  const [shareholders,       setShareholders]       = useState([]);
  const [shareholderSnaps,   setShareholderSnaps]   = useState([]);
  const [boardMembers,       setBoardMembers]       = useState([]);
  const [shDateSel,          setShDateSel]          = useState('');
  const [bmDateSel,          setBmDateSel]          = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [modal, setModal] = useState(null);
  const openModal = (type, record = null, requestType = null) => setModal({ type, record, requestType });
  const closeModal = () => setModal(null);
  const [toast, setToast] = useState(null);
  const [allTagsForEdit, setAllTagsForEdit] = useState([]);

  const load = useCallback(async () => {
    const [f, v, r, companies, eh, sh, snaps, bm] = await Promise.all([
      companyService.fetchFinancialsByCompany(initialCompany.id),
      companyService.fetchValuationsByCompany(initialCompany.id),
      companyService.fetchReportsByCompany(initialCompany.id),
      companyService.fetchAll(),
      companyService.fetchEmployeeHistory(initialCompany.id),
      companyService.fetchShareholders(initialCompany.id),
      companyService.fetchShareholderSnapshots(initialCompany.id),
      companyService.fetchBoardMembers(initialCompany.id),
    ]);
    setFinancials(f);
    setValuations(v);
    setReports(r);
    setEmployeeHistory(eh);
    setShareholders(sh);
    setShareholderSnaps(snaps);
    setBoardMembers(bm);
    if (snaps.length) setShDateSel(prev => prev || snaps[0].as_of_date);
    if (bm.length)    setBmDateSel(prev => prev || bm[0].as_of_date);
    const updated = companies.find(c => c.id === initialCompany.id);
    if (updated) setCompany(updated);
  }, [initialCompany.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    companyService.fetchAllTags().then(tags => setAllTagsForEdit(tags));
  }, []);

  const showToast = (msg, type='success') => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 3000);
  };

  const latestF = financials[0];
  const latestV = valuations[0];

  return (
    <div>
      {toast && <Toast {...toast} onClose={()=>setToast(null)}/>}
      {modal?.type === 'edit' && (
        <EditCompanyModal
          company={company}
          onClose={closeModal}
          onSave={()=>{ load(); showToast('기업 정보가 수정됐어요'); }}
          allTags={allTagsForEdit}
        />
      )}
      {modal?.type === 'financial' && (
        <FinancialModal
          company={company}
          record={modal.record}
          onClose={closeModal}
          isAdmin={isAdmin}
          session={session}
          onSave={()=>{ load(); showToast(modal.record ? '재무실적이 수정됐어요' : '재무실적이 저장됐어요'); }}
        />
      )}
      {modal?.type === 'valuation' && (
        <ValuationModal
          company={company}
          record={modal.record}
          onClose={closeModal}
          isAdmin={isAdmin}
          session={session}
          onSave={()=>{ load(); showToast(modal.record ? '기업가치가 수정됐어요' : '기업가치가 저장됐어요'); }}
        />
      )}
      {modal?.type === 'report' && (
        <ReportModal
          company={company}
          record={modal.record}
          onClose={closeModal}
          session={session}
          onSave={()=>{ load(); showToast(modal.record ? '보고 이력이 수정됐어요' : '보고 이력이 저장됐어요'); }}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteConfirmModal
          company={company}
          record={modal.record}
          tableType={modal.tableType}
          onClose={closeModal}
          onDelete={async (reason) => {
            const svc = {
              financials: () => companyService.deleteFinancial(modal.record, reason),
              valuations: () => companyService.deleteValuation(modal.record, reason),
              reports:    () => companyService.deleteReport(modal.record, reason),
            }[modal.tableType];
            await svc();
            load();
            showToast('삭제됐어요');
          }}
        />
      )}
      {modal?.type === 'updateRequest' && (
        <UpdateRequestModal
          session={session}
          profile={userProfile}
          company={company}
          requestType={modal.requestType}
          onClose={closeModal}
          onSave={() => { closeModal(); showToast('요청이 제출됐어요'); }}
        />
      )}
      {modal?.type === 'softDelete' && (
        <SoftDeleteModal
          company={company}
          session={session}
          onClose={closeModal}
          onDeleted={() => { closeModal(); showToast('기업이 삭제됐어요'); onBack(); }}
        />
      )}
      {modal?.type === 'employeeHistory' && (
        <EmployeeHistoryModal
          company={company}
          record={modal.record}
          session={session}
          onClose={closeModal}
          onSave={() => { load(); showToast(modal.record ? '임직원 수가 수정됐어요' : '임직원 수가 저장됐어요'); }}
        />
      )}
      {modal?.type === 'shareholder' && (
        <ShareholderModal
          company={company}
          record={modal.record}
          session={session}
          onClose={closeModal}
          onSave={() => { load(); showToast(modal.record ? '주주 정보가 수정됐어요' : '주주가 추가됐어요'); }}
        />
      )}
      {modal?.type === 'shareholderBulk' && (
        <ShareholderBulkModal
          company={company}
          existingShareholders={shareholders}
          onClose={closeModal}
          onSave={() => { load(); showToast('주주 현황이 저장됐어요'); }}
        />
      )}
      {modal?.type === 'boardMember' && (
        <BoardMemberModal
          company={company}
          record={modal.record}
          session={session}
          onClose={closeModal}
          onSave={() => { load(); showToast(modal.record ? '경영진 정보가 수정됐어요' : '경영진이 추가됐어요'); }}
        />
      )}
      {modal?.type === 'boardMemberBulk' && (
        <BoardMemberBulkModal
          company={company}
          existingBoardMembers={boardMembers}
          onClose={closeModal}
          onSave={() => { load(); showToast('이사회/경영진이 저장됐어요'); }}
        />
      )}

      <button className="back-btn" onClick={onBack}>← 목록으로</button>

      <div className="detail-header">
        <div>
          <div className="detail-title">{company.name}</div>
          <div className="detail-sub">
            <span>{getListingBadge(company.listing_status)}</span>
            {company.founded_date && <span>📅 {fmtDate(company.founded_date)}</span>}
            <span>👤 {company.ceo || '—'}</span>
            <span>📍 {company.location || '—'}</span>
            <span>🏭 {company.industry || '—'}</span>
            <span>👥 {company.employee_count || '—'}명</span>
          </div>
          <div style={{marginTop:10,display:'flex',flexWrap:'wrap',gap:4}}>
            {(company.tags||[]).map(t=><span key={t} className="tag sector">{t}</span>)}
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
          {isAdmin && <button className="btn-edit" onClick={()=>openModal('edit')}>✎ 기업 수정</button>}
          {isAdmin && <button className="btn btn-secondary" onClick={()=>openModal('financial')}>+ 재무실적</button>}
          {isAdmin && <button className="btn btn-secondary" onClick={()=>openModal('valuation')}>+ 기업가치</button>}
          {isAdmin && <button className="btn btn-secondary" onClick={()=>openModal('report')}>+ 보고 이력</button>}
          {isAdmin && <button className="btn" style={{background:'rgba(220,38,38,0.08)',border:'1px solid rgba(220,38,38,0.3)',color:'var(--red)'}} onClick={()=>openModal('softDelete')}>🗑 기업 삭제</button>}
          {!isAdmin && <button className="btn btn-secondary" onClick={()=>openModal('updateRequest', null, 'UPDATE_FINANCIALS')}>재무실적 업데이트 요청</button>}
          {!isAdmin && <button className="btn btn-secondary" onClick={()=>openModal('updateRequest', null, 'UPDATE_VALUATION')}>기업가치 업데이트 요청</button>}
        </div>
      </div>

      <div className="tab-bar">
        {[['overview','개요'],['financials','재무 이력'],['valuations','기업가치 이력'],['review','내부검토 현황']].map(([k,l])=>
          <button key={k} className={`tab ${activeTab===k?'active':''}`} onClick={()=>setActiveTab(k)}>{l}</button>
        )}
      </div>

      {activeTab === 'overview' && (() => {
        const ehSorted    = [...employeeHistory].sort((a,b) => new Date(a.as_of_date) - new Date(b.as_of_date));
        const maxEmpCount = Math.max(...ehSorted.map(e => e.employee_count), 1);
        const latestVDate = latestV ? new Date(latestV.valuation_date) : null;
        const nearestF    = latestVDate ? financials.reduce((best, f) => {
          if (!f.operating_profit || f.operating_profit <= 0) return best;
          const fDate = new Date(f.fiscal_date);
          if (fDate > latestVDate) return best;
          const diff = latestVDate - fDate;
          const bestDiff = best ? latestVDate - new Date(best.fiscal_date) : Infinity;
          return diff < bestDiff ? f : best;
        }, null) : null;
        const calcPE = nearestF && latestV?.valuation && nearestF.operating_profit > 0
          ? (Number(latestV.valuation) / Number(nearestF.operating_profit)).toFixed(1) : null;
        // 기업가치 전용 formatter (억원 기준: 10000억 이상 → n.n조, 미만 → n,nnn억)
        const fmtVal = v => {
          if (v == null || v === '') return '—';
          const n = Number(v);
          if (isNaN(n)) return '—';
          if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '조';
          return n.toLocaleString() + '억';
        };
        // 재무실적 전용 formatter (음수 처리 포함)
        const fmtFin = v => {
          if (v == null || v === '') return '—';
          const n = Number(v);
          if (isNaN(n)) return '—';
          if (n >= 10000)  return (n / 10000).toFixed(1).replace(/\.0$/, '') + '조';
          if (n <= -10000) return '-' + (Math.abs(n) / 10000).toFixed(1).replace(/\.0$/, '') + '조';
          return Math.round(n).toLocaleString() + '억';
        };
        return (
          <div>

            {/* ── 기업 기본 정보 ── */}
            <div className="full-width-section" style={{marginBottom:24}}>
              <div className="section-title">기업 기본 정보</div>
              <table className="history-table">
                <tbody>
                  <tr>
                    <td style={{textAlign:'left',fontFamily:'inherit',color:'var(--text3)',width:'15%'}}>설립일</td>
                    <td style={{textAlign:'left',fontFamily:'inherit'}}>{company.founded_date ? fmtDate(company.founded_date) : '—'}</td>
                    <td style={{textAlign:'left',fontFamily:'inherit',color:'var(--text3)',width:'15%'}}>소재지</td>
                    <td style={{textAlign:'left',fontFamily:'inherit'}}>{company.location || '—'}</td>
                  </tr>
                  <tr>
                    <td style={{textAlign:'left',fontFamily:'inherit',color:'var(--text3)'}}>대표이사</td>
                    <td style={{textAlign:'left',fontFamily:'inherit'}}>{company.ceo || '—'}</td>
                    <td style={{textAlign:'left',fontFamily:'inherit',color:'var(--text3)'}}>임직원 수</td>
                    <td style={{textAlign:'left',fontFamily:'inherit'}}>{company.employee_count || '—'}명</td>
                  </tr>
                  <tr>
                    <td style={{textAlign:'left',fontFamily:'inherit',color:'var(--text3)'}}>업종</td>
                    <td style={{textAlign:'left',fontFamily:'inherit'}}>{company.industry || '—'}</td>
                    <td style={{textAlign:'left',fontFamily:'inherit',color:'var(--text3)'}}>상장여부</td>
                    <td style={{textAlign:'left',fontFamily:'inherit'}}>{getListingBadge(company.listing_status)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ══ 지배구조 ══ */}
            <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:14,paddingBottom:6,borderBottom:'2px solid var(--border)'}}>
              지배구조
            </div>

            {/* 주주 현황 */}
            <div className="full-width-section" style={{marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
                <div className="section-title" style={{marginBottom:0}}>주주 현황</div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  {shareholderSnaps.length > 0 && (
                    <select className="form-input" style={{fontSize:11,padding:'4px 8px',width:'auto'}}
                      value={shDateSel} onChange={e => setShDateSel(e.target.value)}>
                      {shareholderSnaps.map(s=>(
                        <option key={s.id} value={s.as_of_date}>{s.as_of_date} 기준</option>
                      ))}
                    </select>
                  )}
                  {isAdmin && <button className="btn btn-secondary" style={{fontSize:12,padding:'5px 12px'}} onClick={()=>openModal('shareholderBulk')}>+ 추가</button>}
                  {isAdmin && shDateSel && (
                    <button style={{fontSize:11,padding:'5px 10px',borderRadius:6,border:'1px solid rgba(220,38,38,0.3)',background:'rgba(220,38,38,0.06)',color:'var(--red)',cursor:'pointer',fontFamily:'inherit'}}
                      onClick={async()=>{
                        const snap = shareholderSnaps.find(s=>s.as_of_date===shDateSel);
                        if (!snap) return;
                        if (!window.confirm(`${shDateSel} 기준 주주 현황 전체를 삭제하시겠습니까?`)) return;
                        try { await companyService.deleteShareholderSnapshot(snap.id); load(); showToast('삭제됐어요'); }
                        catch(e) { alert('삭제 실패: '+e.message); }
                      }}>🗑 기준일 삭제</button>
                  )}
                </div>
              </div>
              {shareholders.length === 0 ? (
                <div style={{color:'var(--text3)',fontSize:13}}>주주 현황 데이터가 없습니다</div>
              ) : (
                <div style={{overflowX:'auto'}}>
                  <table className="history-table" style={{fontSize:11,minWidth:700}}>
                    <thead>
                      <tr>
                        <th style={{textAlign:'left',fontSize:10}} rowSpan={2}>주주명</th>
                        <th style={{fontSize:10,textAlign:'center'}} rowSpan={2}>구분</th>
                        <th style={{fontSize:10,textAlign:'center'}} colSpan={3}>소유주식수 (주)</th>
                        <th style={{fontSize:10,textAlign:'center'}} colSpan={3}>지분율 (%)</th>
                        <th style={{fontSize:10,textAlign:'center'}} rowSpan={2}>최대주주와의 관계</th>
                        {isAdmin && <th rowSpan={2}></th>}
                      </tr>
                      <tr>
                        {['보통주','우선주','합계','보통주','우선주','합계'].map((h,i)=>(
                          <th key={i} style={{fontSize:10,textAlign:'center'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shareholders.filter(s=>s.as_of_date===shDateSel).map(s => (
                        <tr key={s.id}>
                          <td style={{textAlign:'left',fontWeight:500}}>{s.shareholder_name}</td>
                          <td style={{textAlign:'center',fontSize:10,color:'var(--text3)'}}>{s.shareholder_type||'—'}</td>
                          <td style={{textAlign:'center',fontFamily:'MaruBuri,sans-serif'}}>{s.common_shares?.toLocaleString()??'—'}</td>
                          <td style={{textAlign:'center',fontFamily:'MaruBuri,sans-serif'}}>{s.preferred_shares?.toLocaleString()??'—'}</td>
                          <td style={{textAlign:'center',fontFamily:'MaruBuri,sans-serif',fontWeight:500}}>{s.total_shares?.toLocaleString()??'—'}</td>
                          <td style={{textAlign:'center',fontFamily:'MaruBuri,sans-serif'}}>{s.common_ratio!=null?s.common_ratio+'%':'—'}</td>
                          <td style={{textAlign:'center',fontFamily:'MaruBuri,sans-serif'}}>{s.preferred_ratio!=null?s.preferred_ratio+'%':'—'}</td>
                          <td style={{textAlign:'center',fontFamily:'MaruBuri,sans-serif',fontWeight:500,color:'var(--accent)'}}>{s.total_ratio!=null?s.total_ratio+'%':'—'}</td>
                          <td style={{textAlign:'center',fontSize:11,color:'var(--text3)'}}>{s.relation_to_major_shareholder||'—'}</td>
                          {isAdmin && (
                            <td style={{textAlign:'right',whiteSpace:'nowrap'}}>
                              <button className="row-edit-btn" onClick={()=>openModal('shareholder',s)}>✎</button>
                              <button className="row-delete-btn" style={{marginLeft:4}} onClick={async()=>{
                                if(!window.confirm('해당 주주 이력을 삭제하시겠습니까?'))return;
                                try{ await companyService.deleteShareholder(s.id); load(); showToast('삭제됐어요'); }
                                catch(e){ alert('삭제 실패: '+e.message); }
                              }}>🗑</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 이사회/경영진 현황 */}
            <div className="full-width-section" style={{marginBottom:28}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
                <div className="section-title" style={{marginBottom:0}}>이사회/경영진 현황</div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  {boardMembers.length > 0 && (
                    <select className="form-input" style={{fontSize:11,padding:'4px 8px',width:'auto'}}
                      value={bmDateSel} onChange={e => setBmDateSel(e.target.value)}>
                      {[...new Set(boardMembers.map(m=>m.as_of_date))].sort((a,b)=>b.localeCompare(a)).map(d=>(
                        <option key={d} value={d}>{d} 기준</option>
                      ))}
                    </select>
                  )}
                  {isAdmin && <button className="btn btn-secondary" style={{fontSize:12,padding:'5px 12px'}} onClick={()=>openModal('boardMemberBulk')}>+ 추가</button>}
                </div>
              </div>
              {boardMembers.length === 0 ? (
                <div style={{color:'var(--text3)',fontSize:13}}>이사회/경영진 데이터가 없습니다</div>
              ) : (
                <div style={{overflowX:'auto'}}>
                  <table className="history-table" style={{fontSize:11,minWidth:620}}>
                    <thead>
                      <tr>
                        {['구분','성명','출생연도','등기여부','담당업무','비고'].map(h=>(
                          <th key={h} style={{fontSize:10,textAlign:h==='구분'||h==='성명'||h==='비고'?'left':'center'}}>{h}</th>
                        ))}
                        {isAdmin && <th></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {boardMembers.filter(m=>m.as_of_date===bmDateSel).map(m => (
                        <tr key={m.id}>
                          <td style={{textAlign:'left',fontSize:11,color:'var(--text3)'}}>{m.member_type}</td>
                          <td style={{textAlign:'left',fontWeight:500}}>{m.name}</td>
                          <td style={{textAlign:'center',fontFamily:'MaruBuri,sans-serif'}}>{m.birth_year||'—'}</td>
                          <td style={{textAlign:'center'}}>
                            <span style={{fontSize:10,padding:'2px 6px',borderRadius:4,background:m.registration_status==='등기'?'rgba(22,163,74,0.1)':'var(--bg3)',color:m.registration_status==='등기'?'var(--green)':'var(--text3)'}}>
                              {m.registration_status||'—'}
                            </span>
                          </td>
                          <td style={{textAlign:'center',color:'var(--text2)'}}>{m.responsibility||'—'}</td>
                          <td style={{textAlign:'left',color:'var(--text2)',fontSize:11}}>{m.note||'—'}</td>
                          {isAdmin && (
                            <td style={{textAlign:'right',whiteSpace:'nowrap'}}>
                              <button className="row-edit-btn" onClick={()=>openModal('boardMember',m)}>✎</button>
                              <button className="row-delete-btn" style={{marginLeft:4}} onClick={async()=>{
                                if(!window.confirm('해당 경영진 이력을 삭제하시겠습니까?'))return;
                                try{ await companyService.deleteBoardMember(m.id); load(); showToast('삭제됐어요'); }
                                catch(e){ alert('삭제 실패: '+e.message); }
                              }}>🗑</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ══ 재무 현황 ══ */}
            <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:14,paddingBottom:6,borderBottom:'2px solid var(--border)'}}>
              재무 현황
            </div>

            {/* 최신 재무실적 + 기업가치 */}
            <div className="detail-grid" style={{marginBottom:28}}>
              <div className="detail-section">
                <div className="section-title">최신 재무실적</div>
                {latestF ? (
                  <>
                    <div className="info-row"><span className="info-label">기준일</span><span className="info-value mono">{fmtDate(latestF.fiscal_date)}</span></div>
                    <div className="info-row"><span className="info-label">매출</span><span className="info-value mono">{fmtFin(latestF.revenue)}</span></div>
                    <div className="info-row"><span className="info-label">영업이익</span><span className="info-value mono" style={{color:latestF.operating_profit<0?'var(--red)':'var(--text)'}}>{fmtFin(latestF.operating_profit)}</span></div>
                    <div className="info-row"><span className="info-label">총자산</span><span className="info-value mono">{fmtFin(latestF.total_assets)}</span></div>
                    <div className="info-row"><span className="info-label">순자산</span><span className="info-value mono">{fmtFin(latestF.net_assets)}</span></div>
                    {latestF.memo && <div className="info-row"><span className="info-label">메모</span><span className="info-value">{latestF.memo}</span></div>}
                  </>
                ) : <div style={{color:'var(--text3)',fontSize:13}}>재무실적 데이터가 없습니다</div>}
              </div>
              <div className="detail-section">
                <div className="section-title">기업가치</div>
                {latestV ? (
                  <>
                    <div className="info-row"><span className="info-label">기준일</span><span className="info-value mono">{fmtDate(latestV.valuation_date)}</span></div>
                    <div className="info-row"><span className="info-label">기업가치</span><span className="info-value mono" style={{color:'var(--accent)',fontWeight:600}}>{fmtVal(latestV.valuation)}</span></div>
                    <div className="info-row">
                      <span className="info-label">P/E 멀티플</span>
                      <span className="info-value mono">{calcPE ? calcPE+'x' : <span style={{color:'var(--text3)'}}>N/A</span>}</span>
                    </div>
                    {calcPE && nearestF && <div className="info-row"><span className="info-label" style={{fontSize:11}}>기준 실적</span><span className="info-value" style={{fontSize:11,color:'var(--text3)'}}>{fmtDate(nearestF.fiscal_date)} OP {fmt(nearestF.operating_profit)}</span></div>}
                  </>
                ) : <div style={{color:'var(--text3)',fontSize:13}}>기업가치 데이터가 없습니다</div>}
              </div>
            </div>

            {/* ══ 조직 현황 ══ */}
            <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:14,paddingBottom:6,borderBottom:'2px solid var(--border)'}}>
              조직 현황
            </div>

            {/* 임직원 수 추이 */}
            <div className="full-width-section">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <div className="section-title" style={{marginBottom:0}}>임직원 수 추이</div>
                {isAdmin && (
                  <button className="btn btn-secondary" style={{fontSize:12,padding:'5px 12px'}} onClick={() => openModal('employeeHistory')}>+ 추가</button>
                )}
              </div>
              {ehSorted.length === 0 ? (
                <div style={{color:'var(--text3)',fontSize:13}}>임직원 수 이력이 없습니다</div>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}}>
                  <div>
                    <div style={{display:'flex',alignItems:'flex-end',gap:6,minHeight:140,paddingTop:40,paddingBottom:20,marginTop:8}}>
                      {ehSorted.map((e, i) => {
                        const barH = Math.max(4, Math.round((e.employee_count / maxEmpCount) * 80));
                        const prev = ehSorted[i - 1];
                        const chg  = prev ? ((e.employee_count - prev.employee_count) / prev.employee_count * 100).toFixed(1) : null;
                        return (
                          <div key={e.id} style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1,gap:4}}>
                            {chg !== null && <div style={{fontSize:9,color:Number(chg)>=0?'var(--green)':'var(--red)',whiteSpace:'nowrap',marginBottom:8}}>{Number(chg)>=0?'▲':'▼'}{Math.abs(chg)}%</div>}
                            <div title={e.employee_count+'명'} style={{width:'100%',maxWidth:32,background:'var(--accent)',borderRadius:'3px 3px 0 0',height:barH}}/>
                            <div style={{fontSize:9,color:'var(--text3)',textAlign:'center'}}>{new Date(e.as_of_date).getFullYear()}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{fontSize:11,color:'var(--text3)',textAlign:'center',marginTop:12}}>
                      최신: <strong style={{color:'var(--text)'}}>{ehSorted[ehSorted.length-1]?.employee_count?.toLocaleString()}명</strong>
                    </div>
                  </div>
                  <table className="history-table" style={{fontSize:12}}>
                    <thead><tr>
                      <th style={{textAlign:'left',fontSize:10}}>기준일</th>
                      <th style={{fontSize:10}}>임직원 수</th>
                      <th style={{fontSize:10,textAlign:'left'}}>출처</th>
                      {isAdmin && <th style={{fontSize:10}}></th>}
                    </tr></thead>
                    <tbody>
                      {[...ehSorted].reverse().map(e => (
                        <tr key={e.id}>
                          <td style={{textAlign:'left',fontFamily:'MaruBuri,sans-serif',fontSize:11}}>{fmtDate(e.as_of_date)}</td>
                          <td style={{fontSize:12,fontFamily:'MaruBuri,sans-serif',fontWeight:500}}>{e.employee_count?.toLocaleString()}명</td>
                          <td style={{textAlign:'left',fontSize:11,color:'var(--text3)'}}>{e.source||'—'}</td>
                          {isAdmin && (
                            <td style={{textAlign:'right'}}>
                              <button className="row-edit-btn" onClick={() => openModal('employeeHistory', e)}>✎</button>
                              <button className="row-delete-btn" style={{marginLeft:4}} onClick={async () => {
                                if (!window.confirm('해당 임직원 수 이력을 삭제하시겠습니까?')) return;
                                try {
                                  await companyService.deleteEmployeeHistory(e.id);
                                  await companyService.syncLatestEmployeeCount(company.id);
                                  load();
                                  showToast('삭제됐어요');
                                } catch(err) {
                                  alert('삭제 실패: ' + err.message);
                                }
                              }}>🗑</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        );
      })()}


      {activeTab === 'financials' && (() => {
        // 연간 / 분기 분리
        const isAnnual  = f => f.period_type === '연간' || (!f.period_type && !!f.quarter && !['1Q','2Q','3Q'].some(q => (f.quarter||'').includes(q)));
        const isQuarter = f => ['1Q','2Q','3Q'].includes(f.period_type) || (!f.period_type && ['1Q','2Q','3Q'].some(q => (f.quarter||'').includes(q)));
        const annualF   = financials.filter(isAnnual);
        const quarterF  = financials.filter(isQuarter);
        // 분기: 최신순 정렬
        const quarterSorted = [...quarterF].sort((a,b) => new Date(b.fiscal_date) - new Date(a.fiscal_date));
        // 연간: 오래된→최신 (차트용)
        const annualSorted  = [...annualF].reverse();
        const revenues = annualSorted.map(f => Number(f.revenue)||0);
        const ops      = annualSorted.map(f => Number(f.operating_profit)||0);

        // 전년동기 대비 계산: 같은 period_type 중 1년 전 row 찾기
        function findYoY(f) {
          if (!f.fiscal_date || !f.period_type) return null;
          const thisDate = new Date(f.fiscal_date);
          const prevYear = thisDate.getFullYear() - 1;
          return quarterF.find(q =>
            q.period_type === f.period_type &&
            q.id !== f.id &&
            new Date(q.fiscal_date).getFullYear() === prevYear
          ) || null;
        }

        // 재무실적 전용 formatter (억원 기준: 10,000억 이상 → n.n조, 미만 → n,nnn억)
        const fmtF = v => {
          if (v == null || v === '') return '—';
          const n = Number(v);
          if (isNaN(n)) return '—';
          if (n >= 10000)  return (n / 10000).toFixed(1).replace(/\.0$/, '') + '조';
          if (n <= -10000) return '-' + (Math.abs(n) / 10000).toFixed(1).replace(/\.0$/, '') + '조';
          return Math.round(n).toLocaleString() + '억';
        };

        return (
          <div style={{display:'flex',flexDirection:'column',gap:20}}>

            {/* ── 최근 실적 업데이트 (분기) ── 최상단 */}
            <div className="full-width-section">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div className="section-title" style={{marginBottom:0}}>최근 실적 업데이트</div>
                <span style={{fontSize:11,color:'var(--text3)'}}>1Q · 2Q · 3Q 분기 데이터 · 최신순</span>
              </div>
              {quarterSorted.length > 0 ? (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {quarterSorted.map(f => {
                    const label   = f.period_type || f.quarter || '';
                    const year    = f.fiscal_date ? new Date(f.fiscal_date).getFullYear() : '';
                    const opMargin = f.revenue && f.revenue != 0
                      ? ((Number(f.operating_profit)||0) / Number(f.revenue) * 100).toFixed(1) : null;
                    const yoy = findYoY(f);
                    const revYoY = yoy?.revenue ? calcChange(f.revenue, yoy.revenue) : null;
                    const opYoY  = yoy?.operating_profit != null && yoy.operating_profit !== 0
                      ? calcChange(f.operating_profit, yoy.operating_profit) : null;
                    return (
                      <div key={f.id} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 16px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--border)'}}>
                        {/* 기간 레이블 */}
                        <div style={{minWidth:68,flexShrink:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:'var(--accent)'}}>{year} {label}</div>
                          <div style={{fontSize:10,color:'var(--text3)',fontFamily:'MaruBuri,sans-serif',marginTop:2}}>{fmtDate(f.fiscal_date)}</div>
                        </div>
                        {/* 수치 */}
                        <div style={{flex:1,display:'flex',gap:20,flexWrap:'wrap',alignItems:'flex-start'}}>
                          {f.revenue != null && (
                            <div>
                              <div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>매출</div>
                              <div style={{fontSize:13,fontWeight:600,fontFamily:'MaruBuri,sans-serif'}}>{fmtF(f.revenue)}</div>
                              {revYoY !== null && (
                                <div style={{fontSize:10,color:Number(revYoY)>=0?'var(--green)':'var(--red)',marginTop:2}}>
                                  {Number(revYoY)>=0?'▲':'▼'}{Math.abs(revYoY)}% <span style={{color:'var(--text3)'}}>전년동기비</span>
                                </div>
                              )}
                            </div>
                          )}
                          {f.operating_profit != null && (
                            <div>
                              <div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>영업이익</div>
                              <div style={{fontSize:13,fontWeight:600,fontFamily:'MaruBuri,sans-serif',color:f.operating_profit<0?'var(--red)':'var(--text)'}}>{fmtF(f.operating_profit)}</div>
                              {opYoY !== null && (
                                <div style={{fontSize:10,color:Number(opYoY)>=0?'var(--green)':'var(--red)',marginTop:2}}>
                                  {Number(opYoY)>=0?'▲':'▼'}{Math.abs(opYoY)}% <span style={{color:'var(--text3)'}}>전년동기비</span>
                                </div>
                              )}
                            </div>
                          )}
                          {opMargin !== null && (
                            <div>
                              <div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>영업이익률</div>
                              <div style={{fontSize:13,fontWeight:600,fontFamily:'MaruBuri,sans-serif',color:Number(opMargin)<0?'var(--red)':'var(--text)'}}>{opMargin}%</div>
                            </div>
                          )}
                          {yoy && (
                            <div style={{alignSelf:'center'}}>
                              <div style={{fontSize:10,color:'var(--text3)',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 7px'}}>
                                전년동기: {new Date(yoy.fiscal_date).getFullYear()} {yoy.period_type}
                              </div>
                            </div>
                          )}
                          {f.memo && <div style={{fontSize:11,color:'var(--text3)',alignSelf:'center',fontStyle:'italic'}}>"{f.memo}"</div>}
                        </div>
                        {/* 수정/삭제 */}
                        {isAdmin && (
                          <div style={{display:'flex',gap:4,flexShrink:0}}>
                            <button className="row-edit-btn" onClick={e=>{e.stopPropagation();openModal('financial',f);}}>✎</button>
                            <button className="row-delete-btn" onClick={e=>{e.stopPropagation();setModal({type:'delete',record:f,tableType:'financials'});}}>🗑</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{color:'var(--text3)',fontSize:13,padding:'12px 0'}}>분기 실적 데이터가 없습니다</div>
              )}
            </div>

            {/* ── 연간 실적 추이 ── */}
            <div className="full-width-section">
              <div className="section-title">연간 실적 추이</div>
              {annualF.length > 0 ? (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>손익 현황</div>
                    <table className="history-table" style={{fontSize:12}}>
                      <thead><tr>
                        <th style={{textAlign:'left',fontSize:10}}>결산기준일</th>
                        <th style={{fontSize:10}}>매출</th>
                        <th style={{fontSize:10}}>영업이익</th>
                        <th style={{fontSize:10}}>영업이익률</th>
                      </tr></thead>
                      <tbody>{annualF.map((f,i) => {
                        const prev = annualF[i+1];
                        const revChg = prev?.revenue ? calcChange(f.revenue, prev.revenue) : null;
                        const opChg  = prev?.operating_profit && prev.operating_profit !== 0 ? calcChange(f.operating_profit, prev.operating_profit) : null;
                        const opMargin = f.revenue && f.revenue !== 0 ? ((Number(f.operating_profit)||0) / Number(f.revenue) * 100).toFixed(1) : null;
                        return (
                          <tr key={f.id}>
                            <td style={{textAlign:'left',fontFamily:'MaruBuri,sans-serif',fontSize:11}}>
                              {fmtDate(f.fiscal_date)}
                              {isAdmin && <button className="row-edit-btn" style={{marginLeft:6}} onClick={e=>{e.stopPropagation();openModal('financial',f);}}>✎</button>}
                              {isAdmin && <button className="row-delete-btn" style={{marginLeft:2}} onClick={e=>{e.stopPropagation();setModal({type:'delete',record:f,tableType:'financials'});}}>🗑</button>}
                            </td>
                            <td style={{fontSize:12}}>
                              {fmtF(f.revenue)}
                              {revChg && <span style={{fontSize:9,color:Number(revChg)>=0?'var(--green)':'var(--red)',marginLeft:4}}>{Number(revChg)>=0?'▲':'▼'}{Math.abs(revChg)}%</span>}
                            </td>
                            <td style={{fontSize:12}}>
                              <span style={{color:f.operating_profit==null?'var(--text3)':f.operating_profit<0?'var(--red)':'var(--text)'}}>{fmtF(f.operating_profit)}</span>
                              {opChg && <span style={{fontSize:9,color:Number(opChg)>=0?'var(--green)':'var(--red)',marginLeft:4}}>{Number(opChg)>=0?'▲':'▼'}{Math.abs(opChg)}%</span>}
                            </td>
                            <td style={{fontSize:12,color:opMargin===null?'var(--text3)':Number(opMargin)<0?'var(--red)':'var(--text)',fontFamily:'MaruBuri,sans-serif'}}>
                              {opMargin !== null ? opMargin + '%' : '—'}
                            </td>
                          </tr>
                        );
                      })}</tbody>
                    </table>
                  </div>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>매출 / 영업이익 추이</div>
                    {(() => {
                      const opPosMax = Math.max(...ops.filter(v=>v>0), 0);
                      const opNegMax = Math.abs(Math.min(...ops.filter(v=>v<0), 0));
                      const sharedPosMax = Math.max(Math.max(...revenues,1), opPosMax);
                      const s0 = { posMax: sharedPosMax, negMax: opNegMax };
                      return <MiniChart data={[revenues, ops]} scales={[s0,s0]} color="var(--accent)" color2="rgba(255,106,0,0.38)" xLabels={annualSorted.map(f=>new Date(f.fiscal_date).getFullYear())}/>;
                    })()}
                    <div style={{display:'flex',gap:14,marginTop:4,fontSize:11,color:'var(--text2)',justifyContent:'center'}}>
                      <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'var(--accent)',display:'inline-block'}}/> 매출</span>
                      <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'rgba(255,106,0,0.38)',display:'inline-block'}}/> 영업이익</span>
                    </div>
                  </div>
                </div>
              ) : <div style={{color:'var(--text3)',fontSize:13}}>연간 실적 데이터가 없습니다</div>}
            </div>

            {/* ── 재무상태 (연간) ── */}
            {annualF.length > 0 && (
              <div className="full-width-section">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>재무상태</div>
                    <table className="history-table" style={{fontSize:12}}>
                      <thead><tr>
                        <th style={{textAlign:'left',fontSize:10}}>결산기준일</th>
                        <th style={{fontSize:10}}>총자산</th>
                        <th style={{fontSize:10}}>순자산</th>
                        <th style={{fontSize:10}}>출처</th>
                      </tr></thead>
                      <tbody>{annualF.map(f => (
                        <tr key={f.id}>
                          <td style={{textAlign:'left',fontFamily:'MaruBuri,sans-serif',fontSize:11}}>
                            {fmtDate(f.fiscal_date)}
                            {isAdmin && <button className="row-edit-btn" style={{marginLeft:6}} onClick={e=>{e.stopPropagation();openModal('financial',f);}}>✎</button>}
                            {isAdmin && <button className="row-delete-btn" style={{marginLeft:2}} onClick={e=>{e.stopPropagation();setModal({type:'delete',record:f,tableType:'financials'});}}>🗑</button>}
                          </td>
                          <td style={{fontSize:12}}>{fmtF(f.total_assets)}</td>
                          <td style={{fontSize:12,color:f.net_assets!=null&&Number(f.net_assets)<0?'var(--red)':'var(--text)'}}>{fmtF(f.net_assets)}</td>
                          <td style={{fontFamily:'inherit',fontSize:11,color:'var(--text3)'}}>{f.source||'—'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>총자산 / 순자산 추이</div>
                    {(() => {
                      const tas = annualSorted.map(f=>Number(f.total_assets)||0);
                      const nas = annualSorted.map(f=>Number(f.net_assets)||0);
                      const posMax = Math.max(...tas,...nas.filter(v=>v>0),1);
                      const negMax = Math.abs(Math.min(...nas.filter(v=>v<0),0));
                      return <MiniChart data={[tas,nas]} scales={[{posMax,negMax},{posMax,negMax}]} color="var(--teal)" color2="rgba(13,148,136,0.35)" xLabels={annualSorted.map(f=>new Date(f.fiscal_date).getFullYear())}/>;
                    })()}
                    <div style={{display:'flex',gap:14,marginTop:4,fontSize:11,color:'var(--text2)',justifyContent:'center'}}>
                      <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'var(--teal)',display:'inline-block'}}/> 총자산</span>
                      <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'rgba(13,148,136,0.35)',display:'inline-block'}}/> 순자산</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        );
      })()}

            {activeTab === 'valuations' && (
        <div className="full-width-section">
          <div className="section-title">기업가치 이력 (누적)</div>
          {valuations.length > 0 ? (() => {
            // 기업가치 전용 formatter: 10,000억 이상 → n.n조, 미만 → n,nnn억
            const fmtV = v => {
              if (v == null || v === '') return '—';
              const n = Number(v);
              if (isNaN(n)) return '—';
              if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '조';
              return n.toLocaleString() + '억';
            };
            const sorted = [...valuations].sort((a,b) => new Date(a.valuation_date) - new Date(b.valuation_date));
            const latest = sorted[sorted.length-1];
            const maxVal = Math.max(...sorted.map(v => Number(v.valuation)||0), 1);
            const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
            const ti = maxVal <= magnitude*2 ? magnitude/2 : maxVal <= magnitude*5 ? magnitude : magnitude*2;
            const ticks = [];
            for(let v=ti; v<=maxVal*1.15; v+=ti) ticks.push(v);
            const yAxisW = 56; const chartH = 160; const padT = 20; const padB = 28; const padR = 12;
            const innerH = chartH - padT - padB;
            const colW = Math.max(60, Math.floor(500 / sorted.length));
            const svgW = Math.max(sorted.length * colW + yAxisW + padR, 400);
            const barW = Math.min(32, colW - 16);
            return (
              <div>
                <div style={{display:'flex',gap:32,marginBottom:20,paddingBottom:16,borderBottom:'1px solid var(--border)'}}>
                  <div>
                    <div style={{fontSize:11,color:'var(--text3)',marginBottom:4}}>최신 기업가치</div>
                    <div style={{fontSize:20,fontWeight:700,fontFamily:'MaruBuri,sans-serif',color:'var(--accent)'}}>{fmtV(latest.valuation)}</div>
                    <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{fmtDate(latest.valuation_date)} · {latest.memo||'—'}</div>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:'var(--text3)',marginBottom:4}}>기업가치 건수</div>
                    <div style={{fontSize:20,fontWeight:700,fontFamily:'MaruBuri,sans-serif',color:'var(--text)'}}>{sorted.length}건</div>
                  </div>
                  {sorted.length >= 2 && (() => {
                    const first = sorted[0];
                    const chg = calcChange(latest.valuation, first.valuation);
                    return (
                      <div>
                        <div style={{fontSize:11,color:'var(--text3)',marginBottom:4}}>초기 대비 변화</div>
                        <div style={{fontSize:20,fontWeight:700,fontFamily:'MaruBuri,sans-serif',color:Number(chg)>=0?'var(--green)':'var(--red)'}}>
                          {Number(chg)>=0?'▲':'▼'}{Math.abs(chg)}%
                        </div>
                        <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{fmtV(first.valuation)} → {fmtV(latest.valuation)}</div>
                      </div>
                    );
                  })()}
                </div>
                <div style={{overflowX:'auto'}}>
                  <svg width="100%" viewBox={`0 0 ${svgW} ${chartH}`} style={{display:'block',minWidth:300}}>
                    {ticks.map(v => {
                      const y = padT + innerH - Math.round((v/maxVal/1.15)*innerH);
                      return (
                        <g key={v}>
                          <line x1={yAxisW} y1={y} x2={svgW-padR} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3"/>
                          <text x={yAxisW-4} y={y+3} textAnchor="end" fontSize="9" fill="var(--text3)" fontFamily="MaruBuri,sans-serif">{fmtV(v)}</text>
                        </g>
                      );
                    })}
                    <line x1={yAxisW} y1={padT+innerH} x2={svgW-padR} y2={padT+innerH} stroke="var(--border2)" strokeWidth="1"/>
                    {sorted.map((v, i) => {
                      const val = Number(v.valuation)||0;
                      const bH = Math.max(Math.round((val/maxVal/1.15)*innerH), 2);
                      const colX = yAxisW + i*colW + (colW-barW)/2;
                      const bY = padT + innerH - bH;
                      const isLatest = i === sorted.length-1;
                      return (
                        <g key={v.id}>
                          <rect x={colX} y={bY} width={barW} height={bH} fill={isLatest ? 'var(--accent)' : 'rgba(255,106,0,0.35)'} rx="3"/>
                          <text x={colX+barW/2} y={bY-4} textAnchor="middle" fontSize="9" fill="var(--text2)" fontFamily="MaruBuri,sans-serif">{fmtV(val)}</text>
                          <text x={colX+barW/2} y={padT+innerH+14} textAnchor="middle" fontSize="8" fill="var(--text3)" fontFamily="MaruBuri,sans-serif">
                            {new Date(v.valuation_date).getFullYear()}.{String(new Date(v.valuation_date).getMonth()+1).padStart(2,'0')}
                          </text>
                          {v.memo && <text x={colX+barW/2} y={padT+innerH+24} textAnchor="middle" fontSize="7" fill="var(--text3)" fontFamily="inherit">{v.memo}</text>}
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div style={{marginTop:20,border:'1px solid var(--border)',borderRadius:8,overflow:'hidden'}}>
                  <div style={{display:'grid',gridTemplateColumns:'150px 100px 80px 160px 1fr',background:'var(--bg3)',borderBottom:'1px solid var(--border)'}}>
                    {['기준일','기업가치','P/E','거래 유형','출처'].map((h,i)=>(
                      <div key={i} style={{padding:'9px 14px',fontSize:11,fontWeight:600,color:'var(--text3)',letterSpacing:'0.06em',textAlign:'center'}}>{h}</div>
                    ))}
                  </div>
                  {sorted.slice().reverse().map((v,idx)=>{
                    const parts = (v.memo||'').split(' · ');
                    const dealType = parts[0]||'—';
                    const textSource = parts.length>1 ? parts.slice(1).join(' · ') : null;
                    const cs = {padding:'10px 14px',fontSize:12,color:'var(--text)',textAlign:'center'};
                    const vDate = new Date(v.valuation_date);
                    const nearestF = financials.reduce((best, f) => {
                      if (!f.operating_profit || f.operating_profit <= 0) return best;
                      const fDate = new Date(f.fiscal_date);
                      if (fDate > vDate) return best;
                      const diff = vDate - fDate;
                      const bestDiff = best ? vDate - new Date(best.fiscal_date) : Infinity;
                      return diff < bestDiff ? f : best;
                    }, null);
                    const pe = nearestF && v.valuation && nearestF.operating_profit > 0
                      ? (Number(v.valuation) / Number(nearestF.operating_profit)).toFixed(1)
                      : null;
                    return (
                      <div key={v.id} className="valuation-row" style={{display:'grid',gridTemplateColumns:'150px 100px 80px 160px 1fr',borderBottom:idx<sorted.length-1?'1px solid var(--border)':'none',background:'var(--bg2)'}}>
                        <div style={{...cs,textAlign:'left',position:'relative'}}>
                          {fmtDate(v.valuation_date)}
                          {isAdmin && <button className="row-edit-btn" style={{marginLeft:6}} onClick={()=>openModal('valuation',v)}>✎</button>}
                          {isAdmin && <button className="row-delete-btn" style={{marginLeft:2}} onClick={()=>setModal({type:'delete',record:v,tableType:'valuations'})}>🗑</button>}
                        </div>
                        <div style={{...cs,fontWeight:500}}>{fmtV(v.valuation)}</div>
                        <div style={{...cs,color:pe?'var(--text)':'var(--text3)'}}>{pe ? pe+'x' : 'N/A'}</div>
                        <div style={cs}>{dealType}</div>
                        <div style={{...cs}}>
                          {v.source_link
                            ? /^https?:\/\//.test(v.source_link)
                              ? <a href={v.source_link} target="_blank" rel="noreferrer" style={{color:'var(--accent)',textDecoration:'none',fontWeight:500}}>링크</a>
                              : <span style={{color:'var(--text2)'}}>{v.source_link}</span>
                            : textSource
                              ? <span style={{color:'var(--text2)'}}>{textSource}</span>
                              : <span style={{color:'var(--text3)'}}>—</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })() : <div style={{color:'var(--text3)',fontSize:13,padding:'20px 0'}}>기업가치 데이터가 없습니다</div>}
        </div>
      )}

      {activeTab === 'review' && (() => {
        const raw = company.inbound_outbound || '';
        const isOutbound = raw.includes('아웃바운드');
        const isInbound = !isOutbound && raw !== 'X' && raw !== '' && raw !== '-';
        const inboundSource = isInbound ? raw : null;
        return (
          <div className="full-width-section">
            <div className="section-title">딜 검토 현황</div>
            <div style={{marginBottom:24}}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>보고 이력</div>
              {reports.length > 0 ? (
                <table className="history-table">
                  <thead><tr>
                    <th style={{textAlign:'left'}}>보고 날짜</th>
                    <th style={{textAlign:'left'}}>유형</th>
                    <th style={{textAlign:'left'}}>보고 대상</th>
                    <th style={{textAlign:'left'}}>PPT</th>
                    <th style={{textAlign:'left'}}>비고</th>
                  </tr></thead>
                  <tbody>{reports.map(r=>(
                    <tr key={r.id}>
                      <td style={{textAlign:'left'}}>
                        {fmtDate(r.report_date)}
                        {isAdmin && <button className="row-edit-btn" style={{marginLeft:6}} onClick={e=>{e.stopPropagation();openModal('report',r);}}>✎</button>}
                        {isAdmin && <button className="row-delete-btn" style={{marginLeft:2}} onClick={e=>{e.stopPropagation();setModal({type:'delete',record:r,tableType:'reports'});}}>🗑</button>}
                      </td>
                      <td style={{textAlign:'left',fontFamily:'inherit'}}>{r.report_type || '—'}</td>
                      <td style={{textAlign:'left',fontFamily:'inherit',color:'var(--text2)'}}>{r.report_target || '—'}</td>
                      <td style={{textAlign:'left'}}>{r.ppt_link ? <a className="report-link" href={r.ppt_link} target="_blank" rel="noreferrer">PPT 보기 →</a> : <span style={{color:'var(--text3)'}}>—</span>}</td>
                      <td style={{textAlign:'left',fontFamily:'inherit',fontSize:12,color:'var(--text3)'}}>{r.notes || '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : <div style={{color:'var(--text3)',fontSize:13,padding:'12px 0'}}>보고 이력이 없습니다. "+ 보고 이력" 버튼으로 추가해주세요.</div>}
            </div>
            <div style={{borderTop:'1px solid var(--border)',paddingTop:20}}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>투자/인수 검토 현황</div>
              {(!company.ma_status || company.ma_status === 'X' || company.ma_status === '-') ? (
                <div style={{color:'var(--text3)',fontSize:13,padding:'12px 0'}}>투자/인수 검토는 진행되지 않았습니다.</div>
              ) : (
                <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 16px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg3)'}}>
                    <span style={{fontSize:16}}>{isInbound?'📥':isOutbound?'📤':'—'}</span>
                    <div>
                      <div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>딜 유형</div>
                      <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{isInbound ? '인바운드' : isOutbound ? '아웃바운드' : '—'}</div>
                    </div>
                  </div>
                  {isInbound && inboundSource && (
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 16px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg3)'}}>
                      <span style={{fontSize:16}}>👤</span>
                      <div>
                        <div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>검토 요청자</div>
                        <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{inboundSource}</div>
                      </div>
                    </div>
                  )}
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 16px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg3)'}}>
                    <span style={{fontSize:16}}>📋</span>
                    <div>
                      <div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>검토 결과</div>
                      <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{company.ma_status}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
