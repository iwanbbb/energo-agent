/* =========================================================
   ЭНЕРГО-АГЕНТ: СПАСИ ГОРОД! — игровая логика
   Чистый JavaScript (ES6+), без сервера и библиотек.
   ========================================================= */
'use strict';

/* ---------------------------------------------------------
   1. НАСТРОЙКИ ИГРЫ
   --------------------------------------------------------- */
const CONFIG = {
  maxLives: 3,
  startEnergy: 100,
  correctPoints: 10,     // баллы за верный ответ
  correctEnergy: 10,     // энергия за верный ответ
  wrongEnergy: 10,       // потеря энергии за ошибку
  leakEnergy: 5,         // «утечка»: жители тратят энергию перед каждой ситуацией
  hintCost: 5,           // стоимость подсказки Ватта
  huntTime: 40,          // секунд на мини-игру
  miniPoints: 10,        // баллы за каждое верное действие в мини-играх
  huntEnergy: 5,         // энергия за найденного «энерговора»
  huntMissPenalty: 5     // потеря энергии за каждого пропущенного
};

/* ---------------------------------------------------------
   2. ДАННЫЕ УРОВНЕЙ
   --------------------------------------------------------- */
const LEVELS = [
  {
    title: 'Умный дом', icon: '🏠', scene: 'home',
    watt: 'Проверим, умеешь ли ты экономить энергию дома!',
    goal: 'В квартире жителей Энергограда горит свет, работает техника и заряжаются гаджеты. Наведи порядок! В конце уровня — мини-игра «Энерго-сортировка».',
    done: 'Отлично! Ты помог Энергограду сократить ненужный расход энергии.',
    stages: [
      {
        icon: '💡',
        q: 'Ты уходишь из комнаты. Свет остался включён. Что нужно сделать?',
        options: ['Оставить свет включённым', 'Выключить свет', 'Включить ещё одну лампу'],
        correct: 1,
        success: 'Правильно! Нет смысла освещать пустую комнату.',
        fail: 'Свет в пустой комнате никому не нужен — энергия тратится впустую.',
        hint: 'Помни! Если в комнате никого нет, свет лучше выключить.',
        tip: 'Уходя из комнаты, выключай свет.'
      },
      {
        icon: '📺',
        q: 'Телевизор работает, но никто его не смотрит. Что лучше сделать?',
        options: ['Оставить включённым', 'Выключить телевизор', 'Увеличить громкость'],
        correct: 1,
        success: 'Верно! Телевизор, который никто не смотрит, просто тратит электричество.',
        fail: 'Работающий «для фона» телевизор расходует энергию, хотя пользы от него нет.',
        hint: 'Если экран никто не смотрит, ему не нужно работать.',
        tip: 'Выключай телевизор и компьютер, если ими никто не пользуется.'
      },
      {
        icon: '🔌',
        q: 'Телефон уже зарядился. Что стоит сделать с зарядным устройством?',
        options: ['Оставить подключённым', 'Отключить зарядное устройство', 'Подключить ещё один прибор'],
        correct: 1,
        success: 'Правильно! Зарядка в розетке продолжает понемногу потреблять энергию, даже без телефона.',
        fail: 'Зарядное устройство в розетке нагревается и тратит энергию, даже когда телефон уже отключён.',
        hint: 'Потрогай зарядку в розетке — она тёплая. Значит, тратит энергию.',
        tip: 'Вынимай зарядное устройство из розетки после зарядки.'
      },
      {
        type: 'sort', emoji: '🗂️', title: 'Энерго-сортировка',
        info: 'Жители Энергограда рассказывают о своих привычках. Реши, что делает каждая привычка: бережёт энергию или тратит её впустую.',
        take: 8,
        cards: [
          { icon: '🧺', text: 'Запускать стиральную машину только с полной загрузкой', good: true, why: 'Одна полная стирка вместо двух неполных — меньше энергии и воды.' },
          { icon: '📖', text: 'Днём читать у окна, не включая лампу', good: true, why: 'Дневной свет бесплатный.' },
          { icon: '🔌', text: 'Держать зарядку в розетке весь день без телефона', good: false, why: 'Зарядка в розетке продолжает тратить энергию.' },
          { icon: '📺', text: 'Засыпать под работающий телевизор', good: false, why: 'Телевизор всю ночь работает впустую.' },
          { icon: '🍲', text: 'Ставить горячую кастрюлю в холодильник', good: false, why: 'Холодильнику придётся долго охлаждать горячее.' },
          { icon: '♨️', text: 'Включить обогреватель и открыть окно', good: false, why: 'Тепло сразу уходит на улицу.' },
          { icon: '🖥️', text: 'Выключать компьютер, когда закончил работу', good: true, why: 'Выключенный компьютер не тратит энергию.' },
          { icon: '🔋', text: 'Выключать удлинитель кнопкой, когда техника не нужна', good: true, why: 'Так сразу отключаются все приборы в режиме ожидания.' },
          { icon: '☕', text: 'Кипятить полный чайник ради одной чашки', good: false, why: 'Лишняя вода нагревается зря.' },
          { icon: '🪟', text: 'Держать окна чистыми, чтобы в комнате было светлее', good: true, why: 'Чем больше дневного света, тем реже нужна лампа.' }
        ],
        tip: 'Полезные привычки экономят энергию каждый день — даже маленькие.'
      }
    ]
  },
  {
    title: 'Энергошкола', icon: '🏫', scene: 'school',
    watt: 'В школе много ламп и техники. Покажи, как можно сберечь энергию на уроках и после них!',
    goal: 'Проверь классную комнату: парты, доску, компьютеры, проектор и освещение. В конце — мини-игра «Свет в Энергошколе».',
    done: 'Превосходно! Энергошкола теперь расходует энергию с умом.',
    stages: [
      {
        icon: '🚪',
        q: 'После урока ученики вышли из кабинета. Свет остался включён. Что делать?',
        options: ['Выключить свет', 'Оставить включённым', 'Включить ещё свет'],
        correct: 0,
        success: 'Правильно! Свет нужен только там, где есть люди.',
        fail: 'Пустой кабинет не нуждается в освещении — последний выходящий выключает свет.',
        hint: 'В пустом классе свет никому не помогает.',
        tip: 'Последний, кто выходит из кабинета, выключает свет.'
      },
      {
        icon: '🖥️',
        q: 'Компьютеры в кабинете больше никто не использует. Что лучше сделать?',
        options: ['Оставить включёнными на всякий случай', 'Завершить работу и выключить компьютеры', 'Включить на них видео'],
        correct: 1,
        success: 'Верно! Компьютеры, которые никто не использует, нужно выключать.',
        fail: 'Каждый работающий без дела компьютер тратит электроэнергию весь день.',
        hint: 'Если за компьютером никто не сидит, он работает зря.',
        tip: 'После работы правильно завершай работу компьютера и выключай монитор.'
      },
      {
        icon: '📽️',
        q: 'Урок закончился, а проектор продолжает светить на пустую доску. Как поступить?',
        options: ['Пусть работает до завтра', 'Сделать изображение ярче', 'Выключить проектор'],
        correct: 2,
        success: 'Правильно! Проектор — мощный прибор, и без дела ему работать незачем.',
        fail: 'Проектор потребляет много энергии, а его лампа изнашивается. Его нужно выключить.',
        hint: 'Когда презентация закончилась, проектор больше не нужен.',
        tip: 'Выключай проектор и интерактивную доску после урока.'
      },
      {
        icon: '☀️',
        q: 'На улице солнечно, в классе и так светло. Но все лампы включены. Что лучше сделать?',
        options: ['Выключить лампы и пользоваться дневным светом', 'Задёрнуть шторы и оставить лампы', 'Включить ещё и настольные лампы'],
        correct: 0,
        success: 'Отлично! Солнечный свет бесплатный — пользуйся им.',
        fail: 'Когда светло от солнца, лампы не нужны. Дневной свет ничего не стоит.',
        hint: 'Солнце светит бесплатно!',
        tip: 'Пользуйся дневным светом: держи окна чистыми и не закрывай их шторами днём.'
      },
      {
        type: 'rooms', emoji: '🏫', title: 'Свет в Энергошколе',
        info: 'Пройди по школе и настрой освещение: свет должен гореть только там, где люди занимаются и без лампы темно. Нажимай на помещения, чтобы включить или выключить свет, затем нажми «Проверить».',
        rooms: [
          { name: 'Кабинет 101', desc: '📐 Идёт урок математики, за окном пасмурно и темно', need: true, init: false, why: 'Здесь занимаются, а без лампы темно — свет нужен.' },
          { name: 'Кабинет 102', desc: '🚪 Урок закончился, все ушли на перемену', need: false, init: true, why: 'В пустом кабинете свет не нужен.' },
          { name: 'Кабинет 103', desc: '☀️ Идёт урок, солнце ярко светит в окна', need: false, init: true, why: 'Светло от солнца — лампы можно выключить.' },
          { name: 'Спортзал', desc: '🏀 Тренировка закончилась, зал пуст', need: false, init: true, why: 'Пустой спортзал освещать незачем.' },
          { name: 'Библиотека', desc: '📚 Ребята читают, а за окном уже вечер', need: true, init: true, why: 'Читать в темноте вредно для глаз — свет нужен.' },
          { name: 'Столовая', desc: '🍽️ Обед закончился, никого нет', need: false, init: true, why: 'Никого нет — свет выключаем.' }
        ],
        tip: 'Свет нужен там, где есть люди и где темно. В остальных помещениях его выключаем.'
      }
    ]
  },
  {
    title: 'Энергокухня', icon: '🍳', scene: 'kitchen',
    watt: 'На кухне работают самые «прожорливые» приборы: холодильник, чайник и плита. Будь внимателен!',
    goal: 'Помоги жителям правильно пользоваться кухонной техникой. В конце — мини-игра «Чайный мастер».',
    done: 'Шикарно! Теперь на кухне Энергограда готовят вкусно и экономно.',
    stages: [
      {
        icon: '🧊',
        q: 'Ты стоишь у открытого холодильника и долго выбираешь, что съесть. Как правильно?',
        options: ['Держать дверцу открытой, пока не решу', 'Решить заранее, быстро взять продукт и закрыть дверцу', 'Открыть ещё и морозилку'],
        correct: 1,
        success: 'Правильно! Чем дольше открыта дверца, тем больше тёплого воздуха попадает внутрь и тем дольше работает холодильник.',
        fail: 'Пока дверца открыта, внутрь заходит тёплый воздух, и холодильнику приходится тратить больше энергии на охлаждение.',
        hint: 'Тёплый воздух — враг холодильника.',
        tip: 'Не держи дверцу холодильника открытой — реши заранее, что хочешь взять.'
      },
      {
        icon: '☕',
        q: 'Нужно приготовить всего одну чашку чая. Сколько воды налить в электрочайник?',
        options: ['Полный чайник — пусть будет запас', 'Столько, сколько нужно для одной чашки', 'Вскипятить два раза подряд для надёжности'],
        correct: 1,
        success: 'Верно! Чем меньше воды, тем меньше энергии нужно, чтобы её вскипятить.',
        fail: 'На нагрев лишней воды уходит лишняя энергия. Кипяти столько, сколько нужно.',
        hint: 'Чайник тратит энергию на каждый литр воды.',
        tip: 'Кипяти в чайнике столько воды, сколько нужно прямо сейчас.'
      },
      {
        icon: '🍲',
        q: 'Суп только что сварили, он ещё горячий. Как убрать его в холодильник?',
        options: ['Сразу поставить горячую кастрюлю', 'Дать немного остыть, а потом убрать в холодильник', 'Оставить дверцу холодильника открытой, чтобы суп остыл'],
        correct: 1,
        success: 'Правильно! Горячая еда нагревает холодильник, и он работает намного дольше. Только не оставляй еду остывать надолго — достаточно, чтобы кастрюля стала тёплой.',
        fail: 'Горячая кастрюля нагревает всё внутри холодильника — он будет работать дольше и тратить больше энергии.',
        hint: 'Холодильнику тяжело охлаждать горячее.',
        tip: 'Не ставь горячую еду в холодильник — сначала дай ей немного остыть.'
      },
      {
        icon: '🍝',
        q: 'Ты варишь макароны на электроплите. Как сэкономить энергию?',
        options: ['Накрыть кастрюлю крышкой и подобрать конфорку по размеру дна', 'Поставить маленькую кастрюлю на большую конфорку без крышки', 'Включить все конфорки, чтобы на кухне было теплее'],
        correct: 0,
        success: 'Отлично! С крышкой вода закипает быстрее, а подходящая конфорка не греет воздух вокруг.',
        fail: 'Без крышки тепло уходит вверх, а большая конфорка под маленькой кастрюлей греет воздух, а не еду.',
        hint: 'Крышка не выпускает тепло.',
        tip: 'Готовь с крышкой и подбирай конфорку по размеру кастрюли.'
      },
      {
        type: 'kettle', emoji: '🫖', title: 'Чайный мастер',
        info: 'Налей в электрочайник ровно столько воды, сколько нужно: одна чашка — 250 мл. Посчитай, сколько человек будут пить чай, и нажми «Вскипятить».',
        orders: [
          { text: 'Вы с мамой решили попить чаю.', cups: 2 },
          { text: 'Мама, папа, младшая сестра и ты садитесь пить чай.', cups: 4 },
          { text: 'К папе зашли двое коллег. Чай будут пить папа и гости, а ты уже пил.', cups: 3 }
        ],
        tip: 'Кипяти столько воды, сколько нужно сейчас, но не ниже отметки MIN на чайнике.'
      }
    ]
  },
  {
    title: 'Энергогород', icon: '🏙️', scene: 'city',
    watt: 'Теперь думаем масштабно! Решения для всего города экономят очень много энергии.',
    goal: 'Помоги администрации Энергограда сделать улицы, подъезды и здания энергоэффективными. В конце — мини-игра «Ночной дозор».',
    done: 'Блестяще! Улицы и дома Энергограда стали по-настоящему умными.',
    stages: [
      {
        icon: '🌃',
        q: 'Ночью на пустой улице фонари горят на полную мощность до утра. Что предложить городу?',
        options: ['Установить умное освещение с датчиками движения', 'Добавить ещё больше фонарей', 'Включать фонари и днём'],
        correct: 0,
        success: 'Верно! Умные фонари светят ярче, только когда рядом есть люди или машины.',
        fail: 'Яркий свет на пустой улице расходует энергию зря. Умные датчики решают эту проблему.',
        hint: 'Свет нужен, когда рядом кто-то есть.',
        tip: 'Датчики движения и освещённости помогают включать свет только когда нужно.'
      },
      {
        icon: '🏢',
        q: 'В подъезде многоэтажки свет горит круглые сутки, даже днём. Как это исправить?',
        options: ['Пусть горит, так привычнее', 'Установить датчики движения в подъезде', 'Поставить более мощные лампы'],
        correct: 1,
        success: 'Правильно! Свет будет включаться, только когда кто-то идёт по лестнице.',
        fail: 'Круглосуточный свет в подъезде — большая потеря энергии. Датчики движения включают его только при необходимости.',
        hint: 'Лампа может сама «узнавать», что кто-то пришёл.',
        tip: 'Датчики движения в подъездах экономят энергию всего дома.'
      },
      {
        icon: '💡',
        q: 'Город закупает лампы для школ и больниц. Какие лучше выбрать?',
        options: ['Обычные лампы накаливания', 'Светодиодные (LED) лампы', 'Любые — разницы нет'],
        correct: 1,
        success: 'Отлично! Светодиодные лампы тратят в несколько раз меньше энергии и служат намного дольше.',
        fail: 'Лампы накаливания превращают бо́льшую часть энергии в тепло, а не в свет. Светодиодные лампы гораздо экономнее.',
        hint: 'Эти лампы почти не нагреваются.',
        tip: 'Выбирай светодиодные (LED) лампы — они экономичнее и долговечнее.'
      },
      {
        icon: '🏷️',
        q: 'Семья выбирает новый холодильник. На что важно обратить внимание?',
        options: ['Только на цвет', 'На класс энергоэффективности (A и выше)', 'Чем больше холодильник, тем лучше'],
        correct: 1,
        success: 'Верно! Класс энергоэффективности на наклейке показывает, сколько энергии потребляет прибор.',
        fail: 'Главное для экономии — класс энергоэффективности. Приборы класса A и выше потребляют меньше энергии.',
        hint: 'Ищи на технике цветную наклейку с буквами.',
        tip: 'Покупая технику, выбирай класс энергоэффективности A и выше.'
      },
      {
        type: 'whack', emoji: '🌙', title: 'Ночной дозор',
        info: 'Ночь в Энергограде. В пустых офисах то и дело загорается свет — гаси его, пока город не потерял энергию! Но не трогай окна, где дома люди: им свет нужен.',
        waste: 12, people: 5, interval: 1300, life: 2600,
        tip: 'Свет в пустых помещениях — одна из самых частых потерь энергии в городе.'
      }
    ]
  },
  {
    title: 'Финальная миссия', icon: '🏆', scene: 'final',
    watt: 'Финальная миссия! Тебя ждут две мини-игры — «Охота на энерговоров» и «Энерго-пары», а потом последние вопросы.',
    goal: 'Покажи всё, чему научился: действуй быстро и внимательно.',
    done: 'Миссия выполнена! Энергоград спасён!',
    stages: [
      {
        type: 'hunt', emoji: '🔍',
        title: 'Охота на энерговоров',
        info: 'Нажимай на приборы, которые тратят энергию впустую. Осторожно: некоторые приборы работают правильно — их выключать не надо!',
        items: [
          { icon: '💡', name: 'Свет в пустой ванной', waste: true, fix: 'Свет выключен' },
          { icon: '📺', name: 'Телевизор, который никто не смотрит', waste: true, fix: 'Телевизор выключен' },
          { icon: '🔌', name: 'Зарядка в розетке без телефона', waste: true, fix: 'Зарядка отключена' },
          { icon: '🧊', name: 'Дверца холодильника открыта уже 5 минут', waste: true, fix: 'Дверца закрыта' },
          { icon: '💻', name: 'Компьютер работает всю ночь без дела', waste: true, fix: 'Компьютер выключен' },
          { icon: '♨️', name: 'Обогреватель работает при открытом окне', waste: true, fix: 'Обогреватель выключен' },
          { icon: '📚', name: 'Настольная лампа, при которой сестра делает уроки', waste: false, why: 'Нужен! Здесь занимаются' },
          { icon: '☕', name: 'Чайник кипятит воду на одну чашку', waste: false, why: 'Нужен! Воды ровно сколько надо' },
          { icon: '🧺', name: 'Стиральная машина с полной загрузкой', waste: false, why: 'Нужна! Полная загрузка — экономно' }
        ],
        tip: 'Регулярно проверяй дом: не работает ли что-то зря.'
      },
      {
        type: 'memory', emoji: '🧩', title: 'Энерго-пары',
        info: 'Открывай карточки по две и находи пары: проблема и её правильное решение.',
        pairs: [
          { a: ['💡', 'Свет в пустой комнате'], b: ['🖐️', 'Выключить свет'] },
          { a: ['🔌', 'Зарядка без телефона'], b: ['↩️', 'Вынуть из розетки'] },
          { a: ['☕', 'Полный чайник на одну чашку'], b: ['💧', 'Налить сколько нужно'] },
          { a: ['🧊', 'Холодильник открыт надолго'], b: ['🚪', 'Быстро закрыть дверцу'] },
          { a: ['🔥', 'Лампа накаливания'], b: ['✨', 'Светодиодная лампа'] },
          { a: ['🏢', 'Свет в подъезде весь день'], b: ['📡', 'Датчик движения'] }
        ],
        tip: 'У каждой энергопотери есть простое решение — запомни их!'
      },
      {
        icon: '🔴',
        q: 'Телевизор выключили пультом, но на нём горит красная лампочка. Что это значит?',
        options: ['Прибор полностью выключен и ничего не тратит', 'Это режим ожидания — прибор продолжает потреблять электричество', 'Это специальный режим, который сам вырабатывает энергию'],
        correct: 1,
        success: 'Правильно! В режиме ожидания техника продолжает потреблять энергию. Если прибор не нужен долго — отключай его кнопкой или от розетки.',
        fail: 'Горящий индикатор — признак режима ожидания. В нём прибор продолжает тратить электричество.',
        hint: 'Если лампочка горит, значит, ток идёт.',
        tip: 'Режим ожидания тоже тратит энергию: отключай технику, если она долго не нужна.'
      },
      {
        icon: '⚡',
        q: 'Дома одновременно работают чайник, утюг, обогреватель и стиральная машина, хотя утюг и обогреватель сейчас не нужны. Что делать?',
        options: ['Выключить ненужные приборы и не включать мощную технику без необходимости', 'Включить ещё и духовку', 'Ничего, пусть всё работает'],
        correct: 0,
        success: 'Верно! Мощные приборы, которые сейчас не нужны, лучше выключить — это экономит энергию и бережёт электросеть.',
        fail: 'Ненужные мощные приборы тратят много энергии и перегружают электросеть дома.',
        hint: 'Работать должно только то, чем пользуются.',
        tip: 'Не включай мощные электроприборы без необходимости.'
      },
      {
        icon: '🤝',
        q: 'Какой поступок больше всего поможет сберечь энергию всего Энергограда?',
        options: ['Самому соблюдать правила энергосбережения и рассказать о них семье и друзьям', 'Экономить только тогда, когда приходит счёт за свет', 'Ничего не делать — это забота только взрослых'],
        correct: 0,
        success: 'Отлично! Когда правила соблюдают все, экономия становится огромной. Ты — настоящий Энерго-Агент!',
        fail: 'Энергосбережение — общее дело. Каждый может помочь, и дети тоже!',
        hint: 'Вместе можно сделать больше.',
        tip: 'Делись правилами энергосбережения с семьёй и друзьями.'
      }
    ]
  }
];

/* Подсчёт общего числа этапов и максимума баллов */
const TOTAL_STAGES = LEVELS.reduce((sum, l) => sum + l.stages.length, 0);
function unitsOf(st) {
  switch (st.type) {
    case 'hunt': return st.items.filter(i => i.waste).length;
    case 'sort': return st.take;
    case 'rooms': return st.rooms.length;
    case 'kettle': return st.orders.length;
    case 'whack': return st.waste;
    case 'memory': return st.pairs.length;
    default: return 1;
  }
}
const MAX_SCORE = LEVELS.reduce((sum, l) => sum + l.stages.reduce((acc, st) =>
  acc + (st.type ? unitsOf(st) * CONFIG.miniPoints : CONFIG.correctPoints), 0), 0);
const MAX_ANSWERS = LEVELS.reduce((sum, l) => sum + l.stages.reduce((acc, st) => acc + unitsOf(st), 0), 0);

/* ---------------------------------------------------------
   3. ГРАФИКА (SVG)
   --------------------------------------------------------- */
let svgUid = 0;
const uid = (p) => `${p}${++svgUid}`;

/** Окна здания: часть горит, часть нет (детерминированно) */
function windowsGrid(x, y, cols, rows, w, h, gapX, gapY, litRatio, seed) {
  let s = '';
  let r = seed;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      r = (r * 9301 + 49297) % 233280;
      const lit = r / 233280 < litRatio;
      s += `<rect x="${x + j * (w + gapX)}" y="${y + i * (h + gapY)}" width="${w}" height="${h}" rx="1.5" class="${lit ? 'win-lit' : 'win'}"/>`;
    }
  }
  return s;
}

function agentSVG() {
  return `
  <svg viewBox="0 0 100 165" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Энерго-Агент">
    <ellipse cx="50" cy="160" rx="28" ry="4" fill="rgba(0,0,0,.3)"/>
    <path d="M30 62 L14 120 L34 112 Z" fill="#ff5c6c"/>
    <path d="M70 62 L86 120 L66 112 Z" fill="#e0465a"/>
    <rect x="35" y="112" width="12" height="38" rx="5" fill="#1b2f45"/>
    <rect x="53" y="112" width="12" height="38" rx="5" fill="#1b2f45"/>
    <rect x="32" y="146" width="17" height="10" rx="4" fill="#ffd23f"/>
    <rect x="51" y="146" width="17" height="10" rx="4" fill="#ffd23f"/>
    <rect x="30" y="58" width="40" height="58" rx="12" fill="#1f7ae0"/>
    <rect x="30" y="100" width="40" height="6" fill="#123d73"/>
    <rect x="45" y="99" width="10" height="8" rx="2" fill="#ffd23f"/>
    <path d="M53 64 L42 82 H50 L46 96 L59 76 H51 L55 64 Z" fill="#ffd23f" stroke="#ff9f43" stroke-width="1"/>
    <rect x="18" y="62" width="11" height="40" rx="5" fill="#1f7ae0" transform="rotate(12 23 62)"/>
    <rect x="71" y="62" width="11" height="40" rx="5" fill="#1f7ae0" transform="rotate(-12 77 62)"/>
    <circle cx="17" cy="101" r="6" fill="#f5c9a0"/>
    <circle cx="83" cy="101" r="6" fill="#f5c9a0"/>
    <rect x="44" y="50" width="12" height="10" fill="#f5c9a0"/>
    <circle cx="50" cy="34" r="20" fill="#f5c9a0"/>
    <path d="M29 33 C29 12 71 10 71 31 C66 24 58 20 48 22 C40 23 33 27 29 33 Z" fill="#3b2a20"/>
    <rect x="33" y="29" width="34" height="9" rx="4.5" fill="#2ee59d" opacity=".9"/>
    <circle cx="42" cy="33.5" r="2.4" fill="#0b3b2a"/>
    <circle cx="58" cy="33.5" r="2.4" fill="#0b3b2a"/>
    <path d="M43 44 Q50 49 57 44" stroke="#9a5b3a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  </svg>`;
}

function wattSVG() {
  return `
  <svg viewBox="0 0 60 84" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Робот Ватт">
    <line x1="10" y1="42" x2="2" y2="30" stroke="#18b87a" stroke-width="4" stroke-linecap="round"/>
    <line x1="50" y1="42" x2="58" y2="52" stroke="#18b87a" stroke-width="4" stroke-linecap="round"/>
    <rect x="18" y="68" width="8" height="12" rx="3" fill="#0e6b4b"/>
    <rect x="34" y="68" width="8" height="12" rx="3" fill="#0e6b4b"/>
    <rect x="22" y="3" width="16" height="9" rx="2.5" fill="#ffd23f"/>
    <rect x="9" y="10" width="42" height="60" rx="11" fill="#2ee59d" stroke="#0e6b4b" stroke-width="3"/>
    <rect x="13" y="48" width="34" height="18" rx="6" fill="#18b87a"/>
    <circle cx="23" cy="28" r="6.5" fill="#fff"/>
    <circle cx="37" cy="28" r="6.5" fill="#fff"/>
    <circle cx="24" cy="29" r="3" fill="#0b2a3d"/>
    <circle cx="38" cy="29" r="3" fill="#0b2a3d"/>
    <path d="M23 38 Q30 44 37 38" stroke="#0b4a33" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M32 49 L25 59 H30 L28 66 L36 55 H31 L33 49 Z" fill="#ffd23f"/>
  </svg>`;
}

function citySVG() {
  const sky = uid('sky'), hill = uid('hill');
  const buildings = [
    { x: 40, w: 54, h: 120, c: '#22557c', seed: 3 },
    { x: 100, w: 46, h: 160, c: '#1d4a6d', seed: 7 },
    { x: 152, w: 70, h: 200, c: '#285f8a', seed: 11 },
    { x: 228, w: 50, h: 140, c: '#1d4a6d', seed: 5 },
    { x: 284, w: 62, h: 175, c: '#22557c', seed: 13 },
    { x: 352, w: 44, h: 110, c: '#1d4a6d', seed: 17 }
  ];
  const ground = 260;
  let b = '';
  buildings.forEach(bd => {
    const top = ground - bd.h;
    b += `<rect x="${bd.x}" y="${top}" width="${bd.w}" height="${bd.h}" rx="3" fill="${bd.c}"/>`;
    const cols = Math.floor((bd.w - 8) / 12);
    const rows = Math.floor((bd.h - 16) / 16);
    b += windowsGrid(bd.x + 6, top + 10, cols, rows, 7, 9, 5, 7, 0.45, bd.seed);
  });
  return `
  <svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Город Энергоград">
    <defs>
      <linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#123a5a"/><stop offset=".7" stop-color="#2f86b8"/><stop offset="1" stop-color="#8fe0ff"/>
      </linearGradient>
      <linearGradient id="${hill}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2ee59d"/><stop offset="1" stop-color="#128a5c"/>
      </linearGradient>
    </defs>
    <rect width="480" height="300" fill="url(#${sky})"/>
    <g class="sun-rays">
      <g stroke="#ffd23f" stroke-width="3" stroke-linecap="round" opacity=".7">
        <line x1="410" y1="20" x2="410" y2="8"/><line x1="410" y1="80" x2="410" y2="92"/>
        <line x1="380" y1="50" x2="368" y2="50"/><line x1="440" y1="50" x2="452" y2="50"/>
        <line x1="389" y1="29" x2="381" y2="21"/><line x1="431" y1="71" x2="439" y2="79"/>
        <line x1="431" y1="29" x2="439" y2="21"/><line x1="389" y1="71" x2="381" y2="79"/>
      </g>
    </g>
    <circle cx="410" cy="50" r="22" fill="#ffd23f"/>
    <path d="M0 230 Q120 190 240 225 T480 215 V300 H0 Z" fill="url(#${hill})" opacity=".55"/>
    <!-- ветряк -->
    <rect x="438" y="120" width="5" height="120" fill="#e8f4ff"/>
    <g class="spin">
      <circle cx="440.5" cy="120" r="5" fill="#fff"/>
      <path d="M440.5 120 L436 80 L445 80 Z" fill="#fff"/>
      <path d="M440.5 120 L474 141 L469 149 Z" fill="#fff"/>
      <path d="M440.5 120 L407 141 L412 149 Z" fill="#fff"/>
    </g>
    ${b}
    <!-- солнечные панели -->
    <g transform="translate(156 52)">
      <rect x="0" y="0" width="28" height="8" fill="#1a3d8f" stroke="#9ad" stroke-width="1" transform="skewX(-20)"/>
      <rect x="32" y="0" width="28" height="8" fill="#1a3d8f" stroke="#9ad" stroke-width="1" transform="skewX(-20)"/>
    </g>
    <!-- молния над главной башней -->
    <path class="glow" d="M190 20 L176 42 H186 L180 58 L198 34 H188 L194 20 Z" fill="#ffd23f"/>
    <rect y="260" width="480" height="40" fill="#163248"/>
    <rect y="278" width="480" height="3" fill="#ffd23f" opacity=".5"/>
    <g fill="#e8f4ff">
      <rect x="20" y="225" width="3" height="35"/><rect x="120" y="225" width="3" height="35"/><rect x="220" y="225" width="3" height="35"/><rect x="320" y="225" width="3" height="35"/>
    </g>
    <g fill="#ffd23f" class="glow">
      <circle cx="21.5" cy="224" r="4"/><circle cx="121.5" cy="224" r="4"/><circle cx="221.5" cy="224" r="4"/><circle cx="321.5" cy="224" r="4"/>
    </g>
    <circle cx="80" cy="215" r="14" fill="#2ee59d"/><rect x="78" y="225" width="4" height="35" fill="#6b4a2b"/>
    <circle cx="410" cy="225" r="12" fill="#2ee59d"/><rect x="408" y="233" width="4" height="27" fill="#6b4a2b"/>
  </svg>`;
}

const SCENES = {
  home() {
    return `
    <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Комната дома">
      <rect width="400" height="200" fill="#f4ead6"/>
      <rect y="0" width="400" height="10" fill="#e3d5bb"/>
      <rect y="158" width="400" height="42" fill="#c99a6b"/>
      <g stroke="#b08257" stroke-width="2">${[40, 100, 160, 220, 280, 340].map(x => `<line x1="${x}" y1="158" x2="${x - 20}" y2="200"/>`).join('')}</g>
      <rect x="18" y="30" width="80" height="70" rx="4" fill="#8fd3ff" stroke="#fff" stroke-width="5"/>
      <line x1="58" y1="30" x2="58" y2="100" stroke="#fff" stroke-width="4"/>
      <line x1="18" y1="65" x2="98" y2="65" stroke="#fff" stroke-width="4"/>
      <circle cx="80" cy="47" r="7" fill="#ffd23f"/>
      <line x1="200" y1="10" x2="200" y2="30" stroke="#555" stroke-width="2"/>
      <path d="M184 30 H216 L209 44 H191 Z" fill="#3d4f60"/>
      <circle cx="200" cy="49" r="22" fill="#ffd23f" opacity=".25" class="glow"/>
      <circle cx="200" cy="48" r="7" fill="#ffd23f"/>
      <rect x="112" y="118" width="84" height="40" rx="3" fill="#8a5a35"/>
      <rect x="120" y="70" width="68" height="44" rx="4" fill="#1d1d1d"/>
      <rect x="124" y="74" width="60" height="36" rx="2" fill="#3ec5ff" class="flicker"/>
      <rect x="150" y="114" width="8" height="5" fill="#1d1d1d"/>
      <rect x="220" y="112" width="86" height="7" fill="#8a5a35"/>
      <rect x="226" y="119" width="5" height="39" fill="#6d4426"/><rect x="295" y="119" width="5" height="39" fill="#6d4426"/>
      <rect x="244" y="78" width="44" height="30" rx="3" fill="#1d1d1d"/>
      <rect x="247" y="81" width="38" height="24" rx="2" fill="#2ee59d" class="flicker"/>
      <rect x="262" y="108" width="8" height="4" fill="#1d1d1d"/>
      <rect x="318" y="126" width="14" height="18" rx="2" fill="#fff" stroke="#999"/>
      <rect x="320" y="131" width="10" height="11" rx="2" fill="#333"/>
      <path d="M325 142 C325 160 300 150 296 158" stroke="#333" stroke-width="2" fill="none"/>
      <rect x="342" y="48" width="48" height="110" rx="5" fill="#eaf6fb" stroke="#9cc" stroke-width="2"/>
      <line x1="342" y1="88" x2="390" y2="88" stroke="#9cc" stroke-width="2"/>
      <rect x="347" y="60" width="4" height="18" rx="2" fill="#9cc"/><rect x="347" y="96" width="4" height="26" rx="2" fill="#9cc"/>
    </svg>`;
  },
  school() {
    let desks = '';
    [[40, 140], [130, 140], [220, 140], [310, 140]].forEach(([x, y]) => {
      desks += `<rect x="${x}" y="${y}" width="60" height="8" rx="2" fill="#c98b4e"/>
        <rect x="${x + 4}" y="${y + 8}" width="4" height="30" fill="#7a5230"/><rect x="${x + 52}" y="${y + 8}" width="4" height="30" fill="#7a5230"/>
        <rect x="${x + 22}" y="${y + 18}" width="16" height="12" rx="2" fill="#3ec5ff"/>`;
    });
    return `
    <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Классная комната">
      <rect width="400" height="200" fill="#dff1ea"/>
      <rect y="172" width="400" height="28" fill="#b9c8cf"/>
      ${[80, 200, 320].map(x => `<rect x="${x - 26}" y="4" width="52" height="7" rx="3" fill="#fff" stroke="#bbb"/><rect x="${x - 34}" y="10" width="68" height="18" fill="#ffd23f" opacity=".22" class="glow"/>`).join('')}
      <rect x="110" y="38" width="180" height="78" rx="4" fill="#1f5c45" stroke="#8a5a35" stroke-width="6"/>
      <text x="200" y="70" fill="#e9fff4" font-size="16" text-anchor="middle" font-family="Segoe UI, Arial">Береги энергию!</text>
      <text x="200" y="95" fill="#ffd23f" font-size="20" text-anchor="middle">⚡ = 💚</text>
      <rect x="306" y="34" width="70" height="52" rx="3" fill="#f7f7f7" stroke="#aaa"/>
      <polygon points="310,38 372,38 372,82 310,82" fill="#3ec5ff" opacity=".35" class="flicker"/>
      <rect x="18" y="40" width="68" height="70" rx="3" fill="#8fd3ff" stroke="#fff" stroke-width="5"/>
      <line x1="52" y1="40" x2="52" y2="110" stroke="#fff" stroke-width="4"/>
      <rect x="18" y="114" width="40" height="22" rx="2" fill="#1d1d1d"/><rect x="21" y="117" width="34" height="16" fill="#2ee59d" class="flicker"/>
      ${desks}
    </svg>`;
  },
  kitchen() {
    return `
    <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Кухня">
      <rect width="400" height="200" fill="#fff4e0"/>
      <g fill="#fbe3bd">${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 40}" y="60" width="38" height="38"/>`).join('')}</g>
      <rect y="170" width="400" height="30" fill="#d9b48a"/>
      <rect x="0" y="118" width="300" height="52" fill="#8a5a35"/>
      <rect x="0" y="112" width="300" height="8" fill="#e8e1d6"/>
      <rect x="12" y="10" width="120" height="40" rx="3" fill="#a46b3c"/>
      <rect x="150" y="18" width="70" height="56" rx="3" fill="#8fd3ff" stroke="#fff" stroke-width="5"/>
      <rect x="160" y="96" width="90" height="16" rx="2" fill="#3a3a3a"/>
      <circle cx="182" cy="104" r="6" fill="#ff5c6c" class="glow"/><circle cx="228" cy="104" r="6" fill="#555"/>
      <rect x="166" y="76" width="34" height="22" rx="3" fill="#b8c6d0"/><rect x="162" y="73" width="42" height="5" rx="2" fill="#8fa2b0"/>
      <path d="M176 70 q4 -10 0 -18 M188 70 q4 -10 0 -18" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>
      <path d="M40 112 L44 84 H72 L76 112 Z" fill="#3ec5ff"/>
      <path d="M76 90 Q88 92 82 104" stroke="#2a8fbf" stroke-width="4" fill="none"/>
      <rect x="50" y="78" width="16" height="6" rx="2" fill="#2a8fbf"/>
      <rect x="110" y="126" width="34" height="30" rx="3" fill="#a46b3c" stroke="#7a4f2b"/>
      <rect x="310" y="30" width="80" height="140" rx="6" fill="#eaf6fb" stroke="#9cc" stroke-width="2"/>
      <line x1="310" y1="80" x2="390" y2="80" stroke="#9cc" stroke-width="2"/>
      <rect x="316" y="44" width="4" height="22" rx="2" fill="#9cc"/><rect x="316" y="90" width="4" height="34" rx="2" fill="#9cc"/>
      <rect x="350" y="142" width="32" height="18" rx="2" fill="#2ee59d"/><text x="366" y="156" font-size="12" text-anchor="middle" fill="#063" font-weight="bold">A+</text>
    </svg>`;
  },
  city() {
    const night = uid('night');
    let b = '';
    [[10, 70, 110, 2], [86, 50, 140, 4], [142, 64, 90, 6], [212, 56, 150, 8], [274, 60, 120, 10], [340, 52, 100, 12]].forEach(([x, w, h, s]) => {
      const top = 160 - h;
      b += `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="#17344f"/>` +
        windowsGrid(x + 6, top + 8, Math.floor((w - 8) / 11), Math.floor((h - 12) / 14), 6, 8, 5, 6, 0.5, s);
    });
    return `
    <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ночной город">
      <defs><linearGradient id="${night}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050f1e"/><stop offset="1" stop-color="#1b3f63"/></linearGradient></defs>
      <rect width="400" height="200" fill="url(#${night})"/>
      ${[[30, 20], [90, 35], [160, 15], [250, 28], [330, 18], [370, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff"/>`).join('')}
      <circle cx="350" cy="30" r="14" fill="#f7f1c8"/><circle cx="356" cy="26" r="13" fill="#0a1a2e"/>
      ${b}
      <rect y="160" width="400" height="40" fill="#22313f"/>
      <rect y="178" width="400" height="3" fill="#ffd23f" opacity=".6"/>
      ${[40, 140, 240, 340].map(x => `<rect x="${x}" y="122" width="3" height="40" fill="#9fb3c4"/><path d="M${x - 6} 122 h15 l-3 -6 h-9 z" fill="#9fb3c4"/><polygon points="${x - 18},170 ${x + 21},170 ${x + 6},126 ${x - 3},126" fill="#ffd23f" opacity=".18" class="glow"/>`).join('')}
    </svg>`;
  },
  final() {
    return `<div style="position:relative">${citySVG()}</div>`;
  }
};

/* ---------------------------------------------------------
   4. ЗВУК (Web Audio, без файлов)
   --------------------------------------------------------- */
const Sound = {
  ctx: null,
  on: true,
  tone(freq, dur, type = 'sine', delay = 0, vol = 0.07) {
    if (!this.on) return;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const t = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (e) { /* звук недоступен — игра работает без него */ }
  },
  click() { this.tone(520, 0.06, 'square', 0, 0.025); },
  good() { this.tone(660, 0.12, 'triangle'); this.tone(990, 0.2, 'triangle', 0.1); },
  bad() { this.tone(240, 0.18, 'sawtooth', 0, 0.045); this.tone(170, 0.28, 'sawtooth', 0.12, 0.045); },
  level() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.18, 'triangle', i * 0.1)); },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.25, 'triangle', i * 0.12)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, 'sine', i * 0.16, 0.06)); }
};

/* ---------------------------------------------------------
   5. СОСТОЯНИЕ ИГРЫ
   --------------------------------------------------------- */
const $ = (id) => document.getElementById(id);
const state = {};
let miniKeys = null;  // обработчик клавиш активной мини-игры
const timers = new Set();
function later(fn, ms) { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; }
function every(fn, ms) { const id = setInterval(fn, ms); timers.add(id); return id; }
function clearTimers() { timers.forEach(id => { clearTimeout(id); clearInterval(id); }); timers.clear(); }
let nextAction = null; // что делает Enter / кнопка «Далее»

function resetState() {
  clearTimers();
  miniKeys = null;
  nextAction = null;
  Object.assign(state, {
    playerName: state.playerName || 'Агент',
    levelIdx: 0,
    stageIdx: 0,
    score: 0,
    lives: CONFIG.maxLives,
    energy: CONFIG.startEnergy,
    correct: 0,
    wrong: 0,
    doneStages: 0,
    answered: true,
    hintUsed: false,
    level: { correct: 0, total: 0, points: 0 },
    learnedTips: []
  });
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const isOver = () => state.lives <= 0 || state.energy <= 0;

/* ---------------------------------------------------------
   6. ЭКРАНЫ, HUD, ЭФФЕКТЫ
   --------------------------------------------------------- */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(`screen-${name}`).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bump(el, cls = 'bump') {
  el.classList.remove(cls);
  void el.offsetWidth; // перезапуск анимации
  el.classList.add(cls);
}

function updateHUD() {
  $('hud-level').textContent = `${state.levelIdx + 1} / ${LEVELS.length}`;
  $('hud-score').textContent = state.score;
  $('hud-lives').textContent = '❤️'.repeat(Math.max(0, state.lives)) + '🖤'.repeat(CONFIG.maxLives - Math.max(0, state.lives));
  $('hud-energy').textContent = `${state.energy}%`;
  const fill = $('energy-fill');
  fill.style.width = `${state.energy}%`;
  fill.classList.toggle('mid', state.energy <= 60 && state.energy > 30);
  fill.classList.toggle('low', state.energy <= 30);
  const pct = Math.round(state.doneStages / TOTAL_STAGES * 100);
  $('progress-fill').style.width = `${pct}%`;
  $('progress-text').textContent = `${pct}%`;
}

function floatText(text, cls, anchor) {
  const r = anchor ? anchor.getBoundingClientRect() : { left: innerWidth / 2, width: 0, top: innerHeight / 2 };
  const el = document.createElement('div');
  el.className = `float-text ${cls}`;
  el.textContent = text;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top}px`;
  $('fx-layer').appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

function changeScore(delta) {
  state.score = Math.max(0, state.score + delta);
  updateHUD();
  bump($('hud-score'));
  floatText(`${delta > 0 ? '+' : ''}${delta} ⭐`, delta > 0 ? 'gold' : 'bad', $('hud-score'));
}

function changeEnergy(delta) {
  const before = state.energy;
  state.energy = clamp(state.energy + delta, 0, 100);
  updateHUD();
  const real = state.energy - before;
  if (real !== 0) {
    bump($('hud-energy'));
    floatText(`${real > 0 ? '+' : ''}${real}% ⚡`, real > 0 ? 'good' : 'bad', $('hud-energy'));
  }
}

function loseLife() {
  state.lives = Math.max(0, state.lives - 1);
  updateHUD();
  bump($('hud-lives'), 'shake');
  floatText('−1 ❤️', 'bad', $('hud-lives'));
}

function confetti(count = 90) {
  const colors = ['#2ee59d', '#ffd23f', '#3ec5ff', '#ff9f43', '#ff5c6c', '#b8f36b'];
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = `${2.2 + Math.random() * 2.2}s`;
    c.style.animationDelay = `${Math.random() * 0.8}s`;
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    $('fx-layer').appendChild(c);
    setTimeout(() => c.remove(), 5500);
  }
}

function wattSay(text, bad = false) {
  return `<div class="watt-say"><div class="watt-mini">${wattSVG()}</div><div class="bubble ${bad ? 'bad' : ''}"><b>Ватт:</b> ${text}</div></div>`;
}

function starsHTML(n) {
  return `<div class="stars" aria-label="${n} из 3 звёзд">${[0, 1, 2].map(i => `<span class="${i < n ? 'on' : 'off'}">★</span>`).join('')}</div>`;
}

function addTip(tip) {
  if (tip && !state.learnedTips.includes(tip)) state.learnedTips.push(tip);
}

/* ---------------------------------------------------------
   7. ХОД ИГРЫ
   --------------------------------------------------------- */
function startGame() {
  const name = $('player-name').value.trim();
  state.playerName = name || 'Агент';
  resetState();
  updateHUD();
  showScreen('game');
  showLevelIntro();
}

function showLevelIntro() {
  const L = LEVELS[state.levelIdx];
  state.stageIdx = 0;
  state.hintUsed = false;
  state.answered = true;
  state.level = { correct: 0, total: 0, points: 0 };
  updateHUD();

  $('stage').innerHTML = `
    <div class="card level-intro">
      <div class="intro-left">
        <div><span class="level-badge">Уровень ${state.levelIdx + 1} из ${LEVELS.length}</span></div>
        <h2>${L.icon} Уровень ${state.levelIdx + 1}. ${L.title}</h2>
        <p class="goal">${L.goal}</p>
        ${wattSay(L.watt)}
        <button class="btn btn-primary btn-big" id="btn-level-go">▶ НАЧАТЬ УРОВЕНЬ</button>
      </div>
      <div>
        <div class="scene">${SCENES[L.scene]()}</div>
        <div class="intro-agent">${agentSVG()}</div>
      </div>
    </div>`;
  $('btn-level-go').addEventListener('click', () => { Sound.click(); renderStage(); });
  nextAction = () => renderStage();
}

function renderStage() {
  nextAction = null;
  const L = LEVELS[state.levelIdx];
  const st = L.stages[state.stageIdx];
  const mini = st.type && MINI_GAMES[st.type];
  if (mini) mini(st);
  else renderQuestion(st, L);
}

function renderQuestion(st, L) {
  state.answered = false;
  const letters = ['A', 'B', 'C', 'D'];
  const qNum = state.stageIdx + 1;

  $('stage').innerHTML = `
    <div class="card question-card">
      <div class="q-head">
        <span class="level-badge">${L.icon} ${L.title}</span>
        <span class="q-count">Ситуация ${qNum} из ${L.stages.length}</span>
      </div>
      <div class="q-body">
        <div class="q-icon" aria-hidden="true">${st.icon}</div>
        <p class="q-text">${st.q}</p>
      </div>
      <div class="answers" id="answers">
        ${st.options.map((opt, i) => `
          <button class="answer" data-i="${i}">
            <span class="letter">${letters[i]}</span><span>${opt}</span>
          </button>`).join('')}
      </div>
      <div class="q-tools">
        <span class="leak">⚠ Жители снова тратят энергию впустую: −${CONFIG.leakEnergy}%</span>
        <button class="btn btn-hint" id="btn-hint" ${state.hintUsed ? 'disabled' : ''}>
          💡 Подсказка Ватта (−${CONFIG.hintCost} ⭐)${state.hintUsed ? ' — использована' : ''}
        </button>
      </div>
      <div class="feedback" id="feedback"></div>
    </div>`;

  // «Утечка» энергии: каждая ситуация — это ошибка жителей, которую надо исправить
  changeEnergy(-CONFIG.leakEnergy);

  $('answers').querySelectorAll('.answer').forEach(btn => {
    btn.addEventListener('click', () => answer(Number(btn.dataset.i)));
  });
  $('btn-hint').addEventListener('click', () => useHint(st));

  // Если утечка опустошила энергию — игра окончена
  if (isOver()) {
    state.answered = true;
    setTimeout(gameOver, 900);
  }
}

function useHint(st) {
  if (state.hintUsed || state.answered) return;
  state.hintUsed = true;
  Sound.click();
  changeScore(-CONFIG.hintCost);

  // Убираем один неверный вариант
  const wrongIdx = st.options.map((_, i) => i).filter(i => i !== st.correct);
  const removeIdx = wrongIdx[Math.floor(Math.random() * wrongIdx.length)];
  const btn = $('answers').querySelector(`[data-i="${removeIdx}"]`);
  btn.classList.add('removed');
  btn.disabled = true;

  const hintBtn = $('btn-hint');
  hintBtn.disabled = true;
  hintBtn.textContent = '💡 Подсказка использована';

  const fb = $('feedback');
  fb.innerHTML = wattSay(st.hint);
  fb.classList.add('show');
}

function answer(i) {
  if (state.answered) return;
  state.answered = true;
  const L = LEVELS[state.levelIdx];
  const st = L.stages[state.stageIdx];
  const ok = i === st.correct;

  const buttons = $('answers').querySelectorAll('.answer');
  buttons.forEach((b, idx) => {
    b.disabled = true;
    if (idx === st.correct) b.classList.add('correct');
    else if (idx === i) b.classList.add('wrong');
    else b.classList.add('dim');
  });
  $('btn-hint').disabled = true;

  state.level.total++;
  if (ok) {
    Sound.good();
    state.correct++;
    state.level.correct++;
    state.level.points += CONFIG.correctPoints;
    changeScore(CONFIG.correctPoints);
    changeEnergy(CONFIG.correctEnergy);
  } else {
    Sound.bad();
    state.wrong++;
    loseLife();
    changeEnergy(-CONFIG.wrongEnergy);
  }
  addTip(st.tip);
  state.doneStages++;
  updateHUD();

  const over = isOver();
  const correctText = st.options[st.correct];
  const fb = $('feedback');
  fb.innerHTML = `
    ${ok ? wattSay(st.success) : wattSay(`Ошибка! Правильный ответ: «${correctText}». ${st.fail}`, true)}
    <div class="tip">📌 <b>Правило Энерго-Агента:</b> ${st.tip}</div>
    <button class="btn ${over ? 'btn-danger' : 'btn-primary'}" id="btn-next">
      ${over ? 'УЗНАТЬ ИТОГ' : (state.stageIdx + 1 < L.stages.length ? 'ДАЛЕЕ ➜' : 'ЗАВЕРШИТЬ УРОВЕНЬ ✔')}
    </button>`;
  fb.classList.add('show');

  nextAction = over ? gameOver : nextStage;
  const nb = $('btn-next');
  nb.addEventListener('click', () => { Sound.click(); nextAction(); });
  setTimeout(() => { nb.focus({ preventScroll: true }); fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 150);
}

function nextStage() {
  nextAction = null;
  const L = LEVELS[state.levelIdx];
  state.stageIdx++;
  if (state.stageIdx >= L.stages.length) levelComplete();
  else renderStage();
}

/* =========================================================
   МИНИ-ИГРЫ
   hunt   — «Охота на энерговоров»   (уровень 5)
   sort   — «Энерго-сортировка»      (уровень 1)
   rooms  — «Свет в Энергошколе»     (уровень 2)
   kettle — «Чайный мастер»          (уровень 3)
   whack  — «Ночной дозор»           (уровень 4)
   memory — «Энерго-пары»            (уровень 5)
   ========================================================= */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function miniHeader(st) {
  const L = LEVELS[state.levelIdx];
  return `
    <div class="mini-head">
      <span class="level-badge">🎮 Мини-игра · ${L.title}</span>
      <span class="q-count">Этап ${state.stageIdx + 1} из ${L.stages.length}</span>
    </div>
    <h3 class="mini-title">${st.emoji} ${st.title}</h3>
    <p class="hunt-info">${st.info}</p>`;
}

function nextLabel() {
  const L = LEVELS[state.levelIdx];
  return state.stageIdx + 1 < L.stages.length ? 'ДАЛЕЕ ➜' : 'ЗАВЕРШИТЬ УРОВЕНЬ ✔';
}

/** Таймер обратного отсчёта для мини-игр (обновляет #mini-time и #mini-timer-fill) */
function startCountdown(sec, onEnd) {
  let left = sec;
  const id = every(() => {
    left--;
    const t = $('mini-time');
    const f = $('mini-timer-fill');
    if (t) t.textContent = `⏱ ${left} с`;
    if (f) f.style.width = `${(left / sec) * 100}%`;
    if (left <= 0) {
      clearInterval(id);
      timers.delete(id);
      onEnd();
    }
  }, 1000);
}

/** Общее завершение любой мини-игры: статистика, сообщение Ватта, кнопка «Далее» */
function finishMini(st, { good, total, mistakes, ok, msg }) {
  state.answered = true;
  miniKeys = null;
  clearTimers();

  state.correct += good;
  state.wrong += mistakes;
  state.level.correct += good;
  state.level.total += total;
  state.level.points += good * CONFIG.miniPoints;
  state.doneStages++;
  addTip(st.tip);
  updateHUD();

  const over = isOver();
  const fb = $('feedback');
  fb.innerHTML = `
    ${wattSay(msg, !ok)}
    <div class="tip">📌 <b>Правило Энерго-Агента:</b> ${st.tip}</div>
    <button class="btn ${over ? 'btn-danger' : 'btn-primary'}" id="btn-next">${over ? 'УЗНАТЬ ИТОГ' : nextLabel()}</button>`;
  fb.classList.add('show');

  nextAction = over ? gameOver : nextStage;
  const nb = $('btn-next');
  nb.addEventListener('click', () => { Sound.click(); nextAction(); });
  setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
}

/* ---------- 1. Охота на энерговоров ---------- */
function renderHunt(st) {
  state.answered = false;
  const items = shuffle(st.items);
  const total = items.filter(i => i.waste).length;
  let found = 0;
  let mistakes = 0;
  let finished = false;

  $('stage').innerHTML = `
    <div class="card mini-card">
      ${miniHeader(st)}
      <div class="hunt-meters">
        <span class="chip" id="mini-time">⏱ ${CONFIG.huntTime} с</span>
        <div class="timer-bar"><div class="timer-fill" id="mini-timer-fill"></div></div>
        <span class="chip" id="mini-count">Найдено: 0 / ${total}</span>
      </div>
      <div class="hunt-grid" id="hunt-grid">
        ${items.map((it, i) => `
          <button class="hunt-item" data-i="${i}">
            <span class="h-icon">${it.icon}</span>
            <span class="h-name">${it.name}</span>
            <span class="h-status">⚡ работает</span>
          </button>`).join('')}
      </div>
      <div class="feedback" id="feedback"></div>
    </div>`;

  const grid = $('hunt-grid');
  grid.querySelectorAll('.hunt-item').forEach(btn => {
    btn.addEventListener('click', () => {
      if (finished || btn.disabled) return;
      const it = items[Number(btn.dataset.i)];
      btn.disabled = true;
      if (it.waste) {
        found++;
        Sound.good();
        btn.classList.add('fixed');
        btn.querySelector('.h-status').textContent = `✔ ${it.fix}`;
        changeScore(CONFIG.miniPoints);
        changeEnergy(CONFIG.huntEnergy);
        $('mini-count').textContent = `Найдено: ${found} / ${total}`;
        if (found === total) finish();
      } else {
        mistakes++;
        Sound.bad();
        btn.classList.add('wrong-pick');
        btn.querySelector('.h-status').textContent = `✖ ${it.why}`;
        loseLife();
        changeEnergy(-CONFIG.wrongEnergy);
        if (isOver()) finish();
      }
    });
  });

  startCountdown(CONFIG.huntTime, finish);

  function finish() {
    if (finished) return;
    finished = true;
    const missed = total - found;
    grid.querySelectorAll('.hunt-item').forEach(btn => {
      const it = items[Number(btn.dataset.i)];
      if (it.waste && !btn.classList.contains('fixed')) {
        btn.classList.add('missed');
        btn.querySelector('.h-status').textContent = '⚠ Пропущен энерговор!';
      }
      btn.disabled = true;
    });
    if (missed > 0) changeEnergy(-CONFIG.huntMissPenalty * missed);

    let msg;
    if (found === total && mistakes === 0) msg = 'Идеально! Ты нашёл всех энерговоров и не выключил ничего лишнего!';
    else if (found === total) msg = `Все энерговоры найдены! Но будь внимательнее: приборы, которыми пользуются, выключать не нужно (ошибок: ${mistakes}).`;
    else msg = `Найдено ${found} из ${total}. Пропущенные энерговоры отмечены пунктиром — запомни их!`;

    finishMini(st, { good: found, total, mistakes, ok: found === total && mistakes === 0, msg });
  }
}

/* ---------- 2. Энерго-сортировка ---------- */
function renderSort(st) {
  state.answered = false;
  const cards = shuffle(st.cards).slice(0, st.take);
  let i = 0;
  let good = 0;
  let mistakes = 0;
  let locked = true;

  $('stage').innerHTML = `
    <div class="card mini-card">
      ${miniHeader(st)}
      <div class="hunt-meters">
        <span class="chip" id="mini-count">Карточка 1 / ${cards.length}</span>
        <span class="chip" id="mini-score">Верно: 0</span>
      </div>
      <div class="sort-area"><div class="sort-card" id="sort-card"></div></div>
      <div class="sort-buttons">
        <button class="btn sort-bad" id="sort-bad">❌ Тратим впустую</button>
        <button class="btn sort-good" id="sort-good">✅ Бережём энергию</button>
      </div>
      <p class="muted center">Можно отвечать стрелками: ← впустую · → бережём</p>
      <div class="feedback" id="feedback"></div>
    </div>`;

  const show = () => {
    const c = cards[i];
    const el = $('sort-card');
    el.className = 'sort-card';
    void el.offsetWidth;
    el.classList.add('in');
    el.innerHTML = `<div class="s-icon">${c.icon}</div><div class="s-text">${c.text}</div><div class="s-why" id="s-why"></div>`;
    $('mini-count').textContent = `Карточка ${i + 1} / ${cards.length}`;
    locked = false;
  };

  const choose = (saysGood) => {
    if (locked || state.answered) return;
    locked = true;
    const c = cards[i];
    const ok = saysGood === c.good;
    const el = $('sort-card');
    if (ok) {
      good++;
      Sound.good();
      el.classList.add('ok');
      changeScore(CONFIG.miniPoints);
      changeEnergy(2);
    } else {
      mistakes++;
      Sound.bad();
      el.classList.add('no');
      changeEnergy(-5);
    }
    $('s-why').textContent = `${ok ? '✔ Верно!' : '✖ Не так.'} ${c.why}`;
    $('mini-score').textContent = `Верно: ${good}`;
    if (isOver()) { later(end, 1300); return; }
    later(() => {
      i++;
      if (i < cards.length) show();
      else end();
    }, 1700);
  };

  function end() {
    $('sort-good').disabled = true;
    $('sort-bad').disabled = true;
    const ok = mistakes === 0;
    const msg = ok
      ? `Безупречно! Все ${cards.length} привычек разобраны верно. Ты отлично отличаешь полезное от расточительного!`
      : `Верно разобрано ${good} из ${cards.length}. Перечитай объяснения — и в следующий раз будет ещё лучше!`;
    finishMini(st, { good, total: cards.length, mistakes, ok, msg });
  }

  $('sort-good').addEventListener('click', () => choose(true));
  $('sort-bad').addEventListener('click', () => choose(false));
  miniKeys = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); choose(true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); choose(false); }
  };
  show();
}

/* ---------- 3. Свет в Энергошколе ---------- */
function renderRooms(st) {
  state.answered = false;
  const rooms = st.rooms.map(r => ({ ...r, on: r.init }));

  $('stage').innerHTML = `
    <div class="card mini-card">
      ${miniHeader(st)}
      <div class="rooms-grid" id="rooms-grid">
        ${rooms.map((r, i) => `
          <button class="room" data-i="${i}">
            <span class="r-bulb"></span>
            <b>${r.name}</b>
            <span class="r-desc">${r.desc}</span>
            <span class="r-switch"></span>
          </button>`).join('')}
      </div>
      <button class="btn btn-primary btn-big" id="rooms-check">✔ ПРОВЕРИТЬ</button>
      <div class="feedback" id="feedback"></div>
    </div>`;

  const grid = $('rooms-grid');
  const paint = (btn, r) => {
    btn.classList.toggle('on', r.on);
    btn.querySelector('.r-bulb').textContent = r.on ? '💡' : '⚫';
    btn.querySelector('.r-switch').textContent = r.on ? 'Свет включён' : 'Свет выключен';
  };
  grid.querySelectorAll('.room').forEach(btn => {
    const r = rooms[Number(btn.dataset.i)];
    paint(btn, r);
    btn.addEventListener('click', () => {
      if (state.answered) return;
      r.on = !r.on;
      Sound.click();
      paint(btn, r);
    });
  });

  $('rooms-check').addEventListener('click', () => {
    if (state.answered) return;
    $('rooms-check').disabled = true;
    let good = 0;
    grid.querySelectorAll('.room').forEach(btn => {
      const r = rooms[Number(btn.dataset.i)];
      const ok = r.on === r.need;
      if (ok) good++;
      btn.disabled = true;
      btn.classList.add(ok ? 'right' : 'wrong');
      btn.querySelector('.r-switch').textContent = `${ok ? '✔' : '✖'} ${r.why}`;
    });
    const bad = rooms.length - good;
    if (good > 0) changeScore(good * CONFIG.miniPoints);
    changeEnergy(good * 3 - bad * 5);
    if (bad === 0) Sound.good(); else Sound.bad();

    const msg = bad === 0
      ? 'Отлично! Во всей школе свет горит только там, где он действительно нужен.'
      : `Правильно настроено ${good} из ${rooms.length} помещений. Посмотри на отмеченные красным — там свет был лишним или его не хватало.`;
    finishMini(st, { good, total: rooms.length, mistakes: bad, ok: bad === 0, msg });
  });
}

/* ---------- 4. Чайный мастер ---------- */
function renderKettle(st) {
  state.answered = false;
  const CUP_ML = 250;
  const MAX_CUPS = 7;
  let round = 0;
  let cups = 0;
  let good = 0;
  let mistakes = 0;
  let busy = false;

  const marks = Array.from({ length: MAX_CUPS }, (_, k) =>
    `<span style="bottom:${((k + 1) / MAX_CUPS) * 100}%">${(k + 1) * CUP_ML}</span>`).join('');

  $('stage').innerHTML = `
    <div class="card mini-card">
      ${miniHeader(st)}
      <div class="hunt-meters">
        <span class="chip" id="mini-count">Заказ 1 / ${st.orders.length}</span>
        <span class="chip" id="mini-score">Верно: 0</span>
      </div>
      <div class="kettle-wrap">
        <div>
          <div class="order"><small>Заказ</small><span id="k-order"></span></div>
          <div class="kettle-controls">
            <button class="btn btn-ghost" id="k-minus">− чашка</button>
            <button class="btn btn-ghost" id="k-plus">+ чашка воды</button>
          </div>
          <button class="btn btn-primary btn-big" id="k-boil">🔥 ВСКИПЯТИТЬ</button>
          <div class="k-result" id="k-result"></div>
        </div>
        <div class="kettle">
          <div class="kettle-lid"></div>
          <div class="kettle-body" id="k-body">
            <div class="kettle-water" id="k-water"></div>
            <div class="kettle-marks">${marks}</div>
          </div>
          <div class="kettle-ml" id="k-ml">0 мл</div>
        </div>
      </div>
      <div class="feedback" id="feedback"></div>
    </div>`;

  const draw = () => {
    $('k-water').style.height = `${(cups / MAX_CUPS) * 100}%`;
    $('k-ml').textContent = `${cups * CUP_ML} мл`;
    $('k-minus').disabled = busy || cups === 0;
    $('k-plus').disabled = busy || cups === MAX_CUPS;
    $('k-boil').disabled = busy || cups === 0;
  };
  const showOrder = () => {
    cups = 0;
    busy = false;
    $('k-order').textContent = st.orders[round].text;
    $('mini-count').textContent = `Заказ ${round + 1} / ${st.orders.length}`;
    $('k-result').textContent = '';
    $('k-result').className = 'k-result';
    $('k-body').classList.remove('boiling');
    draw();
  };

  $('k-plus').addEventListener('click', () => { if (!busy && cups < MAX_CUPS) { cups++; Sound.tone(300 + cups * 60, 0.08, 'sine'); draw(); } });
  $('k-minus').addEventListener('click', () => { if (!busy && cups > 0) { cups--; Sound.click(); draw(); } });
  $('k-boil').addEventListener('click', () => {
    if (busy || state.answered || cups === 0) return;
    busy = true;
    draw();
    const need = st.orders[round].cups;
    const res = $('k-result');
    $('k-body').classList.add('boiling');
    if (cups === need) {
      good++;
      Sound.good();
      changeScore(CONFIG.miniPoints);
      changeEnergy(3);
      res.textContent = `✔ Ровно ${need * CUP_ML} мл — ни капли лишней!`;
      res.classList.add('good');
    } else if (cups > need) {
      mistakes++;
      Sound.bad();
      changeEnergy(-5);
      res.textContent = `✖ Нужно было ${need * CUP_ML} мл. Лишние ${(cups - need) * CUP_ML} мл нагрелись зря.`;
      res.classList.add('bad');
    } else {
      mistakes++;
      Sound.bad();
      changeEnergy(-5);
      res.textContent = `✖ Нужно было ${need * CUP_ML} мл. Не хватит на всех — придётся кипятить ещё раз.`;
      res.classList.add('bad');
    }
    $('mini-score').textContent = `Верно: ${good}`;
    later(() => {
      round++;
      if (!isOver() && round < st.orders.length) showOrder();
      else end();
    }, 2300);
  });

  function end() {
    ['k-plus', 'k-minus', 'k-boil'].forEach(id => { $(id).disabled = true; });
    $('k-body').classList.remove('boiling');
    const ok = mistakes === 0;
    const msg = ok
      ? 'Настоящий чайный мастер! Каждый раз ты кипятил ровно столько воды, сколько нужно.'
      : `Точных заказов: ${good} из ${st.orders.length}. Считай чашки внимательно: одна чашка — 250 мл.`;
    finishMini(st, { good, total: st.orders.length, mistakes, ok, msg });
  }

  showOrder();
}

/* ---------- 5. Ночной дозор ---------- */
function renderWhack(st) {
  state.answered = false;
  const WINDOWS = 12;
  const seq = shuffle([...Array(st.waste).fill('waste'), ...Array(st.people).fill('people')]);
  const slots = Array(WINDOWS).fill(null);
  let spawned = 0;
  let good = 0;
  let missed = 0;
  let mistakes = 0;
  let running = false;
  let done = false;

  $('stage').innerHTML = `
    <div class="card mini-card">
      ${miniHeader(st)}
      <div class="hunt-meters">
        <span class="chip" id="mini-count">Погашено: 0 / ${st.waste}</span>
        <span class="chip" id="mini-missed">Пропущено: 0</span>
        <span class="chip">💡 пусто — гаси · 👨‍👩‍👧 люди — не трогай</span>
      </div>
      <div class="whack-city">
        <div class="whack-moon">🌙</div>
        <div class="whack-grid" id="whack-grid">
          ${Array.from({ length: WINDOWS }, (_, i) => `<button class="wwin" data-i="${i}" aria-label="Окно ${i + 1}"></button>`).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-big" id="whack-start">▶ НАЧАТЬ ДОЗОР</button>
      <div class="feedback" id="feedback"></div>
    </div>`;

  const grid = $('whack-grid');
  const btnOf = (i) => grid.querySelector(`[data-i="${i}"]`);

  const clearSlot = (i, cls) => {
    const b = btnOf(i);
    slots[i] = null;
    b.className = 'wwin';
    b.innerHTML = '';
    if (cls) {
      b.classList.add(cls);
      later(() => { if (!slots[i]) b.className = 'wwin'; }, 450);
    }
  };

  const spawn = () => {
    if (done) return;
    if (spawned >= seq.length) return;
    const free = slots.map((s, i) => (s ? -1 : i)).filter(i => i >= 0);
    if (!free.length) return;
    const i = free[Math.floor(Math.random() * free.length)];
    const kind = seq[spawned++];
    const b = btnOf(i);
    b.className = `wwin lit ${kind}`;
    b.innerHTML = kind === 'waste' ? '💡<small>пусто</small>' : '👨‍👩‍👧<small>дома люди</small>';
    const tid = later(() => {
      if (slots[i] && slots[i].tid === tid) {
        if (kind === 'waste') {
          missed++;
          changeEnergy(-3);
          $('mini-missed').textContent = `Пропущено: ${missed}`;
          clearSlot(i, 'burned');
        } else {
          clearSlot(i);
        }
        checkEnd();
      }
    }, st.life);
    slots[i] = { kind, tid };
  };

  const checkEnd = () => {
    if (done) return;
    if (isOver() || (spawned >= seq.length && slots.every(s => !s))) end();
  };

  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.wwin');
    if (!b || !running || done) return;
    const i = Number(b.dataset.i);
    const s = slots[i];
    if (!s) return;
    if (s.kind === 'waste') {
      good++;
      Sound.good();
      changeScore(CONFIG.miniPoints);
      changeEnergy(2);
      $('mini-count').textContent = `Погашено: ${good} / ${st.waste}`;
      clearSlot(i, 'fixed');
      checkEnd();
    } else {
      mistakes++;
      Sound.bad();
      changeEnergy(-5);
      b.classList.remove('oops');
      void b.offsetWidth;
      b.classList.add('oops');
      floatText('Здесь живут люди!', 'bad', b);
      checkEnd();
    }
  });

  $('whack-start').addEventListener('click', () => {
    if (running) return;
    running = true;
    Sound.click();
    $('whack-start').disabled = true;
    $('whack-start').textContent = '🌃 Дозор идёт…';
    spawn();
    const sid = every(() => {
      spawn();
      if (spawned >= seq.length) { clearInterval(sid); timers.delete(sid); }
    }, st.interval);
  });

  function end() {
    if (done) return;
    done = true;
    running = false;
    grid.querySelectorAll('.wwin').forEach(b => { b.disabled = true; });
    $('whack-start').textContent = '🌅 Утро в Энергограде';
    const ok = good === st.waste && mistakes === 0;
    let msg;
    if (ok) msg = 'Блестящий дозор! Ни одна лампа в пустом офисе не горела зря, а жителей ты не потревожил.';
    else {
      msg = `Погашено ${good} из ${st.waste} лишних ламп.`;
      if (missed) msg += ` Пропущено: ${missed}.`;
      if (mistakes) msg += ` Ошибочно выключал свет у жителей: ${mistakes} раз — там свет нужен!`;
    }
    finishMini(st, { good, total: st.waste, mistakes, ok, msg });
  }
}

/* ---------- 6. Энерго-пары ---------- */
function renderMemory(st) {
  state.answered = false;
  const cards = shuffle(st.pairs.flatMap((p, pi) => [
    { pi, side: 'p', icon: p.a[0], text: p.a[1] },
    { pi, side: 's', icon: p.b[0], text: p.b[1] }
  ]));
  let open = [];
  let matched = 0;
  let moves = 0;
  let lock = false;

  $('stage').innerHTML = `
    <div class="card mini-card">
      ${miniHeader(st)}
      <div class="hunt-meters">
        <span class="chip" id="mini-count">Пары: 0 / ${st.pairs.length}</span>
        <span class="chip" id="mini-moves">Ходов: 0</span>
      </div>
      <div class="mem-grid" id="mem-grid">
        ${cards.map((c, i) => `
          <button class="mem-card" data-i="${i}" aria-label="Карточка ${i + 1}">
            <span class="mem-inner">
              <span class="mem-back">⚡</span>
              <span class="mem-front ${c.side}">
                <i>${c.icon}</i><small>${c.text}</small><em>${c.side === 'p' ? 'Проблема' : 'Решение'}</em>
              </span>
            </span>
          </button>`).join('')}
      </div>
      <div class="feedback" id="feedback"></div>
    </div>`;

  const grid = $('mem-grid');
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.mem-card');
    if (!b || lock || state.answered) return;
    if (b.classList.contains('flipped') || b.classList.contains('matched')) return;
    Sound.click();
    b.classList.add('flipped');
    open.push(b);
    if (open.length < 2) return;

    moves++;
    $('mini-moves').textContent = `Ходов: ${moves}`;
    const [x, y] = open;
    const cx = cards[Number(x.dataset.i)];
    const cy = cards[Number(y.dataset.i)];
    open = [];
    if (cx.pi === cy.pi) {
      matched++;
      Sound.good();
      x.classList.add('matched');
      y.classList.add('matched');
      changeScore(CONFIG.miniPoints);
      changeEnergy(2);
      $('mini-count').textContent = `Пары: ${matched} / ${st.pairs.length}`;
      if (matched === st.pairs.length) later(end, 700);
    } else {
      lock = true;
      x.classList.add('wrongpair');
      y.classList.add('wrongpair');
      later(() => {
        x.classList.remove('flipped', 'wrongpair');
        y.classList.remove('flipped', 'wrongpair');
        lock = false;
      }, 1000);
    }
  });

  function end() {
    const perfect = st.pairs.length;
    const ok = moves <= perfect + 4;
    const msg = ok
      ? `Великолепная память! Все пары найдены за ${moves} ходов. Ты знаешь решение для каждой энергопотери.`
      : `Все пары найдены за ${moves} ходов. Отлично! Запомни эти пары «проблема — решение».`;
    finishMini(st, { good: matched, total: st.pairs.length, mistakes: 0, ok: true, msg });
  }
}

const MINI_GAMES = {
  hunt: renderHunt,
  sort: renderSort,
  rooms: renderRooms,
  kettle: renderKettle,
  whack: renderWhack,
  memory: renderMemory
};

/* ---------- Итоги уровня ---------- */
function levelComplete() {
  const L = LEVELS[state.levelIdx];
  const isLast = state.levelIdx === LEVELS.length - 1;
  if (isLast) { finalScreen(); return; }

  Sound.level();
  const ratio = state.level.total ? state.level.correct / state.level.total : 0;
  const stars = ratio === 1 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0;
  const next = LEVELS[state.levelIdx + 1];

  $('stage').innerHTML = `
    <div class="card level-result">
      <span class="level-badge">Уровень ${state.levelIdx + 1} пройден</span>
      <h2>${L.icon} ${L.title} — готово!</h2>
      ${starsHTML(stars)}
      <p class="lead">${L.done}</p>
      <div class="result-stats">
        <div class="stat"><b>${state.level.correct} / ${state.level.total}</b><span>верных решений</span></div>
        <div class="stat"><b>+${state.level.points}</b><span>баллов за уровень</span></div>
        <div class="stat"><b>${state.energy}%</b><span>энергии города</span></div>
      </div>
      ${wattSay(`Следующая цель — «${next.title}» ${next.icon}. Вперёд, агент!`)}
      <button class="btn btn-primary btn-big" id="btn-next-level">ПЕРЕЙТИ ДАЛЬШЕ ➜</button>
    </div>`;

  const go = () => { Sound.click(); state.levelIdx++; showLevelIntro(); };
  $('btn-next-level').addEventListener('click', go);
  nextAction = go;
}

/* ---------- Финал ---------- */
function getRank(pct) {
  if (pct >= 85) return { title: 'Главный Энерго-Агент', medal: '🏆', stars: 3, text: 'Ты спас Энергоград! Твои решения помогли сохранить энергию всего города. Теперь ты — настоящий герой энергосбережения.' };
  if (pct >= 60) return { title: 'Старший Энерго-Агент', medal: '🥈', stars: 2, text: 'Отличная работа! Энергоград в безопасности. Ещё немного практики — и ты станешь Главным Энерго-Агентом.' };
  return { title: 'Энерго-Агент-стажёр', medal: '🥉', stars: 1, text: 'Миссия пройдена! Ты сделал первые шаги к энергосбережению. Пройди игру ещё раз, чтобы получить высшее звание.' };
}

function statsHTML() {
  return `
    <div class="final-stats">
      <div class="stat"><b>${state.score} / ${MAX_SCORE}</b><span>⭐ баллов</span></div>
      <div class="stat"><b>${state.correct} / ${MAX_ANSWERS}</b><span>✅ верных решений</span></div>
      <div class="stat"><b>${Math.max(0, state.lives)} / ${CONFIG.maxLives}</b><span>❤️ жизней</span></div>
      <div class="stat"><b>${state.energy}%</b><span>⚡ энергии города</span></div>
    </div>`;
}

function memoHTML(open) {
  if (!state.learnedTips.length) return '';
  return `
    <details class="memo" ${open ? 'open' : ''}>
      <summary>📋 Памятка Энерго-Агента (${state.learnedTips.length} правил)</summary>
      <ul>${state.learnedTips.map(t => `<li>${t}</li>`).join('')}</ul>
    </details>`;
}

function finalScreen() {
  nextAction = null;
  const pct = Math.round(state.score / MAX_SCORE * 100);
  const rank = getRank(pct);
  const date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  $('final-content').innerHTML = `
    <div class="card final-card">
      <div class="final-medal">${rank.medal}</div>
      <h2>Миссия выполнена! Энергоград спасён!</h2>
      ${starsHTML(rank.stars)}
      <p class="lead">${rank.text}</p>
      <div class="certificate" id="certificate">
        <div class="cert-top">⚡ Город Энергоград ⚡</div>
        <div class="cert-title">УДОСТОВЕРЕНИЕ</div>
        <p>Настоящим подтверждается, что</p>
        <div class="cert-name" id="cert-name"></div>
        <p>успешно выполнил(а) миссию и получает звание</p>
        <div class="cert-rank">${rank.title}</div>
        <div class="cert-date">Результат: ${state.score} из ${MAX_SCORE} баллов · ${date}</div>
      </div>
      ${statsHTML()}
      ${memoHTML(true)}
      <div class="btn-row">
        <button class="btn btn-primary" id="btn-again">🔄 ИГРАТЬ СНОВА</button>
        <button class="btn btn-ghost" id="btn-print">🖨 ПЕЧАТЬ УДОСТОВЕРЕНИЯ</button>
        <button class="btn btn-ghost" id="btn-home">🏠 ГЛАВНОЕ МЕНЮ</button>
      </div>
    </div>`;
  $('cert-name').textContent = state.playerName; // безопасная вставка имени

  $('btn-again').addEventListener('click', restart);
  $('btn-print').addEventListener('click', () => window.print());
  $('btn-home').addEventListener('click', goHome);

  updateHUD();
  showScreen('final');
  Sound.win();
  confetti();
}

function gameOver() {
  nextAction = null;
  miniKeys = null;
  clearTimers();
  const reason = state.energy <= 0
    ? 'Энергия города закончилась — Энергоград погрузился во тьму.'
    : 'У тебя закончились жизни.';

  $('final-content').innerHTML = `
    <div class="card final-card">
      <div class="final-medal">🔋</div>
      <h2>Миссия прервана</h2>
      <p class="lead">${reason} Но настоящий Энерго-Агент не сдаётся!</p>
      ${wattSay('Не расстраивайся! Перечитай памятку ниже и попробуй ещё раз — у тебя обязательно получится.', true)}
      ${statsHTML()}
      ${memoHTML(true)}
      <div class="btn-row">
        <button class="btn btn-primary" id="btn-again">🔄 ИГРАТЬ СНОВА</button>
        <button class="btn btn-ghost" id="btn-home">🏠 ГЛАВНОЕ МЕНЮ</button>
      </div>
    </div>`;
  $('btn-again').addEventListener('click', restart);
  $('btn-home').addEventListener('click', goHome);

  showScreen('final');
  Sound.lose();
}

function restart() {
  Sound.click();
  $('fx-layer').innerHTML = '';
  resetState();
  updateHUD();
  showScreen('game');
  showLevelIntro();
}

function goHome() {
  Sound.click();
  resetState();
  $('fx-layer').innerHTML = '';
  $('stage').innerHTML = '';
  closeModals();
  showScreen('start');
}

/* ---------------------------------------------------------
   8. МОДАЛЬНЫЕ ОКНА
   --------------------------------------------------------- */
let lastFocus = null;
function openModal(id) {
  lastFocus = document.activeElement;
  $(id).classList.add('open');
  const btn = $(id).querySelector('.btn');
  if (btn) setTimeout(() => btn.focus(), 50);
}
function closeModals() {
  document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
const anyModalOpen = () => !!document.querySelector('.modal.open');

/* ---------------------------------------------------------
   9. ИНИЦИАЛИЗАЦИЯ
   --------------------------------------------------------- */
function init() {
  $('start-city').innerHTML = citySVG();
  $('start-agent').innerHTML = agentSVG();
  $('start-watt').innerHTML = wattSVG();

  $('btn-start').addEventListener('click', () => { Sound.click(); startGame(); });
  $('btn-how').addEventListener('click', () => { Sound.click(); openModal('modal-how'); });
  $('btn-about').addEventListener('click', () => { Sound.click(); openModal('modal-about'); });
  $('player-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') { Sound.click(); startGame(); } });

  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { Sound.click(); closeModals(); }));
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) closeModals(); }));

  $('btn-sound').addEventListener('click', () => {
    Sound.on = !Sound.on;
    $('btn-sound').textContent = Sound.on ? '🔊' : '🔇';
    Sound.click();
  });
  $('btn-menu').addEventListener('click', () => { Sound.click(); openModal('modal-exit'); });
  $('btn-exit-yes').addEventListener('click', goHome);

  // Управление с клавиатуры
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && anyModalOpen()) { closeModals(); return; }
    if (anyModalOpen() || !$('screen-game').classList.contains('active')) return;
    if (e.target && e.target.tagName === 'INPUT') return;

    if (miniKeys && !state.answered) { miniKeys(e); return; }
    if (!state.answered && ['1', '2', '3', '4'].includes(e.key)) {
      const btn = document.querySelector(`#answers .answer[data-i="${Number(e.key) - 1}"]`);
      if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
      return;
    }
    if (e.key === 'Enter' && nextAction && document.activeElement?.tagName !== 'BUTTON') {
      e.preventDefault();
      Sound.click();
      nextAction();
    }
  });

  resetState();
  updateHUD();
}

document.addEventListener('DOMContentLoaded', init);
