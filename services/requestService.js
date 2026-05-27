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
  },
};
