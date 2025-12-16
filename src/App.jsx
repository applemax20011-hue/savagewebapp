import React, { useEffect, useState, useRef } from 'react';
import './index.css';

// ⚠️ ЗАМЕНИ ССЫЛКУ NGROK
const API_URL = "https://ТВОЙ_АДРЕС_NGROK.ngrok-free.app/api";

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
  { t: "🖼 NFT", u: "https://t.me/CheckRefaundRuBot" }
];

function App() {
  const [tab, setTab] = useState('profile');
  const [data, setData] = useState(null); // User Data
  const [kassa, setKassa] = useState(null);
  const [tops, setTops] = useState([]);
  const [topPeriod, setTopPeriod] = useState('day');
  const [mentors, setMentors] = useState([]);
  const [card, setCard] = useState(null);
  const [spinAnim, setSpinAnim] = useState(false);
  const [winData, setWinData] = useState(null); // {type: 'money'|'status'|'empty', val: ...}

  // Init
  useEffect(() => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#050505');
    
    const uid = tg.initDataUnsafe?.user?.id || 6960794064; // Твой ID для теста
    loadUser(uid);
    loadKassa();
    loadCard();
    loadMentors();
  }, []);

  // Top loader
  useEffect(() => {
    fetch(`${API_URL}/top/${topPeriod}`, {headers: {'ngrok-skip-browser-warning':'true'}})
      .then(r=>r.json()).then(setTops);
  }, [topPeriod]);

  const loadUser = (uid) => fetch(`${API_URL}/user/${uid}`, {headers: {'ngrok-skip-browser-warning':'true'}}).then(r=>r.json()).then(setData);
  const loadKassa = () => fetch(`${API_URL}/kassa`, {headers: {'ngrok-skip-browser-warning':'true'}}).then(r=>r.json()).then(setKassa);
  const loadCard = () => fetch(`${API_URL}/config/card`, {headers: {'ngrok-skip-browser-warning':'true'}}).then(r=>r.json()).then(setCard);
  const loadMentors = () => fetch(`${API_URL}/mentors`, {headers: {'ngrok-skip-browser-warning':'true'}}).then(r=>r.json()).then(setMentors);

  const switchTab = (t) => { playSound('tab'); setTab(t); window.Telegram.WebApp.HapticFeedback.selectionChanged(); }

  // Game Logic
  const doSpin = async () => {
    if(data.spins < 1) return alert("Нет спинов!");
    setSpinAnim(true);
    playSound('spin');
    
    try {
        const res = await fetch(`${API_URL}/rocket/spin`, {
            method: 'POST', headers: {'Content-Type':'application/json', 'ngrok-skip-browser-warning':'true'},
            body: JSON.stringify({user_id: data.id})
        });
        const json = await res.json();
        
        setTimeout(() => {
            setSpinAnim(false);
            if(json.error) return alert(json.error);
            
            // Обновляем спины локально
            setData(prev => ({...prev, spins: json.spins_left}));
            
            if(json.type !== 'empty') {
                setWinData({type: json.type, val: json.value});
                playSound('win');
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            } else {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
        }, 2000); // 2 сек анимации
    } catch(e) { setSpinAnim(false); }
  };

  const sendStatus = async (e) => {
      e.preventDefault();
      const text = e.target.status.value;
      await fetch(`${API_URL}/rocket/status`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({user_id: data.id, text})
      });
      alert("Отправлено админу на проверку!");
      setWinData(null);
  };

  if(!data) return <div className="loader">SAVAGE TEAM...</div>;

  return (
    <div className="app-container">
      {/* --- HEADER --- */}
      <div className="neon-header">
         SAVAGE <span style={{color:'var(--acc)'}}>TEAM</span>
         <div className="online-dot"></div>
      </div>

      {/* --- PROFILE TAB --- */}
      {tab === 'profile' && (
        <div className="fade-in">
           <div className="profile-card glass">
              <div className="avatar-area">
                 <div className="avatar">🦈</div>
                 <div className="level-badge">LEVEL {Math.floor(data.profits_count / 10) + 1}</div>
              </div>
              <div className="p-info">
                 <div className="p-name">{data.username}</div>
                 <div className="p-id">ID: {data.id}</div>
                 {data.is_fake && <div className="fake-badge">FAKETAG ON</div>}
              </div>
           </div>

           <div className="stats-grid">
              <div className="stat-box">
                 <div className="s-label">БАЛАНС</div>
                 <div className="s-val neon">{data.balance.toLocaleString()} ₽</div>
              </div>
              <div className="stat-box">
                 <div className="s-label">СПИНЫ</div>
                 <div className="s-val" style={{color:'#ff0055'}}>{data.spins}</div>
              </div>
           </div>

           <div className="glass kassa-full">
              <h3>💵 ЛИЧНАЯ КАССА</h3>
              <div className="row"><span>Сегодня:</span> <b>{data.stats.day.toLocaleString()} ₽</b></div>
              <div className="row"><span>Неделя:</span> <b>{data.stats.week.toLocaleString()} ₽</b></div>
              <div className="row"><span>Месяц:</span> <b>{data.stats.month.toLocaleString()} ₽</b></div>
              <div className="row bt"><span>ВСЕГО:</span> <b className="neon">{data.stats.all.toLocaleString()} ₽</b></div>
           </div>
           
           {kassa && (
               <div className="glass kassa-team">
                  <h3>🌍 КАССА КОМАНДЫ</h3>
                  <div className="big-num">{kassa.all.sum.toLocaleString()} ₽</div>
                  <div className="sub-stat">Сегодня: {kassa.day.sum.toLocaleString()} ₽</div>
               </div>
           )}
        </div>
      )}

      {/* --- TOPS TAB --- */}
      {tab === 'tops' && (
         <div className="fade-in">
            <div className="tabs-switch">
               {['day','week','month','all'].map(p => (
                  <div key={p} className={`ts-item ${topPeriod===p?'act':''}`} onClick={()=>setTopPeriod(p)}>
                     {p.toUpperCase()}
                  </div>
               ))}
            </div>
            <div className="top-list glass">
               {tops.length === 0 ? <div style={{padding:20, textAlign:'center'}}>Пусто...</div> : 
                tops.map((u, i) => (
                  <div className="top-row" key={i}>
                     <div className="rank">{u.rank}</div>
                     <div className="t-name">{u.name}</div>
                     <div className="t-val">{u.amount.toLocaleString()} ₽</div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* --- GAME TAB --- */}
      {tab === 'game' && (
         <div className="fade-in game-screen">
            <h1 className="game-title">ROCKET <span>SPIN</span></h1>
            <div className={`rocket-container ${spinAnim ? 'shake' : ''}`}>
                <div className="rocket-emoji" style={{transform: spinAnim ? 'translateY(-100px) scale(1.2)' : 'none'}}>🚀</div>
            </div>
            <button className="spin-btn" onClick={doSpin} disabled={spinAnim}>
               {spinAnim ? "LETS GO..." : `КРУТИТЬ (${data.spins})`}
            </button>
            <div className="prizes-list">
               <div>🎁 Статус (30%)</div>
               <div>💵 0.5$ (10%)</div>
               <div>💩 Пусто (60%)</div>
            </div>
         </div>
      )}

      {/* --- CARD TAB --- */}
      {tab === 'card' && card && (
         <div className="fade-in">
            <div className="credit-card">
               <div className="bank-name">{card.bank}</div>
               <div className="chip"></div>
               <div className="card-num" onClick={()=>{navigator.clipboard.writeText(card.number); alert('Скопировано!')}}>
                  {card.number} <span style={{fontSize:12}}>📋</span>
               </div>
               <div className="card-fio">{card.fio}</div>
               <div className="limits">Лимиты: {card.min} - {card.max} ₽</div>
            </div>
            <div className="info-txt">
               ⚠️ Всегда сверяйте карту перед переводом! Нажмите на номер, чтобы скопировать.
            </div>
         </div>
      )}

      {/* --- SERVICES / MENTORS --- */}
      {tab === 'services' && (
         <div className="fade-in services-grid">
            {SERVICES.map((s,i) => (
               <a key={i} href={s.u} className="service-card">
                  <div className="s-icon">🤖</div>
                  <div className="s-title">{s.t}</div>
               </a>
            ))}
         </div>
      )}
      
      {tab === 'mentor' && (
         <div className="fade-in">
            <h2>Наставники</h2>
            {mentors.map(m => (
                <div key={m.id} className="glass mentor-card">
                    <img src={m.image_url} alt="" className="m-img"/>
                    <div style={{padding:10}}>
                        <h3>{m.name}</h3>
                        <div className="m-tag">{m.directions}</div>
                        <p>{m.info}</p>
                        <div className="fee">Процент: {m.fee_percent}%</div>
                    </div>
                </div>
            ))}
         </div>
      )}

      {/* --- МЕНЮ --- */}
      <div className="nav-bar">
         <btn className={tab==='profile'?'act':''} onClick={()=>switchTab('profile')}>🆔</btn>
         <btn className={tab==='card'?'act':''} onClick={()=>switchTab('card')}>💳</btn>
         <btn className={tab==='tops'?'act':''} onClick={()=>switchTab('tops')}>🏆</btn>
         <btn className={tab==='game'?'act':''} onClick={()=>switchTab('game')}>🚀</btn>
         <btn className={tab==='services'?'act':''} onClick={()=>switchTab('services')}>🛠</btn>
         <btn className={tab==='mentor'?'act':''} onClick={()=>switchTab('mentor')}>👨‍🏫</btn>
      </div>

      {winData && (
         <div className="modal" onClick={()=>setWinData(null)}>
            <div className="win-box" onClick={e=>e.stopPropagation()}>
               <div className="glow"></div>
               <h2>{winData.type==='money'?'ДЕНЬГИ!':'СТАТУС!'}</h2>
               {winData.type==='money' ? <h1>0.5$ Check</h1> : (
                   <form onSubmit={sendStatus}>
                       <p>Введите желаемый статус:</p>
                       <input name="status" placeholder="BOSS" maxLength={15} autoFocus/>
                       <button>ОТПРАВИТЬ АДМИНУ</button>
                   </form>
               )}
               {winData.type==='money' && <p>Админ пришлет чек в ЛС.</p>}
            </div>
         </div>
      )}
    </div>
  );
}

export default App;