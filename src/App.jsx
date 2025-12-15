import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import axios from 'axios';

// !!! ТВОЯ ССЫЛКА NGROK !!!
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev"; // ЗАМЕНИ НА АКТУАЛЬНУЮ

const api = axios.create({
    baseURL: API_URL,
    headers: { "ngrok-skip-browser-warning": "true", "Content-Type": "application/json" }
});

const AUDIO = {
    spin: new Audio('https://cdn.freesound.org/previews/32/32184_379750-lq.mp3'),
    win: new Audio('https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3'),
    start: new Audio('https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3')
};
Object.values(AUDIO).forEach(a => { a.volume = 0.4; a.load(); });
const playSfx = (name) => { try { AUDIO[name].currentTime = 0; AUDIO[name].play().catch(()=>{}); } catch(e){} };

const ITEMS = [
    { id: 'empty',  name: "💀 ПУСТО",       type: 'empty',  color: '#3f3f46', img: "https://cdn-icons-png.flaticon.com/512/1077/1077114.png" },
    { id: 'check',  name: "💵 ЧЕК 0.5$",    type: 'money',  color: '#3b82f6', img: "https://cdn-icons-png.flaticon.com/512/2534/2534204.png" },
    { id: 'status', name: "💎 СТАТУС",      type: 'status', color: '#ec4899', img: "https://cdn-icons-png.flaticon.com/512/10692/10692795.png" },
];
const CARD_WIDTH = 148;

const Loader = () => (
    <div className="loader-container">
        <div className="shark-loader">🦈</div>
        <div className="loader-text glitch" data-text="LOADING...">LOADING...</div>
    </div>
);

function App() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({ id: 0, username: '', spins: 0, photo_url: null });
    const [spinning, setSpinning] = useState(false);
    const [cards, setCards] = useState([]);
    const [offset, setOffset] = useState(0);
    const [animTime, setAnimTime] = useState(0);
    const [winItem, setWinItem] = useState(null);
    const [fast, setFast] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [statusSent, setStatusSent] = useState(false);

    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if (tg) { tg.ready(); tg.expand(); tg.enableClosingConfirmation(); }
        const uid = tg?.initDataUnsafe?.user?.id || 5839201122; 

        api.get(`/init/${uid}`).then(res => {
            setUser({
                id: uid,
                username: tg?.initDataUnsafe?.user?.username || res.data.username,
                spins: res.data.spins,
                photo_url: tg?.initDataUnsafe?.user?.photo_url
            });
            setTimeout(() => setLoading(false), 800);
        }).catch(() => { setLoading(false); });
        setCards(genStrip());
    }, []);

    const genStrip = () => {
        let arr = [];
        for(let i=0; i<80; i++) arr.push({...ITEMS[Math.floor(Math.random()*ITEMS.length)], uid: Math.random()});
        return arr;
    }

    const spin = async () => {
        if(spinning || user.spins < 1) return;
        setWinItem(null); setStatusSent(false); setStatusText(""); setAnimTime(0); setOffset(0);

        setTimeout(async () => {
            try {
                setSpinning(true);
                playSfx('start');
                window.Telegram?.WebApp?.HapticFeedback.impactOccurred('medium');
                setUser(prev => ({...prev, spins: prev.spins - 1}));

                const res = await api.post(`/play`, { user_id: user.id });
                const { winner_id, spins_left } = res.data;
                const winner = ITEMS.find(i => i.id === winner_id);
                
                const newCards = genStrip();
                newCards[60] = winner;
                setCards(newCards);

                const screenW = window.innerWidth > 600 ? 600 : (window.innerWidth - 32);
                const shift = (Math.random() * CARD_WIDTH * 0.6) - (CARD_WIDTH * 0.3);
                const finalScroll = (60 * CARD_WIDTH) + (CARD_WIDTH / 2) - (screenW / 2) + shift;

                const duration = fast ? 0.5 : 5.5;
                setAnimTime(duration);
                setOffset(-finalScroll);

                if(!fast) setTimeout(() => playSfx('spin'), 200);

                setTimeout(() => {
                    setSpinning(false);
                    setWinItem(winner);
                    setUser(prev => ({...prev, spins: spins_left}));
                    if(winner.type !== 'empty') {
                        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                        playSfx('win');
                    }
                }, duration * 1000);
            } catch (e) {
                setSpinning(false);
                setUser(prev => ({...prev, spins: prev.spins + 1}));
                window.Telegram?.WebApp?.showAlert("Ошибка связи!");
            }
        }, 50);
    };

    const sendStatus = async () => {
        if(!statusText.trim()) return;
        try {
            await api.post('/send_status', { user_id: user.id, username: user.username, text: statusText });
            setStatusSent(true);
        } catch(e) { window.Telegram?.WebApp?.showAlert("Ошибка!"); }
    };

    if (loading) return <Loader />;

    return (
        <div className="app-container animate-fade-in">
            <div className="header">
                <div className="user-block">
                    {user.photo_url ? <img src={user.photo_url} className="avatar-img"/> : <div className="avatar">🦈</div>}
                    <div><div className="nickname">@{user.username}</div><div className="uid">ID: {user.id}</div></div>
                </div>
                <div className="balance-block"><div className="balance-label">SPINS</div><div className="balance-val">{user.spins}</div></div>
            </div>

            <div className="game-area">
                <h2 className="game-title glitch" data-text="ROCKET">ROCKET</h2>
                <div className="case-window">
                    <div className="pointer-line"></div>
                    <div className="track" style={{ transform: `translateX(${offset}px)`, transition: `transform ${animTime}s cubic-bezier(0.12, 0, 0.30, 1)` }}>
                        {cards.map((item, i) => (
                            <div key={i} className="item-card" style={{'--item-color': item.color}}>
                                <img src={item.img} className="item-img" alt="" />
                                <div className="item-name" style={{color:item.color}}>{item.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="controls">
                    <label className="fast-switch">
                        <input type="checkbox" checked={fast} onChange={e => setFast(e.target.checked)} disabled={spinning} />
                        <span className="slider"></span><span className="label-text">⚡ БЫСТРО</span>
                    </label>
                    <button onClick={spin} disabled={spinning || user.spins < 1} className="action-btn">
                        {spinning ? "КРУТИМ..." : user.spins > 0 ? "КРУТИТЬ (1 SPIN)" : "НЕТ СПИНОВ"}
                    </button>
                </div>
            </div>

            {winItem && (
                <div className="win-modal-overlay">
                    <div className="win-card animate-pop-up">
                        <div className="win-glow" style={{background: winItem.color}}></div>
                        <div className="win-title">{winItem.type === 'empty' ? 'НЕ ПОВЕЗЛО' : 'ВЫИГРЫШ'}</div>
                        <img src={winItem.img} className="win-img animate-float" alt="" />
                        <div className="win-name" style={{color: winItem.color}}>{winItem.name}</div>
                        
                        {winItem.type === 'money' && <div className="win-desc">Зачислено на баланс!</div>}
                        {winItem.type === 'status' && !statusSent && (
                            <div className="status-form">
                                <div className="win-desc">Введите текст статуса:</div>
                                <input className="status-input" value={statusText} onChange={e => setStatusText(e.target.value)} maxLength={20} />
                                <button className="collect-btn" onClick={sendStatus}>ОТПРАВИТЬ АДМИНУ</button>
                            </div>
                        )}
                        {winItem.type === 'status' && statusSent && <div className="win-desc" style={{color: '#22c55e'}}>✅ Отправлено!</div>}
                        
                        {(winItem.type !== 'status' || statusSent) && (
                            <button className="collect-btn" onClick={() => setWinItem(null)}>
                                {winItem.type === 'empty' ? 'ЗАКРЫТЬ' : 'ОТЛИЧНО'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;