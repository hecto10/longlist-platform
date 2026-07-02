// ─── AUTH SERVICE ─────────────────────────────────────────
const authService = {

  // 현재 세션 확인
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Magic Link 발송
  async signInWithMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  },

  // 로그아웃
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // 현재 유저의 profile 조회
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, status')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // profile이 없으면 신규 생성 (최초 로그인 시)
  // allowed_emails에 이메일이 있으면 active, 없으면 pending으로 생성
  async ensureProfile(userId, email) {
    // 이미 profile이 있으면 그대로 반환
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, name, role, status')
      .eq('id', userId)
      .maybeSingle();
    if (existing) return existing;

    // allowed_emails에서 본인 이메일 확인 (RLS: 본인 이메일만 조회 가능)
    const normalizedEmail = (email || '').toLowerCase().trim();

    console.log('[ensureProfile] 전달된 email 원본:', JSON.stringify(email));
    console.log('[ensureProfile] normalized email:', JSON.stringify(normalizedEmail));

    let allowed = null;
    try {
      const { data, error } = await supabase
        .from('allowed_emails')
        .select('id, initial_role')
        .eq('email', normalizedEmail)
        .maybeSingle();

      console.log('[ensureProfile] allowed_emails 조회 결과:', JSON.stringify({ data, error }));
      allowed = data;
    } catch(e) {
      console.warn('[ensureProfile] allowed_emails 조회 실패 (catch):', e.message);
    }

    const status = allowed ? 'active'           : 'pending';
    const role   = allowed ? (allowed.initial_role || 'user') : 'user';
    const name   = (email || '').split('@')[0] || 'user';
    console.log('[ensureProfile] status:', status, '| role:', role);

    const { data: newProfile, error: insertErr } = await supabase
      .from('profiles')
      .insert({ id: userId, name, role, status })
      .select()
      .single();
    if (insertErr) throw insertErr;

    // pending인 경우 admin에게 알림 생성
    // notificationService 로드 순서와 무관하게 supabase 직접 호출
    if (status === 'pending') {
      try {
        // admin 전체에게 알림: recipient_id 없이 recipient_role만 사용
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
          .eq('status', 'active');

        if (admins?.length) {
          const notifs = admins.map(a => ({
            recipient_id:   a.id,
            recipient_role: null,
            type:           'NEW_USER_PENDING',
            title:          '신규 사용자 승인 요청',
            message:        `${email} 계정 승인이 필요합니다.`,
            link_type:      'users',
            is_read:        false,
          }));
          await supabase.from('notifications').insert(notifs);
        }
      } catch(e) {
        console.warn('[ensureProfile] 알림 생성 실패 (profile 생성은 완료):', e.message);
      }
    }

    return newProfile;
  },

  // profile 이름 업데이트
  async updateProfileName(userId, name) {
    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', userId);
    if (error) throw error;
  },

  // 세션 변경 감지 구독
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  },

  // ── 사전 승인 이메일 관리 (admin 전용) ─────────────────

  async fetchAllowedEmails() {
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('id, email, note, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addAllowedEmail(email, note, adminUserId, initialRole) {
    const normalized = email.toLowerCase().trim();
    const { error } = await supabase
      .from('allowed_emails')
      .insert({
        email:        normalized,
        note:         note         || null,
        created_by:   adminUserId  || null,
        initial_role: initialRole  || 'user',
      });
    if (error) throw error;
  },

  async deleteAllowedEmail(id) {
    const { error } = await supabase
      .from('allowed_emails')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── 사용자 관리 (admin 전용) ────────────────────────────

  // 전체 프로필 목록 조회
  async fetchAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, status, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // role 변경 (user ↔ admin)
  async updateProfileRole(userId, role) {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    if (error) throw error;
  },

  // status 변경 (pending → active → blocked)
  async updateProfileStatus(userId, status) {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);
    if (error) throw error;

    // active 승인 시 해당 user에게 알림
    if (status === 'active') {
      await notificationService.insert({
        recipient_id: userId,
        type:      'USER_APPROVED',
        title:     '가입이 승인됐습니다',
        message:   '이제 플랫폼의 모든 기능을 이용하실 수 있습니다.',
        link_type: 'list',
      });
    }
  },
};
