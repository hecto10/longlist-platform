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

  // 현재 DB에 존재하는 모든 고유 태그 수집 → Set 반환 (업로드 validation용)
  async fetchAllTagsSet() {
    const { data, error } = await supabase
      .from('companies')
      .select('tags')
      .is('deleted_at', null);
    if (error) throw error;
    const tagSet = new Set();
    (data || []).forEach(row => {
      (row.tags || []).forEach(t => {
        const trimmed = t?.trim();
        if (trimmed) tagSet.add(trimmed);
      });
    });
    return tagSet;
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

  // 재무실적 추가 (생성된 row 반환)
  async insertFinancial(payload) {
    const { data, error } = await supabase
      .from('financials')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 기업가치 추가 (생성된 row 반환)
  async insertValuation(payload) {
    const { data, error } = await supabase
      .from('valuations')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
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
    if (!target_id) {
      console.warn('[logDataChange] target_id 없음 — 로그 저장 건너뜀', { target_table, action_type });
      return;
    }
    const { error } = await supabase
      .from('data_change_logs')
      .insert({
        target_table,
        target_id:    String(target_id),
        company_id:   String(company_id),
        action_type,
        old_snapshot: old_snapshot ?? null,
        new_snapshot,
        changed_by:   changed_by  || null,
        reason:       reason      || '변경 이력 기록',
        request_id:   request_id  || null,
      });
    if (error) throw error;
  },

  // ── 임직원 수 이력 ──────────────────────────────────────

  // 기업별 임직원 이력 조회 (soft delete 제외, 날짜 내림차순)
  async fetchEmployeeHistory(companyId) {
    const { data, error } = await supabase
      .from('employee_history')
      .select('*')
      .eq('company_id', String(companyId))
      .is('deleted_at', null)
      .order('as_of_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // 임직원 이력 추가
  async insertEmployeeHistory(payload) {
    const { error } = await supabase
      .from('employee_history')
      .insert(payload);
    if (error) throw error;
  },

  // 임직원 이력 수정
  async updateEmployeeHistory(id, payload) {
    const { error } = await supabase
      .from('employee_history')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  },

  // 임직원 이력 soft delete
  async deleteEmployeeHistory(id) {
    const { error } = await supabase
      .from('employee_history')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // 임직원 수 동기화: employee_history 최신값 → companies.employee_count
  async syncLatestEmployeeCount(companyId) {
    try {
      const { data } = await supabase
        .from('employee_history')
        .select('employee_count')
        .eq('company_id', Number(companyId))
        .is('deleted_at', null)
        .order('as_of_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.employee_count != null) {
        await supabase
          .from('companies')
          .update({ employee_count: data.employee_count })
          .eq('id', Number(companyId));
      }
      // 이력이 없으면 기존값 유지 (업데이트하지 않음)
    } catch(e) {
      console.warn('[syncLatestEmployeeCount] 동기화 실패 (메인 기능에 영향 없음):', e.message);
    }
  },

  // ── 주주 현황 (shareholder_snapshot + shareholders) ──────

  // snapshot 목록 조회 (기준일 드롭다운용)
  async fetchShareholderSnapshots(companyId) {
    const { data, error } = await supabase
      .from('shareholder_snapshot')
      .select('*')
      .eq('company_id', Number(companyId))
      .is('deleted_at', null)
      .order('as_of_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // 기준일로 기존 snapshot 조회 (없으면 null)
  async fetchSnapshotByDate(companyId, asOfDate) {
    const { data, error } = await supabase
      .from('shareholder_snapshot')
      .select('*')
      .eq('company_id', Number(companyId))
      .eq('as_of_date', asOfDate)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  },

  // 특정 snapshot의 주주 목록 조회 (snapshot JOIN으로 orphan 방어)
  async fetchShareholders(companyId) {
    const { data, error } = await supabase
      .from('shareholders')
      .select('*, shareholder_snapshot!inner(id, as_of_date, total_common_shares, total_preferred_shares, deleted_at)')
      .eq('company_id', Number(companyId))
      .is('deleted_at', null)
      .is('shareholder_snapshot.deleted_at', null)
      .order('as_of_date', { ascending: false })
      .order('total_ratio', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return data || [];
  },

  // snapshot + 주주 일괄 저장/추가 (upsert)
  // - 기존 snapshot 있으면 기존 id 사용 (총 발행주식수 변경 없음)
  // - 없으면 신규 snapshot 생성
  // - 중복 shareholder_name 있으면 오류
  async upsertSnapshotWithShareholders(snapshotPayload, shareholderRows) {
    // 1. 기존 snapshot 조회
    let snap = await this.fetchSnapshotByDate(snapshotPayload.company_id, snapshotPayload.as_of_date);

    if (!snap) {
      // 2a. 신규 snapshot 생성
      const { data, error } = await supabase
        .from('shareholder_snapshot')
        .insert(snapshotPayload)
        .select()
        .single();
      if (error) throw error;
      snap = data;
    }
    // 2b. 기존 snapshot 사용 — total_shares 변경 없음

    // 3. 중복 주주명 검사
    const { data: existingNames } = await supabase
      .from('shareholders')
      .select('shareholder_name')
      .eq('snapshot_id', snap.id)
      .is('deleted_at', null);

    const existingSet = new Set((existingNames || []).map(r => r.shareholder_name));
    const dupNames = shareholderRows
      .map(r => r.shareholder_name?.trim())
      .filter(name => name && existingSet.has(name));

    if (dupNames.length > 0) {
      throw new Error(`동일 기준일에 이미 존재하는 주주: "${dupNames.join('", "')}"`);
    }

    if (!shareholderRows.length) return snap;

    // 4. 지분율 계산 후 shareholders INSERT
    const totalCommon    = snap.total_common_shares    || 0;
    const totalPreferred = snap.total_preferred_shares || 0;
    const totalAll       = totalCommon + totalPreferred;

    const rows = shareholderRows.map(r => {
      const cs = Number(r.common_shares)    || 0;
      const ps = Number(r.preferred_shares) || 0;
      const ts = cs + ps;
      const cr = totalCommon    > 0 ? Math.round(cs / totalCommon    * 10000) / 100 : null;
      const pr = totalPreferred > 0 ? Math.round(ps / totalPreferred * 10000) / 100 : null;
      const tr = totalAll       > 0 ? Math.round(ts / totalAll       * 10000) / 100 : null;
      return {
        snapshot_id:                   snap.id,
        company_id:                    snap.company_id,
        as_of_date:                    snap.as_of_date,
        shareholder_name:              r.shareholder_name.trim(),
        shareholder_type:              r.shareholder_type              || null,
        common_shares:                 cs || null,
        preferred_shares:              ps || null,
        total_shares:                  ts || null,
        common_ratio:                  cr,
        preferred_ratio:               pr,
        total_ratio:                   tr,
        relation_to_major_shareholder: r.relation_to_major_shareholder || null,
        note:                          r.note                          || null,
      };
    });

    const { error: rowErr } = await supabase.from('shareholders').insert(rows);
    if (rowErr) throw rowErr;
    return snap;
  },

  // 단일 주주 수정
  async updateShareholder(id, payload, snapshotId) {
    // 지분율 재계산 (snapshot 조회 후)
    if (snapshotId) {
      const { data: snap } = await supabase
        .from('shareholder_snapshot').select('*').eq('id', snapshotId).single();
      if (snap) {
        const cs  = Number(payload.common_shares)    || 0;
        const ps  = Number(payload.preferred_shares) || 0;
        const ts  = cs + ps;
        const tc  = snap.total_common_shares    || 0;
        const tp  = snap.total_preferred_shares || 0;
        const ta  = tc + tp;
        payload.total_shares     = ts || null;
        payload.common_ratio     = tc > 0 ? Math.round(cs / tc * 10000) / 100 : null;
        payload.preferred_ratio  = tp > 0 ? Math.round(ps / tp * 10000) / 100 : null;
        payload.total_ratio      = ta > 0 ? Math.round(ts / ta * 10000) / 100 : null;
      }
    }
    const { error } = await supabase.from('shareholders').update(payload).eq('id', id);
    if (error) throw error;
  },

  // 단일 주주 soft delete
  async deleteShareholder(id) {
    const { error } = await supabase
      .from('shareholders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // snapshot soft delete (연결 주주 cascade soft delete)
  async deleteShareholderSnapshot(snapshotId) {
    const now = new Date().toISOString();
    const { error: rowErr } = await supabase
      .from('shareholders')
      .update({ deleted_at: now })
      .eq('snapshot_id', snapshotId);
    if (rowErr) throw rowErr;
    const { error: snapErr } = await supabase
      .from('shareholder_snapshot')
      .update({ deleted_at: now })
      .eq('id', snapshotId);
    if (snapErr) throw snapErr;
  },

  // ── 이사회/경영진 ───────────────────────────────────────

  async fetchBoardMembers(companyId) {
    const { data, error } = await supabase
      .from('board_members')
      .select('*')
      .eq('company_id', Number(companyId))
      .is('deleted_at', null)
      .order('as_of_date', { ascending: false })
      .order('id',         { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async insertBoardMember(payload) {
    const { error } = await supabase.from('board_members').insert(payload);
    if (error) throw error;
  },

  async updateBoardMember(id, payload) {
    const { error } = await supabase.from('board_members').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteBoardMember(id) {
    const { error } = await supabase
      .from('board_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // 기업가치 bulk insert
  async insertValuationsBulk(rows) {
    const { error } = await supabase.from('valuations').insert(rows);
    if (error) throw error;
  },

  // 보고이력 bulk insert
  async insertReportsBulk(rows) {
    const { error } = await supabase.from('reports').insert(rows);
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
