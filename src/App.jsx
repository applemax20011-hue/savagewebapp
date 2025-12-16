import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import './index.css';

// ⚠️⚠️⚠️ ОБЯЗАТЕЛЬНО ВСТАВЬ СЮДА СВОЮ NGROK ССЫЛКУ! ⚠️⚠️⚠️
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev/api";

// Звуковые эффекты
const SOUNDS = {
  click: "https://cdn.freesound.org/previews/256/256116_3263906-lq.mp3",
  win: "https://cdn.freesound.org/previews/270/270402_5123851-lq.mp3",
  spin: "https://cdn.freesound.org/previews/45/45903_232777-lq.mp3",
  tab: "https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3"
};
const playSound = (k) => { 
    try { const a = new Audio(SOUNDS[k]); a.volume=0.3; a.currentTime=0; a.play().catch(()=>{}); } catch(e){} 
};

// Предметы рулетки
const ITEMS = [
  { id: 'empty', name: "💀", color: '#333' },
  { id: 'check', name: "💵", color: '#00ff41' },
  { id: 'status', name: "💎", color: '#d946ef' }
];

function App() {
  const [tab, setTab] = useState('profile');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Состояния игры
  const [spinning, setSpinning] = useState(false);
  const [cards, setCards] = useState([]);
  const [offset, setOffset] = useState(0);
  const [winData, setWinData] = useState(null); 
  const [statusText, setStatusText] = useState("");
  const [statusSent, setStatusSent] = useState(false);
  const [fastMode, setFastMode] = useState(false);

  // Ментор
  const [mentorForm, setMentorForm] = useState({ info: "", fee: 0 });

  const tg = window.Telegram?.WebApp;
  const uid = tg?.initDataUnsafe?.user?.id || 5839201122; // Тестовый ID если не в ТГ

  useEffect(() => {
    if(tg) { 
        tg.ready(); 
        tg.expand(); 
        tg.setHeaderColor('#050505'); // Черная шапка
    }
    fetchData();
    initGame();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/app_data/${uid}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      const json = await res.json();
      
      if(!json.error) {
        setData(json);
        if(json.is_mentor) setMentorForm(json.mentor_panel);
      }
      setLoading(false);
    } catch(e) { 
        console.error("Ошибка загрузки:", e);
        // Не убираем лоадер, чтобы юзер видел что грузится (или добавить экран ошибки)
    }
  };

  const initGame = () => {
    let arr = [];
    for(let i=0; i<80; i++) arr.push({...ITEMS[Math.floor(Math.random()*ITEMS.length)], uid: Math.random()});
    setCards(arr);
  };

  const switchTab = (t) => { playSound('tab'); setTab(t); };

  const spin = async () => {
    if(spinning || data.user.spins < 1) return;
    setWinData(null); setStatusSent(false); setStatusText("");
    setOffset(0); 
    
    // Оптимистичное обновление спинов
    setData(p => ({...p, user: {...p.user, spins: p.user.spins - 1}}));
    setSpinning(true);
    if(!fastMode) playSound('spin');

    try {
      const res = await fetch(`${API_URL}/play`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: uid })
      });
      const json = await res.json();
      const winner = ITEMS.find(i => i.id === json.winner_id);
      
      // Подкручиваем ленту
      const newCards = [...cards];
      newCards[60] = winner;
      setCards(newCards);

      // Анимация
      const cardW = 110; 
      const center = window.innerWidth / 2;
      // Немного рандома для реалистичности остановки
      const randomOffset = Math.floor(Math.random() * 40) - 20;
      const target = (60 * cardW) + (cardW/2) - center + randomOffset;
      
      setOffset(-target);

      setTimeout(() => {
        setSpinning(false);
        if(winner.id !== 'empty') {
           playSound('win');
           setWinData({ type: winner.id === 'check' ? 'money' : 'status', val: winner.name });
           confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
           if(tg) tg.HapticFeedback.notificationOccurred('success');
        } else {
           if(tg) tg.HapticFeedback.impactOccurred('light');
        }
      }, fastMode ? 500 : 5000);

    } catch(e) { 
        setSpinning(false); 
        // Вернуть спин при ошибке
        setData(p => ({...p, user: {...p.user, spins: p.user.spins + 1}}));
    }
  };

  const sendStatus = async () => {
    if(!statusText) return;
    await fetch(`${API_URL}/send_status`, {
       method: 'POST', headers: {'Content-Type':'application/json'},
       body: JSON.stringify({ user_id: uid, username: data.user.real_username, text: statusText })
    });
    setStatusSent(true);
  };

  const saveMentor = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const info = formData.get('info');
    const fee = formData.get('fee');
    await fetch(`${API_URL}/update_mentor`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ user_id: uid, info, fee })
    });
    if(tg) tg.showAlert("Настройки сохранены!");
  };

  if(loading) return <div className="loader">SAVAGE OS<br/><span className="blink">LOADING...</span></div>;

  return (
    <div className="app-container">
      <div className="bg-anim"></div>
      
      {/* --- 1. ПРОФИЛЬ --- */}
      {tab === 'profile' && (
         <div className="page fade-in">
            <div className="id-card">
               <div className="id-top">
                  <div className="chip"></div>
                  <div className="logo">SAVAGE TEAM</div>
               </div>
               <div className="id-main">
                  <div className="ava-box">
                     {tg?.initDataUnsafe?.user?.photo_url ? 
                        <img src={tg.initDataUnsafe.user.photo_url} className="ava"/> : 
                        <div className="ava-ph">🦈</div>
                     }
                  </div>
                  <div className="info-box">
                     <div className="label">OPERATIVE</div>
                     {/* Если есть фейк тег - показываем его с глитчем */}
                     <div className="val glitch" data-text={data.user.fake_tag || data.user.username}>
                        {data.user.fake_tag || data.user.username}
                     </div>
                     <div className="row">
                        <div><span className="label">ID</span> {data.user.id}</div>
                        <div><span className="label">RANK</span> <span className="neon">{data.user.status}</span></div>
                     </div>
                  </div>
               </div>
               <div className="id-bot">MENTOR: {data.user.mentor}</div>
            </div>

            <div className="stats-row">
               <div className="s-card">
                  <div className="lbl">БАЛАНС</div>
                  <div className="val neon">{data.user.balance.toLocaleString()} ₽</div>
               </div>
               <div className="s-card">
                  <div className="lbl">ПРОФИТЫ</div>
                  <div className="val">{data.user.profits_count}</div>
               </div>
            </div>
            
            <div className="stats-row" style={{marginTop: 5}}>
               <div className="s-card">
                  <div className="lbl">ДНИ В ТИМЕ</div>
                  <div className="val">{data.user.days_with_us}</div>
               </div>
            </div>

            <h3 className="neon-header">ИСТОРИЯ (ПОСЛЕДНИЕ)</h3>
            <div className="hist-list">
               {data.history.map((h,i) => (
                  <div key={i} className="h-item">
                     <div>
                        <div className="h-serv">{h.service}</div>
                        <div className="h-date">{h.date}</div>
                     </div>
                     <div className="h-sum">+{h.sum.toLocaleString()} ₽</div>
                  </div>
               ))}
               {data.history.length === 0 && <div className="empty">Пусто...</div>}
            </div>
         </div>
      )}

      {/* --- 2. КАРТА --- */}
      {tab === 'card' && (
         <div className="page fade-in">
            <h3 className="neon-header">РЕКВИЗИТЫ</h3>
            <div className="credit-card" onClick={() => {navigator.clipboard.writeText(data.card.number); if(tg) tg.showAlert('Номер скопирован!');}}>
               <div className="bank-name">{data.card.bank}</div>
               <div className="chip"></div>
               <div className="card-num">{data.card.number}</div>
               <div className="card-fio">{data.card.fio}</div>
               <div className="copy-icon">📋</div>
            </div>
            <div className="hint">Нажми на карту, чтобы скопировать номер</div>
         </div>
      )}

      {/* --- 3. ТОПЫ --- */}
      {tab === 'tops' && (
         <div className="page fade-in">
            <div className="kassa-banner">
                <div className="lbl">ОБЩАЯ КАССА</div>
                <div className="val neon">{data.kassa.toLocaleString()} ₽</div>
            </div>

            <h3 className="neon-header">ТОП ЗА СЕГОДНЯ</h3>
            <div className="top-list">
               {data.top_day.map((u,i) => (
                  <div key={i} className="top-item">
                     <div className="rank">#{i+1}</div>
                     <div className={`name ${u.is_fake?'fake':''}`}>{u.name}</div>
                     <div className="score neon">{u.sum.toLocaleString()}</div>
                  </div>
               ))}
               {data.top_day.length === 0 && <div className="empty">Сегодня тихо...</div>}
            </div>

            <h3 className="neon-header">ТОП БОГАЧЕЙ</h3>
            <div className="top-list">
               {data.top_all.map((u,i) => (
                  <div key={i} className="top-item">
                     <div className="rank">#{i+1}</div>
                     <div className={`name ${u.is_fake?'fake':''}`}>{u.name}</div>
                     <div className="score neon">{u.sum.toLocaleString()}</div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* --- 4. ИГРА --- */}
      {tab === 'game' && (
         <div className="page fade-in game-wrap">
            <h1 className="glitch" data-text="CASINO">CASINO</h1>
            
            <div className="controls-top">
                <div className={`toggle ${fastMode ? 'active' : ''}`} onClick={() => setFastMode(!fastMode)}>
                    ⚡ ТУРБО
                </div>
            </div>

            <div className="roulette">
               <div className="pointer"></div>
               <div className="track" style={{
                   transform: `translateX(${offset}px)`, 
                   transition: spinning ? `transform ${fastMode ? 0.5 : 5}s cubic-bezier(0.1,0,0.1,1)` : 'none'
               }}>
                  {cards.map((c,i)=>(
                     <div key={i} className="card" style={{borderColor: c.color}}>
                        <div className="emoji">{c.name}</div>
                     </div>
                  ))}
               </div>
            </div>
            
            <button className="spin-btn" disabled={spinning} onClick={spin}>
               КРУТИТЬ ({data.user.spins})
            </button>
         </div>
      )}

      {/* --- 5. АЧИВКИ --- */}
      {tab === 'ach' && (
         <div className="page fade-in">
            <h3 className="neon-header">ДОСТИЖЕНИЯ</h3>
            <div className="ach-grid">
               {data.achievements.length > 0 ? data.achievements.map((a,i) => (
                  <div key={i} className="ach-item">
                      <div className="ach-icon">🏆</div>
                      <div className="ach-name">{a}</div>
                  </div>
               )) : <div className="empty">Нет достижений. Воркай!</div>}
            </div>
         </div>
      )}

      {/* --- 6. СЕРВИСЫ --- */}
      {tab === 'services' && (
         <div className="page fade-in">
            <h3 className="neon-header">СЕРВИСЫ & БОТЫ</h3>
            <div className="services-grid">
               {data.services.map((s,i)=>(
                  <a key={i} href={s.u} className="service-card">
                     <div className="s-title">{s.t}</div>
                  </a>
               ))}
            </div>
         </div>
      )}

      {/* --- 7. МЕНТОР (Только если is_mentor=true) --- */}
      {tab === 'mentor' && (
         <div className="page fade-in">
            <h3 className="neon-header">ПАНЕЛЬ НАСТАВНИКА</h3>
            {data.is_mentor && (
               <div className="mentor-dash">
                  <div className="mentor-stats">
                     <div className="s-card"><div className="lbl">ОБОРОТ</div><div className="val neon">{data.mentor_panel.turnover.toLocaleString()}</div></div>
                     <div className="s-card"><div className="lbl">УЧЕНИКИ</div><div className="val">{data.mentor_panel.students.length}</div></div>
                  </div>
                  
                  <div className="student-list-box">
                      <h4>Твои слоны 🐘</h4>
                      {data.mentor_panel.students.map((s, i) => (
                          <div key={i} className="st-row">
                              <div>{s.name}</div>
                              <div className="neon">{s.balance} ₽</div>
                          </div>
                      ))}
                  </div>

                  <form onSubmit={saveMentor} className="m-form">
                     <label>Инфо о себе:</label>
                     <textarea name="info" defaultValue={mentorForm.info} rows="3"></textarea>
                     <label>Твой процент:</label>
                     <input name="fee" type="number" defaultValue={mentorForm.fee}/>
                     <button>СОХРАНИТЬ</button>
                  </form>
               </div>
            )}
         </div>
      )}

      {/* --- МЕНЮ (TAB BAR) --- */}
      <div className="nav-bar">
         <div className={`nav-btn ${tab==='profile'?'act':''}`} onClick={()=>switchTab('profile')}>🆔</div>
         <div className={`nav-btn ${tab==='card'?'act':''}`} onClick={()=>switchTab('card')}>💳</div>
         <div className={`nav-btn ${tab==='tops'?'act':''}`} onClick={()=>switchTab('tops')}>🏆</div>
         <div className={`nav-btn ${tab==='game'?'act':''}`} onClick={()=>switchTab('game')}>🚀</div>
         <div className={`nav-btn ${tab==='ach'?'act':''}`} onClick={()=>switchTab('ach')}>🎖</div>
         <div className={`nav-btn ${tab==='services'?'act':''}`} onClick={()=>switchTab('services')}>🛠</div>
         {data.is_mentor && <div className={`nav-btn ${tab==='mentor'?'act':''}`} onClick={()=>switchTab('mentor')}>👨‍🏫</div>}
      </div>

      {/* Модалка выигрыша */}
      {winData && (
         <div className="modal" onClick={()=>setWinData(null)}>
            <div className="win-box" onClick={e=>e.stopPropagation()}>
               <div className="glow"></div>
               <h2>{winData.type==='money'?'ВЫИГРЫШ!':'СТАТУС!'}</h2>
               {winData.type==='money' ? <h1>{winData.val}</h1> : <div className="win-desc">Вы выиграли возможность установить кастомный статус!</div>}
               
               {winData.type==='status' && !statusSent && (
                  <div className="status-inp-box">
                     <input placeholder="Введи статус..." onChange={e=>setStatusText(e.target.value)} maxLength={15} autoFocus/>
                     <button onClick={sendStatus}>ОТПРАВИТЬ</button>
                  </div>
               )}
               {statusSent && <div className="ok">✅ Отправлено админу!</div>}
               {winData.type === 'money' && <p>Заявка на выплату отправлена админу.</p>}
               
               <button className="close-btn" onClick={() => setWinData(null)}>ЗАКРЫТЬ</button>
            </div>
         </div>
      )}
    </div>
  );
}

export default App;