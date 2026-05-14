// ─── TAG INPUT COMPONENT ─────────────────────────────────
function TagInput({ selectedTags, onChange, suggestions }) {
  const { useState, useEffect, useRef } = React;
  const [inputVal, setInputVal] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef();
  const wrapRef = useRef();

  const query = inputVal.trim().toLowerCase();
  const filtered = query.length === 0 ? [] : (suggestions || []).filter(s =>
    s.toLowerCase().includes(query) && !selectedTags.includes(s)
  );
  const isExact = (suggestions || []).some(s => s.toLowerCase() === query);
  const showCustom = query.length > 0 && !isExact && !selectedTags.includes(inputVal.trim());

  const allDropdownItems = [
    ...filtered.map(s => ({ type: 'existing', label: s })),
    ...(showCustom ? [{ type: 'custom', label: inputVal.trim() }] : []),
  ];
  const isOpen = dropdownOpen && allDropdownItems.length > 0;

  function addTag(tag) {
    const t = tag.trim();
    if (!t || selectedTags.includes(t)) return;
    onChange([...selectedTags, t]);
    setInputVal('');
    setActiveIdx(-1);
    inputRef.current?.focus();
  }

  function removeTag(tag) {
    onChange(selectedTags.filter(t => t !== tag));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (isOpen && activeIdx >= 0) {
        addTag(allDropdownItems[activeIdx].label);
      } else if (inputVal.trim()) {
        addTag(inputVal.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, allDropdownItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Backspace' && inputVal === '' && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
      setActiveIdx(-1);
    }
  }

  function handleChange(e) {
    const val = e.target.value;
    if (val.endsWith(',')) {
      const t = val.slice(0, -1).trim();
      if (t) addTag(t);
      return;
    }
    setInputVal(val);
    setDropdownOpen(true);
    setActiveIdx(-1);
  }

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={wrapRef} style={{position:'relative'}}>
      <div className="tag-input-wrap" onClick={() => inputRef.current?.focus()}>
        {selectedTags.map(t => (
          <span key={t} className="tag-chip">
            {t}
            <button
              className="tag-chip-remove"
              onClick={e => { e.stopPropagation(); removeTag(t); }}
            >✕</button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="tag-text-input"
          placeholder={selectedTags.length === 0 ? '태그 입력 후 Enter 또는 쉼표...' : ''}
          value={inputVal}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (inputVal.trim()) setDropdownOpen(true); }}
        />
      </div>
      {isOpen && (
        <div className="tag-dropdown">
          {filtered.length > 0 && (
            <div className="tag-dropdown-divider">기존 태그</div>
          )}
          {filtered.map((s, i) => (
            <div
              key={s}
              className={`tag-dropdown-item ${activeIdx === i ? 'active' : ''}`}
              onMouseDown={e => { e.preventDefault(); addTag(s); }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              {s}
              <span className="tag-hint">선택</span>
            </div>
          ))}
          {showCustom && (
            <>
              {filtered.length > 0 && (
                <div className="tag-dropdown-divider">새 태그 추가</div>
              )}
              <div
                className={`tag-dropdown-item ${activeIdx === filtered.length ? 'active' : ''}`}
                onMouseDown={e => { e.preventDefault(); addTag(inputVal.trim()); }}
                onMouseEnter={() => setActiveIdx(filtered.length)}
              >
                "{inputVal.trim()}"
                <span className="tag-hint">새로 만들기</span>
              </div>
            </>
          )}
        </div>
      )}
      <div className="tag-hint-text">Enter 또는 쉼표(,)로 확정 · Backspace로 마지막 태그 삭제</div>
    </div>
  );
}
