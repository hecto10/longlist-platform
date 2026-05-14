// ─── APP ─────────────────────────────────────────────────
function App() {
  const { useState } = React;
  const [selected, setSelected] = useState(null);

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <span>●</span> Longlist <span style={{color:'var(--text3)',fontWeight:400}}>Platform</span>
        </div>
        <div style={{fontSize:12,color:'var(--text3)',fontFamily:'MaruBuri,sans-serif'}}>
          {new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'})}
        </div>
      </header>
      <main className="main">
        {selected ? (
          <DetailView company={selected} onBack={()=>setSelected(null)}/>
        ) : (
          <ListView onSelect={setSelected}/>
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
