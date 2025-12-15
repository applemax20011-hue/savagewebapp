import React, { useEffect, useState, useRef } from 'react';
import './index.css';

// ⚠️ ТВОЯ ССЫЛКА NGROK
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev/api";

// ЗВУКИ (Ссылки на mp3)
const SOUNDS = {
  click: "https://cdn.freesound.org/previews/256/256116_3263906-lq.mp3",
  win: "https://cdn.freesound.org/previews/270/270402_5123851-lq.mp3",
  spin: "https://cdn.freesound.org/previews/45/45903_232777-lq.mp3",
  tab: "https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3"
};

const playSound = (key) => {
  const audio = new Audio(SOUNDS[key]);
  audio.volume = 0.5;
  audio.play().catch(()=>console.log("Audio play blocked"));
};

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
  const [card, setCard] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Game
  const [spinning, setSpinning] = useState(false);
  const [winData, setWinData] = useState(null);
  const [fastSpin, setFastSpin] = useState(false);
  const trackRef = useRef(null);
  
  // Mentor Edit
  const [editingMentor, setEditingMentor] = useState(false);

  const tg = window.Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id || 6960794064; 
  const photoUrl = tg?.initDataUnsafe?.user?.photo_url;

  const savageFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "ngrok-skip-browser-warning": "true", 
        "Content-Type": "application/json"
      }
    }).then(async r => {
      if (!r.ok) {
         const text = await r.text();
         throw new Error(`Err: ${r.status}`);
      }
      return r.json();
    });
  };

  useEffect(() => {
    tg?.expand();
    savageFetch(`${API_URL}/init/${userId}`)
      .then(d => { if(d.error) setErrorMsg(d.error); else setData(d); })
      .catch(err => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, []);

  const switchTab = (t) => {
    playSound('tab');
    setTab(t);
    if(t === 'tops' && !stats) savageFetch(`${API_URL}/stats`).then(setStats);
    if(t === 'card' && !card) savageFetch(`${API_URL}/card`).then(setCard);
    if(t === 'achievements' && !achievements) savageFetch(`${API_URL}/achievements/${userId}`).then(setAchievements);
    if(t === 'mentor' && !mentor && data?.is_mentor) savageFetch(`${API_URL}/mentor/${userId}`).then(setMentor);
  };

  const handleSpin = () => {
    playSound('click');
    if(data.user.spins < 1) return tg.showAlert("Нет спинов!");
    setSpinning(true);
    playSound('spin');
    
    savageFetch(`${API_URL}/play`, { method: 'POST', body: JSON.stringify({user_id: userId}) })
    .then(res => {
        if(res.error) { setSpinning(false); return alert(res.error); }
        setData(prev => ({...prev, user: {...prev.user, spins: res.spins}}));
        
        const track = trackRef.current;
        if(track) {
            track.style.transition = 'none';
            track.style.transform = 'translateX(0)';
            setTimeout(() => {
                track.style.transition = fastSpin ? 'transform 1s ease' : 'transform 4s ease';
                track.style.transform = `translateX(-${2000 + Math.random() * 500}px)`;
            }, 50);
        }
        setTimeout(() => {
            setSpinning(false);
            if(res.win) { setWinData(res); playSound('win'); }
        }, fastSpin ? 1100 : 4100);
    }).catch(e => {setSpinning(false); alert(e.message)});
  };

  const copyText = (txt) => {
    navigator.clipboard.writeText(txt);
    playSound('click');
    tg.showPopup({title:"Скопировано!", message:txt, buttons:[{type:'ok'}]});
  };

  if(loading) return <div className="loader">SAVAGE<br/>ЗАГРУЗКА...</div>;
  if(errorMsg) return <div className="loader" style={{color:'red'}}>{errorMsg}</div>;

  return (
    <div className="app-container slide-in">
      <div className="bg-animation"></div> {/* Живой фон */}

      {/* --- ПРОФИЛЬ --- */}
      {tab === 'profile' && (
        <>
          <div className="neon-header">ЛИЧНАЯ КАРТА</div>
          <div className="id-card">
            <div className="id-header">
              <div className="id-logo">SAVAGE TEAM</div>
              <div className="id-chip"></div>
            </div>
            <div className="id-body">
              {photoUrl ? <img src={photoUrl} className="id-photo" alt=""/> : <div className="id-photo-ph">👤</div>}
              <div className="id-info">
                <div className="id-label">ИМЯ АГЕНТА</div>
                <div className={`id-val ${data.user.fake ? 'neon-text' : ''}`}>
                    {data.user.fake || data.user.username || `ID ${data.user.id}`}
                </div>
                <div className="id-row">
                   <div>ID: {data.user.id}</div>
                   <div className="status-badge-pro">{data.user.status.toUpperCase()}</div>
                </div>
              </div>
            </div>
            <div className="id-footer">НАСТАВНИК: {data.user.mentor.toUpperCase()}</div>
          </div>

          <div className="stats-row">
             <div className="stat-box"><div className="sb-lbl">БАЛАНС</div><div className="sb-val">{data.user.balance.toLocaleString()}</div></div>
             <div className="stat-box"><div className="sb-lbl">ПРОФИТОВ</div><div className="sb-val">{data.user.profits}</div></div>
             <div className="stat-box" style={{borderColor:'var(--accent)'}}><div className="sb-lbl" style={{color:'var(--accent)'}}>СПИНЫ</div><div className="sb-val">{data.user.spins}</div></div>
          </div>

          <div className="neon-header">ИСТОРИЯ</div>
          <div className="hist-list">
             {data.history.length === 0 ? <div style={{textAlign:'center', color:'#555', padding:'20px'}}>ПУСТО</div> : 
               data.history.map((h, i) => (
                 <div className="hist-card" key={i}>
                    <div><div className="hc-serv">{h.serv}</div><div className="hc-date">{h.date}</div></div>
                    <div className="hc-sum">+{h.sum} RUB</div>
                 </div>
               ))
             }
          </div>
        </>
      )}

      {/* --- КАРТА (РЕКВИЗИТЫ) --- */}
      {tab === 'card' && card && (
        <div className="fade-in">
            <div className="neon-header">РЕКВИЗИТЫ КОМАНДЫ</div>
            <div className="credit-card" onClick={()=>copyText(card.number)}>
                <div className="cc-bank">{card.bank}</div>
                <div className="cc-chip"></div>
                <div className="cc-number">{card.number}</div>
                <div className="cc-info">
                    <div className="cc-holder">{card.fio}</div>
                    <div className="cc-valid">LIMIT: {card.max}</div>
                </div>
            </div>
            <div style={{textAlign:'center', marginTop:15, fontSize:12, color:'#888'}}>
                Нажми на карту, чтобы скопировать номер.<br/>
                Лимиты: <b>{card.min} - {card.max} RUB</b>
            </div>
            
            <button className="savage-btn" style={{marginTop:30}} onClick={()=>copyText(card.number)}>
                КОПИРОВАТЬ НОМЕР
            </button>
        </div>
      )}

      {/* --- АЧИВКИ --- */}
      {tab === 'achievements' && achievements && (
        <div className="fade-in">
            <div className="neon-header">ДОСТИЖЕНИЯ</div>
            <div className="ach-grid">
                {achievements.map((ach, i) => (
                    <div className={`ach-item ${ach.unlocked ? 'unlocked' : 'locked'}`} key={i}>
                        <div className="ach-icon">{ach.icon}</div>
                        <div className="ach-name">{ach.name}</div>
                        <div className="ach-desc">{ach.desc}</div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- ТОПЫ --- */}
      {tab === 'tops' && stats && (
         <div className="fade-in">
           <div className="kassa-glitch">
              <div className="kg-lbl">ОБЩАЯ КАССА</div>
              <div className="kg-val glitch-text">{stats.kassa.all.toLocaleString()} RUB</div>
              <div style={{marginTop:10, fontSize:10, color:'#888'}}>ДЕНЬ: {stats.kassa.day.toLocaleString()} RUB</div>
           </div>
           <div className="neon-header">ТОП 10 (ДЕНЬ)</div>
           {stats.day.map((u,i) => (
              <div className="top-card" key={i}>
                 <div className="tc-rank">#{i+1}</div>
                 <div className={`t-ava ${u.fake?'fake':''}`}>{u.name[1]}</div>
                 <div className="tc-name" style={{color:u.fake?'var(--accent)':'#fff'}}>{u.name}</div>
                 <div className="tc-sum">{u.val.toLocaleString()}</div>
              </div>
           ))}
         </div>
      )}

      {/* --- ИГРА --- */}
      {tab === 'game' && (
        <div style={{textAlign:'center', padding:'20px 0'}}>
           <div className="game-header">
              <h1 className="neon-title">РАКЕТКА</h1>
              <div className="fast-toggle" onClick={() => {playSound('click'); setFastSpin(!fastSpin)}}>
                 FAST <div className={`ft-dot ${fastSpin?'on':''}`}></div>
              </div>
           </div>
           <div className="roulette-wrapper">
              <div className="marker-top"></div><div className="marker-bottom"></div>
              <div className="track" ref={trackRef} style={{width:'2000px'}}> 
                 {[...Array(30)].map((_, i) => {
                    let icon = IMGS.skull;
                    if(i % 5 === 0) icon = IMGS.money;
                    if(i % 12 === 0) icon = IMGS.star;
                    return <div className="r-card" key={i}><img src={icon} alt=""/></div>
                 })}
              </div>
           </div>
           <div style={{marginTop: 20, fontFamily:'Rajdhani', color:'#888'}}>СПИНЫ: <b style={{color:'#fff', fontSize:18}}>{data.user.spins}</b></div>
           <button className="spin-btn-main" onClick={handleSpin} disabled={spinning || data.user.spins < 1}>
              {spinning ? "КРУТИМ..." : "КРУТИТЬ"}
           </button>
        </div>
      )}

      {/* --- СЕРВИСЫ --- */}
      {tab === 'services' && (
         <div className="services-grid fade-in">
            {SERVICES.map((s,i) => (
                 <a href={s.u} key={i} className="hist-card" style={{textDecoration:'none', color:'#fff', display:'block', textAlign:'center'}}>
                    <div style={{fontSize:24, marginBottom:5}}>🔗</div>
                    <div style={{fontWeight:700, fontSize:12}}>{s.t}</div>
                 </a>
            ))}
         </div>
      )}

      {/* --- МЕНТОР --- */}
      {tab === 'mentor' && mentor && (
         <div className="fade-in">
            <div className="mentor-header">
               <h2>КАБИНЕТ</h2>
               <div style={{fontSize:14, fontWeight:700, color:'#fff'}}>{mentor.name}</div>
               <div style={{fontSize:10, color:'#666', cursor:'pointer', textDecoration:'underline'}} onClick={()=>setEditingMentor(true)}>[РЕДАКТИРОВАТЬ]</div>
               <div style={{display:'flex', justifyContent:'space-between', marginTop:20}}>
                  <div className="m-stat">УЧЕНИКИ<br/><b>{mentor.count}</b></div>
                  <div className="m-stat">ОБОРОТ<br/><b>{mentor.turnover.toLocaleString()}</b></div>
                  <div className="m-stat">%<br/><b>{mentor.fee}%</b></div>
               </div>
               <div style={{marginTop:15, textAlign:'left', background:'rgba(0,0,0,0.3)', padding:10, borderRadius:8, fontSize:12}}><b>ИНФО:</b> {mentor.info}</div>
            </div>
            <div className="neon-header">УЧЕНИКИ</div>
            {mentor.students.map((s,i) => (
               <div className="student-card" key={i}>
                  <div className="st-ava">👤</div>
                  <div><div className="st-name">{s.name}</div><div className="st-prof">Проф: {s.prof}</div></div>
                  <div className="st-bal">{s.bal.toLocaleString()}</div>
               </div>
            ))}
            {editingMentor && (
                <div className="win-overlay slide-in">
                    <form className="win-content" onSubmit={(e)=>{e.preventDefault(); const info=e.target.elements.mInfo.value; const fee=e.target.elements.mFee.value; savageFetch(`${API_URL}/mentor/update`, {method:'POST', body:JSON.stringify({user_id:userId, info, fee})}).then(()=>{setEditingMentor(false); setMentor(p=>({...p, info, fee})); tg.showAlert("Сохранено!");}) }}>
                        <h3 style={{marginTop:0}}>НАСТРОЙКИ</h3>
                        <textarea name="mInfo" defaultValue={mentor.info} rows={4} style={{width:'90%', background:'#222', color:'#fff', padding:10}}></textarea>
                        <input name="mFee" type="number" min="5" max="20" defaultValue={mentor.fee} style={{width:'90%', background:'#222', color:'#fff', padding:10, marginTop:10}}/>
                        <button type="submit" style={{marginTop:20, background:'var(--accent)', color:'#000', fontWeight:900, width:'100%', padding:10}}>СОХРАНИТЬ</button>
                    </form>
                </div>
            )}
         </div>
      )}

      {/* --- НАВИГАЦИЯ --- */}
      <div className="tab-bar">
         <button className={tab==='profile'?'active':''} onClick={()=>switchTab('profile')}><span>🆔</span></button>
         <button className={tab==='card'?'active':''} onClick={()=>switchTab('card')}><span>💳</span></button>
         <button className={tab==='tops'?'active':''} onClick={()=>switchTab('tops')}><span>🏆</span></button>
         <button className={tab==='game'?'active':''} onClick={()=>switchTab('game')}><span>🚀</span></button>
         <button className={tab==='achievements'?'active':''} onClick={()=>switchTab('achievements')}><span>🎖</span></button>
         <button className={tab==='services'?'active':''} onClick={()=>switchTab('services')}><span>🛠</span></button>
         {data.is_mentor && <button className={tab==='mentor'?'active':''} onClick={()=>switchTab('mentor')}><span>👨‍🏫</span></button>}
      </div>

      {winData && (
         <div className="win-overlay animate-pop" onClick={() => setWinData(null)}>
            <div className="win-content" onClick={(e)=>e.stopPropagation()}>
               <div className="win-glow" style={{background: winData.type==='status'?'blue':'green'}}></div>
               <h2 className="neon-header" style={{border:'none', margin:0, fontSize:28, color:'#fff'}}>{winData.type === 'money' ? 'ПОБЕДА!' : 'СТАТУС!'}</h2>
               <img src={winData.type==='money'?IMGS.money:IMGS.star} className="win-img-big" alt=""/>
               {winData.type === 'money' ? (
                  <><div style={{fontSize:32, fontWeight:900, fontFamily:'Rajdhani', marginBottom:20}}>{winData.val}</div><button className="win-close" onClick={() => setWinData(null)}>ЕЩЕ</button></>
               ) : (
                  <form className="status-form" onSubmit={(e)=>{e.preventDefault(); savageFetch(`${API_URL}/status`, {method:'POST', body:JSON.stringify({user_id:userId, text:e.target.elements.stText.value})}).then(()=>{setWinData(null); tg.showAlert("Заявка отправлена!")})}}>
                     <input name="stText" placeholder="BOSS" maxLength={15} autoFocus required/><button type="submit">ОК</button>
                  </form>
               )}
            </div>
         </div>
      )}
    </div>
  );
}
export default App;