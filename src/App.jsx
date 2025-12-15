import React, { useEffect, useState, useRef } from 'react';
import './index.css';

// ⚠️ ПРОВЕРЬ, ЧТОБЫ ТУТ БЫЛА ТВОЯ АКТУАЛЬНАЯ ССЫЛКА NGROK
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev/api";

// КАРТИНКИ
const IMGS = {
  skull: "https://cdn-icons-png.flaticon.com/512/1701/1701833.png",
  money: "https://cdn-icons-png.flaticon.com/512/2474/2474450.png",
  star: "https://cdn-icons-png.flaticon.com/512/1828/1828884.png"
};

const SERVICES = [
  { t: "📊 Обмен OKX", u: "https://t.me/OKXCrypto_Robot" },
  { t: "🌐 Web Trade", u: "https://t.me/ForbexTradeBot" },
  { t: "💊 Наркошоп", u: "https://t.me/ReagentShopBot" },
  { t: "🔞 Эскорт", u: "https://t.me/RoyaleEscort_Robot" },
  { t: "🖼 NFT", u: "https://t.me/CheckRefaundRuBot" },
  { t: "📚 Мануалы", u: "https://t.me/manualsavage" }
];

function App() {
  const [tab, setTab] = useState('profile');
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [mentor, setMentor] = useState(null);
  
  // Добавили состояние ошибки
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [spinning, setSpinning] = useState(false);
  const [winData, setWinData] = useState(null);
  const [fastSpin, setFastSpin] = useState(false);
  const trackRef = useRef(null);
  
  const tg = window.Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id || 6960794064; 
  const photoUrl = tg?.initDataUnsafe?.user?.photo_url;

  // --- ХЕЛПЕР ДЛЯ ФЕТЧА (Чтобы везде добавлять заголовок) ---
  const savageFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        // 🔥 ВОТ ЭТОТ ЗАГОЛОВОК РЕШАЕТ ПРОБЛЕМУ NGROK:
        "ngrok-skip-browser-warning": "true", 
        "Content-Type": "application/json"
      }
    }).then(async r => {
      if (!r.ok) {
         const text = await r.text();
         throw new Error(`Server Error: ${r.status} ${text}`);
      }
      return r.json();
    });
  };

  useEffect(() => {
    tg?.expand();
    
    // Загрузка профиля
    savageFetch(`${API_URL}/init/${userId}`)
      .then(d => {
        if(d.error) {
           setErrorMsg(d.error);
        } else {
           setData(d);
        }
      })
      .catch(err => {
        console.error(err);
        setErrorMsg("Ошибка связи: " + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const switchTab = (t) => {
    setTab(t);
    if(t === 'tops' && !stats) {
      savageFetch(`${API_URL}/stats`).then(setStats).catch(alert);
    }
    if(t === 'mentor' && !mentor && data?.is_mentor) {
      savageFetch(`${API_URL}/mentor/${userId}`).then(setMentor).catch(alert);
    }
  };

  const handleSpin = () => {
    if(data.user.spins < 1) return tg.showAlert("Нет спинов!");
    setSpinning(true);
    
    savageFetch(`${API_URL}/play`, {
        method: 'POST',
        body: JSON.stringify({user_id: userId})
    })
    .then(res => {
        if(res.error) { setSpinning(false); return alert(res.error); }
        
        setData(prev => ({...prev, user: {...prev.user, spins: res.spins}}));

        const track = trackRef.current;
        if(!track) return;
        
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';
        
        setTimeout(() => {
            track.style.transition = fastSpin ? 'transform 1s cubic-bezier(0.1,0.9,0.2,1)' : 'transform 4s cubic-bezier(0.1,0.9,0.2,1)';
            const randomOffset = 2000 + Math.random() * 500;
            track.style.transform = `translateX(-${randomOffset}px)`;
        }, 50);

        setTimeout(() => {
            setSpinning(false);
            if(res.win) setWinData(res);
        }, fastSpin ? 1100 : 4100);
    })
    .catch(err => {
        setSpinning(false);
        alert("Ошибка спина: " + err.message);
    });
  };

  const sendStatus = (e) => {
    e.preventDefault();
    const text = e.target.elements.stText.value;
    savageFetch(`${API_URL}/status`, {
        method:'POST', body:JSON.stringify({user_id:userId, text})
    }).then(() => {
        setWinData(null);
        tg.showAlert("Заявка отправлена админам!");
    }).catch(alert);
  };

  if(loading) return <div className="loader">SAVAGE<br/>LOADING...</div>;
  
  if(errorMsg) return (
      <div className="loader" style={{flexDirection:'column', padding:20, textAlign:'center'}}>
          <div style={{color:'red', marginBottom:10}}>CRITICAL ERROR</div>
          <div style={{fontSize:14, fontFamily:'monospace', color:'#fff'}}>{errorMsg}</div>
          <div style={{marginTop:20, fontSize:12, color:'#888'}}>
              Проверь: <br/>
              1. Запущен ли uvicorn?<br/>
              2. Верна ли ссылка ngrok?<br/>
              3. Есть ли /api в конце ссылки?
          </div>
      </div>
  );

  return (
    <div className="app-container slide-in">
      
      {/* --- PROFILE TAB --- */}
      {tab === 'profile' && (
        <>
          <div className="neon-header">Identity Card</div>
          
          <div className="id-card">
            <div className="id-header">
              <div className="id-logo">SAVAGE TEAM</div>
              <div className="id-chip"></div>
            </div>
            
            <div className="id-body">
              {photoUrl ? <img src={photoUrl} className="id-photo" alt=""/> : <div className="id-photo-ph">👤</div>}
              
              <div className="id-info">
                <div className="id-label">OPERATIVE NAME</div>
                <div className="id-val">{data.user.fake || data.user.username || `User ${data.user.id}`}</div>
                
                <div className="id-row">
                   <div>ID: {data.user.id}</div>
                   <div style={{color: data.user.status==='Легенда'?'#fbbf24':'#fff'}}>
                     {data.user.status.toUpperCase()}
                   </div>
                </div>
              </div>
            </div>
            
            <div className="id-footer">
               MENTOR: {data.user.mentor.toUpperCase()}
            </div>
          </div>

          <div className="stats-row">
             <div className="stat-box">
                <div className="sb-lbl">BALANCE</div>
                <div className="sb-val">{data.user.balance.toLocaleString()}</div>
             </div>
             <div className="stat-box">
                <div className="sb-lbl">PROFITS</div>
                <div className="sb-val">{data.user.profits}</div>
             </div>
             <div className="stat-box" style={{borderColor: 'var(--accent)'}}>
                <div className="sb-lbl" style={{color:'var(--accent)'}}>SPINS</div>
                <div className="sb-val">{data.user.spins}</div>
             </div>
          </div>

          <div className="neon-header">HISTORY LOG</div>
          <div className="hist-list">
             {data.history.length === 0 ? <div style={{textAlign:'center', color:'#555', padding:'20px'}}>NO DATA</div> : 
               data.history.map((h, i) => (
                 <div className="hist-card" key={i}>
                    <div>
                       <div className="hc-serv">{h.serv}</div>
                       <div className="hc-date">{h.date}</div>
                    </div>
                    <div className="hc-sum">+{h.sum}</div>
                 </div>
               ))
             }
          </div>
        </>
      )}

      {/* --- TOPS TAB --- */}
      {tab === 'tops' && stats && (
         <>
           <div className="kassa-glitch">
              <div className="kg-lbl">TOTAL TEAM BALANCE</div>
              <div className="kg-val glitch-text">{stats.kassa.all.toLocaleString()} ₽</div>
              <div style={{marginTop:10, fontSize:10, color:'#888'}}>DAY: {stats.kassa.day.toLocaleString()} ₽</div>
           </div>

           <div className="neon-header">TOP 10 (DAY)</div>
           {stats.day.map((u,i) => (
              <div className="top-card" key={i}>
                 <div className="tc-rank">#{i+1}</div>
                 <div className={`t-ava ${u.fake?'fake':''}`}>{u.name[1]}</div>
                 <div className="tc-name" style={{color: u.fake?'var(--accent)':'#fff'}}>{u.name}</div>
                 <div className="tc-sum">{u.val.toLocaleString()}</div>
              </div>
           ))}

           <div className="neon-header" style={{marginTop:30}}>TOP 10 (ALL TIME)</div>
           {stats.all.map((u,i) => (
              <div className="top-card" key={'a'+i}>
                 <div className="tc-rank">#{i+1}</div>
                 <div className={`t-ava ${u.fake?'fake':''}`}>{u.name[1]}</div>
                 <div className="tc-name" style={{color: u.fake?'var(--accent)':'#fff'}}>{u.name}</div>
                 <div className="tc-sum">{u.val.toLocaleString()}</div>
              </div>
           ))}
         </>
      )}

      {/* --- GAME TAB --- */}
      {tab === 'game' && (
        <div style={{textAlign:'center', padding:'20px 0'}}>
           <div className="game-header">
              <h1 className="neon-title">ROCKET</h1>
              <div className="fast-toggle" onClick={() => setFastSpin(!fastSpin)}>
                 FAST <div className={`ft-dot ${fastSpin?'on':''}`}></div>
              </div>
           </div>

           <div className="roulette-wrapper">
              <div className="marker-top"></div>
              <div className="marker-bottom"></div>
              <div className="track" ref={trackRef} style={{width: '2000px'}}> 
                 {[...Array(30)].map((_, i) => {
                    let icon = IMGS.skull;
                    if(i % 5 === 0) icon = IMGS.money;
                    if(i % 12 === 0) icon = IMGS.star;
                    return (
                       <div className="r-card" key={i}>
                          <img src={icon} alt=""/>
                       </div>
                    )
                 })}
              </div>
           </div>
           
           <div style={{marginTop: 20, fontFamily:'Rajdhani', color:'#888'}}>
              SPINS LEFT: <b style={{color:'#fff', fontSize:18}}>{data.user.spins}</b>
           </div>

           <button 
              className="spin-btn-main" 
              onClick={handleSpin} 
              disabled={spinning || data.user.spins < 1}
           >
              {spinning ? "SPINNING..." : "SPIN NOW"}
           </button>
        </div>
      )}

      {/* --- SERVICES TAB --- */}
      {tab === 'services' && (
         <>
           <div className="neon-header">SERVICES & INFO</div>
           <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              {SERVICES.map((s,i) => (
                 <a href={s.u} key={i} className="hist-card" style={{textDecoration:'none', color:'#fff', display:'block', textAlign:'center'}}>
                    <div style={{fontSize:24, marginBottom:5}}>🔗</div>
                    <div style={{fontWeight:700, fontSize:12}}>{s.t}</div>
                 </a>
              ))}
           </div>
         </>
      )}

      {/* --- MENTOR TAB --- */}
      {tab === 'mentor' && mentor && (
         <>
            <div className="mentor-header">
               <h2>MENTOR PANEL</h2>
               <div style={{fontSize:14, fontWeight:700, color:'#fff', marginTop:10}}>{mentor.name}</div>
               <div style={{display:'flex', justifyContent:'space-between', marginTop:20}}>
                  <div className="m-stat">STUDENTS<br/><b style={{fontSize:16, color:'#fff'}}>{mentor.count}</b></div>
                  <div className="m-stat">TURNOVER<br/><b style={{fontSize:16, color:'#fff'}}>{mentor.turnover.toLocaleString()}</b></div>
                  <div className="m-stat">YOUR FEE<br/><b style={{fontSize:16, color:'#fff'}}>{mentor.fee}%</b></div>
               </div>
            </div>

            <div className="neon-header">YOUR STUDENTS</div>
            {mentor.students.map((s,i) => (
               <div className="student-card" key={i}>
                  <div className="st-ava">👤</div>
                  <div>
                     <div className="st-name">{s.name}</div>
                     <div className="st-prof">Profits: {s.prof}</div>
                  </div>
                  <div className="st-bal">{s.bal.toLocaleString()}</div>
               </div>
            ))}
         </>
      )}

      {/* --- BOTTOM NAV --- */}
      <div className="tab-bar">
         <button className={tab==='profile'?'active':''} onClick={()=>switchTab('profile')}>
            <span style={{fontSize:18}}>🆔</span> PROFILE
         </button>
         <button className={tab==='tops'?'active':''} onClick={()=>switchTab('tops')}>
            <span style={{fontSize:18}}>🏆</span> TOPS
         </button>
         <button className={tab==='game'?'active':''} onClick={()=>switchTab('game')}>
            <span style={{fontSize:18}}>🚀</span> GAME
         </button>
         <button className={tab==='services'?'active':''} onClick={()=>switchTab('services')}>
            <span style={{fontSize:18}}>🛠</span> LINKS
         </button>
         {data.is_mentor && (
           <button className={tab==='mentor'?'active':''} onClick={()=>switchTab('mentor')}>
              <span style={{fontSize:18}}>👨‍🏫</span> MENTOR
           </button>
         )}
      </div>

      {/* --- WIN MODAL --- */}
      {winData && (
         <div className="win-overlay animate-pop">
            <div className="win-content">
               <div className="win-glow" style={{background: winData.type==='status'?'blue':'green'}}></div>
               <h2 className="neon-header" style={{border:'none', margin:0, fontSize:28, color:'#fff'}}>
                  {winData.type === 'money' ? 'YOU WON!' : 'STATUS WIN!'}
               </h2>
               
               <img src={winData.type==='money'?IMGS.money:IMGS.star} className="win-img-big" alt=""/>
               
               {winData.type === 'money' ? (
                  <>
                    <div style={{fontSize:32, fontWeight:900, fontFamily:'Rajdhani', marginBottom:20}}>
                       {winData.val}
                    </div>
                    <button className="win-close" onClick={() => setWinData(null)}>AWESOME</button>
                  </>
               ) : (
                  <form className="status-form" onSubmit={sendStatus}>
                     <div style={{fontSize:12, marginBottom:10, color:'#aaa'}}>Enter your custom status:</div>
                     <input name="stText" placeholder="e.g. BOSS" maxLength={15} autoFocus required/>
                     <button type="submit">SET STATUS</button>
                     <div style={{fontSize:10, marginTop:10, color:'#555'}} onClick={()=>setWinData(null)}>CANCEL</div>
                  </form>
               )}
            </div>
         </div>
      )}

    </div>
  );
}

export default App;