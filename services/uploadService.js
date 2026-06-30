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
          // cellDates 옵션 사용하지 않음: SheetJS의 시리얼→Date 변환 과정에서
          // 타임존 의존적 오차(23:59:08 등)로 날짜가 하루 밀리는 알려진 문제가 있음.
          // 대신 raw 시리얼 번호(정수)를 그대로 받아서 직접 YYYY-MM-DD로 변환한다.
          const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: false });
          const ws = wb.Sheets[wb.SheetNames[0]];
          // range: 3 → 0-indexed 3번째 행(4행)부터 읽음. 헤더는 0행 기준
          const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', range: 0 });
          if (raw.length < 4) { resolve([]); return; }
          const headers = raw[0].map(h => String(h).trim());
          // 2행(index 1) = 안내문, 3행(index 2) = 예시 → 스킵
          const dataRows = raw.slice(3).filter(r => r.some(c => c !== ''));
          const rows = dataRows.map((r, i) => {
            const obj = {};
            headers.forEach((h, j) => {
              const cell = r[j];
              if (cell === undefined || cell === '') {
                obj[h] = '';
              } else if (typeof cell === 'number') {
                // 날짜 컬럼이면 엑셀 시리얼 숫자를 그대로 보존(toDateString이 처리)
                // 숫자 컬럼(매출 등)도 동일하게 숫자 그대로 보존
                obj[h] = cell;
              } else {
                obj[h] = String(cell).trim();
              }
            });
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
    return this.toDateString(v) !== null;
  },

  // 엑셀 시리얼 번호(정수) → YYYY-MM-DD 문자열
  // Date 객체나 toISOString을 전혀 사용하지 않는 순수 정수 산술 변환.
  // 엑셀 날짜 시스템: serial 1 = 1900-01-01, 단 1900년을 윤년으로 잘못 취급하는
  // 레거시 버그가 있어 1900-03-01 이후는 +1 보정이 필요(업계 표준 처리 방식).
  excelSerialToDateString(serial) {
    const s = Math.round(serial); // 정수가 아니면 반올림 (소수부는 시각이므로 날짜에는 영향 없음)

    // 1899-12-30을 day 0으로 삼는 그레고리력 계산 (순수 정수 연산, 타임존/Date 객체 미사용)
    // 1899-12-31 = 1, 1900-01-01 = 2, ... (엑셀의 1900-02-29 존재 버그 반영)
    let days = s;
    // 1900-02-29(존재하지 않는 날짜, 시리얼 60)를 보정: 60 이상이면 실제로는 하루 적은 날짜
    if (days >= 60) days -= 1;

    // 1899-12-31을 기준(day=0)으로 순수 정수 그레고리력 변환
    // (Julian Day Number 알고리즘 — Date 객체 전혀 사용하지 않음)
    let jdn = days + 2415020; // 검증된 보정 상수 (직접 테스트로 확인: serial 1 → 1900-01-01)

    const a = jdn + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor((146097 * b) / 4);
    const d = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor((1461 * d) / 4);
    const m = Math.floor((5 * e + 2) / 153);

    const day   = e - Math.floor((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * Math.floor(m / 10);
    const year  = 100 * b + d - 4800 + Math.floor(m / 10);

    return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  },

  // YYYY-MM-DD 문자열만 반환. Date 객체/toISOString을 사용하지 않음
  toDateString(v) {
    if (!v && v !== 0) return null;

    // 1) 'YYYY-MM-DD' 또는 'YYYY-MM-DDTHH:mm:ss' 형태의 문자열 → 앞 10자리 직접 파싱
    if (typeof v === 'string') {
      const m = v.trim().match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
      if (m) {
        const [, y, mo, d] = m;
        return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      }
      return null;
    }

    // 2) 엑셀 시리얼 번호(숫자) — 순수 정수 산술로 변환 (Date 객체 미사용)
    if (typeof v === 'number' && !isNaN(v)) {
      try {
        return this.excelSerialToDateString(v);
      } catch {
        return null;
      }
    }

    return null;
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

  // 태그 정규화: 쉼표 분리 → trim → 빈값 제거 → 중복 제거
  normalizeTags(raw) {
    if (!raw) return [];
    return [...new Set(
      String(raw).split(',').map(t => t.trim()).filter(Boolean)
    )];
  },

  // ── 기업 개요 검증 ────────────────────────────────────
  validateCompanyRows(rows, nameMap, knownTags) {
    // knownTags: Set<string> (DB 실제 태그) 또는 undefined (fallback: UPLOAD_ENUMS.tags)
    const knownTagSet = knownTags instanceof Set
      ? knownTags
      : new Set(UPLOAD_ENUMS.tags);
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

      const foundedDateStr = row['founded_date'] ? this.toDateString(row['founded_date']) : '';
      if (row['founded_date'] && !foundedDateStr)
        errors.push('설립일: YYYY-MM-DD 형식으로 입력해주세요');

      if (row['employee_count'] !== '' && !this.isValidNumber(row['employee_count']))
        errors.push('임직원 수: 숫자만 입력해주세요');

      if (row['listing_status'] && !UPLOAD_ENUMS.listing_status.includes(row['listing_status']))
        errors.push(`listing_status 허용값 오류 (${UPLOAD_ENUMS.listing_status.join(' / ')})`);

      if (row['ma_status'] && !UPLOAD_ENUMS.ma_status.includes(row['ma_status']))
        errors.push(`ma_status 허용값 오류 (${UPLOAD_ENUMS.ma_status.join(' / ')})`);

      if (row['industry'] && !UPLOAD_ENUMS.industry.includes(row['industry']))
        warnings.push(`industry: "${row['industry']}" 표준 목록에 없는 산업명 (참고 시트 확인)`);

      // 태그 정규화 + 미등록 태그 경고
      if (row['tags']) {
        const tagList = this.normalizeTags(row['tags']);
        const newTags = tagList.filter(t => !knownTagSet.has(t));
        if (newTags.length) warnings.push(`신규 태그: "${newTags.join('", "')}" (저장은 가능합니다)`);
      }

      return { ...row, founded_date: foundedDateStr || row['founded_date'], _errors: errors, _warnings: warnings, _status: errors.length ? 'error' : 'valid' };
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

      // fiscal_date: 원본이 Date 객체든 문자열이든 YYYY-MM-DD 문자열로 정규화
      const fiscalDateStr = this.toDateString(row['fiscal_date']);

      if (!row['fiscal_date']) errors.push('fiscal_date 필수');
      else if (!fiscalDateStr)
        errors.push('fiscal_date: YYYY-MM-DD 형식으로 입력해주세요');

      ['revenue', 'operating_profit', 'total_assets', 'net_assets'].forEach(col => {
        if (row[col] !== '' && !this.isValidNumber(row[col]))
          errors.push(`${col}: 숫자만 입력 (쉼표 제외)`);
      });

      if (!this.isValidUrl(row['source_link']))
        errors.push('source_link: https:// 로 시작하는 URL 형식 필요');

      // 중복 검사
      if (companyId && fiscalDateStr && row['period_type'] && !errors.length) {
        const key = `${companyId}__${fiscalDateStr}__${row['period_type']}`;
        if (existingKeys.has(key)) errors.push('중복: 동일 기간 데이터 이미 존재');
        else if (uploadKeys.has(key)) errors.push('중복: 파일 내 동일 항목');
        else uploadKeys.add(key);
      }

      // 반환 row의 fiscal_date를 정규화된 문자열로 덮어씀 (Preview/저장 모두 이 값 사용)
      return {
        ...row,
        fiscal_date: fiscalDateStr,
        _companyId: companyId, _errors: errors, _warnings: warnings,
        _status: errors.length ? 'error' : 'valid',
      };
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
      tags:             this.normalizeTags(row['tags']),
      ma_status:        row['ma_status']        || 'X',
      inbound_outbound: row['inbound_outbound'] || null,
    }));
    const { error } = await supabase.from('companies').insert(payload);
    if (error) throw error;
    return payload.length;
  },

  async saveFinancialRows(validRows) {
    const payload = validRows.map(row => {
      return {
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
      };
    });
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
