// ─── EDIT COMPANY MODAL ──────────────────────────────────
function EditCompanyModal({ company, onClose, onSave, allTags }) {
  const { useState } = React;
  const [form, setForm] = useState({
    name: company.name || '',
    founded_date: company.founded_date || '',
    location: company.location || '',
    ceo: company.ceo || '',
    employee_count: company.employee_count || '',
    listing_status: company.listing_status || '',
    industry: company.industry || '',
    ma_status: company.ma_status || 'X',
    inbound_outbound: company.inbound_outbound || '',
  });
  const [selectedTags, setSelectedTags] = useState(company.tags || []);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  async function submit() {
    if (!form.name.trim()) return alert('기업명을 입력해주세요');
    setLoading(true);
    try {
      await companyService.update(company.id, {
        name: form.name.trim(),
        founded_date: form.founded_date || null,
        location: form.location || null,
        ceo: form.ceo || null,
        employee_count: form.employee_count || null,
        listing_status: form.listing_status || null,
        industry: form.industry || null,
        tags: selectedTags,
        ma_status: form.ma_status || 'X',
        inbound_outbound: form.inbound_outbound || null,
      });
      onSave(); onClose();
    } catch(e) {
      alert('저장 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">기업 정보 수정</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">기업명 *</label>
            <input className="form-input" placeholder="기업명 입력" value={form.name} onChange={e=>set('name',e.target.value)}/>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">설립일</label>
              <input type="date" className="form-input" value={form.founded_date} onChange={e=>set('founded_date',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">소재지</label>
              <input className="form-input" placeholder="예: 서울 강남구" value={form.location} onChange={e=>set('location',e.target.value)}/>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">대표이사</label>
              <input className="form-input" placeholder="대표이사 이름" value={form.ceo} onChange={e=>set('ceo',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">임직원 수</label>
              <input className="form-input" placeholder="예: 50" value={form.employee_count} onChange={e=>set('employee_count',e.target.value)}/>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">업종</label>
              <input className="form-input" placeholder="예: 소프트웨어 개발" value={form.industry} onChange={e=>set('industry',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">상장여부</label>
              <select className="form-input" value={form.listing_status} onChange={e=>set('listing_status',e.target.value)}>
                <option value="">선택</option>
                <option value="비상장 (외감X)">비상장 (외감X)</option>
                <option value="비상장 (외감)">비상장 (외감)</option>
                <option value="코스피">코스피</option>
                <option value="코스닥">코스닥</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">태그</label>
            <TagInput
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              suggestions={allTags || []}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">M&A 현황</label>
              <select className="form-input" value={form.ma_status} onChange={e=>set('ma_status',e.target.value)}>
                <option value="X">X (검토 없음)</option>
                <option value="진행중">진행중</option>
                <option value="보류(내부판단)">보류(내부판단)</option>
                <option value="보류(2순위)">보류(2순위)</option>
                <option value="종결(내부판단)">종결(내부판단)</option>
                <option value="종결(상대거절)">종결(상대거절)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">인바운드/아웃바운드 경로</label>
              <input className="form-input" placeholder="예: 아웃바운드 / HI 김민정 전무" value={form.inbound_outbound} onChange={e=>set('inbound_outbound',e.target.value)}/>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>취소</button>
            <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? '저장 중...' : '수정 완료'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
