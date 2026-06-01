// ─── DATA MANAGEMENT VIEW ─────────────────────────────────
function DataManagementView({ companies, onRefresh }) {
  const { useState, useEffect } = React;
  const [tab,               setTab]               = useState('valuation');
  const [loadedCompanies,   setLoadedCompanies]   = useState(companies || []);

  // companies prop이 없거나 비어있으면 직접 조회
  useEffect(() => {
    if (!companies?.length) {
      companyService.fetchAll().then(setLoadedCompanies).catch(() => {});
    } else {
      setLoadedCompanies(companies);
    }
  }, [companies]);

  const TABS = [
    { key: 'valuation', label: '기업가치 등록' },
    { key: 'report',    label: '보고이력 등록' },
    { key: 'upload',    label: '엑셀 업로드'   },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>데이터 관리</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>기업 데이터를 일괄 등록하거나 엑셀로 업로드합니다.</div>
      </div>

      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        {tab === 'valuation' && <ValuationBulkView companies={loadedCompanies} />}
        {tab === 'report'    && <ReportBulkView    companies={loadedCompanies} />}
        {tab === 'upload'    && <ExcelUploadV2      companies={loadedCompanies} onRefresh={() => {
          companyService.fetchAll().then(setLoadedCompanies).catch(() => {});
          onRefresh && onRefresh();
        }} />}
      </div>
    </div>
  );
}
