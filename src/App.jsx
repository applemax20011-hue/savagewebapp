import React, { useEffect, useState, useRef } from 'react';
import './index.css';

// URL ТВОЕГО БЭКЕНДА (Ngrok)
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev"; 

// КАРТИНКИ (Заглушки, можно заменить на реальные URL)
const IMGS = {
  skull: "https://cdn-icons-png.flaticon.com/512/1701/1701833.png", // Пусто
  money: "https://cdn-icons-png.flaticon.com/512/2474/2474450.png", // Деньги
  star: "https://cdn-icons-png.flaticon.com/512/1828/1828884.png", // Статус
  logo: "https://cdn-icons-png.flaticon.com/512/5968/5968292.png" // Лого (заглушка)
};

// СПИСОК СЕРВИСОВ (статичный, как в боте)
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
  const [loading, setLoading] = useState(true);
  
  // -- GAME STATE --
  const [spinning, setSpinning] = useState(false);
  const [winData, setWinData] = useState(null); // {type: 'money'|'status'|'empty', val: ...}
  const [fastSpin, setFastSpin] = useState(false);
  const trackRef = useRef(null);
  
  // -- TG INIT --
  const tg = window.Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id || 6960794064; // Тест ID
  const photoUrl = tg?.initDataUnsafe?.user?.photo_url;

  useEffect(() => {
    tg?.expand();
    fetch(`${API_URL}/init/${userId}`)
      .then(r => r.json())
      .then(d => {
        if(d.error) return alert("Ошибка доступа");
        setData(d);
        setLoading(false);
      });
  }, []);

  // Ленивая загрузка вкладок
  const switchTab = (t) => {
    setTab(t);
    if(t === 'tops' && !stats) {
      fetch(`${API_URL}/stats`).then(r=>r.json()).then(setStats);
    }
    if(t === 'mentor' && !mentor && data.is_mentor) {
      fetch(`${API_URL}/mentor/${userId}`).then(r=>r.json()).then(setMentor);
    }
  };

  // --- ЛОГИКА ИГРЫ ---
  const handleSpin = () => {
    if(data.user.spins < 1) return tg.showAlert("Нет спинов!");
    setSpinning(true);
    
    fetch(`${API_URL}/play`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user_id: userId})
    })
    .then(r => r.json())
    .then(res => {
        if(res.error) { setSpinning(false); return alert(res.error); }
        
        // Обновляем спины
        setData(prev => ({...prev, user: {...prev.user, spins: res.spins}}));

        // Анимация
        const track = trackRef.current;
        if(!track) return;
        
        // Сброс позиции
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';
        
        // Определяем картинку выигрыша
        // 0-Empty, 1-Money, 2-Star. Генерируем ленту так, чтобы нужная иконка оказалась по центру
        // Для простоты: просто крутим долго и останавливаемся рандомно, а результат показываем попапом
        // НО, чтобы было красиво, можно сделать так:
        // (Упрощенная рулетка: просто CSS анимация "blur" и показ результата)
        
        setTimeout(() => {
            track.style.transition = fastSpin ? 'transform 1s cubic-bezier(0.1,0.9,0.2,1)' : 'transform 4s cubic-bezier(0.1,0.9,0.2,1)';
            // Сдвигаем на рандомное большое расстояние
            const randomOffset = 2000 + Math.random() * 500;
            track.style.transform = `translateX(-${randomOffset}px)`;
        }, 50);

        setTimeout(() => {
            setSpinning(false);
            if(res.win) {
                setWinData(res);
            } else {
               // Пусто
            }
        }, fastSpin ? 1100 : 4100);
    });
  };

  const sendStatus = (e) => {
    e.preventDefault();
    const text = e.target.elements.stText.value;
    fetch(`${API_URL}/status`, {
        method:'POST', body:JSON.stringify({user_id:userId, text})
    }).then(() => {
        setWinData(null);
        tg.showAlert("Заявка отправлена админам!");
    });
  };

  if(loading) return <div className="loader">SAVAGE<br/>LOADING</div>;

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
                 {/* Генерируем много карточек для иллюзии бесконечности */}
                 {[...Array(30)].map((_, i) => {
                    // Чередуем иконки
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