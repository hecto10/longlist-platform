// ─── DASHBOARD SERVICE ────────────────────────────────────
const dashboardService = {

  async fetchKPI() {
    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().slice(0, 10);

    const [
      { count: totalCompanies },
      { count: recentCompanies },
      { count: totalActiveUsers },
      { count: pendingRequests },
      { count: todayDone },
    ] = await Promise.all([
      supabase.from('companies').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('companies').select('*', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', sevenDaysAgo),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('company_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('company_requests').select('*', { count: 'exact', head: true }).eq('status', 'done').gte('reviewed_at', today),
    ]);

    return {
      totalCompanies:  totalCompanies  || 0,
      recentCompanies: recentCompanies || 0,
      totalActiveUsers: totalActiveUsers || 0,
      pendingRequests: pendingRequests || 0,
      todayDone:       todayDone       || 0,
    };
  },

  async fetchPendingRequests() {
    const { data, error } = await supabase
      .from('company_requests')
      .select('id, request_type, company_name, requester_name, request_purposes, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(8);
    if (error) throw error;
    return data || [];
  },

  async fetchRequestTypeCounts() {
    const { data, error } = await supabase
      .from('company_requests')
      .select('request_type');
    if (error) throw error;
    const counts = { ADD_COMPANY: 0, UPDATE_FINANCIALS: 0, UPDATE_VALUATION: 0 };
    (data || []).forEach(r => { if (counts[r.request_type] !== undefined) counts[r.request_type]++; });
    return counts;
  },

  async fetchRecentChangeLogs() {
    const { data, error } = await supabase
      .from('data_change_logs')
      .select('id, target_table, company_id, changed_by, created_at, action_type')
      .order('created_at', { ascending: false })
      .limit(6);
    if (error) throw error;
    // company_id로 회사명 매핑
    const companyIds = [...new Set((data||[]).map(d => d.company_id).filter(Boolean))];
    let nameMap = {};
    if (companyIds.length > 0) {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);
      (companies||[]).forEach(c => { nameMap[String(c.id)] = c.name; });
    }
    return (data||[]).map(d => ({ ...d, company_name: nameMap[String(d.company_id)] || '—' }));
  },

  async fetchRecentCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, created_at, industry')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) throw error;
    return data || [];
  },

  async fetchRecentDoneRequests() {
    const { data, error } = await supabase
      .from('company_requests')
      .select('id, request_type, company_name, reviewed_at')
      .eq('status', 'done')
      .not('reviewed_at', 'is', null)
      .order('reviewed_at', { ascending: false })
      .limit(5);
    if (error) throw error;
    return data || [];
  },
};
