import { useState, useEffect } from 'react';
import './index.css';

// 👇👇👇 ВСТАВЬ СЮДА СВОЙ HTTPS URL ОТ NGROK 👇👇👇
const API_URL = "https://unmummied-lethargically-loretta.ngrok-free.dev"; 

// --- 1. ПРОФИЛЬ (С кассой и фото) ---
const Profile = ({ user, tgUser }) => {
  // Аватарка: либо из телеграма, либо заглушка
  const avatarUrl = tgUser?.photo_url 
    ? tgUser.photo_url 
    : "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // Имя: если есть Fake Tag - показываем его, иначе username
  const displayName = user?.fake_tag ? user.fake_tag : (user?.username || "Guest");
  const isFake = !!user?.fake_tag;

  return (
    <div className="screen">
      <div className="glass-card profile-header">
        <div className="avatar" style={{ backgroundImage: `url(${avatarUrl})` }}></div>
        <div className="user-info">
          <h3 className={isFake ? "fake-tag" : ""}>
             {isFake ? displayName : `@${displayName}`}
          </h3>
          <span>ID: {user?.id || tgUser?.id || "..."}</span>
          <br/>
          <span style={{opacity: 0.7}}>Рег: {user?.register_date || "Недавно"}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-label">Баланс</span>
          <h4>{user?.balance?.toLocaleString() || 0} ₽</h4>
        </div>
        <div className="stat-box">
          <span className="stat-label">Спины</span>
          <h4 style={{color: 'var(--secondary)'}}>{user?.spins || 0} 🎟</h4>
        </div>
      </div>

      <h4 style={{marginTop: '20px', marginLeft: '5px'}}>📊 Моя Касса</h4>
      <div className="glass-card kassa-block">
        <div className="kassa-row">
          <span>За сегодня:</span>
          <span className="kassa-val" style={{color: '#fff'}}>{user?.stats?.day?.toLocaleString() || 0} ₽</span>
        </div>
        <div className="kassa-row">
          <span>За неделю:</span>
          <span className="kassa-val">{user?.stats?.week?.toLocaleString() || 0} ₽</span>
        </div>
        <div className="kassa-row">
          <span>За месяц:</span>
          <span className="kassa-val">{user?.stats?.month?.toLocaleString() || 0} ₽</span>
        </div>
        <div className="kassa-row" style={{borderTop: '1px solid #333', marginTop: '5px', paddingTop: '10px'}}>
          <span style={{color: 'var(--primary)'}}>За всё время:</span>
          <span className="kassa-val" style={{color: 'var(--primary)'}}>{user?.stats?.all?.toLocaleString() || 0} ₽</span>
        </div>
      </div>
    </div>
  );
};

// --- 2. ИГРА РАКЕТКА ---
const RocketGame = ({ user, refreshData }) => {
  const [flying, setFlying] = useState(false);
  const [multiplier, setMultiplier] = useState(1.00);
  const [status, setStatus] = useState("idle"); // idle, fly, crash, win

  const startGame = async () => {
    if ((user?.spins || 0) <= 0) {
      window.Telegram.WebApp.showAlert("У вас закончились спины! Сделайте профит.");
      return;
    }
    setFlying(true);
    setStatus("fly");
    setMultiplier(1.00);

    // Анимация набора высоты (визуальная)
    const timer = setInterval(() => {
        setMultiplier(prev => prev + 0.03);
    }, 50);

    try {
      const res = await fetch(`${API_URL}/api/rocket/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      const data = await res.json();
      
      clearInterval(timer);

      if (data.success) {
        setMultiplier(data.multiplier); // Ставим выигрышный X
        setStatus("win");
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      } else {
        setStatus("crash");
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
      
      refreshData(); // Обновляем баланс и спины
      setFlying(false);

    } catch (e) {
      clearInterval(timer);
      setFlying(false);
      setStatus("idle");
      console.error(e);
    }
  };

  return (
    <div className="screen">
      <h2>🚀 Ракетка</h2>
      <div className="glass-card rocket-zone">
         {status === "crash" && <h1 style={{color: 'var(--danger)', fontSize:'40px'}}>CRASH</h1>}
         {status === "win" && <h1 style={{color: 'var(--primary)', fontSize:'40px'}}>x{multiplier.toFixed(2)}</h1>}
         
         {(status === "fly" || status === "idle") && (
            <div style={{textAlign: 'center'}}>
                <div className="rocket-emoji" style={{
                    transform: status === "fly" ? `translateY(-${(multiplier*10)}px) scale(1.2)` : 'none'
                }}>🚀</div>
                <h2 style={{marginTop:'10px'}}>x{multiplier.toFixed(2)}</h2>
            </div>
         )}
      </div>
      
      <p style={{textAlign: 'center', color: '#666', marginBottom: '10px'}}>
         Осталось спинов: <b style={{color: '#fff'}}>{user?.spins || 0}</b>
      </p>

      <button className="btn-neon" onClick={startGame} disabled={flying}>
        {flying ? "ЛЕТИМ..." : "ЗАПУСТИТЬ"}
      </button>
    </div>
  );
};

// --- 3. НАСТАВНИКИ ---
const Mentors = () => {
  const [list, setList] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/mentors`)
      .then(r => r.json())
      .then(d => setList(d))
      .catch(e => console.log(e));
  }, []);

  return (
    <div className="screen">
      <h2>👨‍🏫 Наставники</h2>
      {list.map((m, i) => (
        <div key={i} className="glass-card" style={{padding: '0'}}>
          <div style={{
            height: '120px', 
            background: `url(${m.image_url || 'https://via.placeholder.com/400x150'}) center/cover`,
            borderRadius: '20px 20px 0 0'
          }}></div>
          <div style={{padding: '15px'}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
                <h4>{m.name}</h4>
                <span style={{color:'var(--primary)'}}>{m.fee_percent}%</span>
            </div>
            <p style={{fontSize:'12px', color:'#aaa'}}>{m.info}</p>
            <div style={{marginTop:'10px'}}>
               {m.directions.split(',').map(d => (
                 <span key={d} style={{
                    fontSize:'10px', background:'rgba(255,255,255,0.1)', 
                    padding:'4px 8px', borderRadius:'5px', marginRight:'5px'
                 }}>{d}</span>
               ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- 4. ТОП ---
const TopLeaders = () => {
    const [top, setTop] = useState([]);
  
    useEffect(() => {
      fetch(`${API_URL}/api/top`).then(r => r.json()).then(setTop).catch(console.error);
    }, []);
  
    return (
      <div className="screen">
        <h2>🏆 Зал Славы</h2>
        <div className="glass-card">
           {top.map((u, i) => (
             <div key={i} style={{
                display:'flex', justifyContent:'space-between', padding:'10px 0',
                borderBottom: i < top.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
             }}>
                <div style={{display:'flex', gap:'10px'}}>
                    <b style={{color: i===0?'gold': i===1?'silver': i===2?'#cd7f32':'#555'}}>#{i+1}</b>
                    <span>{u.username}</span>
                </div>
                <b style={{color:'var(--primary)'}}>{u.balance.toLocaleString()} ₽</b>
             </div>
           ))}
        </div>
      </div>
    );
};

// --- MAIN ---
function App() {
  const [tab, setTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [tgUser, setTgUser] = useState(null);

  const fetchUserData = (uid) => {
     fetch(`${API_URL}/api/user/${uid}`)
       .then(r => r.json())
       .then(data => {
           if (!data.error) setUser(data);
       })
       .catch(err => console.error("API Error:", err));
  };

  useEffect(() => {
    // Инициализация Telegram
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    // Берем данные из телеграма
    const tUser = tg.initDataUnsafe?.user;
    setTgUser(tUser);

    // ID для запроса к БД (фоллбек для браузера - твой ID)
    const queryId = tUser?.id || 6960794064;
    
    fetchUserData(queryId);

    // Настраиваем цвета приложения под тему
    tg.setHeaderColor('#050505');
    tg.setBackgroundColor('#050505');
  }, []);

  // Функция обновления данных (после игры)
  const refresh = () => {
      const uid = tgUser?.id || 6960794064;
      fetchUserData(uid);
  }

  return (
    <div>
      {tab === 'profile' && <Profile user={user} tgUser={tgUser} />}
      {tab === 'rocket' && <RocketGame user={user} refreshData={refresh} />}
      {tab === 'mentors' && <Mentors />}
      {tab === 'top' && <TopLeaders />}

      <div className="bottom-nav">
        <div className={`nav-item ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}>
           <div className="nav-icon">👤</div>
           <span>Я</span>
        </div>
        <div className={`nav-item ${tab==='rocket'?'active':''}`} onClick={()=>setTab('rocket')}>
           <div className="nav-icon">🚀</div>
           <span>Игра</span>
        </div>
        <div className={`nav-item ${tab==='mentors'?'active':''}`} onClick={()=>setTab('mentors')}>
           <div className="nav-icon">🎓</div>
           <span>Менторы</span>
        </div>
        <div className={`nav-item ${tab==='top'?'active':''}`} onClick={()=>setTab('top')}>
           <div className="nav-icon">🏆</div>
           <span>Топ</span>
        </div>
      </div>
    </div>
  );
}

export default App;