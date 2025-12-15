import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import axios from 'axios';

// !!! ТВОЯ ССЫЛКА NGROK !!!
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev"; 

const api = axios.create({
    baseURL: API_URL,
    headers: { "ngrok-skip-browser-warning": "true", "Content-Type": "application/json" }
});

// ЗВУКОВОЙ ДВИЖОК
const playSfx = (type) => {
    const sfx = {
        click: 'https://cdn.freesound.org/previews/256/256116_4486188-lq.mp3',
        spin: 'https://cdn.freesound.org/previews/32/32184_379750-lq.mp3',
        win: 'https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3',
    };
    try { const a = new Audio(sfx[type]); a.volume = 0.4; a.currentTime=0; a.play().catch(()=>{}); } catch(e){}
};

// ПРЕДМЕТЫ
const ITEMS = [
    { id: 'empty', name: "ПУСТО", color: '#3f3f46', img: "https://cdn-icons-png.flaticon.com/512/1077/1077114.png" },
    { id: 'check', name: "ЧЕК 0.5$", color: '#3b82f6', img: "https://cdn-icons-png.flaticon.com/512/2534/2534204.png" },
    { id: 'status', name: "СТАТУС", color: '#ec4899', img: "https://cdn-icons-png.flaticon.com/512/10692/10692795.png" }
];

// ИКОНКИ
const Icons = {
    Home: () => <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm5 15h-2v-6H9v6H7v-7.81l5-4.5 5 4.5V18z"/><path opacity=".3" d="M7 10.19V18h2v-6h6v6h2v-7.81l-5-4.5z"/></svg>,
    Tops: () => <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg>,
    Game: () => <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8zM6 15h2v-2h2v-2H8V9H6v2H4v2h2z"/></svg>,
    Info: () => <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
};

function App() {
    const [tab, setTab] = useState('profile');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    // Telegram
    const tg = window.Telegram?.WebApp;
    const uid = tg?.initDataUnsafe?.user?.id || 5839201122; 
    const tgPhoto = tg?.initDataUnsafe?.user?.photo_url;

    useEffect(() => {
        if(tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#09090b'); }
        api.get(`/app_data/${uid}`)
           .then(res => { 
               if(res.data.error) setError(true);
               else setData(res.data);
               setLoading(false); 
           })
           .catch(() => { setError(true); setLoading(false); });
    }, []);

    // --- GAME ENGINE ---
    const [spinning, setSpinning] = useState(false);
    const [cards, setCards] = useState([]);
    const [offset, setOffset] = useState(0);
    const [animTime, setAnimTime] = useState(0);
    const [winItem, setWinItem] = useState(null);
    const [statusText, setStatusText] = useState("");
    const [statusSent, setStatusSent] = useState(false);
    const [fastMode, setFastMode] = useState(false);

    useEffect(() => {
        let arr = [];
        for(let i=0; i<80; i++) arr.push({...ITEMS[Math.floor(Math.random()*ITEMS.length)], uid: Math.random()});
        setCards(arr);
    }, []);

    const spin = async () => {
        if(spinning || data.user.spins < 1) return;
        setWinItem(null); setStatusSent(false); setStatusText(""); playSfx('click');

        // Сброс позиции
        setAnimTime(0); setOffset(0);

        setTimeout(async () => {
            try {
                setSpinning(true); 
                if(!fastMode) playSfx('spin'); // Звук только в медленном
                
                setData(prev => ({...prev, user: {...prev.user, spins: prev.user.spins - 1}}));

                const res = await api.post(`/play`, { user_id: uid });
                const winner = ITEMS.find(i => i.id === res.data.winner_id);
                
                const newCards = [...cards];
                newCards[60] = winner; // Подмешиваем выигрыш
                setCards(newCards);

                // Расчет
                const CARD_W = 140;
                const screenCenter = window.innerWidth / 2;
                const targetPos = (60 * CARD_W) + (CARD_W / 2);
                const noise = (Math.random() * 80) - 40;
                const finalOffset = targetPos - screenCenter + noise;

                const duration = fastMode ? 0.5 : 6; // Быстро или Медленно
                setAnimTime(duration);
                setOffset(-finalOffset);

                setTimeout(() => {
                    setSpinning(false);
                    setWinItem(winner);
                    if(winner.id !== 'empty') {
                        playSfx('win');
                        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                        if(tg) tg.HapticFeedback.notificationOccurred('success');
                    } else {
                        if(tg) tg.HapticFeedback.impactOccurred('light');
                    }
                }, duration * 1000);
            } catch(e) { 
                setSpinning(false);
                setData(prev => ({...prev, user: {...prev.user, spins: prev.user.spins + 1}}));
            }
        }, 50);
    };

    const sendStatus = async () => {
        if(!statusText.trim()) return;
        playSfx('click');
        await api.post('/send_status', { user_id: uid, username: data.user.real_username, text: statusText });
        setStatusSent(true);
    };

    const switchTab = (t) => { playSfx('click'); setTab(t); };

    // Аватарка для топа
    const TopAvatar = ({ u }) => {
        if (u.is_fake) {
            return <div className="t-ava fake">🎭</div>;
        }
        const color = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'][u.name.length % 6];
        return <div className="t-ava" style={{background: `linear-gradient(135deg, ${color}, #000)`}}>{u.name[1]?.toUpperCase() || 'U'}</div>;
    };

    if(loading) return <div className="loader"><div className="scan-line"></div>SAVAGE<br/>SYSTEM</div>;
    if(error) return <div className="loader" style={{color:'red'}}>ERROR</div>;

    return (
        <div className="app-container">
            {/* === ПРОФИЛЬ === */}
            {tab === 'profile' && (
                <div className="page slide-in">
                    <div className="profile-header">
                        <div className="ava-glow">
                            {tgPhoto ? <img src={tgPhoto} className="avatar-img"/> : <div className="avatar-ph">🦈</div>}
                        </div>
                        <div className="p-info">
                            <div className="p-nick">{data.user.username}</div>
                            <div className="p-badge">{data.user.status}</div>
                        </div>
                    </div>

                    <div className="stats-box">
                        <div className="s-cell">
                            <div className="s-lbl">Баланс</div>
                            <div className="s-val text-gradient">{data.user.balance.toLocaleString()} RUB</div>
                        </div>
                        <div className="s-row-btm">
                            <div className="s-small">
                                <span>Профиты</span>
                                <b>{data.user.profits_count}</b>
                            </div>
                            <div className="s-small">
                                <span>Дни</span>
                                <b>{data.user.days_with_us}</b>
                            </div>
                        </div>
                    </div>

                    <div className="banner-casino" onClick={() => switchTab('game')}>
                        <div className="bc-content">
                            <div className="bc-title">🎰 CASINO</div>
                            <div className="bc-spins">{data.user.spins} SPINS</div>
                        </div>
                        <div className="bc-arrow">➔</div>
                    </div>

                    <h3 className="section-title">История</h3>
                    <div className="history-list">
                        {data.history.map((h, i) => (
                            <div key={i} className="hist-card">
                                <div className="hc-left">
                                    <div className="hc-serv">{h.service}</div>
                                    <div className="hc-date">{h.date}</div>
                                </div>
                                <div className="hc-sum">+{h.sum.toLocaleString()} RUB</div>
                            </div>
                        ))}
                        {data.history.length === 0 && <div className="empty">Пусто...</div>}
                    </div>
                </div>
            )}

            {/* === ТОПЫ === */}
            {tab === 'tops' && (
                <div className="page slide-in">
                    <div className="kassa-box">
                        <div className="kb-lbl">ОБЩАЯ КАССА</div>
                        <div className="kb-val">{data.kassa.toLocaleString()} RUB</div>
                    </div>

                    <h3 className="section-title">🔥 Топ за сегодня</h3>
                    <div className="top-list">
                        {data.top_day.map((u, i) => (
                            <div key={i} className="top-card">
                                <div className="tc-rank">#{i+1}</div>
                                <TopAvatar u={u} />
                                <div className="tc-info">
                                    <div className={u.is_fake ? "tc-name glitch-text" : "tc-name"}>{u.name}</div>
                                    <div className="tc-sum">{u.sum.toLocaleString()} ₽</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <h3 className="section-title">🏆 Богачи</h3>
                    <div className="top-list">
                        {data.top_all.map((u, i) => (
                            <div key={i} className="top-card">
                                <div className="tc-rank">#{i+1}</div>
                                <TopAvatar u={u} />
                                <div className="tc-info">
                                    <div className={u.is_fake ? "tc-name glitch-text" : "tc-name"}>{u.name}</div>
                                    <div className="tc-sum">{u.sum.toLocaleString()} ₽</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* === КАЗИНО === */}
            {tab === 'game' && (
                <div className="page slide-in game-page">
                    <div className="game-header">
                        <h2 className="neon-title">SAVAGE</h2>
                        <div className="fast-toggle" onClick={() => {playSfx('click'); setFastMode(!fastMode)}}>
                            <div className={`ft-dot ${fastMode ? 'on' : ''}`}></div>
                            <span>{fastMode ? 'TURBO' : 'NORMAL'}</span>
                        </div>
                    </div>

                    <div className="roulette-wrapper">
                        <div className="marker-top"></div>
                        <div className="marker-bottom"></div>
                        <div className="track" style={{
                            transform: `translateX(${offset}px)`, 
                            transition: `transform ${animTime}s cubic-bezier(0.15, 0, 0.20, 1)`
                        }}>
                            {cards.map((c, i) => (
                                <div key={i} className="r-card" style={{borderBottom: `3px solid ${c.color}`}}>
                                    <img src={c.img} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={spin} disabled={spinning} className="spin-btn-main">
                        {spinning ? "..." : `SPIN (${data.user.spins})`}
                    </button>

                    {winItem && (
                        <div className="win-modal">
                            <div className="win-content animate-pop">
                                <div className="win-glow" style={{background: winItem.color}}></div>
                                <h3>{winItem.name}</h3>
                                <img src={winItem.img} className="win-img-big"/>
                                
                                {winItem.id === 'status' && !statusSent && (
                                    <div className="status-form">
                                        <input placeholder="ТВОЙ СТАТУС" value={statusText} onChange={e=>setStatusText(e.target.value)} maxLength={15}/>
                                        <button onClick={sendStatus}>ОТПРАВИТЬ</button>
                                    </div>
                                )}
                                {statusSent && <div className="win-msg">✅ Отправлено!</div>}
                                
                                <button className="win-close" onClick={() => setWinItem(null)}>ЗАКРЫТЬ</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* === ИНФО === */}
            {tab === 'info' && (
                <div className="page slide-in">
                    <h3 className="section-title">Сервисы</h3>
                    <div className="serv-grid">
                        {data.services.map((s, i) => (
                            <a key={i} href={s.link} className="serv-block">
                                <div className="sb-title">{s.title}</div>
                                <div className="sb-desc">{s.desc}</div>
                            </a>
                        ))}
                    </div>
                    <h3 className="section-title">Новости</h3>
                    {data.updates.map((n, i) => (
                        <div key={i} className="news-block">
                            <div className="nb-date">{n.date}</div>
                            <div className="nb-text">{n.text}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* === TAB BAR === */}
            <div className="tab-bar">
                <button className={tab==='profile'?'active':''} onClick={()=>switchTab('profile')}><Icons.Home/><span>Main</span></button>
                <button className={tab==='tops'?'active':''} onClick={()=>switchTab('tops')}><Icons.Tops/><span>Top</span></button>
                <button className={tab==='game'?'active':''} onClick={()=>switchTab('game')}><Icons.Game/><span>Game</span></button>
                <button className={tab==='info'?'active':''} onClick={()=>switchTab('info')}><Icons.Info/><span>Info</span></button>
            </div>
        </div>
    );
}

export default App;