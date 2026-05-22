// ─── DETAIL VIEW ─────────────────────────────────────────
function DetailView({ company, onBack }) {
  const { useState, useEffect, useCallback } = React;
  const [financials, setFinancials] = useState([]);
  const [valuations, setValuations] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  // modal: null | { type: 'edit'|'financial'|'valuation'|'report', record: object|null }
  const [modal, setModal] = useState(null);
  const openModal = (type, record = null) => setModal({ type, record });
  const closeModal = () => setModal(null);
  const [toast, setToast] = useState(null);
  const [allTagsForEdit, setAllTagsForEdit] = useState([]);

  const load = useCallback(async () => {
    const [f, v, r] = await Promise.all([
      companyService.fetchFinancialsByCompany(company.id),
      companyService.fetchValuationsByCompany(company.id),
      companyService.fetchReportsByCompany(company.id),
    ]);
    setFinancials(f);
    setValuations(v);
    setReports(r);
  }, [company.id]);

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
          onSave={()=>{ load(); showToast(modal.record ? '재무실적이 수정됐어요' : '재무실적이 저장됐어요'); }}
        />
      )}
      {modal?.type === 'valuation' && (
        <ValuationModal
          company={company}
          record={modal.record}
          onClose={closeModal}
          onSave={()=>{ load(); showToast(modal.record ? '기업가치가 수정됐어요' : '기업가치가 저장됐어요'); }}
        />
      )}
      {modal?.type === 'report' && (
        <ReportModal
          company={company}
          record={modal.record}
          onClose={closeModal}
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
        <div style={{display:'flex',gap:8}}>
          <button className="btn-edit" onClick={()=>openModal('edit')}>✎ 기업 수정</button>
          <button className="btn btn-secondary" onClick={()=>openModal('financial')}>+ 재무실적</button>
          <button className="btn btn-secondary" onClick={()=>openModal('valuation')}>+ 기업가치</button>
          <button className="btn btn-secondary" onClick={()=>openModal('report')}>+ 보고 이력</button>
        </div>
      </div>

      <div className="tab-bar">
        {[['overview','개요'],['financials','재무 이력'],['valuations','기업가치 이력'],['review','내부검토 현황']].map(([k,l])=>
          <button key={k} className={`tab ${activeTab===k?'active':''}`} onClick={()=>setActiveTab(k)}>{l}</button>
        )}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div className="full-width-section" style={{marginBottom:20}}>
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
                  <td style={{textAlign:'left',fontFamily:'inherit'}}>{getListingBadge(company.listing_status) || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="detail-grid">
            <div className="detail-section">
              <div className="section-title">최신 재무실적</div>
              {latestF ? <>
                <div className="info-row"><span className="info-label">기준일</span><span className="info-value">{fmtDate(latestF.fiscal_date)}</span></div>
                <div className="info-row"><span className="info-label">매출</span><span className="info-value mono">{fmt(latestF.revenue)}</span></div>
                <div className="info-row"><span className="info-label">영업이익</span><span className="info-value mono" style={{color:latestF.operating_profit<0?'var(--red)':'var(--text)'}}>{fmt(latestF.operating_profit)}</span></div>
                <div className="info-row"><span className="info-label">총자산</span><span className="info-value mono">{fmt(latestF.total_assets)}</span></div>
                <div className="info-row"><span className="info-label">순자산</span><span className="info-value mono">{fmt(latestF.net_assets)}</span></div>
                {latestF.memo && <div className="info-row"><span className="info-label">메모</span><span className="info-value" style={{fontSize:12,maxWidth:'60%',textAlign:'right'}}>{latestF.memo}</span></div>}
              </> : <div style={{color:'var(--text3)',fontSize:13}}>재무실적 데이터가 없습니다</div>}
            </div>
            <div className="detail-section">
              <div className="section-title">기업가치</div>
              {latestV ? (() => {
                const vDate = new Date(latestV.valuation_date);
                const nearestF = financials.reduce((best, f) => {
                  if (!f.operating_profit || f.operating_profit <= 0) return best;
                  const fDate = new Date(f.fiscal_date);
                  if (fDate > vDate) return best;
                  const diff = vDate - fDate;
                  const bestDiff = best ? vDate - new Date(best.fiscal_date) : Infinity;
                  return diff < bestDiff ? f : best;
                }, null);
                const calcPE = nearestF && latestV.valuation && nearestF.operating_profit > 0
                  ? (Number(latestV.valuation) / Number(nearestF.operating_profit)).toFixed(1)
                  : null;
                return <>
                  <div className="info-row"><span className="info-label">기준일</span><span className="info-value">{fmtDate(latestV.valuation_date)}</span></div>
                  <div className="info-row"><span className="info-label">기업가치</span><span className="info-value mono">{fmt(latestV.valuation)}</span></div>
                  <div className="info-row">
                    <span className="info-label">P/E 멀티플</span>
                    <span className="info-value mono">
                      {calcPE ? calcPE + 'x' : <span style={{color:'var(--text3)'}}>N/A</span>}
                    </span>
                  </div>
                  {calcPE && nearestF && <div className="info-row"><span className="info-label" style={{fontSize:11}}>기준 실적</span><span className="info-value" style={{fontSize:11,color:'var(--text3)'}}>{fmtDate(nearestF.fiscal_date)} OP {fmt(nearestF.operating_profit)}</span></div>}
                </>;
              })() : <div style={{color:'var(--text3)',fontSize:13}}>기업가치 데이터가 없습니다</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financials' && (
        <div className="full-width-section">
          <div className="section-title">재무실적 이력 (누적)</div>
          {financials.length > 0 ? (() => {
            const sorted = [...financials].reverse();
            const revenues = sorted.map(f => Number(f.revenue)||0);
            const ops = sorted.map(f => Number(f.operating_profit)||0);
            const tas = sorted.map(f => Number(f.total_assets)||0);
            const nas = sorted.map(f => Number(f.net_assets)||0);

            return (
              <div style={{display:'flex',flexDirection:'column',gap:20}}>
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
                      <tbody>{financials.map((f,i) => {
                        const prev = financials[i+1];
                        const revChg = prev?.revenue ? calcChange(f.revenue, prev.revenue) : null;
                        const opChg = prev?.operating_profit && prev.operating_profit !== 0 ? calcChange(f.operating_profit, prev.operating_profit) : null;
                        const opMargin = f.revenue && f.revenue !== 0 ? ((Number(f.operating_profit)||0) / Number(f.revenue) * 100).toFixed(1) : null;
                        return (
                          <tr key={f.id}>
                            <td style={{textAlign:'left',fontFamily:'MaruBuri,sans-serif',fontSize:11}}>
                              {fmtDate(f.fiscal_date)}
                              <button className="row-edit-btn" style={{marginLeft:6}} onClick={e=>{e.stopPropagation();openModal('financial',f);}}>✎</button>
                              <button className="row-delete-btn" style={{marginLeft:2}} onClick={e=>{e.stopPropagation();setModal({type:'delete',record:f,tableType:'financials'});}}>🗑</button>
                            </td>
                              {revChg && <span style={{fontSize:9,color:Number(revChg)>=0?'var(--green)':'var(--red)',marginLeft:4}}>{Number(revChg)>=0?'▲':'▼'}{Math.abs(revChg)}%</span>}
                            </td>
                            <td style={{fontSize:12}}>
                              <span style={{color:f.operating_profit==null?'var(--text3)':f.operating_profit<0?'var(--red)':'var(--text)'}}>{fmt(f.operating_profit)}</span>
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
                      return <MiniChart
                        data={[revenues, ops]}
                        scales={[s0, s0]}
                        color="var(--accent)" color2="rgba(255,106,0,0.38)"
                        xLabels={sorted.map(f=>new Date(f.fiscal_date).getFullYear())}
                      />;
                    })()}
                    <div style={{display:'flex',gap:14,marginTop:4,fontSize:11,color:'var(--text2)',justifyContent:'center'}}>
                      <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'var(--accent)',display:'inline-block'}}/> 매출</span>
                      <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'rgba(255,106,0,0.38)',display:'inline-block'}}/> 영업이익</span>
                    </div>
                  </div>
                </div>

                <div style={{borderTop:'1px solid var(--border)'}}/>

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
                      <tbody>{financials.map(f => (
                        <tr key={f.id}>
                          <td style={{textAlign:'left',fontFamily:'MaruBuri,sans-serif',fontSize:11}}>
                            {fmtDate(f.fiscal_date)}
                            <button className="row-edit-btn" style={{marginLeft:6}} onClick={e=>{e.stopPropagation();openModal('financial',f);}}>✎</button>
                            <button className="row-delete-btn" style={{marginLeft:2}} onClick={e=>{e.stopPropagation();setModal({type:'delete',record:f,tableType:'financials'});}}>🗑</button>
                          </td>
                          <td style={{fontSize:12}}>{fmt(f.total_assets)}</td>
                          <td style={{fontSize:12,color:f.net_assets!=null&&Number(f.net_assets)<0?'var(--red)':'var(--text)'}}>{fmt(f.net_assets)}</td>
                          <td style={{fontFamily:'inherit',fontSize:11,color:'var(--text3)'}}>{f.source||'—'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>총자산 / 순자산 추이</div>
                    {(() => {
                      const taMax = Math.max(...tas, 1);
                      const naPos = Math.max(...nas.filter(v=>v>0), 0);
                      const naNeg = Math.abs(Math.min(...nas.filter(v=>v<0), 0));
                      const assetScale = { posMax: Math.max(taMax, naPos), negMax: naNeg };
                      return <MiniChart
                        data={[tas, nas]}
                        scales={[assetScale, assetScale]}
                        color="var(--accent)" color2="rgba(255,106,0,0.38)"
                        xLabels={sorted.map(f=>new Date(f.fiscal_date).getFullYear())}
                      />;
                    })()}
                    <div style={{display:'flex',gap:14,marginTop:4,fontSize:11,color:'var(--text2)',justifyContent:'center'}}>
                      <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'var(--accent)',display:'inline-block'}}/> 총자산</span>
                      <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'rgba(255,106,0,0.38)',display:'inline-block'}}/> 순자산</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : <div style={{color:'var(--text3)',fontSize:13}}>데이터가 없습니다</div>}
        </div>
      )}

      {activeTab === 'valuations' && (
        <div className="full-width-section">
          <div className="section-title">기업가치 이력 (누적)</div>
          {valuations.length > 0 ? (() => {
            const sorted = [...valuations].sort((a,b) => new Date(a.valuation_date) - new Date(b.valuation_date));
            const latest = sorted[sorted.length-1];
            const maxVal = Math.max(...sorted.map(v => Number(v.valuation)||0), 1);
            const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
            const ti = maxVal <= magnitude*2 ? magnitude/2 : maxVal <= magnitude*5 ? magnitude : magnitude*2;
            const ticks = [];
            for(let v=ti; v<=maxVal*1.15; v+=ti) ticks.push(v);
            const yAxisW = 52; const chartH = 160; const padT = 20; const padB = 28; const padR = 12;
            const innerH = chartH - padT - padB;
            const colW = Math.max(60, Math.floor(500 / sorted.length));
            const svgW = Math.max(sorted.length * colW + yAxisW + padR, 400);
            const barW = Math.min(32, colW - 16);
            return (
              <div>
                <div style={{display:'flex',gap:32,marginBottom:20,paddingBottom:16,borderBottom:'1px solid var(--border)'}}>
                  <div>
                    <div style={{fontSize:11,color:'var(--text3)',marginBottom:4}}>최신 기업가치</div>
                    <div style={{fontSize:20,fontWeight:700,fontFamily:'MaruBuri,sans-serif',color:'var(--accent)'}}>{fmt(latest.valuation)}</div>
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
                        <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{fmt(first.valuation)} → {fmt(latest.valuation)}</div>
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
                          <text x={yAxisW-4} y={y+3} textAnchor="end" fontSize="9" fill="var(--text3)" fontFamily="MaruBuri,sans-serif">{fmt(v)}</text>
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
                          <text x={colX+barW/2} y={bY-4} textAnchor="middle" fontSize="9" fill="var(--text2)" fontFamily="MaruBuri,sans-serif">{fmt(val)}</text>
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
                          <button className="row-edit-btn" style={{marginLeft:6}} onClick={()=>openModal('valuation',v)}>✎</button>
                          <button className="row-delete-btn" style={{marginLeft:2}} onClick={()=>setModal({type:'delete',record:v,tableType:'valuations'})}>🗑</button>
                        </div>
                        <div style={{...cs,fontWeight:500}}>{fmt(v.valuation)}</div>
                        <div style={{...cs,color:pe?'var(--text)':'var(--text3)'}}>{pe ? pe+'x' : 'N/A'}</div>
                        <div style={cs}>{dealType}</div>
                        <div style={{...cs}}>
                          {v.source_link
                            ? <a href={v.source_link} target="_blank" rel="noreferrer" style={{color:'var(--accent)',textDecoration:'none',fontWeight:500}}>링크</a>
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
                        <button className="row-edit-btn" style={{marginLeft:6}} onClick={e=>{e.stopPropagation();openModal('report',r);}}>✎</button>
                        <button className="row-delete-btn" style={{marginLeft:2}} onClick={e=>{e.stopPropagation();setModal({type:'delete',record:r,tableType:'reports'});}}>🗑</button>
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
