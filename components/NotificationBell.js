// ─── NOTIFICATION BELL ────────────────────────────────────
function NotificationBell({ session, profile, onNavigate }) {
  const { useState, useEffect, useRef } = React;
  const [open,        setOpen]        = useState(false);
  const [items,       setItems]       = useState([]);
  const [unread,      setUnread]      = useState(0);
  const [loading,     setLoading]     = useState(false);
  const panelRef = useRef(null);

  const userId = session?.user?.id;
  const role   = profile?.role;

  // unread count — 주기적 polling (30초)
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function poll() {
      try {
        const count = await notificationService.fetchUnreadCount(userId, role);
        if (!cancelled) setUnread(count);
      } catch {}
    }
    poll();
    const timer = setInterval(poll, 30000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [userId, role]);

  // 드롭다운 열기
  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    try {
      const data = await notificationService.fetchForUser(userId, role);
      setItems(data);
    } catch(e) {
      console.warn('알림 로드 실패:', e.message);
    } finally {
      setLoading(false);
    }
  }

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // 알림 클릭
  async function handleItemClick(item) {
    if (!item.is_read) {
      await notificationService.markRead(item.id);
      setItems(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    }
    setOpen(false);
    if (item.link_type && onNavigate) {
      if (item.link_type === 'company' && item.link_id) {
        onNavigate('company', item.link_id);
      } else {
        onNavigate(item.link_type);
      }
    }
  }

  // 모두 읽음
  async function handleMarkAll() {
    await notificationService.markAllRead(userId, role);
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  }

  function fmtTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const min  = Math.floor(diff / 60000);
    if (min < 1)  return '방금';
    if (min < 60) return min + '분 전';
    const hr = Math.floor(min / 60);
    if (hr < 24)  return hr + '시간 전';
    return Math.floor(hr / 24) + '일 전';
  }

  const typeIcon = {
    NEW_USER_PENDING:  '👤',
    NEW_REQUEST:       '📋',
    REQUEST_DONE:      '✅',
    USER_APPROVED:     '🎉',
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* 종 버튼 */}
      <button
        onClick={handleOpen}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, color: 'var(--text2)', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center' }}
      >
        🔔
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16, background: 'var(--red)', color: '#fff', borderRadius: 8, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* 드롭다운 패널 */}
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, maxHeight: 480, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 500, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* 헤더 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>알림 {unread > 0 && <span style={{ fontSize: 11, color: 'var(--red)', marginLeft: 4 }}>{unread}개 미읽음</span>}</div>
            {unread > 0 && (
              <button onClick={handleMarkAll} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>모두 읽음</button>
            )}
          </div>

          {/* 목록 */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>불러오는 중...</div>
            ) : items.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>새 알림이 없습니다</div>
            ) : items.map(item => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{ display: 'flex', gap: 10, padding: '12px 16px', cursor: 'pointer', background: item.is_read ? 'transparent' : 'rgba(255,106,0,0.04)', borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff5f0'}
                onMouseLeave={e => e.currentTarget.style.background = item.is_read ? 'transparent' : 'rgba(255,106,0,0.04)'}
              >
                <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{typeIcon[item.type] || '🔔'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: item.is_read ? 400 : 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtTime(item.created_at)}</div>
                  </div>
                  {item.message && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, lineHeight: 1.5 }}>{item.message}</div>}
                  {item.link_type && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>바로가기 →</div>}
                </div>
                {!item.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }}/>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
