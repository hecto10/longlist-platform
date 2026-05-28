// ─── REQUEST SERVICE ──────────────────────────────────────
const requestService = {

  // pending 요청 목록 조회 (admin 모달용 — 유형별 필터)
  async fetchPendingByType(type, companyId = null) {
    let query = supabase
      .from('company_requests')
      .select('id, request_type, requester_name, company_name, request_purposes, memo, created_at, payload')
      .eq('request_type', type)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (companyId) query = query.eq('company_id', String(companyId));
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // 요청 등록 (user)
  async insertRequest({ request_type, requester_id, requester_name, company_id, company_name, payload, request_purposes, memo }) {
    const { error } = await supabase
      .from('company_requests')
      .insert({
        request_type,
        requester_id,
        requester_name,
        company_id:       company_id   || null,
        company_name:     company_name || null,
        payload:          payload      || null,
        request_purposes: request_purposes || [],
        memo:             memo         || null,
        status:           'pending',
      });
    if (error) throw error;

    // admin에게 알림
    const typeLabel = { ADD_COMPANY: '기업 추가', UPDATE_FINANCIALS: '재무 업데이트', UPDATE_VALUATION: '기업가치 업데이트' };
    await notificationService.insert({
      recipient_role: 'admin',
      type:      'NEW_REQUEST',
      title:     `새 요청: ${typeLabel[request_type] || request_type}`,
      message:   `${requester_name}${company_name ? ' · ' + company_name : ''}`,
      link_type: 'requests',
    });
  },

  // 본인 요청 목록 조회 (user)
  async fetchMyRequests(requesterId) {
    const { data, error } = await supabase
      .from('company_requests')
      .select('*')
      .eq('requester_id', requesterId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // 전체 요청 목록 조회 (admin)
  async fetchAllRequests() {
    const { data, error } = await supabase
      .from('company_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // 요청 상태 변경 (admin)
  async updateRequestStatus(requestId, status, reviewedBy, reviewNote, resolvedCompanyId = null) {
    // 변경 전 요청 정보 조회 (알림 생성용)
    let requestRow = null;
    if (status === 'done') {
      const { data } = await supabase
        .from('company_requests')
        .select('request_type, requester_id, company_name, resolved_company_id')
        .eq('id', requestId)
        .single();
      requestRow = data;
    }

    const { error } = await supabase
      .from('company_requests')
      .update({
        status,
        reviewed_by:          reviewedBy || null,
        reviewed_at:          new Date().toISOString(),
        review_note:          reviewNote || null,
        resolved_company_id:  resolvedCompanyId,
      })
      .eq('id', requestId);
    if (error) throw error;

    // done 처리 시 requester에게 알림
    if (status === 'done' && requestRow?.requester_id) {
      const typeLabel = { ADD_COMPANY: '기업 등록', UPDATE_FINANCIALS: '재무실적 업데이트', UPDATE_VALUATION: '기업가치 업데이트' };
      const hasCompany = resolvedCompanyId || requestRow.resolved_company_id;
      await notificationService.insert({
        recipient_id: requestRow.requester_id,
        type:      'REQUEST_DONE',
        title:     `요청이 처리 완료됐습니다`,
        message:   `${typeLabel[requestRow.request_type] || '요청'}${requestRow.company_name ? ' · ' + requestRow.company_name : ''}`,
        link_type: hasCompany ? 'company' : null,
        link_id:   hasCompany ? String(hasCompany) : null,
      });
    }
  },
};
