import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import './index.css';

// ⚠️ NGROK URL
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev/api";

const SOUNDS = {
  spin: "https://cdn.freesound.org/previews/45/45903_232777-lq.mp3",
  win: "https://cdn.freesound.org/previews/270/270402_5123851-lq.mp3",
};
const playSound = (k) => { try { new Audio(SOUNDS[k]).play().catch(()=>{}); } catch(e){} };

const ITEMS = [
  { id: 'empty', name: "💀" },
  { id: 'check', name: "💵" },
  { id: 'status', name: "💎" }
];

const SERVICES = [
    { t: "📊 Биржа OKX", u: "https://t.me/OKXCrypto_Robot", i: "📈" },
    { t: "🌐 Web Trade", u: "https://t.me/ForbexTradeBot", i: "🌍" },
    { t: "💊 Shop Bot", u: "https://t.me/ReagentShopBot", i: "💊" },
    { t: "🔞 Escort", u: "https://t.me/RoyaleEscort_Robot", i: "👠" },
    { t: "🖼 NFT Scam", u: "https://t.me/CheckRefaundRuBot", i: "🖼" },
    { t: "🆘 Support", u: "https://t.me/SavageTP_Bot", i: "👨‍💻" },
    { t: "📚 Мануалы", u: "https://telegra.ph/MANUAL-001", i: "📖" },
];

function App() {
  const [tab, setTab] = useState('home'); // home, tops, game, menu
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Game
  const [spinning, setSpinning] = useState(false);
  const [cards, setCards] = useState([]);
  const [offset, setOffset] = useState(0);
  const [winData, setWinData] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [topTab, setTopTab] = useState('day');
  const [fastMode, setFastMode] = useState(false);

  // Mentor
  const [mentorForm, setMentorForm] = useState({ info: "", fee: 0 });

  const tg = window.Telegram?.WebApp;
  const uid = tg?.initDataUnsafe?.user?.id || 5839201122;

  useEffect(() => {
    if(tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#000000'); }
    fetchData();
    // Cards for game
    let c = [];
    for(let i=0; i<80; i++) c.push({...ITEMS[Math.floor(Math.random()*ITEMS.length)], uid: Math.random()});
    setCards(c);
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
    } catch(e) {}
  };

  const spin = async () => {
    if(spinning || data.user.spins < 1) return;
    setWinData(null); setOffset(0); 
    setData(p => ({...p, user: {...p.user, spins: p.user.spins - 1}}));
    setSpinning(true);
    if(!fastMode) playSound('spin');

    try {
      const res = await fetch(`${API_URL}/play`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: uid })
      });
      const json = await res.json();
      const winner = ITEMS.find(i => i.id === json.winner_id);
      
      const newCards = [...cards]; newCards[60] = winner; setCards(newCards);

      const cardW = 108; // width + margin
      const center = window.innerWidth / 2;
      const target = (60 * cardW) + (cardW/2) - center + (Math.random()*30 - 15);
      
      setOffset(-target);

      setTimeout(() => {
        setSpinning(false);
        if(winner.id !== 'empty') {
           playSound('win');
           setWinData(winner);
           confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
           if(tg) tg.HapticFeedback.notificationOccurred('success');
        } else {
           if(tg) tg.HapticFeedback.impactOccurred('light');
        }
      }, fastMode ? 500 : 5000);
    } catch(e) { setSpinning(false); }
  };

  const sendStatus = async () => {
    if(!statusText) return;
    await fetch(`${API_URL}/send_status`, {
       method: 'POST', headers: {'Content-Type':'application/json'},
       body: JSON.stringify({ user_id: uid, username: data.user.real_username, text: statusText })
    });
    setWinData(null);
    if(tg) tg.showAlert("Отправлено админу!");
  };

  const saveMentor = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await fetch(`${API_URL}/update_mentor`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ user_id: uid, info: formData.get('info'), fee: formData.get('fee') })
    });
    if(tg) tg.showAlert("Сохранено");
  };

  const Avatar = ({ u }) => {
    const l = (u.name[1] || 'U').toUpperCase();
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];
    const bg = colors[l.charCodeAt(0) % colors.length];
    return (
        <div className={`ava ${u.is_fake ? 'fake' : ''}`} style={{background: u.is_fake ? '#222' : bg}}>
            {u.is_fake ? '🎭' : l}
        </div>
    );
  };

  if(loading) return <div className="loader"><div className="loader-logo">T</div></div>;

  return (
    <div className="app">
      
      {/* === HOME === */}
      {tab === 'home' && (
        <div className="page fade-in">
            {/* STORIES */}
            <div className="stories">
                <div className="story-item"><div className="st-ring new">🔥</div><span>Новости</span></div>
                <div className="story-item"><div className="st-ring">💎</div><span>Статус</span></div>
                <div className="story-item"><div className="st-ring">💸</div><span>Выплаты</span></div>
            </div>

            {/* MAIN BALANCE CARD */}
            <div className="main-card t-card">
                <div className="mc-top">
                    <span className="mc-label">Savage Black</span>
                    <span className="mc-curr">RUB</span>
                </div>
                {/* ГЛАВНАЯ ЦИФРА - ОБЩИЙ ПРОФИТ */}
                <div className="mc-balance">{data.user.total_earned.toLocaleString()} ₽</div>
                <div className="mc-row">
                    <div className="mc-item">
                        <span>Текущий</span>
                        <b>{data.user.balance.toLocaleString()}</b>
                    </div>
                    <div className="mc-item">
                        <span>Профитов</span>
                        <b>{data.user.profits_count}</b>
                    </div>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="actions">
                <div className="act-btn" onClick={() => setTab('card')}>
                    <div className="act-icon">💳</div>
                    <span>Пополнить</span>
                </div>
                <div className="act-btn" onClick={() => setTab('game')}>
                    <div className="act-icon">🚀</div>
                    <span>Ракетка</span>
                </div>
                <div className="act-btn" onClick={() => setTab('tops')}>
                    <div className="act-icon">🏆</div>
                    <span>Топы</span>
                </div>
                <div className="act-btn" onClick={() => setTab('menu')}>
                    <div className="act-icon">•••</div>
                    <span>Ещё</span>
                </div>
            </div>

            {/* HISTORY */}
            <h3 className="list-title">История операций</h3>
            <div className="history-list">
                {data.history.map((h, i) => (
                    <div key={i} className="hist-row">
                        <div className="hr-icon">💰</div>
                        <div className="hr-info">
                            <div className="hr-title">{h.service}</div>
                            <div className="hr-date">{h.date}</div>
                        </div>
                        <div className="hr-sum green">+{h.sum.toLocaleString()} ₽</div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* === TOPS === */}
      {tab === 'tops' && (
        <div className="page fade-in">
            <h2 className="page-title">Рейтинг</h2>
            <div className="kassa-widget">
                <span>Касса проекта</span>
                <div>{data.kassa.toLocaleString()} ₽</div>
            </div>

            <div className="segment-control">
                {['day', 'week', 'month', 'all'].map(t => (
                    <div key={t} className={`seg-item ${topTab===t?'active':''}`} onClick={()=>setTopTab(t)}>
                        {t==='day'?'День':t==='week'?'Неделя':t==='month'?'Месяц':'Все'}
                    </div>
                ))}
            </div>

            <div className="leaderboard">
                {(data.tops[topTab] || []).map((u, i) => (
                    <div key={i} className="lb-item">
                        <div className="lb-rank">{i+1}</div>
                        <Avatar u={u} />
                        <div className="lb-info">
                            <div className="lb-name">{u.name}</div>
                            <div className="lb-sum">{u.sum.toLocaleString()} ₽</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* === GAME === */}
      {tab === 'game' && (
        <div className="page fade-in game-page">
            <div className="game-header">
                <h2>Кейс Savage</h2>
                <div className="spins-badge">{data.user.spins} спинов</div>
            </div>

            <div className="case-window">
                <div className="case-arrow"></div>
                <div className="case-track" style={{
                    transform: `translateX(${offset}px)`,
                    transition: spinning ? `transform ${fastMode?0.5:5}s cubic-bezier(0.1,0,0.1,1)` : 'none'
                }}>
                    {cards.map((c, i) => (
                        <div key={i} className="case-card" style={{borderColor: c.color}}>
                            <span>{c.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <button className="main-btn" disabled={spinning} onClick={spin}>
                ОТКРЫТЬ
            </button>
            <div className="fast-switch" onClick={()=>setFastMode(!fastMode)}>
                {fastMode ? '⚡ Быстро вкл' : '🐢 Быстро выкл'}
            </div>
        </div>
      )}

      {/* === MENU / INFO === */}
      {tab === 'menu' && (
        <div className="page fade-in">
            <div className="user-mini">
                <div className="um-ava">
                    {tg?.initDataUnsafe?.user?.photo_url && <img src={tg.initDataUnsafe.user.photo_url}/>}
                </div>
                <div className="um-info">
                    <div className="um-name">{data.user.username}</div>
                    <div className="um-tag">{data.user.status}</div>
                </div>
            </div>

            {/* Карточка карты */}
            <div className="info-card dark" onClick={() => {navigator.clipboard.writeText(data.card.number); if(tg) tg.showAlert("Скопировано")}}>
                <div className="ic-label">Актуальные реквизиты</div>
                <div className="ic-val">{data.card.number}</div>
                <div className="ic-sub">{data.card.bank} • {data.card.fio}</div>
                <div className="ic-icon">📋</div>
            </div>

            <h3 className="list-title">Сервисы</h3>
            <div className="grid-menu">
                {SERVICES_LIST.map((s, i) => (
                    <a key={i} href={s.u} className="gm-item">
                        <div className="gm-icon">{s.i}</div>
                        <span>{s.t}</span>
                    </a>
                ))}
            </div>

            {data.is_mentor && (
                <div className="mentor-block">
                    <h3>Кабинет наставника</h3>
                    <div className="mb-stats">
                        <div>Учеников: {data.mentor_panel.students.length}</div>
                        <div>Оборот: {data.mentor_panel.turnover}</div>
                    </div>
                    <form onSubmit={saveMentor}>
                        <input name="info" defaultValue={mentorForm.info} placeholder="О себе"/>
                        <input name="fee" type="number" defaultValue={mentorForm.fee} placeholder="%"/>
                        <button>Сохранить</button>
                    </form>
                </div>
            )}
        </div>
      )}

      {/* === CARD TAB (Просто редирект в меню для упрощения) === */}
      {tab === 'card' && setTab('menu')}

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
          <div className={`bn-item ${tab==='home'?'act':''}`} onClick={()=>setTab('home')}>🏠<span>Главная</span></div>
          <div className={`bn-item ${tab==='tops'?'act':''}`} onClick={()=>setTab('tops')}>🏆<span>Топы</span></div>
          <div className={`bn-item ${tab==='game'?'act':''}`} onClick={()=>setTab('game')}>🚀<span>Игра</span></div>
          <div className={`bn-item ${tab==='menu'?'act':''}`} onClick={()=>setTab('menu')}>☰<span>Меню</span></div>
      </div>

      {/* MODAL */}
      {winData && (
          <div className="modal-overlay" onClick={()=>setWinData(null)}>
              <div className="modal-content" onClick={e=>e.stopPropagation()}>
                  <div className="mc-icon">{winData.id === 'empty' ? '💀' : '🎉'}</div>
                  <h2>{winData.name}</h2>
                  {winData.id === 'status' ? (
                      <div className="st-form">
                          <input placeholder="Твой новый статус" onChange={e=>setStatusText(e.target.value)} />
                          <button onClick={sendStatus}>Установить</button>
                      </div>
                  ) : <p>Приз зачислен!</p>}
              </div>
          </div>
      )}

    </div>
  );
}

export default App;