import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

// --- НАСТРОЙКИ ---
const SOUNDS = {
    click: 'https://cdn.freesound.org/previews/613/613867_11632007-lq.mp3',
    spin: 'https://cdn.freesound.org/previews/32/32184_379750-lq.mp3',
    win: 'https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3',
    dice: 'https://cdn.freesound.org/previews/376/376742_5076729-lq.mp3',
    lose: 'https://cdn.freesound.org/previews/76/76362_1083696-lq.mp3',
    select: 'https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3'
};

const CASE_ITEMS = [
    { id: 'empty',  name: "💀 ПУСТО",       val: 0,   type: 'empty',  color: '#3f3f46', weight: 45, img: "https://cdn-icons-png.flaticon.com/512/1077/1077114.png" },
    { id: 'check',  name: "💵 ЧЕК 0.5$",    val: 0.5, type: 'money',  color: '#3b82f6', weight: 30, img: "https://cdn-icons-png.flaticon.com/512/2534/2534204.png" },
    { id: 'one',    name: "🍌 1$",          val: 1,   type: 'money',  color: '#8b5cf6', weight: 15, img: "https://cdn-icons-png.flaticon.com/512/2534/2534204.png" },
    { id: 'status', name: "💎 STATUS",      val: 0,   type: 'status', color: '#ec4899', weight: 8,  img: "https://cdn-icons-png.flaticon.com/512/10692/10692795.png" },
    { id: 'five',   name: "🔥 5$ (ОКУП)",   val: 5,   type: 'money',  color: '#eab308', weight: 2,  img: "https://cdn-icons-png.flaticon.com/512/744/744922.png" },
];

const CARD_WIDTH = 148;

// Аудио-менеджер
const playAudio = (name) => {
    const audio = new Audio(SOUNDS[name]);
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Audio play failed (user didn't interact yet)"));
};

// === КОМПОНЕНТ: МЕНЮ ===
const MainMenu = ({ setGame }) => (
    <div className="menu-grid animate-in">
        <div className="game-card rocket" onClick={() => { playAudio('click'); setGame('rocket'); }}>
            <div className="game-icon">🚀</div>
            <div className="game-info">
                <h3>Rocket Case</h3>
                <p>Крути и выбивай призы</p>
            </div>
        </div>
        <div className="game-card dice" onClick={() => { playAudio('click'); setGame('dice'); }}>
            <div className="game-icon">🎲</div>
            <div className="game-info">
                <h3>Savage Dice</h3>
                <p>Угадай число (x5)</p>
            </div>
        </div>
    </div>
);

// === КОМПОНЕНТ: КУБИК (DICE) ===
const DiceGame = ({ user, updateBalance, goBack }) => {
    const [bet, setBet] = useState(10);
    const [selectedNum, setSelectedNum] = useState(null); // Выбранное число
    const [rolling, setRolling] = useState(false);
    const [result, setResult] = useState(1);
    const [winAmount, setWinAmount] = useState(0);

    const rollDice = () => {
        if (rolling) return;
        if (!selectedNum) { window.Telegram?.WebApp?.showAlert("Выберите число!"); return; }
        if (user.balance < bet) { window.Telegram?.WebApp?.showAlert("Мало денег!"); return; }

        updateBalance(-bet);
        setRolling(true);
        setWinAmount(0);
        playAudio('dice');

        setTimeout(() => {
            const diceVal = Math.floor(Math.random() * 6) + 1;
            setResult(diceVal);
            setRolling(false);

            if (diceVal === selectedNum) {
                const win = bet * 5; // x5 за угадывание
                setWinAmount(win);
                updateBalance(win);
                playAudio('win');
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
                window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
            } else {
                playAudio('lose');
                window.Telegram?.WebApp?.HapticFeedback.impactOccurred('heavy');
            }
        }, 2000);
    };

    return (
        <div className="game-container animate-in">
            <button className="back-btn" onClick={goBack}>‹ МЕНЮ</button>
            <h2 className="game-title glitch" data-text="SAVAGE DICE">SAVAGE DICE</h2>

            <div className="dice-scene">
                <div className={`cube ${rolling ? 'rolling' : ''} show-${result}`}>
                    {[1,2,3,4,5,6].map(n => <div key={n} className={`cube__face cube__face--${n}`}>{n}</div>)}
                </div>
            </div>

            {winAmount > 0 ? (
                <div className="status-msg win">ВЫИГРЫШ: +{winAmount}$</div>
            ) : (
                <div className="status-msg">Коэффициент: <span className="accent">x5</span></div>
            )}

            <div className="dice-selector">
                <p>ВЫБЕРИ ЧИСЛО:</p>
                <div className="numbers-grid">
                    {[1,2,3,4,5,6].map(n => (
                        <div 
                            key={n} 
                            className={`num-btn ${selectedNum === n ? 'active' : ''}`}
                            onClick={() => { if(!rolling) { setSelectedNum(n); playAudio('select'); } }}
                        >
                            {n}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bet-controls">
                <div className="bet-label">СТАВКА: <span className="val">${bet}</span></div>
                <input 
                    type="range" min="1" max="100" value={bet} 
                    onChange={(e) => setBet(parseInt(e.target.value))} 
                    className="slider" disabled={rolling}
                />
            </div>

            <button className="action-btn" onClick={rollDice} disabled={rolling || !selectedNum}>
                {rolling ? "БРОСАЮ..." : selectedNum ? `ПОСТАВИТЬ ${bet}$ НА [${selectedNum}]` : "ВЫБЕРИ ЧИСЛО"}
            </button>
        </div>
    );
};

// === КОМПОНЕНТ: РАКЕТКА ===
const RocketGame = ({ user, updateBalance, goBack }) => {
    const PRICE = 5;
    const [spinning, setSpinning] = useState(false);
    const [offset, setOffset] = useState(0);
    const [cards, setCards] = useState([]);
    const [winItem, setWinItem] = useState(null);
    const [isFast, setIsFast] = useState(false);
    const [animDuration, setAnimDuration] = useState(0);

    const generateStrip = () => {
        let pool = [];
        CASE_ITEMS.forEach(item => { for(let k=0; k<item.weight; k++) pool.push(item); });
        let arr = [];
        for(let i=0; i<100; i++) {
            const item = pool[Math.floor(Math.random() * pool.length)];
            arr.push({ ...item, uid: Math.random() });
        }
        return arr;
    }

    useEffect(() => { setCards(generateStrip()); }, []);

    const spin = () => {
        if (spinning) return;
        if (user.balance < PRICE) { window.Telegram?.WebApp?.showAlert("Мало денег!"); return; }

        setWinItem(null);
        setAnimDuration(0);
        setOffset(0);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                startSpin();
            });
        });
    };

    const startSpin = () => {
        updateBalance(-PRICE);
        setSpinning(true);
        playAudio('click');
        window.Telegram?.WebApp?.HapticFeedback.impactOccurred('medium');

        setTimeout(() => {
            // Шансы подкручены в весе предметов (CASE_ITEMS)
            let pool = [];
            CASE_ITEMS.forEach(item => { for(let k=0; k<item.weight; k++) pool.push(item); });
            const winner = pool[Math.floor(Math.random() * pool.length)];

            const winPos = 60; 
            const newStrip = generateStrip();
            newStrip[winPos] = winner;
            setCards(newStrip);

            const containerW = window.innerWidth > 600 ? 600 : window.innerWidth - 32;
            const shift = (Math.random() * CARD_WIDTH * 0.7) - (CARD_WIDTH * 0.35);
            const finalScroll = (winPos * CARD_WIDTH) + (CARD_WIDTH / 2) - (containerW / 2) + shift;

            const dur = isFast ? 0.5 : 5;
            setAnimDuration(dur);
            setOffset(-finalScroll);

            if (!isFast) setTimeout(() => playAudio('spin'), 200);

            setTimeout(() => finish(winner), dur * 1000);
        }, 50);
    };

    const finish = (winner) => {
        setSpinning(false);
        setWinItem(winner);
        
        if (winner.type === 'money') {
            updateBalance(winner.val);
            playAudio('win');
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else if (winner.type === 'status') {
            playAudio('win');
            confetti({ particleCount: 150, spread: 90, colors: ['#ec4899'] });
        } else {
            playAudio('lose');
        }
        window.Telegram?.WebApp?.HapticFeedback.notificationOccurred(winner.type === 'empty' ? 'error' : 'success');
    };

    return (
        <div className="game-container animate-in">
            <button className="back-btn" onClick={goBack} disabled={spinning}>‹ МЕНЮ</button>
            <h2 className="game-title glitch" data-text="ROCKET CASE">ROCKET CASE</h2>

            <div className="case-window">
                <div className="pointer-line"></div>
                <div className="track" style={{ 
                    transform: `translateX(${offset}px)`,
                    transition: `transform ${animDuration}s cubic-bezier(0.12, 0, 0.30, 1)`
                }}>
                    {cards.map((item, i) => (
                        <div key={i} className="item-card" style={{ '--item-color': item.color }}>
                            <img src={item.img} className="item-img" alt="" />
                            <div className="item-name" style={{color:item.color}}>{item.name}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="controls">
                <div className="fast-switch-wrapper">
                    <label className="fast-switch">
                        <input type="checkbox" checked={isFast} onChange={(e) => setIsFast(e.target.checked)} disabled={spinning} />
                        <span className="slider"></span>
                        <span className="label-text">⚡ БЫСТРО</span>
                    </label>
                </div>
                <button onClick={spin} disabled={spinning} className={`action-btn ${spinning ? 'disabled' : ''}`}>
                    {spinning ? "КРУТИМ..." : `ОТКРЫТЬ ЗА ${PRICE}$`}
                </button>
            </div>

            {winItem && (
                <div className="win-modal-overlay" onClick={() => setWinItem(null)}>
                    <div className="win-card" onClick={e => e.stopPropagation()}>
                        <div className="win-glow" style={{background: winItem.color}}></div>
                        <div className="win-title">{winItem.type === 'empty' ? 'НЕ ПОВЕЗЛО' : 'ВЫИГРЫШ'}</div>
                        <img src={winItem.img} className="win-img" alt="" />
                        <div className="win-name" style={{color: winItem.color}}>{winItem.name}</div>
                        {winItem.type === 'status' && <div className="win-desc">Пиши админу!</div>}
                        <button className="collect-btn" onClick={() => setWinItem(null)}>
                            {winItem.type === 'empty' ? 'ЗАКРЫТЬ' : 'ЗАБРАТЬ'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// === ГЛАВНЫЙ ===
function App() {
    const [user, setUser] = useState({ username: 'Savage User', id: 0, balance: 500 });
    const [activeGame, setActiveGame] = useState(null);

    const tg = window.Telegram?.WebApp;

    useEffect(() => {
        tg?.ready();
        tg?.expand();
        if(tg?.initDataUnsafe?.user) {
            setUser(prev => ({...prev, username: tg.initDataUnsafe.user.username, id: tg.initDataUnsafe.user.id }));
        }
    }, []);

    const updateBalance = (delta) => {
        setUser(prev => ({ ...prev, balance: prev.balance + delta }));
    };

    return (
        <div className="app-container">
            <div className="header">
                <div className="user-block">
                    <div className="avatar">🦈</div>
                    <div>
                        <div className="nickname">@{user.username}</div>
                        <div className="uid">ID: {user.id}</div>
                    </div>
                </div>
                <div className="balance-block">
                    <div className="balance-label">БАЛАНС</div>
                    <div className="balance-val">${user.balance.toFixed(2)}</div>
                </div>
            </div>

            {!activeGame && <MainMenu setGame={setActiveGame} />}
            {activeGame === 'rocket' && <RocketGame user={user} updateBalance={updateBalance} goBack={() => setActiveGame(null)} />}
            {activeGame === 'dice' && <DiceGame user={user} updateBalance={updateBalance} goBack={() => setActiveGame(null)} />}
        </div>
    );
}

export default App;