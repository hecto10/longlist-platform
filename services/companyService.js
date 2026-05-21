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

  // 재무실적 수정
  async updateFinancial(id, payload) {
    const { error } = await supabase
      .from('financials')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  },

  // 기업가치 수정
  async updateValuation(id, payload) {
    const { error } = await supabase
      .from('valuations')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  },

  // 보고 이력 수정
  async updateReport(id, payload) {
    const { error } = await supabase
      .from('reports')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
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
