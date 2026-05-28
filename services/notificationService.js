// ─── NOTIFICATION SERVICE ─────────────────────────────────
const notificationService = {

  // 알림 목록 조회 (본인 + role 기반)
  async fetchForUser(userId, role) {
    const queries = [
      supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(30),
    ];
    if (role === 'admin') {
      queries.push(
        supabase
          .from('notifications')
          .select('*')
          .eq('recipient_role', 'admin')
          .order('created_at', { ascending: false })
          .limit(30)
      );
    }
    const results = await Promise.all(queries);
    const all = results.flatMap(r => r.data || []);
    // 중복 제거 + 최신순 정렬
    const seen = new Set();
    return all
      .filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 30);
  },

  // unread count
  async fetchUnreadCount(userId, role) {
    const queries = [
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false),
    ];
    if (role === 'admin') {
      queries.push(
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_role', 'admin')
          .eq('is_read', false)
      );
    }
    const results = await Promise.all(queries);
    return results.reduce((sum, r) => sum + (r.count || 0), 0);
  },

  // 읽음 처리 (단일)
  async markRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  // 모두 읽음 (본인 것 + role 것)
  async markAllRead(userId, role) {
    const updates = [
      supabase.from('notifications').update({ is_read: true })
        .eq('recipient_id', userId).eq('is_read', false),
    ];
    if (role === 'admin') {
      updates.push(
        supabase.from('notifications').update({ is_read: true })
          .eq('recipient_role', 'admin').eq('is_read', false)
      );
    }
    await Promise.all(updates);
  },

  // 알림 생성 (내부용)
  async insert({ recipient_id, recipient_role, type, title, message, link_type, link_id }) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_id:   recipient_id   || null,
        recipient_role: recipient_role || null,
        type, title,
        message:   message   || null,
        link_type: link_type || null,
        link_id:   link_id   || null,
        is_read:   false,
      });
    if (error) console.warn('[notificationService] insert 실패:', error.message);
    // 알림 실패가 메인 기능을 막으면 안 되므로 throw 하지 않음
  },
};
