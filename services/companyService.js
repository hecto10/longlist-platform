// ─── COMPANY SERVICE ─────────────────────────────────────
// companies 테이블 관련 Supabase 호출을 한 곳에서 관리합니다.

const companyService = {

  // 전체 기업 목록 조회 (soft delete 제외)
  async fetchAll() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  // 기업 soft delete
  async softDelete(id, deletedBy, reason) {
    const { data: company, error: fetchError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    // deletion_logs에 snapshot 저장
    const logId = crypto.randomUUID();
    const { error: logError } = await supabase
      .from('deletion_logs')
      .insert({
        id:         logId,
        table_name: 'companies',
        record_id:  String(id),
        company_id: String(id),
        reason,
        snapshot:   company,
        status:     'pending',
      });
    if (logError) throw logError;

    // soft delete 실행
    const { error } = await supabase
      .from('companies')
      .update({
        deleted_at:    new Date().toISOString(),
        deleted_by:    deletedBy,
        delete_reason: reason,
      })
      .eq('id', id);
    if (error) throw error;

    // 로그 status → success
    await supabase
      .from('deletion_logs')
      .update({ status: 'success' })
      .eq('id', logId);
  },

  // 기업 추가
  async insert(payload) {
    const { error } = await supabase
      .from('companies')
      .insert(payload);
    if (error) throw error;
  },

  // 기업 추가 (생성된 row 반환 — 요청 연결용)
  async insertWithReturn(payload) {
    const { data, error } = await supabase
      .from('companies')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
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

  // 삭제 로그 저장 (pending 상태로 먼저 insert, log id 클라이언트 생성)
  async insertDeletionLog({ table_name, record_id, company_id, reason, snapshot }) {
    const logId = crypto.randomUUID();
    const { error } = await supabase
      .from('deletion_logs')
      .insert({ id: logId, table_name, record_id, company_id, reason, snapshot, status: 'pending' });
    if (error) throw error;
    return logId;
  },

  // 삭제 로그 상태 업데이트
  async updateDeletionLog(logId, status, error_message = null) {
    const { error } = await supabase
      .from('deletion_logs')
      .update({ status, error_message })
      .eq('id', logId);
    if (error) throw error;
  },

  // 재무실적 삭제 (로그 pending → delete → success/fail)
  async deleteFinancial(record, reason) {
    const logId = await this.insertDeletionLog({
      table_name: 'financials',
      record_id: String(record.id),
      company_id: String(record.company_id),
      reason,
      snapshot: record,
    });
    try {
      const { error } = await supabase
        .from('financials')
        .delete()
        .eq('id', record.id);
      if (error) throw error;
      await this.updateDeletionLog(logId, 'success');
    } catch(e) {
      await this.updateDeletionLog(logId, 'fail', e.message);
      throw e;
    }
  },

  // 기업가치 삭제 (로그 pending → delete → success/fail)
  async deleteValuation(record, reason) {
    const logId = await this.insertDeletionLog({
      table_name: 'valuations',
      record_id: String(record.id),
      company_id: String(record.company_id),
      reason,
      snapshot: record,
    });
    try {
      const { error } = await supabase
        .from('valuations')
        .delete()
        .eq('id', record.id);
      if (error) throw error;
      await this.updateDeletionLog(logId, 'success');
    } catch(e) {
      await this.updateDeletionLog(logId, 'fail', e.message);
      throw e;
    }
  },

  // 보고 이력 삭제 (로그 pending → delete → success/fail)
  async deleteReport(record, reason) {
    const logId = await this.insertDeletionLog({
      table_name: 'reports',
      record_id: String(record.id),
      company_id: String(record.company_id),
      reason,
      snapshot: record,
    });
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', record.id);
      if (error) throw error;
      await this.updateDeletionLog(logId, 'success');
    } catch(e) {
      await this.updateDeletionLog(logId, 'fail', e.message);
      throw e;
    }
  },

  // 기업 정보 변경 이력 저장
  async logChanges(companyId, changes, changedBy) {
    const rows = changes.map(({ field_name, old_value, new_value }) => ({
      company_id: String(companyId),
      field_name,
      old_value:  old_value ?? null,
      new_value:  new_value ?? null,
      changed_by: changedBy || 'unknown',
    }));
    const { error } = await supabase
      .from('company_change_logs')
      .insert(rows);
    if (error) throw error;
  },

  // 재무/기업가치/보고이력 변경 이력 저장 (INSERT / UPDATE)
  async logDataChange({ target_table, target_id, company_id, action_type = 'UPDATE', old_snapshot, new_snapshot, changed_by, reason, request_id }) {
    const { error } = await supabase
      .from('data_change_logs')
      .insert({
        target_table,
        target_id:   target_id != null ? String(target_id) : null,
        company_id:  String(company_id),
        action_type,
        old_snapshot: old_snapshot ?? null,
        new_snapshot,
        changed_by:  changed_by   || null,
        reason:      reason       || null,
        request_id:  request_id   || null,
      });
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
