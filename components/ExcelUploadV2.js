// ─── EXCEL UPLOAD V2 ──────────────────────────────────────

// ── 공통 Preview 테이블 ──────────────────────────────────
function UploadPreviewTable({ rows, columns, onSave, saving }) {
  const { useState } = React;
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'error'

  const validRows  = rows.filter(r => r._status === 'valid');
  const errorRows  = rows.filter(r => r._status === 'error');
  const displayed  = viewMode === 'error' ? errorRows : rows;

  return (
    <div>
      {/* 요약 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13 }}>총 <strong>{rows.length}</strong>행</div>
        <div style={{ fontSize: 13, color: 'var(--green)' }}>✅ 정상 <strong>{validRows.length}</strong>행</div>
        {errorRows.length > 0 && <div style={{ fontSize: 13, color: 'var(--red)' }}>❌ 오류 <strong>{errorRows.length}</strong>행</div>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button onClick={() => setViewMode('all')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 5, border: `1px solid ${viewMode==='all'?'var(--accent)':'var(--border)'}`, background: viewMode==='all'?'rgba(255,106,0,0.1)':'var(--bg2)', color: viewMode==='all'?'var(--accent)':'var(--text2)', cursor: 'pointer', fontFamily: 'inherit' }}>전체 보기</button>
          {errorRows.length > 0 && <button onClick={() => setViewMode('error')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 5, border: `1px solid ${viewMode==='error'?'var(--red)':'var(--border)'}`, background: viewMode==='error'?'rgba(220,38,38,0.08)':'var(--bg2)', color: viewMode==='error'?'var(--red)':'var(--text2)', cursor: 'pointer', fontFamily: 'inherit' }}>오류만 보기</button>}
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: 'auto', marginBottom: 16, maxHeight: 360, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: 'var(--bg3)', position: 'sticky', top: 0 }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>#</th>
              {columns.map(c => <th key={c.key} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{c.label}</th>)}
              <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((row, i) => (
              <tr key={i} style={{ background: row._status === 'error' ? 'rgba(220,38,38,0.03)' : 'transparent', borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '7px 10px', color: 'var(--text3)' }}>{row._rowIndex}</td>
                {columns.map(c => <td key={c.key} style={{ padding: '7px 10px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{row[c.key] || <span style={{ color: 'var(--text3)' }}>—</span>}</td>)}
                <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                  {row._status === 'valid'
                    ? <span style={{ color: 'var(--green)', fontSize: 11 }}>✅</span>
                    : <span style={{ color: 'var(--red)', fontSize: 11 }}>{row._errors.join(' · ')}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {validRows.length > 0 && (
        <button
          onClick={() => onSave(validRows)}
          disabled={saving}
          className="btn btn-primary"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving ? '저장 중...' : `정상 ${validRows.length}행 저장`}
        </button>
      )}
      {validRows.length === 0 && <div style={{ fontSize: 13, color: 'var(--text3)' }}>저장 가능한 행이 없습니다</div>}
    </div>
  );
}

// ── 기업 개요 업로드 ─────────────────────────────────────
function CompanyUpload({ companies, onDone }) {
  const { useState } = React;
  const [rows,   setRows]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const HEADERS  = ['name','founded_date','location','ceo','employee_count','listing_status','industry','tags','ma_status','inbound_outbound'];
  const EXAMPLE  = ['(주)예시기업','2020-01-15','서울 강남구','홍길동','50','비상장 (외감X)','소프트웨어 개발','SaaS,B2B','X','아웃바운드 / HI 김민정 전무'];
  const COLUMNS  = [
    { key: 'name', label: '회사명' }, { key: 'founded_date', label: '설립일' },
    { key: 'location', label: '소재지' }, { key: 'ceo', label: '대표이사' },
    { key: 'employee_count', label: '임직원' }, { key: 'listing_status', label: '상장여부' },
    { key: 'industry', label: '업종' }, { key: 'tags', label: '태그' },
    { key: 'ma_status', label: 'M&A' }, { key: 'inbound_outbound', label: '경로' },
  ];

  function downloadTemplate() {
    uploadService.downloadTemplate('기업개요_업로드_템플릿.xlsx', HEADERS, EXAMPLE);
  }

  async function handleFile(file) {
    setResult(null);
    const parsed = await uploadService.parseExcel(file);
    const nameMap = uploadService.buildNameMap(companies);
    const validated = uploadService.validateCompanyRows(parsed, nameMap);
    setRows(validated);
  }

  async function handleSave(validRows) {
    setSaving(true);
    try {
      const count = await uploadService.saveCompanyRows(validRows);
      setResult({ type: 'success', msg: `${count}개 기업이 저장됐습니다.` });
      setRows(null);
      onDone && onDone();
    } catch(e) {
      setResult({ type: 'error', msg: '저장 실패: ' + e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <UploadPanel
      title="기업 개요 업로드"
      description="companies 테이블에 기업 기본 정보를 일괄 등록합니다. 동일 회사명 존재 시 SKIP됩니다."
      onDownload={downloadTemplate}
      onFile={handleFile}
      rows={rows}
      columns={COLUMNS}
      onSave={handleSave}
      saving={saving}
      result={result}
      onReset={() => { setRows(null); setResult(null); }}
    />
  );
}

// ── 재무이력 업로드 ──────────────────────────────────────
function FinancialUpload({ companies, onDone }) {
  const { useState, useEffect } = React;
  const [rows,    setRows]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [result,  setResult]  = useState(null);
  const [existing, setExisting] = useState([]);

  useEffect(() => {
    companyService.fetchFinancials().then(setExisting).catch(() => {});
  }, []);

  const HEADERS = ['company_name','period_type','fiscal_date','revenue','operating_profit','total_assets','net_assets','source','source_link','memo'];
  const EXAMPLE = ['(주)예시기업','연간','2024-12-31','1200','80','5000','2000','다트전자공시','https://dart.fss.or.kr/','특이사항 없음'];
  const COLUMNS = [
    { key: 'company_name', label: '회사명' }, { key: 'period_type', label: '기준기간' },
    { key: 'fiscal_date', label: '결산기준일' }, { key: 'revenue', label: '매출(억)' },
    { key: 'operating_profit', label: '영업이익(억)' }, { key: 'total_assets', label: '총자산(억)' },
    { key: 'net_assets', label: '순자산(억)' }, { key: 'source', label: '출처' },
    { key: 'source_link', label: '출처링크' }, { key: 'memo', label: '메모' },
  ];

  function downloadTemplate() {
    uploadService.downloadTemplate('재무이력_업로드_템플릿.xlsx', HEADERS, EXAMPLE);
  }

  async function handleFile(file) {
    setResult(null);
    const parsed = await uploadService.parseExcel(file);
    const nameMap = uploadService.buildNameMap(companies);
    const validated = uploadService.validateFinancialRows(parsed, nameMap, existing);
    setRows(validated);
  }

  async function handleSave(validRows) {
    setSaving(true);
    try {
      const count = await uploadService.saveFinancialRows(validRows);
      setResult({ type: 'success', msg: `${count}개 재무이력이 저장됐습니다.` });
      setRows(null);
      onDone && onDone();
    } catch(e) {
      setResult({ type: 'error', msg: '저장 실패: ' + e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <UploadPanel
      title="재무이력 업로드"
      description="financials 테이블에 재무 데이터를 일괄 등록합니다. 동일 company + period_type + fiscal_date 조합은 SKIP됩니다."
      onDownload={downloadTemplate}
      onFile={handleFile}
      rows={rows}
      columns={COLUMNS}
      onSave={handleSave}
      saving={saving}
      result={result}
      onReset={() => { setRows(null); setResult(null); }}
    />
  );
}

// ── 공통 업로드 패널 ─────────────────────────────────────
function UploadPanel({ title, description, onDownload, onFile, rows, columns, onSave, saving, result, onReset }) {
  const { useRef } = React;
  const fileRef = useRef();

  async function handleChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    await onFile(file);
    e.target.value = '';
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{description}</div>
      </div>

      {result && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: result.type === 'success' ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${result.type === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`, color: result.type === 'success' ? 'var(--green)' : 'var(--red)', fontSize: 13 }}>
          {result.msg}
          {result.type === 'success' && <button onClick={onReset} style={{ marginLeft: 12, fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>다시 업로드</button>}
        </div>
      )}

      {!rows ? (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={onDownload} className="btn btn-secondary">📥 템플릿 다운로드</button>
          <button onClick={() => fileRef.current?.click()} className="btn btn-primary">📤 엑셀 파일 업로드</button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleChange}/>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>.xlsx / .xls / .csv 지원</div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <button onClick={onReset} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>← 다시 선택</button>
          </div>
          <UploadPreviewTable rows={rows} columns={columns} onSave={onSave} saving={saving}/>
        </div>
      )}
    </div>
  );
}

// ── 메인: ExcelUploadV2 ──────────────────────────────────
function ExcelUploadV2({ companies, onRefresh }) {
  const { useState } = React;
  const [tab, setTab] = useState('company');

  const TABS = [
    { key: 'company',   label: '기업 개요' },
    { key: 'financial', label: '재무이력' },
    { key: 'valuation', label: '기업가치', disabled: true },
    { key: 'report',    label: '내부검토 현황', disabled: true },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>데이터 업로드</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>엑셀 템플릿을 다운로드하여 작성 후 업로드해주세요. 정상 행만 저장됩니다.</div>
      </div>

      {/* 탭 */}
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => !t.disabled && setTab(t.key)}
            style={{ opacity: t.disabled ? 0.4 : 1, cursor: t.disabled ? 'not-allowed' : 'pointer' }}
          >{t.label}{t.disabled && ' (준비중)'}</button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        {tab === 'company'   && <CompanyUpload   companies={companies} onDone={onRefresh}/>}
        {tab === 'financial' && <FinancialUpload companies={companies} onDone={onRefresh}/>}
      </div>
    </div>
  );
}
