// ─── COMPANY SERVICE ─────────────────────────────────────
// companies 테이블 관련 Supabase 호출을 한 곳에서 관리합니다.

const companyService = {

  // 전체 기업 목록 조회
  async fetchAll() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  // 기업 추가
  async insert(payload) {
    const { error } = await supabase
      .from('companies')
      .insert(payload);
    if (error) throw error;
  },

  // 기업 수정
  async update(id, payload) {
    const { error } = await supabase
      .from('companies')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  },

  // 전체 태그 목록 수집 (TagInput 추천용)
  async fetchAllTags() {
    const { data, error } = await supabase
      .from('companies')
      .select('tags');
    if (error) throw error;
    return [...new Set((data || []).flatMap(c => c.tags || []))].sort();
  },

  // 재무실적 목록 (ListView용 — 전체 기업 최신 실적)
  async fetchFinancials() {
    const { data, error } = await supabase
      .from('financials')
      .select('*')
      .order('fiscal_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // 기업가치 목록 (ListView용 — 전체 기업 최신 기업가치)
  async fetchValuations() {
    const { data, error } = await supabase
      .from('valuations')
      .select('*')
      .order('valuation_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // 특정 기업의 재무실적 이력
  async fetchFinancialsByCompany(companyId) {
    const { data, error } = await supabase
      .from('financials')
      .select('*')
      .eq('company_id', companyId)
      .order('fiscal_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // 특정 기업의 기업가치 이력
  async fetchValuationsByCompany(companyId) {
    const { data, error } = await supabase
      .from('valuations')
      .select('*')
      .eq('company_id', companyId)
      .order('valuation_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // 특정 기업의 보고 이력
  async fetchReportsByCompany(companyId) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('company_id', companyId)
      .order('report_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // 재무실적 추가
  async insertFinancial(payload) {
    const { error } = await supabase
      .from('financials')
      .insert(payload);
    if (error) throw error;
  },

  // 기업가치 추가
  async insertValuation(payload) {
    const { error } = await supabase
      .from('valuations')
      .insert(payload);
    if (error) throw error;
  },

  // 보고 이력 추가
  async insertReport(payload) {
    const { error } = await supabase
      .from('reports')
      .insert(payload);
    if (error) throw error;
  },

  // 엑셀 업로드용 upsert
  async upsertFromExcel(payload) {
    const { error } = await supabase
      .from('companies')
      .upsert(payload, { onConflict: 'name' });
    if (error) throw error;
  },
};

// ── 수정 이력 저장 ────────────────────────────────────────
  // 변경된 필드만 company_change_logs 테이블에 row별로 insert합니다.
  // EditCompanyModal에서 호출합니다.
  //
  // @param {string} companyId  - companies.id (uuid)
  // @param {Array}  changes    - [{ field_name, old_value, new_value }, ...]
  // @param {string} changedBy  - 수정자 이름 (localStorage.userName 또는 'unknown')
  async logChanges(companyId, changes, changedBy = 'unknown') {
    if (!changes || changes.length === 0) return;
    const rows = changes.map(c => ({
      company_id: companyId,
      changed_by: changedBy || 'unknown',
      field_name: c.field_name,
      old_value:  c.old_value  != null ? String(c.old_value)  : null,
      new_value:  c.new_value  != null ? String(c.new_value)  : null,
    }));
    const { error } = await supabase
      .from('company_change_logs')
      .insert(rows);
    // 이력 저장 실패는 메인 저장 흐름을 막지 않도록 throw하지 않고 콘솔에만 기록합니다.
    if (error) console.warn('[companyService.logChanges] 이력 저장 실패:', error.message);
  },

  // ── 관리자 전용 조회 함수 (현재 UI에서는 호출하지 않음) ──────
  // 추후 관리자 모드에서 아래 함수를 사용해 수정 이력을 조회하세요.

  // 특정 기업의 전체 수정 이력 조회 (최신순)
  // async fetchChangeLogsByCompany(companyId) {
  //   const { data, error } = await supabase
  //     .from('company_change_logs')
  //     .select('*')
  //     .eq('company_id', companyId)
  //     .order('changed_at', { ascending: false });
  //   if (error) throw error;
  //   return data || [];
  // },

  // 전체 수정 이력 조회 (최신 N건, 관리자 대시보드용)
  // async fetchRecentChangeLogs(limit = 50) {
  //   const { data, error } = await supabase
  //     .from('company_change_logs')
  //     .select('*, companies(name)')
  //     .order('changed_at', { ascending: false })
  //     .limit(limit);
  //   if (error) throw error;
  //   return data || [];
  // },

  // 특정 수정자의 이력 조회
  // async fetchChangeLogsByUser(changedBy) {
  //   const { data, error } = await supabase
  //     .from('company_change_logs')
  //     .select('*, companies(name)')
  //     .eq('changed_by', changedBy)
  //     .order('changed_at', { ascending: false });
  //   if (error) throw error;
  //   return data || [];
  // },