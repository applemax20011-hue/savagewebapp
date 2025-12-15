import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import axios from 'axios';

// !!! ТВОЯ ССЫЛКА NGROK !!!
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev"; 

const api = axios.create({
    baseURL: API_URL,
    headers: { 
        "ngrok-skip-browser-warning": "true", 
        "Content-Type": "application/json" 
    }
});

const AUDIO = {
    spin: new Audio('https://cdn.freesound.org/previews/32/32184_379750-lq.mp3'),
    win: new Audio('https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3'),
};
const playSfx = (name) => { try { AUDIO[name].volume=0.3; AUDIO[name].currentTime=0; AUDIO[name].play().catch(()=>{}); } catch(e){} };

const Icons = {
    Home: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
    Tops: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11V3H8v6H2v12h20V11h-6zm-6-6h4v14h-4V5zm-6 6h4v8H4v-8zm16 8h-4v-6h4v6z"/></svg>,
    Game: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11 22q-2.525 0-4.325-1.575T4.45 16.55q-.6-2.575.263-4.975T7.6 7.6q2.175-2.175 5.038-2.688 2.862-.512 5.387.663l1.8-1.8.7.7-1.8 1.8q1.175 2.525.663 5.388-.513 2.862-2.688 5.037-2.175 2.888-4.575 3.75Q9.725 21.325 7.15 20.725l1.8-1.8.7.725-1.8 1.8q1.575 1.8 4.088 1.8 1.3 0 2.512-.475 1.213-.475 2.188-1.325l.725.7.7-.7-.7-.7q-.85.95-2.062 1.425Q13.512 22 12.213 22H11Zm.5-5q-1.45 0-2.475-1.025Q8 14.95 8 13.5t1.025-2.475Q10.05 10 11.5 10t2.475 1.025Q15 12.05 15 13.5t-1.025 2.475Q12.95 17 11.5 17Z"/></svg>,
    Info: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
};

const ITEMS = [
    { id: 'empty', name: "💀 ПУСТО", color: '#333', img: "https://cdn-icons-png.flaticon.com/512/1077/1077114.png" },
    { id: 'check', name: "💵 ЧЕК 0.5$", color: '#3b82f6', img: "https://cdn-icons-png.flaticon.com/512/2534/2534204.png" },
    { id: 'status', name: "💎 СТАТУС", color: '#ec4899', img: "https://cdn-icons-png.flaticon.com/512/10692/10692795.png" }
];

function App() {
    const [tab, setTab] = useState('profile');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Получаем ID (или тестовый)
    const tg = window.Telegram?.WebApp;
    const uid = tg?.initDataUnsafe?.user?.id || 5839201122; 

    useEffect(() => {
        if(tg) { tg.ready(); tg.expand(); }
        
        // Загрузка данных
        api.get(`/app_data/${uid}`)
           .then(res => { 
               if(res.data.error) {
                   setError(res.data.error);
               } else {
                   setData(res.data); 
               }
               setLoading(false); 
           })
           .catch(err => { 
               console.error(err);
               setError("Ошибка соединения с сервером");
               setLoading(false); 
           });
    }, []);

    // GAME STATE
    const [spinning, setSpinning] = useState(false);
    const [cards, setCards] = useState([]);
    const [offset, setOffset] = useState(0);
    const [animTime, setAnimTime] = useState(0);
    const [winItem, setWinItem] = useState(null);
    const [statusText, setStatusText] = useState("");
    const [statusSent, setStatusSent] = useState(false);

    useEffect(() => {
        let arr = [];
        for(let i=0; i<80; i++) arr.push({...ITEMS[Math.floor(Math.random()*ITEMS.length)], uid: Math.random()});
        setCards(arr);
    }, []);

    const spin = async () => {
        if(spinning || data.user.spins < 1) return;
        setWinItem(null); setStatusSent(false); setStatusText(""); setAnimTime(0); setOffset(0);

        setTimeout(async () => {
            try {
                setSpinning(true); playSfx('spin');
                // Визуальное списание
                setData(prev => ({...prev, user: {...prev.user, spins: prev.user.spins - 1}}));

                const res = await api.post(`/play`, { user_id: uid });
                const winner = ITEMS.find(i => i.id === res.data.winner_id);
                
                const newCards = [...cards];
                newCards[60] = winner;
                setCards(newCards);

                const shift = (Math.random()*140*0.6) - (140*0.3);
                const finalScroll = (60*140) + 70 - (window.innerWidth/2) + shift;

                setAnimTime(5);
                setOffset(-finalScroll);

                setTimeout(() => {
                    setSpinning(false);
                    setWinItem(winner);
                    if(winner.id !== 'empty') {
                        playSfx('win');
                        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    }
                }, 5000);
            } catch(e) { 
                setSpinning(false); 
                alert("Ошибка игры!");
                // Возвращаем спин при ошибке
                setData(prev => ({...prev, user: {...prev.user, spins: prev.user.spins + 1}}));
            }
        }, 50);
    };

    const sendStatus = async () => {
        if(!statusText) return;
        await api.post('/send_status', { user_id: uid, username: data.user.username, text: statusText });
        setStatusSent(true);
    };

    // --- ОТРИСОВКА ОШИБОК И ЗАГРУЗКИ ---
    if (loading) return <div className="loader">LOADING...</div>;
    
    if (error || !data) return (
        <div className="app-container" style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', textAlign:'center'}}>
            <h2 style={{color: '#ef4444'}}>ОШИБКА СВЯЗИ</h2>
            <p style={{color:'#888', fontSize:'12px'}}>Не удалось получить данные.</p>
            <p style={{color:'#666', fontSize:'10px', marginTop:'10px'}}>
                1. Проверь VPN<br/>
                2. Перезагрузи приложение<br/>
                3. Если ты админ: Проверь Ngrok
            </p>
            <button onClick={() => window.location.reload()} style={{marginTop:'20px', padding:'10px 20px', background:'#22c55e', border:'none', borderRadius:'8px', fontWeight:'bold'}}>ОБНОВИТЬ</button>
        </div>
    );

    return (
        <div className="app-container">
            <div className="content">
                
                {/* === ПРОФИЛЬ === */}
                {tab === 'profile' && (
                    <div className="page animate-in">
                        <div className="profile-card">
                            <div className="ava-row">
                                <div className="avatar">🦈</div>
                                <div>
                                    <div className="nick">@{data.user.username}</div>
                                    <div className="status-badge">{data.user.status}</div>
                                </div>
                            </div>
                            <div className="stats-grid">
                                <div className="stat-item"><span>Баланс</span><b>{data.user.balance} ₽</b></div>
                                <div className="stat-item"><span>Профиты</span><b>{data.user.profits_count}</b></div>
                                <div className="stat-item"><span>В тиме</span><b>{data.user.days_with_us} дн.</b></div>
                            </div>
                        </div>

                        <div className="play-banner" onClick={() => setTab('game')}>
                            <div className="pb-text">🎰 <b>ИГРАТЬ В КАЗИНО</b><br/>Спинов: {data.user.spins}</div>
                            <div className="pb-btn">GO</div>
                        </div>

                        <h3>🕰 Последние профиты</h3>
                        <div className="history-list">
                            {data.history.map((h, i) => (
                                <div key={i} className="hist-item">
                                    <div className="h-serv">{h.service}</div>
                                    <div className="h-sum">+{h.sum} ₽</div>
                                    <div className="h-date">{h.date}</div>
                                </div>
                            ))}
                            {data.history.length === 0 && <div className="empty">Пусто...</div>}
                        </div>
                    </div>
                )}

                {/* === ТОПЫ === */}
                {tab === 'tops' && (
                    <div className="page animate-in">
                        <div className="kassa-card">
                            <div className="label">ОБЩАЯ КАССА</div>
                            <div className="val">{data.kassa.toLocaleString()} ₽</div>
                        </div>
                        <h3>🔥 Топ за сегодня</h3>
                        <div className="top-list">
                            {data.top_day.map((u, i) => (
                                <div key={i} className="top-item">
                                    <div className="rank">#{i+1}</div>
                                    <div className="name">@{u.name}</div>
                                    <div className="score">{u.sum} ₽</div>
                                </div>
                            ))}
                        </div>
                        <h3>🏆 Богачи (Все время)</h3>
                        <div className="top-list">
                            {data.top_all.map((u, i) => (
                                <div key={i} className="top-item">
                                    <div className="rank">#{i+1}</div>
                                    <div className="name">@{u.name}</div>
                                    <div className="score">{u.sum} ₽</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* === ИНФО (СЕРВИСЫ) === */}
                {tab === 'info' && (
                    <div className="page animate-in">
                        <h3>⚡️ Сервисы & Боты</h3>
                        <div className="serv-list">
                            {data.services.map((s, i) => (
                                <a key={i} href={s.link} className="serv-item" target="_blank">
                                    <div className="s-title">{s.title}</div>
                                    <div className="s-desc">{s.desc}</div>
                                </a>
                            ))}
                        </div>
                        <h3>📢 Обновления</h3>
                        <div className="news-list">
                            {data.updates.map((n, i) => (
                                <div key={i} className="news-item">
                                    <div className="n-date">{n.date}</div>
                                    <div className="n-text">{n.text}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* === КАЗИНО === */}
                {tab === 'game' && (
                    <div className="page animate-in game-page">
                        <h2 className="game-title glitch" data-text="SAVAGE">SAVAGE</h2>
                        <div className="case-window">
                            <div className="pointer"></div>
                            <div className="track" style={{transform: `translateX(${offset}px)`, transition: `transform ${animTime}s cubic-bezier(0.1,0,0.2,1)`}}>
                                {cards.map((c, i) => (
                                    <div key={i} className="card" style={{borderBottom: `4px solid ${c.color}`}}>
                                        <img src={c.img} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="controls">
                            <button onClick={spin} disabled={spinning} className="spin-btn">
                                {spinning ? "..." : `КРУТИТЬ (${data.user.spins})`}
                            </button>
                        </div>
                        {winItem && (
                            <div className="win-modal">
                                <div className="win-card">
                                    <h3>{winItem.name}</h3>
                                    <img src={winItem.img} className="win-img"/>
                                    {winItem.id === 'status' && !statusSent && (
                                        <div className="status-box">
                                            <input placeholder="ТВОЙ СТАТУС" value={statusText} onChange={e=>setStatusText(e.target.value)}/>
                                            <button onClick={sendStatus}>ОТПРАВИТЬ</button>
                                        </div>
                                    )}
                                    {statusSent && <div className="ok">✅ Отправлено!</div>}
                                    <button className="close-btn" onClick={() => setWinItem(null)}>ЗАКРЫТЬ</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* === НИЖНЕЕ МЕНЮ === */}
            <div className="tab-bar">
                <button className={tab==='profile'?'active':''} onClick={()=>setTab('profile')}><Icons.Home /><span>Профиль</span></button>
                <button className={tab==='tops'?'active':''} onClick={()=>setTab('tops')}><Icons.Tops /><span>Топы</span></button>
                <button className={tab==='game'?'active':''} onClick={()=>setTab('game')}><Icons.Game /><span>Игра</span></button>
                <button className={tab==='info'?'active':''} onClick={()=>setTab('info')}><Icons.Info /><span>Инфо</span></button>
            </div>
        </div>
    );
}

export default App;