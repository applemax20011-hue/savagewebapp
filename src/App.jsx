import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import axios from 'axios';

// !!! ССЫЛКА С NGROK !!!
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json"
    }
});

// ЗВУКИ
const AUDIO = {
    click: new Audio('https://cdn.freesound.org/previews/613/613867_11632007-lq.mp3'),
    spin: new Audio('https://cdn.freesound.org/previews/32/32184_379750-lq.mp3'),
    win: new Audio('https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3'),
    lose: new Audio('https://cdn.freesound.org/previews/76/76362_1083696-lq.mp3'),
    start: new Audio('https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3')
};
Object.values(AUDIO).forEach(a => { a.volume = 0.4; a.load(); });

const playSfx = (name) => { try { AUDIO[name].currentTime = 0; AUDIO[name].play().catch(()=>{}); } catch(e) {} };

const CASE_ITEMS = [
    { id: 'empty',  name: "💀 ПУСТО",       val: 0,   type: 'empty',  color: '#3f3f46', weight: 45, img: "https://cdn-icons-png.flaticon.com/512/1077/1077114.png" },
    { id: 'check',  name: "💵 ЧЕК 0.5$",    val: 0.5, type: 'money',  color: '#3b82f6', weight: 30, img: "https://cdn-icons-png.flaticon.com/512/2534/2534204.png" },
    { id: 'one',    name: "🍌 1$",          val: 1,   type: 'money',  color: '#8b5cf6', weight: 15, img: "https://cdn-icons-png.flaticon.com/512/2534/2534204.png" },
    { id: 'status', name: "💎 STATUS",      val: 0,   type: 'status', color: '#ec4899', weight: 8,  img: "https://cdn-icons-png.flaticon.com/512/10692/10692795.png" },
    { id: 'five',   name: "🔥 5$ (JACKPOT)",val: 5,   type: 'money',  color: '#eab308', weight: 2,  img: "https://cdn-icons-png.flaticon.com/512/744/744922.png" },
];

const CARD_WIDTH = 148;

function App() {
    const [user, setUser] = useState({ id: 0, username: 'Загрузка...', balance: 0 });
    const [page, setPage] = useState('menu');

    useEffect(() => {
        // Инициализация
        const tg = window.Telegram?.WebApp;
        
        if (tg) {
            tg.ready();
            tg.expand();
            
            const tgUser = tg.initDataUnsafe?.user;
            
            if (tgUser) {
                // ДАННЫЕ НАЙДЕНЫ (Открыто в ТГ)
                // Запрашиваем баланс по реальному ID
                api.get(`/init/${tgUser.id}`)
                    .then(res => {
                        setUser({ 
                            id: tgUser.id, 
                            username: tgUser.username || tgUser.first_name, 
                            balance: res.data.balance || 0,
                            photo_url: tgUser.photo_url
                        });
                    })
                    .catch(err => {
                        // Ошибка API
                        setUser(prev => ({ ...prev, id: tgUser.id, username: tgUser.username, balance: 0 }));
                        // tg.showAlert(`Ошибка API: ${err.message}`);
                    });
            } else {
                // ОТКРЫТО НЕ В ТГ (или данные не пришли)
                // Для теста ставим твой ID вручную
                const myRealID = 5839201122; // <-- ТВОЙ АЙДИ (поменяй если другой)
                api.get(`/init/${myRealID}`).then(res => {
                    setUser({ id: myRealID, username: "Тест Браузер", balance: res.data.balance || 0 });
                });
            }
        }
    }, []);

    const updateBalance = (newBal) => setUser(prev => ({...prev, balance: newBal}));

    return (
        <div className="app-container">
            <div className="header">
                <div className="user-block">
                    {user.photo_url ? <img src={user.photo_url} className="avatar-img"/> : <div className="avatar">🦈</div>}
                    <div>
                        <div className="nickname">@{user.username}</div>
                        <div className="uid">ID: {user.id}</div>
                    </div>
                </div>
                <div className="balance-block">
                    <div className="balance-label">БАЛАНС</div>
                    <div className="balance-val">${(user.balance || 0).toFixed(2)}</div>
                </div>
            </div>

            {page === 'menu' && <Menu setPage={setPage} />}
            {page === 'rocket' && <RocketGame user={user} setPage={setPage} onUpdate={updateBalance} />}
            {page === 'dice' && <DiceGame user={user} setPage={setPage} onUpdate={updateBalance} />}
        </div>
    );
}

// === КОМПОНЕНТЫ ИГР ===
const Menu = ({ setPage }) => (
    <div className="menu-grid animate-in">
        <div className="game-card rocket" onClick={() => { playSfx('click'); setPage('rocket'); }}>
            <div className="game-icon">🚀</div>
            <div className="game-info"><h3>Rocket Case</h3><p>Кейс удачи</p></div>
        </div>
        <div className="game-card dice" onClick={() => { playSfx('click'); setPage('dice'); }}>
            <div className="game-icon">🎲</div>
            <div className="game-info"><h3>Dice x5</h3><p>Угадай число</p></div>
        </div>
    </div>
);

const DiceGame = ({ user, setPage, onUpdate }) => {
    const [bet, setBet] = useState(1);
    const [num, setNum] = useState(null);
    const [rolling, setRolling] = useState(false);
    const [result, setResult] = useState(1);
    const [win, setWin] = useState(0);

    const play = async () => {
        if(rolling) return;
        if(!num) return window.Telegram?.WebApp?.showAlert("Выбери число!");
        
        playSfx('click');
        setRolling(true);
        setWin(0);

        try {
            const res = await api.post(`/play`, { user_id: user.id, game: 'dice', bet: bet, selected_num: num });
            const { dice_result, new_balance, win_amount } = res.data;

            setTimeout(() => {
                setResult(dice_result);
                setRolling(false);
                onUpdate(new_balance);
                if (win_amount > 0) {
                    setWin(win_amount);
                    playSfx('win');
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                } else playSfx('lose');
            }, 1500);
        } catch (e) {
            setRolling(false);
            window.Telegram?.WebApp?.showAlert("Ошибка или мало денег!");
        }
    };

    return (
        <div className="game-container animate-in">
            <button className="back-btn" onClick={() => setPage('menu')}>‹ МЕНЮ</button>
            <h2 className="game-title glitch" data-text="DICE x5">DICE x5</h2>
            <div className="dice-scene">
                <div className={`cube ${rolling ? 'rolling' : ''} show-${result}`}>
                    {[1,2,3,4,5,6].map(n => <div key={n} className={`cube__face cube__face--${n}`}>{n}</div>)}
                </div>
            </div>
            {win > 0 && <div className="status-msg win">ВЫИГРЫШ: +{win}$</div>}
            <div className="dice-selector">
                <div className="numbers-grid">
                    {[1,2,3,4,5,6].map(n => (
                        <div key={n} className={`num-btn ${num===n?'active':''}`} onClick={() => { if(!rolling) setNum(n); playSfx('click'); }}>{n}</div>
                    ))}
                </div>
            </div>
            <div className="bet-controls">
                <div className="bet-label">СТАВКА: <span className="val">${bet}</span></div>
                <input type="range" min="1" max="50" value={bet} onChange={e => setBet(Number(e.target.value))} className="slider" disabled={rolling} />
            </div>
            <button className="action-btn" onClick={play} disabled={rolling || !num}>{rolling ? "БРОСАЮ..." : num ? `СТАВКА ${bet}$ НА [${num}]` : "ВЫБЕРИ ЧИСЛО"}</button>
        </div>
    );
};

const RocketGame = ({ user, setPage, onUpdate }) => {
    const [spinning, setSpinning] = useState(false);
    const [cards, setCards] = useState([]);
    const [offset, setOffset] = useState(0);
    const [animTime, setAnimTime] = useState(0);
    const [winItem, setWinItem] = useState(null);
    const [fast, setFast] = useState(false);

    const genStrip = () => {
        let arr = [];
        for(let i=0; i<80; i++) arr.push({...CASE_ITEMS[Math.floor(Math.random()*CASE_ITEMS.length)], uid: Math.random()});
        return arr;
    }
    useEffect(() => setCards(genStrip()), []);

    const play = async () => {
        if(spinning) return;
        setWinItem(null); setAnimTime(0); setOffset(0);

        setTimeout(async () => {
            try {
                setSpinning(true);
                playSfx('start');
                const res = await api.post(`/play`, { user_id: user.id, game: 'rocket' });
                const { winner_id, new_balance } = res.data;
                const winner = CASE_ITEMS.find(i => i.id === winner_id);
                const newCards = genStrip();
                newCards[60] = winner;
                setCards(newCards);

                const containerW = window.innerWidth > 600 ? 600 : window.innerWidth - 32;
                const shift = (Math.random() * CARD_WIDTH * 0.6) - (CARD_WIDTH * 0.3);
                const finalScroll = (60 * CARD_WIDTH) + (CARD_WIDTH / 2) - (containerW / 2) + shift;

                const duration = fast ? 0.5 : 5;
                setAnimTime(duration);
                setOffset(-finalScroll);

                if(!fast) setTimeout(() => playSfx('spin'), 200);

                setTimeout(() => {
                    setSpinning(false);
                    setWinItem(winner);
                    onUpdate(new_balance);
                    if(winner.val > 0 || winner.id === 'status') {
                        playSfx('win');
                        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    } else playSfx('lose');
                }, duration * 1000);
            } catch (e) {
                setSpinning(false);
                window.Telegram?.WebApp?.showAlert("Ошибка или мало денег!");
            }
        }, 50);
    };

    return (
        <div className="game-container animate-in">
            <button className="back-btn" onClick={() => setPage('menu')} disabled={spinning}>‹ МЕНЮ</button>
            <h2 className="game-title glitch" data-text="ROCKET">ROCKET</h2>
            <div className="case-window">
                <div className="pointer-line"></div>
                <div className="track" style={{ transform: `translateX(${offset}px)`, transition: `transform ${animTime}s cubic-bezier(0.1, 0, 0.2, 1)` }}>
                    {cards.map((item, i) => (
                        <div key={i} className="item-card" style={{'--item-color': item.color}}>
                            <img src={item.img} className="item-img" />
                            <div className="item-name" style={{color:item.color}}>{item.name}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="controls">
                <label className="fast-switch">
                    <input type="checkbox" checked={fast} onChange={e => setFast(e.target.checked)} disabled={spinning} />
                    <span className="slider"></span>
                    <span className="label-text">⚡ БЫСТРО</span>
                </label>
                <button onClick={play} disabled={spinning} className="action-btn">{spinning ? "КРУТИМ..." : "ОТКРЫТЬ (5$)"}</button>
            </div>
            {winItem && (
                <div className="win-modal-overlay" onClick={() => setWinItem(null)}>
                    <div className="win-card animate-pop-up" onClick={e => e.stopPropagation()}>
                        <div className="win-title">{winItem.val > 0 ? 'ВЫИГРЫШ' : 'РЕЗУЛЬТАТ'}</div>
                        <img src={winItem.img} className="win-img" />
                        <div className="win-name" style={{color: winItem.color}}>{winItem.name}</div>
                        <button className="collect-btn" onClick={() => setWinItem(null)}>ЗАБРАТЬ</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;