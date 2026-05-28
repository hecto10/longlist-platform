// ─── UPLOAD SERVICE ───────────────────────────────────────
const uploadService = {

  // 엑셀 파일 → JSON rows
  parseExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          if (raw.length < 2) { resolve([]); return; }
          const headers = raw[0].map(h => String(h).trim());
          const rows = raw.slice(1)
            .filter(r => r.some(c => c !== ''))
            .map((r, i) => {
              const obj = {};
              headers.forEach((h, j) => { obj[h] = r[j] !== undefined ? String(r[j]).trim() : ''; });
              obj._rowIndex = i + 2; // 엑셀 행 번호 (1-indexed + 헤더)
              return obj;
            });
          resolve(rows);
        } catch(e) { reject(e); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  // 회사명 → id 매핑 맵 생성
  buildNameMap(companies) {
    const map = {};
    (companies || []).forEach(c => { map[c.name.trim()] = c.id; });
    return map;
  },

  // 날짜 형식 검증
  isValidDate(v) {
    if (!v) return false;
    // YYYY-MM-DD or YYYY/MM/DD or Date object
    const d = new Date(v);
    return !isNaN(d.getTime());
  },

  // 날짜 → YYYY-MM-DD 변환
  toDateString(v) {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  },

  // 숫자 검증
  isValidNumber(v) {
    if (v === '' || v == null) return true; // optional
    return !isNaN(Number(v));
  },

  // URL 검증 (optional)
  isValidUrl(v) {
    if (!v) return true;
    return /^https?:\/\/.+/.test(v);
  },

  // 템플릿 다운로드
  downloadTemplate(filename, headers, exampleRow) {
    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    // 헤더 스타일 (열 너비)
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename);
  },

  // 기업 개요 검증
  validateCompanyRows(rows, nameMap) {
    const LISTING_STATUS = ['비상장 (외감X)', '비상장 (외감)', '코스피', '코스닥', ''];
    const MA_STATUS = ['X', '진행중', '보류(내부판단)', '보류(2순위)', '종결(내부판단)', '종결(상대거절)', ''];
    const existingNames = new Set(Object.keys(nameMap));
    const uploadNames = new Set();

    return rows.map(row => {
      const errors = [];
      const name = row['name']?.trim();

      if (!name) errors.push('회사명 필수');
      else {
        if (existingNames.has(name)) errors.push(`중복: "${name}" 이미 등록된 회사`);
        if (uploadNames.has(name))   errors.push(`중복: 업로드 파일 내 동일 회사명`);
        else uploadNames.add(name);
      }
      if (row['founded_date'] && !this.isValidDate(row['founded_date'])) errors.push('설립일 날짜 형식 오류');
      if (!this.isValidNumber(row['employee_count'])) errors.push('임직원 수 숫자 형식 오류');
      if (row['listing_status'] && !LISTING_STATUS.includes(row['listing_status'])) errors.push(`상장여부 허용값: ${LISTING_STATUS.filter(Boolean).join('/')}`);
      if (row['ma_status'] && !MA_STATUS.includes(row['ma_status'])) errors.push(`M&A현황 허용값: ${MA_STATUS.filter(Boolean).join('/')}`);

      return { ...row, _errors: errors, _status: errors.length ? 'error' : 'valid' };
    });
  },

  // 재무이력 검증
  validateFinancialRows(rows, nameMap, existingFinancials) {
    const PERIOD_TYPES = ['연간', '1Q', '2Q', '3Q'];
    // 기존 중복 키 세트
    const existingKeys = new Set(
      (existingFinancials || []).map(f => `${f.company_id}__${f.fiscal_date}__${f.period_type}`)
    );
    const uploadKeys = new Set();

    return rows.map(row => {
      const errors = [];
      const companyName = row['company_name']?.trim();
      const companyId   = companyName ? nameMap[companyName] : null;

      if (!companyName) errors.push('company_name 필수');
      else if (!companyId) errors.push(`"${companyName}" 등록되지 않은 회사`);

      if (!row['period_type']) errors.push('period_type 필수');
      else if (!PERIOD_TYPES.includes(row['period_type'])) errors.push(`period_type 허용값: ${PERIOD_TYPES.join('/')}`);

      if (!row['fiscal_date']) errors.push('fiscal_date 필수');
      else if (!this.isValidDate(row['fiscal_date'])) errors.push('fiscal_date 날짜 형식 오류');

      if (!this.isValidNumber(row['revenue']))           errors.push('revenue 숫자 형식 오류');
      if (!this.isValidNumber(row['operating_profit']))  errors.push('operating_profit 숫자 형식 오류');
      if (!this.isValidNumber(row['total_assets']))      errors.push('total_assets 숫자 형식 오류');
      if (!this.isValidNumber(row['net_assets']))        errors.push('net_assets 숫자 형식 오류');
      if (!this.isValidUrl(row['source_link']))          errors.push('source_link URL 형식 오류');

      // 중복 검사 (오류 없는 경우에만)
      if (companyId && row['fiscal_date'] && row['period_type']) {
        const dateStr = this.toDateString(row['fiscal_date']);
        const key = `${companyId}__${dateStr}__${row['period_type']}`;
        if (existingKeys.has(key)) errors.push('중복: 동일 기간 데이터 이미 존재');
        else if (uploadKeys.has(key)) errors.push('중복: 업로드 파일 내 동일 항목');
        else uploadKeys.add(key);
      }

      return { ...row, _companyId: companyId, _errors: errors, _status: errors.length ? 'error' : 'valid' };
    });
  },

  // 기업 개요 → companies insert
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

  // 재무이력 → financials insert
  async saveFinancialRows(validRows) {
    const payload = validRows.map(row => ({
      company_id:       row._companyId,
      period_type:      row['period_type'],
      fiscal_date:      this.toDateString(row['fiscal_date']),
      revenue:          row['revenue']          !== '' ? Number(row['revenue'])          : null,
      operating_profit: row['operating_profit'] !== '' ? Number(row['operating_profit']) : null,
      total_assets:     row['total_assets']     !== '' ? Number(row['total_assets'])     : null,
      net_assets:       row['net_assets']       !== '' ? Number(row['net_assets'])       : null,
      source:           row['source']           || null,
      source_link:      row['source_link']      || null,
      memo:             row['memo']             || null,
    }));
    const { error } = await supabase.from('financials').insert(payload);
    if (error) throw error;
    return payload.length;
  },
};
