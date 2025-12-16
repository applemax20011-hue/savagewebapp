import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import './index.css';

// ⚠️ ССЫЛКА NGROK
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev/api";

const SOUNDS = {
  win: "https://cdn.freesound.org/previews/270/270402_5123851-lq.mp3",
  spin: "https://cdn.freesound.org/previews/45/45903_232777-lq.mp3",
};
const playSound = (k) => { try { const a = new Audio(SOUNDS[k]); a.volume=0.4; a.play().catch(()=>{}); } catch(e){} };

// Словарь ачивок
const ACH_MAP = {
    "first_profit": { t: "Первая кровь", i: "🩸" },
    "cash_100k": { t: "Акула Бизнеса", i: "🦈" },
    "cash_500k": { t: "Миллионер", i: "💰" },
    "top_1": { t: "Царь Горы", i: "👑" },
    "week_survivor": { t: "Выживший", i: "🔥" }
};

const ITEMS = [
  { id: 'empty', name: "💀", color: '#444' },
  { id: 'check', name: "💵", color: '#10b981' },
  { id: 'status', name: "💎", color: '#d946ef' }
];

function App() {
  const [tab, setTab] = useState('profile');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Game
  const [spinning, setSpinning] = useState(false);
  const [cards, setCards] = useState([]);
  const [offset, setOffset] = useState(0);
  const [winData, setWinData] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [statusSent, setStatusSent] = useState(false);
  const [topTab, setTopTab] = useState('day'); // day, week, month, all

  // Mentor
  const [mentorForm, setMentorForm] = useState({ info: "", fee: 0 });

  const tg = window.Telegram?.WebApp;
  const uid = tg?.initDataUnsafe?.user?.id || 5839201122;

  useEffect(() => {
    if(tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#121212'); }
    fetchData();
    initGame();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/app_data/${uid}`, {headers:{"ngrok-skip-browser-warning":"true"}});
      const json = await res.json();
      if(!json.error) {
        setData(json);
        if(json.is_mentor) setMentorForm(json.mentor_panel);
      }
      setLoading(false);
    } catch(e) { console.error(e); }
  };

  const initGame = () => {
    let arr = [];
    for(let i=0; i<80; i++) arr.push({...ITEMS[Math.floor(Math.random()*ITEMS.length)], uid: Math.random()});
    setCards(arr);
  };

  const spin = async () => {
    if(spinning || data.user.spins < 1) return;
    setWinData(null); setStatusSent(false); setStatusText(""); setOffset(0); 
    
    setData(p => ({...p, user: {...p.user, spins: p.user.spins - 1}}));
    setSpinning(true);
    playSound('spin');

    try {
      const res = await fetch(`${API_URL}/play`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: uid })
      });
      const json = await res.json();
      const winner = ITEMS.find(i => i.id === json.winner_id);
      
      const newCards = [...cards]; newCards[60] = winner; setCards(newCards);

      const cardW = 110; 
      const center = window.innerWidth / 2;
      const target = (60 * cardW) + (cardW/2) - center + (Math.random()*40 - 20);
      
      setOffset(-target);

      setTimeout(() => {
        setSpinning(false);
        if(winner.id !== 'empty') {
           playSound('win');
           setWinData({ type: winner.id === 'check' ? 'money' : 'status', val: winner.name });
           confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
           if(tg) tg.HapticFeedback.notificationOccurred('success');
        }
      }, 5000);
    } catch(e) { setSpinning(false); setData(p => ({...p, user: {...p.user, spins: p.user.spins + 1}})); }
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
    await fetch(`${API_URL}/update_mentor`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ user_id: uid, info: formData.get('info'), fee: formData.get('fee') })
    });
    if(tg) tg.showAlert("Сохранено!");
  };

  // Компонент аватарки (умеет: tg фото для себя, mi.png как дефолт, авы для топов через API)
  const Avatar = ({ u = {}, self = false }) => {
      const [broken, setBroken] = useState(false);

      // фейк — маска (без фото)
      if (u.is_fake) return <div className="ava-ph fake">🎭</div>;

      const url = self
        ? (data?.user?.avatar_url || tg?.initDataUnsafe?.user?.photo_url || "/mi.png")
        : (u.id ? `${API_URL}/avatar/${u.id}` : null);

      if (url && !broken) {
        return <img src={url} className="ava" onError={() => setBroken(true)} />;
      }

      // красивые инициалы (fallback)
      const name = (u.name || u.username || 'User').toString();
      const letter = name[0] ? name[0].toUpperCase() : 'U';
      const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];
      const bg = colors[letter.charCodeAt(0) % colors.length];
      return <div className="ava-ph" style={{background: bg}}>{letter}</div>;
  };

  if(loading) return <div className="loader">SAVAGE OS</div>;

  return (
    <div className="app-container">
      
      {/* --- ПРОФИЛЬ --- */}
      {tab === 'profile' && (
         <div className="page animate-up">
            <div className="profile-header">
               <div className="ph-top">
                   <div className="ph-id">ID: {data.user.id}</div>
                   <div className="ph-role">{data.user.status}</div>
               </div>
               <div className="ph-main">
                   <Avatar self={true} />
                   <div className="ph-names">
                       <div className="ph-nick">{data.user.real_username}</div>
                        {data.user.fake_tag && data.user.fake_enabled ? (
                          <div className="ph-faketag">{data.user.fake_tag}</div>
                        ) : null}
                       <div className="ph-mentor">Наставник: {data.user.mentor}</div>
                   </div>
               </div>
               
               <div className="total-block">
                   <div className="tb-label">Общий профит</div>
                   <div className="tb-val">{data.user.total_earned.toLocaleString()} ₽</div>
               </div>
            </div>

            <div className="stats-grid">
               <div className="st-item">
                   <span>Текущий баланс</span>
                   <b>{data.user.balance.toLocaleString()} ₽</b>
               </div>
               <div className="st-item">
                   <span>Профитов</span>
                   <b>{data.user.profits_count}</b>
               </div>
               <div className="st-item">
                   <span>В тиме</span>
                   <b>{data.user.days_with_us} дн.</b>
               </div>
            </div>

            <h3 className="section-head">ИСТОРИЯ ОПЕРАЦИЙ</h3>
            <div className="hist-list">
               {data.history.map((h,i) => (
                  <div key={i} className="h-card">
                     <div className="h-left">
                        <div className="h-serv">{h.service}</div>
                        <div className="h-date">{h.date}</div>
                     </div>
                     <div className="h-sum">+{h.sum.toLocaleString()} ₽</div>
                  </div>
               ))}
               {data.history.length === 0 && <div className="empty">Операций пока нет</div>}
            </div>
         </div>
      )}

      {/* --- КАРТА --- */}
      {tab === 'card' && (
         <div className="page animate-up">
            <h3 className="section-head">РЕКВИЗИТЫ</h3>
            <div className="card-vis" onClick={() => {navigator.clipboard.writeText(data.card.number); if(tg) tg.showAlert('Скопировано');}}>
               <div className="bank-logo">{data.card.bank}</div>
               <div className="card-chip"></div>
               <div className="card-number">{data.card.number}</div>
               <div className="card-holder">{data.card.fio}</div>
               <div className="card-copy">Нажми чтобы скопировать</div>
            </div>
         </div>
      )}

      {/* --- ТОПЫ --- */}
      {tab === 'tops' && (
         <div className="page animate-up">
            <div className="total-kassa">
                <span>ОБЩАЯ КАССА ПРОЕКТА</span>
                <b>{data.kassa.toLocaleString()} ₽</b>
            </div>

            <div className="top-tabs">
                <div className={topTab==='day'?'active':''} onClick={()=>setTopTab('day')}>День</div>
                <div className={topTab==='week'?'active':''} onClick={()=>setTopTab('week')}>Неделя</div>
                 <div className={topTab==='month'?'active':''} onClick={()=>setTopTab('month')}>Месяц</div>
                <div className={topTab==='all'?'active':''} onClick={()=>setTopTab('all')}>Все время</div>
            </div>

            <div className="top-list">
               {(data.tops[topTab] || []).map((u,i) => (
                  <div key={i} className="top-row">
                     <div className="tr-rank">{i+1}</div>
                     <Avatar u={u} />
                     <div className="tr-info">
                         <div className="tr-name">{u.name}</div>
                         <div className="tr-sum">{u.sum.toLocaleString()} ₽</div>
                     </div>
                  </div>
               ))}
               {(data.tops[topTab] || []).length === 0 && <div className="empty">Пока пусто...</div>}
            </div>
         </div>
      )}

      {/* --- РАКЕТКА --- */}
      {tab === 'game' && (
         <div className="page animate-up game-center">
            <h1 className="rocket-title">РАКЕТКА</h1>
            <div className="roulette-box">
               <div className="arrow-down"></div>
               <div className="track" style={{
                   transform: `translateX(${offset}px)`, 
                   transition: spinning ? 'transform 5s cubic-bezier(0.1,0,0.1,1)' : 'none'
               }}>
                  {cards.map((c,i)=>(
                     <div key={i} className="r-card" style={{borderBottom: `3px solid ${c.color}`}}>
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

      {/* --- АЧИВКИ --- */}
      {tab === 'ach' && (
         <div className="page animate-up">
            <h3 className="section-head">ДОСТИЖЕНИЯ</h3>
            <div className="ach-list">
               {data.achievements.map((key,i) => {
                  const info = ACH_MAP[key] || {t: key, i: '🏅'};
                  return (
                      <div key={i} className="ach-card">
                          <div className="ach-icon">{info.i}</div>
                          <div className="ach-name">{info.t}</div>
                      </div>
                  )
               })}
               {data.achievements.length === 0 && <div className="empty">У вас пока нет достижений</div>}
            </div>
         </div>
      )}

      {/* --- СЕРВИСЫ --- */}
      {tab === 'services' && (
         <div className="page animate-up">
            <h3 className="section-head">СЕРВИСЫ</h3>
            <div className="serv-grid">
               {data.services.map((s,i)=>(
                  <a key={i} href={s.u} className="serv-btn">
                     {s.t}
                  </a>
               ))}
            </div>
         </div>
      )}

      {/* --- МЕНТОР --- */}
      {tab === 'mentor' && data.is_mentor && (
         <div className="page animate-up">
            <h3 className="section-head">ПАНЕЛЬ НАСТАВНИКА</h3>
            <div className="m-stats">
                 <div><span>Оборот:</span> <b>{data.mentor_panel.turnover.toLocaleString()} ₽</b></div>
                 <div><span>Учеников:</span> <b>{data.mentor_panel.students.length}</b></div>
            </div>
            
            <form onSubmit={saveMentor} className="m-form">
                <label>Инфо:</label>
                <textarea name="info" defaultValue={mentorForm.info}></textarea>
                <label>Процент:</label>
                <input name="fee" type="number" defaultValue={mentorForm.fee}/>
                <button>СОХРАНИТЬ</button>
            </form>

            <h4 style={{marginTop:20}}>Мои ученики:</h4>
            {data.mentor_panel.students.map((s,i)=>(
                <div key={i} className="st-row">
                    <div>{s.name}</div>
                    <b>{s.balance} ₽</b>
                </div>
            ))}
         </div>
      )}

      {/* --- НАВИГАЦИЯ --- */}
      <div className="tab-bar">
         <div className={tab==='profile'?'active':''} onClick={()=>setTab('profile')}>Профиль</div>
         <div className={tab==='card'?'active':''} onClick={()=>setTab('card')}>Карта</div>
         <div className={tab==='tops'?'active':''} onClick={()=>setTab('tops')}>Топы</div>
         <div className={tab==='game'?'active':''} onClick={()=>setTab('game')}>Ракетка</div>
         <div className={tab==='ach'?'active':''} onClick={()=>setTab('ach')}>Ачивки</div>
         <div className={tab==='services'?'active':''} onClick={()=>setTab('services')}>Сервисы</div>
         {data.is_mentor && <div className={tab==='mentor'?'active':''} onClick={()=>setTab('mentor')}>Ментор</div>}
      </div>

      {/* WIN MODAL */}
      {winData && (
         <div className="modal-overlay" onClick={()=>setWinData(null)}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
               <h2>{winData.type==='money'?'ВЫИГРЫШ!':'СТАТУС!'}</h2>
               {winData.type==='money' ? <h1>{winData.val}</h1> : <p>Теперь вы можете сменить статус!</p>}
               {winData.type==='status' && !statusSent && (
                  <div className="st-box">
                     <input placeholder="Текст..." onChange={e=>setStatusText(e.target.value)} maxLength={15}/>
                     <button onClick={sendStatus}>ОТПРАВИТЬ</button>
                  </div>
               )}
               {statusSent && <div className="ok">Отправлено!</div>}
               <button className="close" onClick={()=>setWinData(null)}>ЗАКРЫТЬ</button>
            </div>
         </div>
      )}
    </div>
  );
}

export default App;