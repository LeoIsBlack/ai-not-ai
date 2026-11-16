/* ============================================================
   ЗДЕСЬ РЕДАКТИРУЕТСЯ ВСЁ СОДЕРЖИМОЕ САЙТА
   ============================================================ */

/* --- Контакты и имя --- */
const SITE = {
  name: "AI not AI",                      // имя / бренд в шапке
  whatsapp: "https://wa.me/77761985879",  // WhatsApp: +7 776 198 58 79
  telegram: "",                           // например "https://t.me/username" ("" — скрыть)
  email: "krysamanleo@gmail.com",         // почта ("" — скрыть)
  instagram: ""                           // например "https://instagram.com/username"
};

/* --- Работы ---
   Чтобы добавить работу — скопируй блок { ... } и заполни поля:

   id          — короткое имя латиницей без пробелов. Из него получается
                 прямая ссылка для клиента:  твой-сайт/#id
   title       — название
   category    — категория (из категорий автоматически строятся фильтры)
   description — пара предложений о задаче (необязательно)
   tools       — чем сделано (необязательно)
   video       — ссылка на ролик. Подходит:
                   • YouTube / YouTube Shorts / Vimeo / Rutube / VK Видео
                   • Google Drive (ссылка «Поделиться»)
                   • файл в папке сайта, например "videos/brand.mp4"
                 Пустая строка "" — карточка с пометкой «Скоро».
   cover       — обложка, например "covers/brand.jpg" (необязательно;
                 для YouTube подставится автоматически)
   vertical    — true для вертикальных роликов 9:16
*/
const WORKS = [
  {
    id: "destruction",
    title: "Кинематографичная история с разрушениями",
    category: "Кино",
    description: "Зрелищные сцены разрушений в стилистике большого кино.",
    tools: "",
    video: "https://youtu.be/lgs-ODgba2w",
    cover: "",
    vertical: false
  },
  {
    id: "cartoon-stories",
    title: "Истории в мультяшном стиле",
    category: "Анимация",
    description: "Любой сюжет можно рассказать в мультяшной стилистике.",
    tools: "",
    video: "https://youtu.be/nBrdrXfeIfQ",
    cover: "",
    vertical: false
  },
  {
    id: "viking",
    title: "История викинга",
    category: "Кино",
    description: "Реалистичная история с живыми персонажами и атмосферой эпохи.",
    tools: "",
    video: "https://youtu.be/rHWmqz_qsIs",
    cover: "",
    vertical: false
  },
  {
    id: "love-story",
    title: "Love Story",
    category: "Анимация",
    description: "История любви в мультяшном стиле.",
    tools: "",
    video: "https://youtu.be/l6B8KCyOO-Q",
    cover: "",
    vertical: false
  },
  {
    id: "cyclist",
    title: "Замена человека в кадре",
    category: "Реализм",
    description: "Реалистичная замена человека в видео: велосипедист в движении.",
    tools: "",
    video: "https://youtu.be/tDsim0TA4vQ",
    cover: "",
    vertical: false
  }
];
