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
      .select('id, name, role')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
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
};
