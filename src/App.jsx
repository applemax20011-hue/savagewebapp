import { useState, useEffect, useRef } from 'react';
import './App.css';

// ⚠️ ЗАМЕНИ НА СВОЙ URL NGROK (без / в конце)
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev"; 

// --- COMPONENTS ---

const Profile = ({ user }) => (
  <div className="screen">
    <div className="profile-header">
      <div className="avatar">🦈</div>
      <h2>{user?.username || "Loading..."}</h2>
      <p style={{color: 'var(--text-gray)'}}>ID: {user?.id || "..."}</p>
    </div>

    <div className="stat-grid">
      <div className="stat-card">
        <p style={{color: 'var(--text-gray)', fontSize: '12px'}}>Баланс</p>
        <h2 className="gradient-text">{user?.balance?.toLocaleString() || 0} ₽</h2>
      </div>
      <div className="stat-card">
        <p style={{color: 'var(--text-gray)', fontSize: '12px'}}>Профитов</p>
        <h3>{user?.profits || 0}</h3>
      </div>
    </div>
    
    <div className="stat-card" style={{marginTop: '15px'}}>
        <p style={{color: 'var(--text-gray)', fontSize: '12px'}}>Спины Ракетки</p>
        <h3 style={{color: 'var(--secondary)'}}>{user?.spins || 0} 🎟</h3>
    </div>
  </div>
);

const RocketGame = ({ user, onSpin }) => {
  const [flying, setFlying] = useState(false);
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashed, setCrashed] = useState(false);
  const [result, setResult] = useState(null);

  const startGame = async () => {
    if (user.spins <= 0) {
      alert("Нет спинов! Сделай профит.");
      return;
    }
    setFlying(true);
    setCrashed(false);
    setResult(null);
    setMultiplier(1.00);

    // Запрос к API
    try {
      // Имитация полета перед получением результата
      let currentX = 1.0;
      const interval = setInterval(() => {
        currentX += 0.05;
        setMultiplier(currentX);
      }, 100);

      // Реальный запрос (раскомментируй когда будет API)
      const res = await fetch(`${API_URL}/api/rocket/spin`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ user_id: user.id })
      });
      const data = await res.json();
      
      clearInterval(interval);

      if (data.success) {
        setMultiplier(data.multiplier || 2.5); // Ставим итоговый X
        setResult(`Вы выиграли x${data.multiplier}!`);
        onSpin(); // Обновить баланс пользователя
      } else {
        setCrashed(true);
        setResult("Краш! Попробуй еще.");
      }
      setFlying(false);

    } catch (e) {
      console.error(e);
      setFlying(false);
    }
  };

  return (
    <div className="screen">
      <h2 style={{marginBottom: '20px'}}>🚀 Ракетка</h2>
      
      <div className="rocket-area">
        {crashed ? (
           <h1 style={{color: 'red', fontSize: '40px'}}>💥 CRASH</h1>
        ) : (
           <div className="rocket-container" style={{textAlign: 'center'}}>
             <div className="rocket-obj" style={{
                 transform: flying ? `translateY(-${(multiplier - 1)*50}px) scale(${1 + (multiplier-1)*0.2})` : 'none'
             }}>🚀</div>
             <h1 style={{marginTop: '20px'}}>x{multiplier.toFixed(2)}</h1>
           </div>
        )}
      </div>

      {result && <p style={{textAlign: 'center', marginBottom: '10px'}}>{result}</p>}

      <button 
        className="launch-btn" 
        onClick={startGame} 
        disabled={flying || user?.spins <= 0}
      >
        {flying ? "ЛЕТИМ..." : `ЗАПУСТИТЬ (Осталось: ${user?.spins || 0})`}
      </button>
    </div>
  );
};

const Mentors = () => {
  const [mentors, setMentors] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/mentors`)
      .then(res => res.json())
      .then(data => setMentors(data))
      .catch(err => console.log("Demo mode: loading mock mentors"));
      // Demo data
      if(mentors.length === 0) {
          setMentors([
              {id: 1, name: "Savage Mentor", directions: "Трейд, NFT", fee_percent: 10, info: "Топовый наставник"},
              {id: 2, name: "Crypto Queen", directions: "Эскорт", fee_percent: 15, info: "Лучший саппорт"}
          ]);
      }
  }, []);

  return (
    <div className="screen">
      <h2 style={{marginBottom: '20px'}}>👨‍🏫 Наставники</h2>
      {mentors.map(m => (
        <div key={m.id} className="mentor-card">
          <div className="mentor-img" style={{backgroundImage: `url(${m.image_url || 'https://via.placeholder.com/400x150?text=MENTOR'})`}}></div>
          <div className="mentor-info">
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <h3>{m.name}</h3>
                <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>{m.fee_percent}%</span>
            </div>
            <p style={{color: 'var(--text-gray)', fontSize: '13px', margin: '10px 0'}}>{m.info}</p>
            <div>
                {m.directions.split(',').map(d => (
                    <span key={d} className="mentor-tag">{d}</span>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/api/top`)
            .then(res => res.json())
            .then(data => setLeaders(data))
            .catch(() => {
                setLeaders([
                    {rank: 1, username: "SavageKing", balance: 500000},
                    {rank: 2, username: "WorkerOne", balance: 320000},
                    {rank: 3, username: "RichGuy", balance: 150000},
                ])
            });
    }, []);

    return (
        <div className="screen">
            <h2 style={{marginBottom: '20px'}}>🏆 Топ Воркеров</h2>
            {leaders.map((l, i) => (
                <div key={i} className={`leader-row rank-${l.rank}`}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <b style={{width: '30px', color: 'var(--text-gray)'}}>#{l.rank}</b>
                        <span>{l.username}</span>
                    </div>
                    <b style={{color: 'var(--primary)'}}>{l.balance.toLocaleString()} ₽</b>
                </div>
            ))}
        </div>
    )
}

// --- MAIN APP ---

function App() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState({ id: 0, username: "Guest", balance: 0, profits: 0, spins: 0 });

  useEffect(() => {
    // Интеграция с Telegram WebApp
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Получаем user_id из initData (или тестовый)
    const userId = tg.initDataUnsafe?.user?.id || 6960794064; // Твой ID как фоллбек для тестов

    // Загружаем данные юзера
    fetch(`${API_URL}/api/user/${userId}`)
      .then(res => res.json())
      .then(data => {
          if(!data.error) setUser({ ...data, id: userId });
      })
      .catch(err => console.error("API Error", err));
      
    // Красим хедер телеграма в черный
    tg.setHeaderColor('#0d0d0d');
  }, []);

  const refreshUser = () => {
      // Обновить данные после игры
      const tg = window.Telegram.WebApp;
      const userId = tg.initDataUnsafe?.user?.id || 6960794064;
      fetch(`${API_URL}/api/user/${userId}`).then(res=>res.json()).then(data => !data.error && setUser({...data, id: userId}));
  };

  return (
    <div className="app-container">
      {activeTab === 'profile' && <Profile user={user} />}
      {activeTab === 'rocket' && <RocketGame user={user} onSpin={refreshUser} />}
      {activeTab === 'mentors' && <Mentors />}
      {activeTab === 'top' && <Leaderboard />}

      <div className="bottom-nav">
        <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <div className="nav-icon">👤</div>
          <span>Профиль</span>
        </div>
        <div className={`nav-item ${activeTab === 'rocket' ? 'active' : ''}`} onClick={() => setActiveTab('rocket')}>
          <div className="nav-icon">🚀</div>
          <span>Ракетка</span>
        </div>
        <div className={`nav-item ${activeTab === 'mentors' ? 'active' : ''}`} onClick={() => setActiveTab('mentors')}>
          <div className="nav-icon">👨‍🏫</div>
          <span>Наставники</span>
        </div>
        <div className={`nav-item ${activeTab === 'top' ? 'active' : ''}`} onClick={() => setActiveTab('top')}>
          <div className="nav-icon">🏆</div>
          <span>Топ</span>
        </div>
      </div>
    </div>
  );
}

export default App;