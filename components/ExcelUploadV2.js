// ─── EXCEL UPLOAD V2 ──────────────────────────────────────

// ── 공통 Preview 테이블 ──────────────────────────────────
function UploadPreviewTable({ rows, columns, onSave, saving, renderCell }) {
  const { useState } = React;
  const [viewMode, setViewMode] = useState('all');

  const validRows   = rows.filter(r => r._status === 'valid');
  const errorRows   = rows.filter(r => r._status === 'error');
  const warnRows    = rows.filter(r => r._status === 'valid' && r._warnings?.length > 0);
  const displayed   = viewMode === 'error' ? errorRows : viewMode === 'warn' ? warnRows : rows;

  return (
    <div>
      {/* 요약 배너 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap', padding: '10px 14px', background: 'var(--bg3)', borderRadius: 8 }}>
        <div style={{ fontSize: 13 }}>총 <strong>{rows.length}</strong>행</div>
        <div style={{ fontSize: 13, color: 'var(--green)' }}>✅ 정상 <strong>{validRows.length}</strong></div>
        {errorRows.length > 0 && <div style={{ fontSize: 13, color: 'var(--red)' }}>❌ 오류 <strong>{errorRows.length}</strong></div>}
        {warnRows.length > 0  && <div style={{ fontSize: 13, color: 'var(--amber)' }}>⚠️ 경고 <strong>{warnRows.length}</strong></div>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {['all','error','warn'].map(m => {
            if (m === 'error' && !errorRows.length) return null;
            if (m === 'warn'  && !warnRows.length)  return null;
            const label = { all: '전체', error: '오류만', warn: '경고만' }[m];
            return (
              <button key={m} onClick={() => setViewMode(m)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1px solid ${viewMode===m ? (m==='error'?'var(--red)':m==='warn'?'var(--amber)':'var(--accent)') : 'var(--border)'}`,
                  background: viewMode===m ? (m==='error'?'rgba(220,38,38,0.08)':m==='warn'?'rgba(245,158,11,0.08)':'rgba(255,106,0,0.08)') : 'var(--bg2)',
                  color: viewMode===m ? (m==='error'?'var(--red)':m==='warn'?'var(--amber)':'var(--accent)') : 'var(--text2)',
                }}>{label}</button>
            );
          })}
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: 'auto', marginBottom: 16, maxHeight: 380, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: 'var(--bg3)', position: 'sticky', top: 0, zIndex: 1 }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>행</th>
              {columns.map(c => (
                <th key={c.key} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{c.label}</th>
              ))}
              <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, borderBottom: '1px solid var(--border)', minWidth: 180 }}>검증 결과</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((row, i) => (
              <tr key={i} style={{
                background: row._status === 'error' ? 'rgba(220,38,38,0.03)' : row._warnings?.length ? 'rgba(245,158,11,0.03)' : 'transparent',
                borderBottom: '1px solid var(--border)',
              }}>
                <td style={{ padding: '7px 10px', color: 'var(--text3)', fontFamily: 'MaruBuri,sans-serif' }}>{row._rowIndex}</td>
                {columns.map(c => (
                  <td key={c.key} style={{ padding: '7px 10px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: c.key === '_tags_parsed' ? 'normal' : 'nowrap' }}>
                    {renderCell ? renderCell(c.key, row) : (row[c.key] || <span style={{ color: 'var(--text3)' }}>—</span>)}
                  </td>
                ))}
                <td style={{ padding: '7px 10px' }}>
                  {row._status === 'error' ? (
                    <div>{row._errors.map((e, j) => (
                      <div key={j} style={{ color: 'var(--red)', fontSize: 11 }}>❌ {e}</div>
                    ))}</div>
                  ) : row._warnings?.length ? (
                    <div>
                      <div style={{ color: 'var(--green)', fontSize: 11, marginBottom: 2 }}>✅ 저장 가능</div>
                      {row._warnings.map((w, j) => <div key={j} style={{ color: 'var(--amber)', fontSize: 11 }}>⚠️ {w}</div>)}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--green)', fontSize: 11 }}>✅ 정상</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {validRows.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => onSave(validRows)} disabled={saving} className="btn btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
            {saving ? '저장 중...' : `정상 ${validRows.length}행 저장`}
          </button>
          {errorRows.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>오류 {errorRows.length}행은 제외됩니다</div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--red)' }}>저장 가능한 행이 없습니다. 오류를 수정 후 다시 업로드해주세요.</div>
      )}
    </div>
  );
}

// ── 기업 개요 업로드 ─────────────────────────────────────
function CompanyUpload({ companies, onDone }) {
  const { useState, useEffect } = React;
  const [rows,      setRows]      = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [result,    setResult]    = useState(null);
  const [knownTags, setKnownTags] = useState(new Set());

  // 마운트 시 DB 실제 태그 수집
  useEffect(() => {
    companyService.fetchAllTagsSet()
      .then(tagSet => setKnownTags(tagSet))
      .catch(() => {}); // 실패 시 빈 Set — fallback으로 UPLOAD_ENUMS.tags 사용
  }, []);

  const HEADERS = ['name', 'founded_date', 'location', 'ceo', 'employee_count', 'listing_status', 'industry', 'tags', 'ma_status', 'inbound_outbound'];
  const GUIDE   = [
    '법인명 표기 제외 (예: 카카오)', // name
    'YYYY-MM-DD 형식',               // founded_date
    '예: 서울 강남구',                // location
    '대표이사 이름',                  // ceo
    '숫자만 (쉼표 없이)',             // employee_count
    '코스피/코스닥/비상장 (외감)/비상장 (외감X)', // listing_status
    '허용값_참고 시트 확인',          // industry
    '쉼표(,) 구분 (예: AI,SaaS)',    // tags
    'X/진행중/보류 (내부판단) 등',    // ma_status
    '예: 아웃바운드 / HI 김민정 전무', // inbound_outbound
  ];
  const EXAMPLE = ['카카오', '1995-09-01', '경기 성남시', '홍길동', '3000', '코스닥', '플랫폼', 'AI,플랫폼', 'X', '아웃바운드 / HI 김민정 전무'];
  const COLUMNS = [
    { key: 'name', label: '회사명' }, { key: 'founded_date', label: '설립일' },
    { key: 'location', label: '소재지' }, { key: 'ceo', label: '대표이사' },
    { key: 'employee_count', label: '임직원' }, { key: 'listing_status', label: '상장여부' },
    { key: 'industry', label: '업종' }, { key: '_tags_parsed', label: '태그 (저장 예정)' },
    { key: 'ma_status', label: 'M&A' }, { key: 'inbound_outbound', label: '경로' },
  ];

  function downloadTemplate() {
    uploadService.downloadTemplate(
      '기업개요_업로드_템플릿.xlsx',
      HEADERS, GUIDE, EXAMPLE,
      uploadService.getRefSheets()
    );
  }

  async function handleFile(file) {
    setResult(null);
    const parsed = await uploadService.parseExcel(file);
    if (!parsed.length) { setResult({ type: 'error', msg: '데이터가 없습니다. 4행부터 입력해주세요.' }); return; }
    const nameMap = uploadService.buildNameMap(companies);
    setRows(uploadService.validateCompanyRows(parsed, nameMap, knownTags));
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
    } finally { setSaving(false); }
  }

  // 태그 뱃지 렌더러
  function renderCell(colKey, row) {
    if (colKey !== '_tags_parsed') return row[colKey] || <span style={{ color: 'var(--text3)' }}>—</span>;
    const tags = uploadService.normalizeTags(row['tags']);
    if (!tags.length) return <span style={{ color: 'var(--text3)' }}>—</span>;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {tags.map((t, i) => {
          const isKnown = knownTags.has(t);
          return (
            <span key={i} style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 4,
              background: isKnown ? 'var(--bg3)' : 'rgba(245,158,11,0.12)',
              color:      isKnown ? 'var(--text2)' : 'var(--amber)',
              border:     `1px solid ${isKnown ? 'var(--border)' : 'rgba(245,158,11,0.4)'}`,
            }}>
              {t}{!isKnown && ' ✦신규'}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <UploadPanel title="기업 개요 업로드"
      description="companies 테이블에 기업 기본 정보를 일괄 등록합니다. 동일 회사명 존재 시 SKIP됩니다. 4행부터 실제 데이터를 입력해주세요."
      onDownload={downloadTemplate} onFile={handleFile}
      rows={rows} columns={COLUMNS} onSave={handleSave}
      saving={saving} result={result}
      onReset={() => { setRows(null); setResult(null); }}
      renderCell={renderCell}
    />
  );
}

// ── 재무이력 업로드 ──────────────────────────────────────
function FinancialUpload({ companies, onDone }) {
  const { useState, useEffect } = React;
  const [rows,     setRows]     = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [result,   setResult]   = useState(null);
  const [existing, setExisting] = useState([]);

  useEffect(() => { companyService.fetchFinancials().then(setExisting).catch(() => {}); }, []);

  const HEADERS = ['company_name', 'period_type', 'fiscal_date', 'revenue', 'operating_profit', 'total_assets', 'net_assets', 'source', 'source_link', 'memo'];
  const GUIDE   = [
    '등록된 회사명과 정확히 일치',  // company_name
    '연간/1Q/2Q/3Q 중 선택',        // period_type
    'YYYY-MM-DD 형식',               // fiscal_date
    '억원 단위, 숫자만 (쉼표 없이)', // revenue
    '억원 단위, 숫자만',             // operating_profit
    '억원 단위, 숫자만',             // total_assets
    '억원 단위, 숫자만',             // net_assets
    '예: 다트전자공시',              // source
    'https:// 로 시작하는 URL',      // source_link
    '자유 입력',                     // memo
  ];
  const EXAMPLE = ['카카오', '연간', '2024-12-31', '78000', '5000', '120000', '85000', '다트전자공시', 'https://dart.fss.or.kr/', '특이사항 없음'];
  const COLUMNS = [
    { key: 'company_name', label: '회사명' }, { key: 'period_type', label: '기준기간' },
    { key: 'fiscal_date', label: '결산기준일' }, { key: 'revenue', label: '매출(억)' },
    { key: 'operating_profit', label: '영업이익(억)' }, { key: 'total_assets', label: '총자산(억)' },
    { key: 'net_assets', label: '순자산(억)' }, { key: 'source', label: '출처' },
    { key: 'source_link', label: '출처링크' }, { key: 'memo', label: '메모' },
  ];

  function downloadTemplate() {
    uploadService.downloadTemplate(
      '재무이력_업로드_템플릿.xlsx',
      HEADERS, GUIDE, EXAMPLE,
      uploadService.getRefSheets()
    );
  }

  async function handleFile(file) {
    setResult(null);
    const parsed = await uploadService.parseExcel(file);
    if (!parsed.length) { setResult({ type: 'error', msg: '데이터가 없습니다. 4행부터 입력해주세요.' }); return; }
    const nameMap = uploadService.buildNameMap(companies);
    setRows(uploadService.validateFinancialRows(parsed, nameMap, existing));
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
    } finally { setSaving(false); }
  }

  return (
    <UploadPanel title="재무이력 업로드"
      description="financials 테이블에 재무 데이터를 일괄 등록합니다. 동일 company + period_type + fiscal_date 조합은 SKIP됩니다. 4행부터 실제 데이터를 입력해주세요."
      onDownload={downloadTemplate} onFile={handleFile}
      rows={rows} columns={COLUMNS} onSave={handleSave}
      saving={saving} result={result} onReset={() => { setRows(null); setResult(null); }}/>
  );
}

// ── 공통 업로드 패널 ─────────────────────────────────────
function UploadPanel({ title, description, onDownload, onFile, rows, columns, onSave, saving, result, onReset, renderCell }) {
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
        <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>{description}</div>
      </div>

      {result && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8,
          background: result.type === 'success' ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
          border: `1px solid ${result.type === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
          color: result.type === 'success' ? 'var(--green)' : 'var(--red)', fontSize: 13 }}>
          {result.msg}
          {result.type === 'success' && (
            <button onClick={onReset} style={{ marginLeft: 12, fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>다시 업로드</button>
          )}
        </div>
      )}

      {!rows ? (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={onDownload} className="btn btn-secondary">📥 템플릿 다운로드</button>
            <button onClick={() => fileRef.current?.click()} className="btn btn-primary">📤 파일 업로드</button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleChange}/>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>.xlsx / .xls 지원 · 4행부터 실제 데이터 입력</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px', lineHeight: 1.8 }}>
            💡 <strong>업로드 방법:</strong> 템플릿 다운로드 → 1행(헤더), 2행(안내), 3행(예시) 유지 → <strong>4행부터</strong> 실제 데이터 입력 → 저장 후 업로드
          </div>
        </div>
      ) : (
        <div>
          <button onClick={onReset} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>← 다시 선택</button>
          <UploadPreviewTable rows={rows} columns={columns} onSave={onSave} saving={saving} renderCell={renderCell}/>
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
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>템플릿을 다운로드하여 작성 후 업로드해주세요. 정상 행만 저장됩니다.</div>
      </div>
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => !t.disabled && setTab(t.key)}
            style={{ opacity: t.disabled ? 0.4 : 1, cursor: t.disabled ? 'not-allowed' : 'pointer' }}>
            {t.label}{t.disabled && ' (준비중)'}
          </button>
        ))}
      </div>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        {tab === 'company'   && <CompanyUpload   companies={companies} onDone={onRefresh}/>}
        {tab === 'financial' && <FinancialUpload companies={companies} onDone={onRefresh}/>}
      </div>
    </div>
  );
}
