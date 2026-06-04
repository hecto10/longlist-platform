// ─── SHAREHOLDER MODAL (단일 수정 전용) ───────────────────
function ShareholderModal({ company, record, onClose, onSave, session }) {
  const { useState, useEffect } = React;

  const [snapshot, setSnapshot] = useState(null);
  const [form, setForm] = useState({
    shareholder_name:              record?.shareholder_name              ?? '',
    shareholder_type:              record?.shareholder_type              ?? '',
    common_shares:                 record?.common_shares                 ?? '',
    preferred_shares:              record?.preferred_shares              ?? '',
    relation_to_major_shareholder: record?.relation_to_major_shareholder ?? '',
    note:                          record?.note                         ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [reason,  setReason]  = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (record?.snapshot_id) {
      supabase.from('shareholder_snapshot').select('*')
        .eq('id', record.snapshot_id).single()
        .then(({ data }) => setSnapshot(data));
    }
  }, [record?.snapshot_id]);

  // 지분율 실시간 계산
  const tc = snapshot?.total_common_shares    || 0;
  const tp = snapshot?.total_preferred_shares || 0;
  const ta = tc + tp;
  const cs = Number(form.common_shares)    || 0;
  const ps = Number(form.preferred_shares) || 0;
  const ts = cs + ps;
  const cr = tc > 0 ? (cs / tc * 100).toFixed(4) : null;
  const pr = tp > 0 ? (ps / tp * 100).toFixed(4) : null;
  const tr = ta > 0 ? (ts / ta * 100).toFixed(4) : null;

  async function submit() {
    if (!form.shareholder_name.trim()) return alert('주주명을 입력해주세요');
    if (!reason.trim()) return alert('수정 사유를 입력해주세요');
    setLoading(true);
    try {
      const payload = {
        shareholder_name:              form.shareholder_name.trim(),
        shareholder_type:              form.shareholder_type              || null,
        common_shares:                 cs || null,
        preferred_shares:              ps || null,
        total_shares:                  ts || null,
        common_ratio:                  cr ? Number(cr) : null,
        preferred_ratio:               pr ? Number(pr) : null,
        total_ratio:                   tr ? Number(tr) : null,
        relation_to_major_shareholder: form.relation_to_major_shareholder || null,
        note:                          form.note || null,
      };
      await companyService.updateShareholder(record.id, payload, record.snapshot_id);
      await companyService.logDataChange({
        target_table: 'shareholders', target_id: record.id, company_id: company.id,
        action_type:  'UPDATE',
        old_snapshot: record, new_snapshot: { ...record, ...payload },
        changed_by:   session?.user?.email || null,
        reason:       reason.trim(),
      });
      onSave(); onClose();
    } catch(e) {
      alert('저장 실패: ' + e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-title">주주 수정 · {company.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {snapshot && (
            <div style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', borderRadius: 6, padding: '8px 12px', marginBottom: 14 }}>
              기준일: <strong style={{ color: 'var(--text)' }}>{snapshot.as_of_date}</strong>
              {tc > 0 && <span style={{ marginLeft: 12 }}>총 보통주: {tc.toLocaleString()}</span>}
              {tp > 0 && <span style={{ marginLeft: 8 }}>총 우선주: {tp.toLocaleString()}</span>}
            </div>
          )}
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">주주명 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="form-input" value={form.shareholder_name} onChange={e => set('shareholder_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">구분</label>
              <select className="form-input" value={form.shareholder_type} onChange={e => set('shareholder_type', e.target.value)}>
                <option value="">선택</option>
                {['최대주주','특수관계인','기관','개인','기타'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">보통주 수</label>
              <input type="number" className="form-input" placeholder="0" value={form.common_shares} onChange={e => set('common_shares', e.target.value)} />
              {cr !== null && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>→ {cr}%</div>}
            </div>
            <div className="form-group">
              <label className="form-label">우선주 수</label>
              <input type="number" className="form-input" placeholder="0" value={form.preferred_shares} onChange={e => set('preferred_shares', e.target.value)} />
              {pr !== null && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>→ {pr}%</div>}
            </div>
            <div className="form-group">
              <label className="form-label">합계 지분율</label>
              <div style={{ padding: '8px 12px', background: 'var(--bg3)', borderRadius: 6, fontSize: 14, fontWeight: 600, color: tr !== null ? 'var(--accent)' : 'var(--text3)', fontFamily: 'MaruBuri,sans-serif' }}>
                {tr !== null ? tr + '%' : '—'}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">최대주주와의 관계</label>
            <input className="form-input" placeholder="예: 본인, 배우자, 타인" value={form.relation_to_major_shareholder} onChange={e => set('relation_to_major_shareholder', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">비고</label>
            <textarea className="form-textarea" value={form.note} onChange={e => set('note', e.target.value)} />
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
              수정자: <span style={{ color: 'var(--text2)' }}>{session?.user?.email || '—'}</span>
              <span style={{ marginLeft: 8 }}>· 자동 기록됩니다</span>
            </div>
            <div className="form-group">
              <label className="form-label">수정 사유 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="form-input" placeholder="수정 사유 입력" value={reason} onChange={e => setReason(e.target.value)}/>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>취소</button>
            <button className="btn btn-primary" onClick={submit} disabled={loading}>
              {loading ? '저장 중...' : '수정 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
