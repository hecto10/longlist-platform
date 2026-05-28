// ─── UPLOAD SERVICE ───────────────────────────────────────

// ── 표준 허용값 ──────────────────────────────────────────
const UPLOAD_ENUMS = {
  listing_status: ['코스피', '코스닥', '비상장 (외감)', '비상장 (외감X)'],
  ma_status: ['X', '진행중', '보류 (내부판단)', '보류 (2순위)', '종결 (내부판단)', '종결 (상대거절)'],
  period_type: ['연간', '1Q', '2Q', '3Q'],
  industry: [
    '소프트웨어 개발', '투자매매업', '전자상거래업', '화장품 제조업',
    '의료기기 제조업', '유선 방송업', '기타 금융 지원', '상품도매업',
    '제조업', '플랫폼', '콘텐츠', 'AI/데이터',
  ],
  tags: [
    '뷰티', '핀테크', 'AI', '보안', '플랫폼', '콘텐츠', '헬스케어',
    '의료기기', '전자상거래', 'SaaS', '데이터', '광고', '모빌리티',
  ],
};

const uploadService = {

  // 엑셀 파일 → JSON rows (4행부터 — 1헤더 + 2안내 + 3예시 스킵)
  parseExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          // range: 3 → 0-indexed 3번째 행(4행)부터 읽음. 헤더는 0행 기준
          const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', range: 0 });
          if (raw.length < 4) { resolve([]); return; }
          const headers = raw[0].map(h => String(h).trim());
          // 2행(index 1) = 안내문, 3행(index 2) = 예시 → 스킵
          const dataRows = raw.slice(3).filter(r => r.some(c => c !== ''));
          const rows = dataRows.map((r, i) => {
            const obj = {};
            headers.forEach((h, j) => { obj[h] = r[j] !== undefined ? String(r[j]).trim() : ''; });
            obj._rowIndex = i + 4; // 엑셀 행 번호 (4행부터)
            return obj;
          });
          resolve(rows);
        } catch(e) { reject(e); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  buildNameMap(companies) {
    const map = {};
    (companies || []).forEach(c => { map[c.name.trim()] = c.id; });
    return map;
  },

  isValidDate(v) {
    if (!v) return false;
    return !isNaN(new Date(v).getTime());
  },

  toDateString(v) {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  },

  isValidNumber(v) {
    if (v === '' || v == null) return true;
    // 쉼표 제거 후 검증 (쉼표 포함 숫자 허용)
    return !isNaN(Number(String(v).replace(/,/g, '')));
  },

  toNumber(v) {
    if (v === '' || v == null) return null;
    const n = Number(String(v).replace(/,/g, ''));
    return isNaN(n) ? null : n;
  },

  isValidUrl(v) {
    if (!v) return true;
    return /^https?:\/\/.+/.test(v);
  },

  // 템플릿 다운로드 (1행=헤더, 2행=안내, 3행=예시)
  downloadTemplate(filename, headers, guideRow, exampleRow, extraSheets) {
    const ws = XLSX.utils.aoa_to_sheet([headers, guideRow, exampleRow]);
    ws['!cols'] = headers.map(() => ({ wch: 22 }));

    // 헤더 행 스타일 (배경색 표현은 xlsx 무료 버전 미지원, 너비만)
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '업로드_데이터');

    // 추가 시트 (허용값 안내)
    if (extraSheets) {
      extraSheets.forEach(({ name, data }) => {
        const refWs = XLSX.utils.aoa_to_sheet(data);
        refWs['!cols'] = [{ wch: 28 }];
        XLSX.utils.book_append_sheet(wb, refWs, name);
      });
    }
    XLSX.writeFile(wb, filename);
  },

  // ── 기업 개요 검증 ────────────────────────────────────
  validateCompanyRows(rows, nameMap) {
    const existingNames = new Set(Object.keys(nameMap));
    const uploadNames   = new Set();

    return rows.map(row => {
      const errors   = [];
      const warnings = [];
      const name = row['name']?.trim();

      // 필수 검증
      if (!name) {
        errors.push('회사명 필수');
      } else {
        if (existingNames.has(name)) errors.push(`중복: "${name}" 이미 등록된 회사`);
        else if (uploadNames.has(name)) errors.push('중복: 파일 내 동일 회사명');
        else uploadNames.add(name);
      }

      if (row['founded_date'] && !this.isValidDate(row['founded_date']))
        errors.push('설립일: YYYY-MM-DD 형식으로 입력해주세요');

      if (row['employee_count'] !== '' && !this.isValidNumber(row['employee_count']))
        errors.push('임직원 수: 숫자만 입력해주세요');

      if (row['listing_status'] && !UPLOAD_ENUMS.listing_status.includes(row['listing_status']))
        errors.push(`listing_status 허용값 오류 (${UPLOAD_ENUMS.listing_status.join(' / ')})`);

      if (row['ma_status'] && !UPLOAD_ENUMS.ma_status.includes(row['ma_status']))
        errors.push(`ma_status 허용값 오류 (${UPLOAD_ENUMS.ma_status.join(' / ')})`);

      if (row['industry'] && !UPLOAD_ENUMS.industry.includes(row['industry']))
        warnings.push(`industry: "${row['industry']}" 표준 목록에 없는 산업명 (참고 시트 확인)`);

      // 태그 경고 (차단하지 않음)
      if (row['tags']) {
        const tagList = row['tags'].split(',').map(t => t.trim()).filter(Boolean);
        const unknown = tagList.filter(t => !UPLOAD_ENUMS.tags.includes(t));
        if (unknown.length) warnings.push(`태그 경고: "${unknown.join(', ')}" 표준 목록에 없는 태그`);
      }

      return { ...row, _errors: errors, _warnings: warnings, _status: errors.length ? 'error' : 'valid' };
    });
  },

  // ── 재무이력 검증 ─────────────────────────────────────
  validateFinancialRows(rows, nameMap, existingFinancials) {
    const existingKeys = new Set(
      (existingFinancials || []).map(f => `${f.company_id}__${f.fiscal_date}__${f.period_type}`)
    );
    const uploadKeys = new Set();

    return rows.map(row => {
      const errors   = [];
      const warnings = [];
      const companyName = row['company_name']?.trim();
      const companyId   = companyName ? nameMap[companyName] : null;

      if (!companyName) errors.push('company_name 필수');
      else if (!companyId) errors.push(`"${companyName}" 등록되지 않은 회사명 (회사명 정확히 일치 필요)`);

      if (!row['period_type']) errors.push('period_type 필수');
      else if (!UPLOAD_ENUMS.period_type.includes(row['period_type']))
        errors.push(`period_type 허용값 오류 (연간 / 1Q / 2Q / 3Q)`);

      if (!row['fiscal_date']) errors.push('fiscal_date 필수');
      else if (!this.isValidDate(row['fiscal_date']))
        errors.push('fiscal_date: YYYY-MM-DD 형식으로 입력해주세요');

      ['revenue', 'operating_profit', 'total_assets', 'net_assets'].forEach(col => {
        if (row[col] !== '' && !this.isValidNumber(row[col]))
          errors.push(`${col}: 숫자만 입력 (쉼표 제외)`);
      });

      if (!this.isValidUrl(row['source_link']))
        errors.push('source_link: https:// 로 시작하는 URL 형식 필요');

      // 중복 검사
      if (companyId && row['fiscal_date'] && row['period_type'] && !errors.length) {
        const dateStr = this.toDateString(row['fiscal_date']);
        const key = `${companyId}__${dateStr}__${row['period_type']}`;
        if (existingKeys.has(key)) errors.push('중복: 동일 기간 데이터 이미 존재');
        else if (uploadKeys.has(key)) errors.push('중복: 파일 내 동일 항목');
        else uploadKeys.add(key);
      }

      return { ...row, _companyId: companyId, _errors: errors, _warnings: warnings, _status: errors.length ? 'error' : 'valid' };
    });
  },

  // ── 저장 ─────────────────────────────────────────────
  async saveCompanyRows(validRows) {
    const payload = validRows.map(row => ({
      name:             row['name'].trim(),
      founded_date:     this.toDateString(row['founded_date']) || null,
      location:         row['location']         || null,
      ceo:              row['ceo']              || null,
      employee_count:   row['employee_count']   || null,
      listing_status:   row['listing_status']   || null,
      industry:         row['industry']         || null,
      tags:             row['tags'] ? row['tags'].split(',').map(t => t.trim()).filter(Boolean) : [],
      ma_status:        row['ma_status']        || 'X',
      inbound_outbound: row['inbound_outbound'] || null,
    }));
    const { error } = await supabase.from('companies').insert(payload);
    if (error) throw error;
    return payload.length;
  },

  async saveFinancialRows(validRows) {
    const payload = validRows.map(row => ({
      company_id:       row._companyId,
      period_type:      row['period_type'],
      fiscal_date:      this.toDateString(row['fiscal_date']),
      revenue:          this.toNumber(row['revenue']),
      operating_profit: this.toNumber(row['operating_profit']),
      total_assets:     this.toNumber(row['total_assets']),
      net_assets:       this.toNumber(row['net_assets']),
      source:           row['source']      || null,
      source_link:      row['source_link'] || null,
      memo:             row['memo']        || null,
    }));
    const { error } = await supabase.from('financials').insert(payload);
    if (error) throw error;
    return payload.length;
  },

  // 허용값 참고 시트 데이터
  getRefSheets() {
    return [
      {
        name: '허용값_참고',
        data: [
          ['항목', '허용값'],
          ['listing_status', UPLOAD_ENUMS.listing_status.join(' / ')],
          ['ma_status', UPLOAD_ENUMS.ma_status.join(' / ')],
          ['period_type', UPLOAD_ENUMS.period_type.join(' / ')],
          [],
          ['표준 산업 목록', ''],
          ...UPLOAD_ENUMS.industry.map(v => [v, '']),
          [],
          ['표준 태그 목록', ''],
          ...UPLOAD_ENUMS.tags.map(v => [v, '']),
        ],
      },
    ];
  },
};
