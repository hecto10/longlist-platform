// ─── EXCEL UPLOAD ─────────────────────────────────────────
function ExcelUpload({ onClose, onDone }) {
  const { useState, useRef } = React;
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState([]);
  const fileRef = useRef();

  async function handleFile(file) {
    setStatus('processing');
    setLog(['파일 읽는 중...']);
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets['마스터DB'];
    if (!ws) { setLog(['❌ "마스터DB" 시트를 찾을 수 없어요']); setStatus('done'); return; }
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
    setLog(l => [...l, `${rows.length}개 기업 데이터 발견`]);
    let ok = 0, fail = 0;
    for (const row of rows) {
      const name = row['회사명'];
      if (!name) continue;
      const tags = row['태그'] ? row['태그'].split(',').map(t=>t.trim()) : [];
      try {
        await companyService.upsertFromExcel({
          name,
          location: row['소재지'] || null,
          ceo: row['대표자명'] || null,
          employee_count: String(row['임직원수'] || ''),
          listing_status: row['상장여부'] || null,
          industry: row['업종'] || null,
          tags,
          ma_status: row['M&A 추진 여부 및 진행단계'] || null,
          inbound_outbound: row['아웃바운드 or 인바운드 경로'] || null,
        });
        ok++;
      } catch(e) {
        fail++;
        setLog(l => [...l, `❌ ${name}: ${e.message}`]);
      }
    }
    setLog(l => [...l, `✅ 완료: ${ok}개 성공, ${fail}개 실패`]);
    setStatus('done');
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">엑셀 일괄 업로드</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {status === 'idle' && (
            <>
              <div className="upload-zone" onClick={() => fileRef.current.click()}>
                <div className="upload-icon">📊</div>
                <div className="upload-text">엑셀 파일을 클릭해서 선택하세요</div>
                <div className="upload-sub">"마스터DB" 시트 기준으로 업데이트됩니다</div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{display:'none'}} onChange={e=>e.target.files[0]&&handleFile(e.target.files[0])}/>
              </div>
              <div style={{marginTop:16,fontSize:12,color:'var(--text3)'}}>
                * 기존 기업은 업데이트, 새 기업은 추가됩니다<br/>
                * 재무실적은 SQL Editor에서 별도 업데이트 권장
              </div>
            </>
          )}
          {(status === 'processing' || status === 'done') && (
            <div style={{background:'var(--bg3)',borderRadius:8,padding:16,fontFamily:'MaruBuri,sans-serif',fontSize:12,color:'var(--text2)',lineHeight:2}}>
              {log.map((l,i) => <div key={i}>{l}</div>)}
              {status === 'processing' && <div style={{color:'var(--accent)'}}>처리 중...</div>}
            </div>
          )}
          <div className="modal-footer" style={{marginTop:16}}>
            {status === 'done'
              ? <button className="btn btn-primary" onClick={() => {onDone(); onClose();}}>완료</button>
              : <button className="btn btn-secondary" onClick={onClose}>취소</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
