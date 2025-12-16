import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import './index.css';

// ==========================================
// 🛠 НАСТРОЙКИ (ВКЛЮЧИ ЭТО ДЛЯ ТЕСТОВ)
// ==========================================
const USE_TEST_MODE = true; // <--- TRUE = Работает без сервера / FALSE = Работает с ботом
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev/api"; 

// ==========================================
// 🧪 ТЕСТОВЫЕ ДАННЫЕ (ЧТОБЫ НЕ ВКЛЮЧАТЬ БОТА)
// ==========================================
const TEST_DATA = {
    user: {
        id: 5839201122,
        username: "@SavageBoss",
        fake_tag: "#VIP_KING", // Если убрать, будет ник
        real_username: "SavageBoss",
        balance: 193720,
        total_earned: 520000,
        profits_count: 49,
        spins: 10,
        status: "Легенда",
        mentor: "BestMentor",
        days_with_us: 142
    },
    history: [
        { service: "📊 Биржа OKX", date: "Сегодня, 14:20", sum: 15000 },
        { service: "🔞 Escort", date: "Вчера, 19:40", sum: 5400 },
        { service: "💊 Shop Bot", date: "12.12.2023", sum: 3200 },
        { service: "🌐 Web Trade", date: "10.12.2023", sum: 50000 },
        { service: "🖼 NFT Scam", date: "09.12.2023", sum: 1200 },
    ],
    is_mentor: true,
    mentor_panel: {
        students: [
            { name: "@mammoth1", balance: 5000 },
            { name: "@shark_biz", balance: 124000 },
            { name: "Аноним", balance: 0 }
        ],
        turnover: 129000,
        fee: 15,
        info: "Обучаю жесткому ворку. Писать в ЛС."
    },
    tops: {
        day: [
            { name: "#KINGS", is_fake: true, sum: 54000 },
            { name: "@SavageBoss", is_fake: false, sum: 15000 },
            { name: "Hidden", is_fake: false, sum: 4000 },
        ],
        week: [
            { name: "@SavageBoss", is_fake: false, sum: 193000 },
            { name: "#KINGS", is_fake: true, sum: 120000 },
        ],
        month: [],
        all: []
    },
    kassa: 4593200,
    card: {
        number: "2200 7004 1234 5678",
        bank: "Т-Банк",
        fio: "ИВАН И."
    },
    achievements: ["first_profit", "cash_100k", "top_1"],
    services: [
        { t: "📊 Обмен OKX", u: "#" },
        { t: "🌐 Web Trade", u: "#" },
        { t: "💊 Наркошоп", u: "#" },
        { t: "🆘 Поддержка", u: "#" }
    ]
};

// Звуки
const SOUNDS = {
  spin: "https://cdn.freesound.org/previews/45/45903_232777-lq.mp3",
  win: "https://cdn.freesound.org/previews/270/270402_5123851-lq.mp3",
};
const playSound = (k) => { try { const a = new Audio(SOUNDS[k]); a.volume=0.4; a.play().catch(()=>{}); } catch(e){} };

const ITEMS = [
  { id: 'empty', name: "💀", color: '#444' },
  { id: 'check', name: "💵", color: '#10b981' },
  { id: 'status', name: "💎", color: '#d946ef' }
];

const ACH_NAMES = {
    "first_profit": "Первая кровь 🩸",
    "cash_100k": "Акула бизнеса 🦈",
    "cash_500k": "Миллионер 💰",
    "top_1": "Легенда 👑",
    "week_survivor": "Выживший 🔥"
};

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
  const [topTab, setTopTab] = useState('day');
  const [fastMode, setFastMode] = useState(false);

  // Mentor
  const [mentorForm, setMentorForm] = useState({ info: "", fee: 0 });

  const tg = window.Telegram?.WebApp;
  const uid = tg?.initDataUnsafe?.user?.id || 5839201122;

  useEffect(() => {
    // Безопасная инициализация Telegram
    if(tg) { 
        try {
            tg.ready(); 
            tg.expand(); 
            // setHeaderColor может падать в браузере, оборачиваем
            try { tg.setHeaderColor('#121212'); } catch(e){}
        } catch(e) {
            console.log("Запущено не в телеграм");
        }
    }
    
    fetchData();
    initGame();
  }, []);

  const fetchData = async () => {
    // --- РЕЖИМ ТЕСТИРОВАНИЯ ---
    if (USE_TEST_MODE) {
        console.log("⚠️ ВКЛЮЧЕН ТЕСТОВЫЙ РЕЖИМ (ДАННЫЕ ФЕЙКОВЫЕ)");
        setTimeout(() => {
            setData(TEST_DATA);
            if(TEST_DATA.is_mentor) setMentorForm(TEST_DATA.mentor_panel);
            setLoading(false);
        }, 1000); // Имитация загрузки 1 сек
        return;
    }
    // ---------------------------

    try {
      const res = await fetch(`${API_URL}/app_data/${uid}`, {headers:{"ngrok-skip-browser-warning":"true"}});
      const json = await res.json();
      if(!json.error) {
        setData(json);
        if(json.is_mentor) setMentorForm(json.mentor_panel);
      }
      setLoading(false);
    } catch(e) { 
        console.error(e);
        // Если ошибка сети - можно показать заглушку или алерт
    }
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
    if(!fastMode) playSound('spin');

    // --- ЛОГИКА ВРАЩЕНИЯ ---
    let winnerId = 'empty';

    if (USE_TEST_MODE) {
        // Симуляция выигрыша в тесте
        winnerId = Math.random() > 0.5 ? 'check' : 'empty'; 
    } else {
        try {
            const res = await fetch(`${API_URL}/play`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ user_id: uid })
            });
            const json = await res.json();
            winnerId = json.winner_id;
        } catch(e) {
            setSpinning(false);
            return;
        }
    }

    const winner = ITEMS.find(i => i.id === winnerId);
    const newCards = [...cards]; 
    newCards[60] = winner; 
    setCards(newCards);

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
           if(tg) try { tg.HapticFeedback.notificationOccurred('success'); } catch(e){}
        } else {
           if(tg) try { tg.HapticFeedback.impactOccurred('light'); } catch(e){}
        }
    }, fastMode ? 500 : 5000);
  };

  const sendStatus = async () => {
    if(!statusText) return;
    if (!USE_TEST_MODE) {
        await fetch(`${API_URL}/send_status`, {
           method: 'POST', headers: {'Content-Type':'application/json'},
           body: JSON.stringify({ user_id: uid, username: data.user.real_username, text: statusText })
        });
    }
    setStatusSent(true);
  };

  const saveMentor = async (e) => {
    e.preventDefault();
    if (!USE_TEST_MODE) {
        const formData = new FormData(e.target);
        await fetch(`${API_URL}/update_mentor`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ user_id: uid, info: formData.get('info'), fee: formData.get('fee') })
        });
    }
    alert("Настройки сохранены (Тест)");
  };

  // Компонент аватарки
  const Avatar = ({ u, self }) => {
      // Если я в тесте - фото не будет, ставим заглушку
      if (self && !USE_TEST_MODE && tg?.initDataUnsafe?.user?.photo_url) {
          return <img src={tg.initDataUnsafe.user.photo_url} className="ava" />;
      }
      if (u.is_fake) return <div className="ava-ph fake">🎭</div>;
      
      const letter = u.name[1] ? u.name[1].toUpperCase() : 'U';
      const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];
      const bg = colors[letter.charCodeAt(0) % colors.length];
      return <div className="ava-ph" style={{background: bg}}>{letter}</div>;
  };

  if(loading) return <div className="loader">SAVAGE TEAM<br/><span>Загрузка...</span></div>;

  return (
    <div className="app-container">
      
      {/* --- 1. ПРОФИЛЬ --- */}
      {tab === 'profile' && (
         <div className="page animate-up">
            <div className="profile-header">
               <div className="ph-top">
                   <div className="ph-badge">{data.user.status}</div>
                   <div className="ph-id">ID: {data.user.id}</div>
               </div>
               
               <div className="ph-main">
                   <Avatar u={{name: data.user.username}} self={true} />
                   <div className="ph-info">
                       <div className="ph-nick">{data.user.username}</div>
                       {/* Показываем фейк тег */}
                       {data.user.fake_tag && <div className="ph-tag">Fake: {data.user.fake_tag}</div>}
                       <div className="ph-ment">Наставник: {data.user.mentor}</div>
                   </div>
               </div>

               <div className="balance-card">
                   <div className="bc-label">ОБЩИЙ ПРОФИТ</div>
                   <div className="bc-val">{data.user.total_earned.toLocaleString()} ₽</div>
                   <div className="bc-sub">Всего профитов: {data.user.profits_count}</div>
               </div>
            </div>

            <div className="stats-grid">
               <div className="st-item">
                   <span>Текущий баланс</span>
                   <b>{data.user.balance.toLocaleString()} ₽</b>
               </div>
               <div className="st-item">
                   <span>Спинов</span>
                   <b>{data.user.spins}</b>
               </div>
               <div className="st-item">
                   <span>В тиме</span>
                   <b>{data.user.days_with_us} дн.</b>
               </div>
            </div>

            <h3 className="section-head">ИСТОРИЯ ПРОФИТОВ</h3>
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
               {data.history.length === 0 && <div className="empty">Профитов пока нет</div>}
            </div>
         </div>
      )}

      {/* --- 2. КАРТА --- */}
      {tab === 'card' && (
         <div className="page animate-up">
            <h3 className="section-head">РЕКВИЗИТЫ ДЛЯ ЗАЛИВА</h3>
            <div className="bank-card" onClick={() => {navigator.clipboard.writeText(data.card.number); alert('Скопировано');}}>
               <div className="bc-bank">{data.card.bank}</div>
               <div className="bc-chip"></div>
               <div className="bc-num">{data.card.number}</div>
               <div className="bc-holder">{data.card.fio}</div>
               <div className="bc-copy">Нажми чтобы скопировать</div>
            </div>
            <div className="hint-text">Всегда сверяйте реквизиты перед переводом!</div>
         </div>
      )}

      {/* --- 3. ТОПЫ --- */}
      {tab === 'tops' && (
         <div className="page animate-up">
            <div className="kassa-block">
                <span>ОБЩАЯ КАССА ПРОЕКТА</span>
                <b>{data.kassa.toLocaleString()} ₽</b>
            </div>

            <div className="tabs-row">
                {['day', 'week', 'month', 'all'].map(t => (
                    <div key={t} className={`tab-pill ${topTab===t?'active':''}`} onClick={()=>setTopTab(t)}>
                        {t==='day'?'День':t==='week'?'Неделя':t==='month'?'Месяц':'Все'}
                    </div>
                ))}
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
               {(data.tops[topTab] || []).length === 0 && <div className="empty">Тут пока пусто...</div>}
            </div>
         </div>
      )}

      {/* --- 4. РАКЕТКА --- */}
      {tab === 'game' && (
         <div className="page animate-up game-center">
            <h1 className="rocket-title">РАКЕТКА</h1>
            
            <div className="controls-top">
                <div className={`toggle ${fastMode ? 'active' : ''}`} onClick={() => setFastMode(!fastMode)}>
                    ⚡ ТУРБО
                </div>
            </div>

            <div className="roulette-box">
               <div className="arrow-down"></div>
               <div className="track" style={{
                   transform: `translateX(${offset}px)`, 
                   transition: spinning ? `transform ${fastMode ? 0.5 : 5}s cubic-bezier(0.1,0,0.1,1)` : 'none'
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
            <div className="hint-text">1 профит = 1 спин. Призы: Статус, Деньги.</div>
         </div>
      )}

      {/* --- 5. ИНФО (Сервисы + Ачивки) --- */}
      {tab === 'info' && (
         <div className="page animate-up">
            <h3 className="section-head">СЕРВИСЫ И БОТЫ</h3>
            <div className="serv-grid">
               {data.services.map((s,i)=>(
                  <a key={i} href={s.u} className="serv-btn">
                     {s.t}
                  </a>
               ))}
            </div>

            <h3 className="section-head" style={{marginTop: 30}}>ТВОИ ДОСТИЖЕНИЯ</h3>
            <div className="ach-list">
               {data.achievements.map((key,i) => {
                  const name = ACH_NAMES[key] || key;
                  return (
                      <div key={i} className="ach-card">
                          🏆 {name}
                      </div>
                  )
               })}
               {data.achievements.length === 0 && <div className="empty">Нет достижений</div>}
            </div>
         </div>
      )}

      {/* --- 6. МЕНТОР --- */}
      {tab === 'mentor' && data.is_mentor && (
         <div className="page animate-up">
            <h3 className="section-head">КАБИНЕТ НАСТАВНИКА</h3>
            <div className="m-stats">
                 <div className="ms-item"><span>Оборот</span> <b>{data.mentor_panel.turnover.toLocaleString()} ₽</b></div>
                 <div className="ms-item"><span>Ученики</span> <b>{data.mentor_panel.students.length}</b></div>
            </div>
            
            <form onSubmit={saveMentor} className="m-form">
                <label>Информация о себе:</label>
                <textarea name="info" defaultValue={mentorForm.info}></textarea>
                <label>Твой процент (%):</label>
                <input name="fee" type="number" defaultValue={mentorForm.fee}/>
                <button>СОХРАНИТЬ ИЗМЕНЕНИЯ</button>
            </form>

            <h4 style={{marginTop:20, color:'#888'}}>СПИСОК УЧЕНИКОВ</h4>
            <div className="st-list">
                {data.mentor_panel.students.map((s,i)=>(
                    <div key={i} className="st-row">
                        <div>{s.name}</div>
                        <b>{s.balance.toLocaleString()} ₽</b>
                    </div>
                ))}
            </div>
         </div>
      )}

      {/* --- НАВИГАЦИЯ --- */}
      <div className="tab-bar">
         <div className={tab==='profile'?'active':''} onClick={()=>setTab('profile')}>Профиль</div>
         <div className={tab==='card'?'active':''} onClick={()=>setTab('card')}>Карта</div>
         <div className={tab==='tops'?'active':''} onClick={()=>setTab('tops')}>Топы</div>
         <div className={tab==='game'?'active':''} onClick={()=>setTab('game')}>Ракетка</div>
         <div className={tab==='info'?'active':''} onClick={()=>setTab('info')}>Инфо</div>
         {data.is_mentor && <div className={tab==='mentor'?'active':''} onClick={()=>setTab('mentor')}>Ментор</div>}
      </div>

      {/* MODAL WIN */}
      {winData && (
         <div className="modal-overlay" onClick={()=>setWinData(null)}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
               <div className="glow"></div>
               <h2>{winData.type==='money'?'ВЫИГРЫШ!':'ПОБЕДА!'}</h2>
               {winData.type==='money' ? <h1>{winData.val}</h1> : <p>Вы выиграли смену статуса!</p>}
               
               {winData.type==='status' && !statusSent && (
                  <div className="st-box">
                     <input placeholder="Новый статус..." onChange={e=>setStatusText(e.target.value)} maxLength={15}/>
                     <button onClick={sendStatus}>ОТПРАВИТЬ АДМИНУ</button>
                  </div>
               )}
               {statusSent && <div className="ok">✅ Заявка отправлена</div>}
               {winData.type === 'money' && <p className="sub">Ожидайте выплату чеком от администратора.</p>}
               
               <button className="close" onClick={()=>setWinData(null)}>ЗАКРЫТЬ</button>
            </div>
         </div>
      )}
    </div>
  );
}

export default App;