import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';

// !!! ВСТАВЬ СЮДА ССЫЛКУ С NGROK !!!
const API_URL = "https://ТВОЙ-URL.ngrok-free.app";

const ITEMS = [
    {id: 1, name: "💩 Луз (10₽)",      img: "https://cdn-icons-png.flaticon.com/512/616/616569.png"},
    {id: 2, name: "🍌 Мелочь (100₽)",  img: "https://cdn-icons-png.flaticon.com/512/272/272525.png"},
    {id: 3, name: "😐 Половина (500₽)", img: "https://cdn-icons-png.flaticon.com/512/2534/2534204.png"},
    {id: 4, name: "♻️ Окуп (1000₽)",   img: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"},
    {id: 5, name: "🔥 X2 (2000₽)",     img: "https://cdn-icons-png.flaticon.com/512/744/744922.png"},
];

function App() {
  const [user, setUser] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [offset, setOffset] = useState(0);
  const [cards, setCards] = useState([]);
  const [winItem, setWinItem] = useState(null);
  
  // Получаем ID из Телеграма
  const tg = window.Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id || 7086207854; // Тестовый ID

  useEffect(() => {
    tg?.ready();
    tg?.expand();
    fetchUser();
    // Генерируем начальную ленту
    setCards(generateStrip(50)); 
  }, []);

  const fetchUser = () => {
    axios.get(`${API_URL}/user/${userId}`)
      .then(res => setUser(res.data))
      .catch(e => console.error(e));
  };

  const generateStrip = (count) => {
    let arr = [];
    for(let i=0; i<count; i++) {
        arr.push(ITEMS[Math.floor(Math.random() * ITEMS.length)]);
    }
    return arr;
  }

  const spin = async () => {
    if (spinning) return;
    if (user.balance < 1000) {
        tg.showAlert("Недостаточно средств! Нужно 1000₽");
        return;
    }

    setSpinning(true);
    setWinItem(null);
    setOffset(0); // Сброс позиции

    try {
        // 1. Запрос к API
        const { data } = await axios.post(`${API_URL}/open/${userId}`);
        
        if (data.success) {
            // 2. Подготовка ленты
            // Нам нужно, чтобы выигранный предмет оказался примерно на 75-й позиции
            const winIndex = 75; 
            const newCards = generateStrip(100);
            
            // Вставляем выигрыш в нужную позицию
            const winner = ITEMS.find(i => i.id === data.prize_id);
            newCards[winIndex] = winner;
            setCards(newCards);

            // 3. Вычисление сдвига (ширина карты 150px с отступами)
            const cardWidth = 150; 
            const containerWidth = window.innerWidth > 600 ? 600 : window.innerWidth;
            // Центрируем: (позиция * ширина) - (половина экрана) + (половина карты) + (рандом внутри карты)
            const randomOffset = Math.floor(Math.random() * 100) - 50; 
            const scrollPos = (winIndex * cardWidth) - (containerWidth / 2) + (cardWidth / 2) + randomOffset;

            // 4. Запуск анимации CSS
            setTimeout(() => {
                setOffset(-scrollPos);
            }, 100); // Небольшая задержка для рендера

            // 5. Окончание анимации (через 5 секунд)
            setTimeout(() => {
                setSpinning(false);
                setWinItem(winner);
                setUser(prev => ({...prev, balance: data.new_balance}));
                
                // Салют
                if (winner.id >= 4) {
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }
                tg.HapticFeedback.notificationOccurred('success');
            }, 5000);
        }
    } catch (e) {
        console.error(e);
        setSpinning(false);
        tg.showAlert("Ошибка сервера или нехватка денег");
    }
  };

  if (!user) return <div className="text-center p-10">Загрузка...</div>;

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-8 bg-[#111] p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-xl">👤</div>
            <div>
                <div className="font-bold text-sm">@{user.username}</div>
                <div className="text-xs text-gray-400">ID: {userId}</div>
            </div>
        </div>
        <div className="text-right">
            <div className="text-gray-400 text-xs">Баланс</div>
            <div className="text-green-400 font-mono font-bold text-xl">{user.balance.toLocaleString()}₽</div>
        </div>
      </div>

      <div className="case-container mb-8">
        <div className="pointer"></div>
        <div 
            className="roulette-track" 
            style={{ 
                transform: `translateX(${offset}px)`,
                transition: spinning ? 'transform 5s cubic-bezier(0.1, 0.05, 0.1, 1)' : 'none'
            }}
        >
            {cards.map((item, i) => (
                <div key={i} className={`card ${winItem && item === winItem ? 'win' : ''}`}>
                    <img src={item.img} alt="" />
                    <p style={{color: item.id >=4 ? '#22c55e' : '#777'}}>{item.name}</p>
                </div>
            ))}
        </div>
      </div>

      {winItem && (
        <div className="mb-6 text-center animate-bounce">
            <div className="text-gray-400 text-sm">Вам выпало:</div>
            <div className="text-3xl font-bold text-green-400">{winItem.name}</div>
        </div>
      )}

      <button onClick={spin} disabled={spinning} className="btn">
        {spinning ? "Крутим..." : `Открыть за 1000₽`}
      </button>
      
      <div className="mt-8 text-center text-gray-500 text-xs max-w-xs">
        Шанс окупа контролируется честным алгоритмом Savage Team. 
        Удачи! 🍀
      </div>
    </div>
  );
}

export default App;