import React, { useEffect, useState, useRef } from 'react';
import './index.css';

// ⚠️ ЗАМЕНИ ССЫЛКУ NGROK
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev/api";

const SOUNDS = {
  click: "https://cdn.freesound.org/previews/256/256116_3263906-lq.mp3",
  win: "https://cdn.freesound.org/previews/270/270402_5123851-lq.mp3",
  spin: "https://cdn.freesound.org/previews/45/45903_232777-lq.mp3",
  tab: "https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3"
};
const playSound = (k) => { const a = new Audio(SOUNDS[k]); a.volume=0.3; a.play().catch(()=>{}); };

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
  const [stats, setStats] = useState(null); // Топы и касса
  const [mentor, setMentor] = useState(null);
  const [card, setCard] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Game
  const [spinning, setSpinning] = useState(false);
  const [winData, setWinData] = useState(null);
  const trackRef = useRef(null);

  // Tops Sub-tab
  const [topTab, setTopTab] = useState('day'); // day, week, all

  // Mentor Edit
  const [editM, setEditM] = useState(false);

  const tg = window.Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id || 6960794064; 
  const photoUrl = tg?.initDataUnsafe?.user?.photo_url;

  const savageFetch = (path, opt={}) => {
    return fetch(`${API_URL}${path}`, {
      ...opt, headers: { ...opt.headers, "ngrok-skip-browser-warning":"true", "Content-Type":"application/json" }
    }).then(async r => {
      if(!r.ok) throw new Error((await r.text()) || r.status);
      return r.json();
    });
  };

  useEffect(() => {
    tg?.expand();
    savageFetch(`/init/${userId}`)
      .then(d => { if(d.error) setError(d.error); else setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const switchTab = (t) => {
    playSound('tab'); setTab(t);
    if(t==='tops' && !stats) savageFetch('/stats').then(setStats);
    if(t==='card' && !card) savageFetch('/card').then(setCard);
    if(t==='ach' && !achievements) savageFetch(`/achievements/${userId}`).then(setAchievements);
    if(t==='mentor' && !mentor && data?.is_mentor) savageFetch(`/mentor/${userId}`).then(setMentor);
  };

  const handleSpin = () => {
    playSound('click');
    if(data.user.spins < 1) return tg.showAlert("Нет спинов!");
    setSpinning(true); playSound('spin');
    
    savageFetch('/play', {method:'POST', body:JSON.stringify({user_id:userId})})
    .then(res => {
        if(res.error) { setSpinning(false); return alert(res.error); }
        setData(p => ({...p, user:{...p.user, spins:res.spins}}));
        
        const track = trackRef.current;
        if(track) {
            track.style.transition = 'none'; track.style.transform = 'translateX(0)';
            setTimeout(() => {
                track.style.transition = 'transform 3s cubic-bezier(0.1, 0.8, 0.1, 1)';
                track.style.transform = `translateX(-${1500 + Math.random()*500}px)`;
            }, 50);
        }
        setTimeout(() => {
            setSpinning(false);
            if(res.win) { setWinData(res); playSound('win'); }
        }, 3100);
    }).catch(e=>{setSpinning(false); alert(e.message)});
  };

  const copy = (txt) => {
    navigator.clipboard.writeText(txt);
    playSound('click');
    tg.showPopup({title:"Скопировано", message:txt});
  };

  if(loading) return <div className="loader">SAVAGE SYSTEM<br/>LOADING...</div>;
  if(error) return <div className="loader" style={{color:'red'}}>ERROR: {error}</div>;

  return (
    <div className="app-container fade-in">
      <div className="bg-anim"></div>

      {/* --- ПРОФИЛЬ --- */}
      {tab==='profile' && (
        <>
          <div className="neon-header">ЛИЧНАЯ КАРТА</div>
          <div className="id-card">
             <div className="id-top"><div className="id-logo">SAVAGE</div><div className="id-chip"></div></div>
             <div className="id-mid">
                {photoUrl ? <img src={photoUrl} className="id-ava" alt=""/> : <div className="id-ava-ph">👤</div>}
                <div className="id-data">
                   <div className="lbl">АГЕНТ</div>
                   <div className={`val ${data.user.fake?'neon':''}`}>{data.user.fake || data.user.username || 'ID '+data.user.id}</div>
                   <div className="row">
                      <span>ID: {data.user.id}</span>
                      <span className="badge">{data.user.status}</span>
                   </div>
                </div>
             </div>
             <div className="id-bot">НАСТАВНИК: {data.user.mentor.toUpperCase()}</div>
          </div>

          <div className="stats-grid">
             <div className="box"><div className="l">БАЛАНС</div><div className="v">{data.user.balance.toLocaleString()} ₽</div></div>
             <div className="box"><div className="l">ПРОФИТЫ</div><div className="v">{data.user.profits}</div></div>
             <div className="box highlight"><div className="l">СПИНЫ</div><div className="v">{data.user.spins}</div></div>
          </div>

          <div className="neon-header">ИСТОРИЯ (ПОСЛЕДНИЕ 100)</div>
          <div className="hist-list">
             {data.history.length===0 ? <div className="empty">ПУСТО</div> : 
               data.history.map((h,i)=>(
                 <div className="h-card" key={i}>
                    <div><div className="h-s">{h.serv}</div><div className="h-d">{h.date}</div></div>
                    <div className="h-v">+{h.sum} ₽</div>
                 </div>
               ))}
          </div>
        </>
      )}

      {/* --- КАРТА --- */}
      {tab==='card' && card && (
        <div className="fade-in">
           <div className="neon-header">РЕКВИЗИТЫ</div>
           <div className="credit-card" onClick={()=>copy(card.number)}>
              <div className="cc-bank">{card.bank}</div>
              <div className="cc-chip"></div>
              <div className="cc-num">{card.number}</div>
              <div className="cc-bot">
                 <div>{card.fio}</div>
                 <div>LIMIT: {card.max}</div>
              </div>
           </div>
           <div className="hint">Нажми на карту для копирования<br/>Мин: {card.min} ₽</div>
        </div>
      )}

      {/* --- АЧИВКИ --- */}
      {tab==='ach' && achievements && (
        <div className="fade-in">
           <div className="neon-header">ДОСТИЖЕНИЯ</div>
           <div className="ach-grid">
              {achievements.map((a,i)=>(
                 <div className={`ach-card ${a.unlocked?'u':'l'}`} key={i}>
                    <div className="ach-i">{a.icon}</div>
                    <div className="ach-n">{a.name}</div>
                    <div className="ach-d">{a.desc}</div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* --- ТОПЫ И КАССА --- */}
      {tab==='tops' && stats && (
        <div className="fade-in">
           <div className="kassa-panel">
              <div className="kp-t">💰 КАССА КОМАНДЫ</div>
              <div className="kp-grid">
                 <div><span>ДЕНЬ</span><b>{stats.kassa.day.toLocaleString()}</b></div>
                 <div><span>ВЧЕРА</span><b>{stats.kassa.yest.toLocaleString()}</b></div>
                 <div><span>НЕДЕЛЯ</span><b>{stats.kassa.week.toLocaleString()}</b></div>
                 <div><span>МЕСЯЦ</span><b>{stats.kassa.month.toLocaleString()}</b></div>
              </div>
              <div className="kp-all">ВСЕГО: {stats.kassa.all.toLocaleString()} ₽</div>
           </div>

           <div className="neon-header">РЕЙТИНГ ВОРКЕРОВ</div>
           <div className="sub-tabs">
              <button className={topTab==='day'?'active':''} onClick={()=>setTopTab('day')}>ДЕНЬ</button>
              <button className={topTab==='week'?'active':''} onClick={()=>setTopTab('week')}>НЕДЕЛЯ</button>
              <button className={topTab==='all'?'active':''} onClick={()=>setTopTab('all')}>ВСЕ</button>
           </div>

           <div className="top-list">
              {(topTab==='day'?stats.top_day : topTab==='week'?stats.top_week : stats.top_all).map((u,i)=>(
                 <div className="top-row" key={i}>
                    <div className="tr-rnk">#{i+1}</div>
                    <div className={`tr-name ${u.fake?'neon':''}`}>{u.name}</div>
                    <div className="tr-val">{u.val.toLocaleString()} ₽</div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* --- ИГРА --- */}
      {tab==='game' && (
        <div className="game-center">
           <div className="neon-header">РАКЕТКА</div>
           <div className="roulette">
              <div className="mark-top"></div><div className="mark-bot"></div>
              <div className="track" ref={trackRef} style={{width:'3000px'}}>
                 {[...Array(40)].map((_,i)=>(
                    <div className="r-item" key={i}>
                       <img src={i%5===0?"https://cdn-icons-png.flaticon.com/512/2474/2474450.png":"https://cdn-icons-png.flaticon.com/512/1701/1701833.png"} alt=""/>
                    </div>
                 ))}
              </div>
           </div>
           <div className="spins-cnt">БАЛАНС СПИНОВ: <b>{data.user.spins}</b></div>
           <button className="spin-btn" onClick={handleSpin} disabled={spinning || data.user.spins<1}>
              {spinning?'КРУТИМ...':'ИСПЫТАТЬ УДАЧУ'}
           </button>
        </div>
      )}

      {/* --- СЕРВИСЫ --- */}
      {tab==='services' && (
         <div className="fade-in">
            <div className="neon-header">ИНСТРУМЕНТЫ</div>
            <div className="serv-grid">
               {SERVICES.map((s,i)=>(
                  <a href={s.u} className="serv-btn" key={i}>
                     <div className="sb-t">{s.t}</div>
                     <div className="sb-arr">↗</div>
                  </a>
               ))}
            </div>
         </div>
      )}

      {/* --- МЕНТОР --- */}
      {tab==='mentor' && mentor && (
         <div className="fade-in">
            <div className="mentor-dash">
               <div className="md-head">
                  <h2>{mentor.name}</h2>
                  <span onClick={()=>setEditM(true)}>⚙️</span>
               </div>
               <div className="md-stats">
                  <div><span>УЧЕНИКИ</span><b>{mentor.count}</b></div>
                  <div><span>ОБОРОТ</span><b>{mentor.turnover.toLocaleString()}</b></div>
                  <div><span>ПРОЦЕНТ</span><b>{mentor.fee}%</b></div>
               </div>
               <div className="md-info">{mentor.info || "Нет инфо"}</div>
            </div>
            <div className="neon-header">СПИСОК УЧЕНИКОВ</div>
            {mentor.students.map((s,i)=>(
               <div className="st-row" key={i}>
                  <div><b>{s.name}</b><br/><small>Профитов: {s.prof}</small></div>
                  <div className="st-v">{s.bal.toLocaleString()} ₽</div>
               </div>
            ))}
            {editM && (
               <div className="modal" onClick={(e)=>{if(e.target===e.currentTarget)setEditM(false)}}>
                  <form onSubmit={(e)=>{e.preventDefault(); savageFetch('/mentor/update', {method:'POST', body:JSON.stringify({user_id:userId, info:e.target.elements.info.value, fee:e.target.elements.fee.value})}).then(()=>{setEditM(false); tg.showAlert("OK")})}}>
                     <h3>РЕДАКТИРОВАТЬ</h3>
                     <textarea name="info" defaultValue={mentor.info}></textarea>
                     <input name="fee" type="number" defaultValue={mentor.fee}/>
                     <button>СОХРАНИТЬ</button>
                  </form>
               </div>
            )}
         </div>
      )}

      {/* --- МЕНЮ --- */}
      <div className="nav-bar">
         <btn className={tab==='profile'?'act':''} onClick={()=>switchTab('profile')}>🆔</btn>
         <btn className={tab==='card'?'act':''} onClick={()=>switchTab('card')}>💳</btn>
         <btn className={tab==='tops'?'act':''} onClick={()=>switchTab('tops')}>🏆</btn>
         <btn className={tab==='game'?'act':''} onClick={()=>switchTab('game')}>🚀</btn>
         <btn className={tab==='ach'?'act':''} onClick={()=>switchTab('ach')}>🎖</btn>
         <btn className={tab==='services'?'act':''} onClick={()=>switchTab('services')}>🛠</btn>
         {data.is_mentor && <btn className={tab==='mentor'?'act':''} onClick={()=>switchTab('mentor')}>👨‍🏫</btn>}
      </div>

      {winData && (
         <div className="modal" onClick={()=>setWinData(null)}>
            <div className="win-box">
               <div className="glow"></div>
               <h2>{winData.type==='money'?'ДЕНЬГИ!':'СТАТУС!'}</h2>
               {winData.type==='money' ? <h1>{winData.val}</h1> : <div>Текст статуса в разработке</div>}
               <button onClick={()=>setWinData(null)}>КРУТО</button>
            </div>
         </div>
      )}
    </div>
  );
}
export default App;