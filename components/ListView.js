// ─── LIST VIEW ────────────────────────────────────────────
function ListView({ onSelect, isAdmin = false }) {
  const { useState, useEffect, useCallback } = React;
  const [companies, setCompanies] = useState([]);
  const [financials, setFinancials] = useState({});
  const [valuations, setValuations] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showUpload, setShowUpload] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [companiesData, financialsData, valuationsData] = await Promise.all([
      companyService.fetchAll(),
      companyService.fetchFinancials(),
      companyService.fetchValuations(),
    ]);

    // 기업별 최신 재무/기업가치 맵 생성
    const fMap = {}, vMap = {};
    for (const row of financialsData) {
      if (!fMap[row.company_id]) fMap[row.company_id] = row;
    }
    for (const row of financialsData) {
      if (!fMap[row.company_id+'_prev'] && fMap[row.company_id] && fMap[row.company_id].id !== row.id) {
        fMap[row.company_id+'_prev'] = row;
      }
    }
    for (const row of valuationsData) {
      if (!vMap[row.company_id]) vMap[row.company_id] = row;
    }

    setCompanies(companiesData);
    setFinancials(fMap);
    setValuations(vMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // 전체 태그 목록 (TagInput 추천 + 필터 드롭다운용)
  const allTags = [...new Set(companies.flatMap(c => c.tags || []))].sort();

  let filtered = companies.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || c.name.toLowerCase().includes(q)
      || (c.tags||[]).some(t => t.toLowerCase().includes(q))
      || (c.industry||'').toLowerCase().includes(q);
    const matchTag = !tagFilter || (c.tags||[]).includes(tagFilter);
    return matchSearch && matchTag;
  });

  filtered = [...filtered].sort((a,b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'ko');
    if (sortBy === 'revenue') return (financials[b.id]?.revenue||0) - (financials[a.id]?.revenue||0);
    if (sortBy === 'valuation') return (valuations[b.id]?.valuation||0) - (valuations[a.id]?.valuation||0);
    if (sortBy === 'updated') return new Date(b.updated_at||0) - new Date(a.updated_at||0);
    return 0;
  });

  return (
    <div>
      {toast && <Toast {...toast} onClose={()=>setToast(null)}/>}
      {showUpload && (
        <ExcelUpload
          onClose={()=>setShowUpload(false)}
          onDone={()=>{ load(); setToast({msg:'엑셀 데이터가 업데이트됐어요',type:'success'}); }}
        />
      )}
      {showAddCompany && (
        <AddCompanyModal
          onClose={()=>setShowAddCompany(false)}
          onSave={()=>{ load(); setToast({msg:'새 기업이 추가됐어요',type:'success'}); }}
          allTags={allTags}
        />
      )}

      <div className="toolbar">
        <div className="search-box">
          <input placeholder="기업명, 태그, 업종 검색..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="filter-select" value={tagFilter} onChange={e=>setTagFilter(e.target.value)}>
          <option value="">전체 태그</option>
          {allTags.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="name">이름순</option>
          <option value="revenue">매출 높은순</option>
          <option value="valuation">기업가치 높은순</option>
          <option value="updated">최근 업데이트순</option>
        </select>
        {isAdmin && <button className="btn btn-primary" onClick={()=>setShowAddCompany(true)}>+ 기업 추가</button>}
        {isAdmin && <button className="btn btn-success" onClick={()=>setShowUpload(true)}>📊 엑셀 업로드</button>}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"/><span>데이터 불러오는 중...</span></div>
      ) : (
        <div className="table-wrap">
          <div className="table-header">
            <span onClick={()=>setSortBy('name')}>기업명 {sortBy==='name'&&'↑'}</span>
            <span>태그</span>
            <span onClick={()=>setSortBy('revenue')}>매출</span>
            <span>영업이익</span>
            <span onClick={()=>setSortBy('valuation')}>기업가치</span>
            <span></span>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🔍</div><div>검색 결과가 없습니다</div></div>
          ) : filtered.map(company => {
            const f = financials[company.id];
            const fp = financials[company.id+'_prev'];
            const v = valuations[company.id];
            const revChange = f && fp ? calcChange(f.revenue, fp.revenue) : null;
            return (
              <div key={company.id} className="table-row" onClick={()=>onSelect(company)}>
                <div>
                  <div className="company-name">{company.name}</div>
                  <div className="company-industry">{company.industry}</div>
                </div>
                <div className="tags-wrap">
                  {(company.tags||[]).slice(0,3).map(t=><span key={t} className="tag">{t}</span>)}
                  {(company.tags||[]).length > 3 && <span className="tag">+{(company.tags||[]).length-3}</span>}
                </div>
                <div>
                  <div className="mono">{fmt(f?.revenue)}</div>
                  {revChange && <div className={`change ${Number(revChange)>=0?'up':'down'}`} style={{fontSize:11}}>{Number(revChange)>=0?'↑':'↓'}{Math.abs(revChange)}%</div>}
                </div>
                <div>
                  <div className="mono" style={{color:f?.operating_profit==null?'var(--text3)':f.operating_profit<0?'var(--red)':'var(--text)'}}>
                    {fmt(f?.operating_profit)}
                  </div>
                  {(() => {
                    const fp2 = financials[company.id+'_prev'];
                    const opChange = f?.operating_profit!=null && fp2?.operating_profit!=null && fp2.operating_profit!==0
                      ? calcChange(f.operating_profit, fp2.operating_profit) : null;
                    return opChange ? <div className={`change ${Number(opChange)>=0?'up':'down'}`} style={{fontSize:11}}>{Number(opChange)>=0?'↑':'↓'}{Math.abs(opChange)}%</div> : null;
                  })()}
                </div>
                <div className="mono">{fmt(v?.valuation)}</div>
                <div style={{color:'var(--text3)',fontSize:18}}>›</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
