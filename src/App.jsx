import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import axios from 'axios';

// !!! ТВОЯ ССЫЛКА NGROK !!!
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev"; 

const api = axios.create({ baseURL: API_URL, headers: { "ngrok-skip-browser-warning": "true" } });

const playSfx = (type) => {
    const sfx = { click: 'https://cdn.freesound.org/previews/256/256116_4486188-lq.mp3', spin: 'https://cdn.freesound.org/previews/32/32184_379750-lq.mp3', win: 'https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3' };
    try { const a = new Audio(sfx[type]); a.volume=0.4; a.currentTime=0; a.play().catch(()=>{}); } catch(e){}
};

const ITEMS = [
    { id: 'empty', name: "ПУСТО", color: '#3f3f46', img: "https://cdn-icons-png.flaticon.com/512/1077/1077114.png" },
    { id: 'check', name: "ЧЕК 0.5$", color: '#3b82f6', img: "https://cdn-icons-png.flaticon.com/512/2534/2534204.png" },
    { id: 'status', name: "СТАТУС", color: '#ec4899', img: "https://cdn-icons-png.flaticon.com/512/10692/10692795.png" }
];

const Icons = {
    Home: () => <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>,
    Tops: () => <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11V3H8v6H2v12h20V11h-6zm-6-6h4v14h-4V5zm-6 6h4v8H4v-8zm16 8h-4v-6h4v6z"/></svg>,
    Game: () => <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8zM6 15h2v-2h2v-2H8V9H6v2H4v2h2z"/></svg>,
    Mentor: () => <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
};

function App() {
    const [tab, setTab] = useState('profile');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    const tg = window.Telegram?.WebApp;
    const uid = tg?.initDataUnsafe?.user?.id || 5839201122; 
    const tgPhoto = tg?.initDataUnsafe?.user?.photo_url;

    useEffect(() => {
        if(tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#09090b'); }
        api.get(`/app_data/${uid}`).then(res => { 
            if(res.data.error) setError(true); else setData(res.data);
            setLoading(false); 
        }).catch(() => { setError(true); setLoading(false); });
    }, []);

    // GAME VARS
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
        setAnimTime(0); setOffset(0);

        setTimeout(async () => {
            try {
                setSpinning(true); if(!fastMode) playSfx('spin');
                setData(prev => ({...prev, user: {...prev.user, spins: prev.user.spins - 1}}));
                const res = await api.post(`/play`, { user_id: uid });
                const winner = ITEMS.find(i => i.id === res.data.winner_id);
                
                const newCards = [...cards]; newCards[60] = winner; setCards(newCards);
                const noise = (Math.random() * 80) - 40;
                const finalOffset = (60 * 140) + 70 - (window.innerWidth / 2) + noise;

                setAnimTime(fastMode ? 0.5 : 6); setOffset(-finalOffset);

                setTimeout(() => {
                    setSpinning(false); setWinItem(winner);
                    if(winner.id !== 'empty') { playSfx('win'); confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }); }
                }, fastMode ? 500 : 6000);
            } catch(e) { setSpinning(false); }
        }, 50);
    };

    const sendStatus = async () => {
        if(!statusText) return;
        await api.post('/send_status', { user_id: uid, username: data.user.real_username, text: statusText });
        setStatusSent(true);
    };

    const TopAvatar = ({ u }) => (
        <div className={`t-ava ${u.is_fake ? 'fake' : ''}`} style={{background: u.is_fake ? '#333' : `linear-gradient(135deg, ${['#ef4444','#f97316','#22c55e'][u.name.length%3]}, #000)`}}>
            {u.is_fake ? '🎭' : u.name[1]?.toUpperCase()}
        </div>
    );

    if(loading) return <div className="loader">SAVAGE<br/>OS v2.0</div>;
    if(error) return <div className="loader" style={{color:'red'}}>CONNECT ERROR</div>;

    return (
        <div className="app-container">
            {/* === ПРОФИЛЬ === */}
            {tab === 'profile' && (
                <div className="page slide-in">
                    <div className="id-card">
                        <div className="id-header">
                            <div className="id-chip"></div>
                            <div className="id-logo">SAVAGE TEAM</div>
                        </div>
                        <div className="id-body">
                            {tgPhoto ? <img src={tgPhoto} className="id-photo"/> : <div className="id-photo-ph">🦈</div>}
                            <div className="id-info">
                                <div className="id-label">OPERATIVE</div>
                                <div className="id-val">{data.user.fake_tag ? <span className="glitch-text">{data.user.fake_tag}</span> : data.user.username}</div>
                                <div className="id-row">
                                    <div><span className="id-label">ID</span> {data.user.id}</div>
                                    <div><span className="id-label">STATUS</span> <span style={{color:'var(--accent)'}}>{data.user.status}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="id-footer">
                            MENTOR: {data.user.my_mentor}
                        </div>
                    </div>

                    <div className="stats-row">
                        <div className="stat-box">
                            <div className="sb-lbl">BALANCE</div>
                            <div className="sb-val">{data.user.balance.toLocaleString()} ₽</div>
                        </div>
                        <div className="stat-box">
                            <div className="sb-lbl">PROFITS</div>
                            <div className="sb-val">{data.user.profits_count}</div>
                        </div>
                    </div>

                    <h3 className="neon-header">История Профитов</h3>
                    <div className="history-list">
                        {data.history.map((h, i) => (
                            <div key={i} className="hist-card">
                                <div className="hc-left">
                                    <div className="hc-serv">{h.service}</div>
                                    <div className="hc-date">{h.date}</div>
                                </div>
                                <div className="hc-sum">+{h.sum.toLocaleString()} ₽</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* === МЕНТОРКА === */}
            {tab === 'mentor' && (
                <div className="page slide-in">
                    <div className="mentor-header">
                        <h2>ПАНЕЛЬ НАСТАВНИКА</h2>
                        <div className="m-stat">Твои ученики: {data.mentor_data.length}</div>
                    </div>
                    <div className="student-list">
                        {data.mentor_data.map((s, i) => (
                            <div key={i} className="student-card">
                                <div className="st-ava">🎓</div>
                                <div className="st-info">
                                    <div className="st-name">@{s.name}</div>
                                    <div className="st-prof">Профитов: {s.profits}</div>
                                </div>
                                <div className="st-bal">{s.balance.toLocaleString()} ₽</div>
                            </div>
                        ))}
                        {data.mentor_data.length === 0 && <div className="empty">У тебя пока нет мамонтов...</div>}
                    </div>
                </div>
            )}

            {/* === ТОПЫ === */}
            {tab === 'tops' && (
                <div className="page slide-in">
                    <div className="kassa-glitch">
                        <div className="kg-lbl">ОБЩАЯ КАССА</div>
                        <div className="kg-val">{data.kassa.toLocaleString()} ₽</div>
                    </div>
                    <h3 className="neon-header">TOP TODAY</h3>
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
                </div>
            )}

            {/* === КАЗИНО === */}
            {tab === 'game' && (
                <div className="page slide-in game-page">
                    <div className="game-header">
                        <h2 className="neon-title">SAVAGE</h2>
                        <div className="fast-toggle" onClick={() => {playSfx('click'); setFastMode(!fastMode)}}>
                            <div className={`ft-dot ${fastMode ? 'on' : ''}`}></div><span>{fastMode ? 'TURBO' : 'NORMAL'}</span>
                        </div>
                    </div>
                    <div className="roulette-wrapper">
                        <div className="marker-top"></div><div className="marker-bottom"></div>
                        <div className="track" style={{transform: `translateX(${offset}px)`, transition: `transform ${animTime}s cubic-bezier(0.15, 0, 0.20, 1)`}}>
                            {cards.map((c, i) => <div key={i} className="r-card" style={{borderBottom: `3px solid ${c.color}`}}><img src={c.img}/></div>)}
                        </div>
                    </div>
                    <button onClick={spin} disabled={spinning} className="spin-btn-main">{spinning ? "..." : `SPIN (${data.user.spins})`}</button>
                    {winItem && (
                        <div className="win-overlay">
                            <div className="win-content animate-pop">
                                <div className="win-glow" style={{background: winItem.color}}></div>
                                <h3>{winItem.name}</h3>
                                <img src={winItem.img} className="win-img-big"/>
                                {winItem.id === 'status' && !statusSent && (
                                    <div className="status-form"><input placeholder="ТВОЙ СТАТУС" value={statusText} onChange={e=>setStatusText(e.target.value)} maxLength={15}/><button onClick={sendStatus}>ОТПРАВИТЬ</button></div>
                                )}
                                {statusSent && <div className="win-msg">✅ Отправлено!</div>}
                                <button className="win-close" onClick={() => setWinItem(null)}>ЗАКРЫТЬ</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="tab-bar">
                <button className={tab==='profile'?'active':''} onClick={()=>setTab('profile')}><Icons.Home/><span>Home</span></button>
                <button className={tab==='tops'?'active':''} onClick={()=>setTab('tops')}><Icons.Tops/><span>Tops</span></button>
                <button className={tab==='game'?'active':''} onClick={()=>setTab('game')}><Icons.Game/><span>Game</span></button>
                {data.is_mentor && <button className={tab==='mentor'?'active':''} onClick={()=>setTab('mentor')}><Icons.Mentor/><span>Mentor</span></button>}
            </div>
        </div>
    );
}

export default App;