/* ============================================================
   ЗДЕСЬ РЕДАКТИРУЕТСЯ ВСЁ СОДЕРЖИМОЕ САЙТА
   ============================================================ */

/* --- Контакты и имя --- */
const SITE = {
  name: "AI not AI",                      // имя / бренд в шапке
  whatsapp: "https://wa.me/77761985879",  // WhatsApp: +7 776 198 58 79
  telegram: "",                           // например "https://t.me/username" ("" — скрыть)
  email: "",                              // например "hello@example.com" ("" — скрыть)
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
    id: "brand-film",
    title: "Имиджевый ролик",
    category: "Реклама",
    description: "Короткое описание задачи и результата появится здесь.",
    tools: "",
    video: "",
    cover: "",
    vertical: false
  },
  {
    id: "product",
    title: "Продуктовая анимация",
    category: "Реклама",
    description: "",
    tools: "",
    video: "",
    cover: "",
    vertical: false
  },
  {
    id: "music-video",
    title: "Музыкальный клип",
    category: "Клипы",
    description: "",
    tools: "",
    video: "",
    cover: "",
    vertical: false
  },
  {
    id: "reels",
    title: "Вертикальный ролик для соцсетей",
    category: "Соцсети",
    description: "",
    tools: "",
    video: "",
    cover: "",
    vertical: true
  },
  {
    id: "character",
    title: "ИИ-персонаж",
    category: "Персонажи",
    description: "",
    tools: "",
    video: "",
    cover: "",
    vertical: false
  },
  {
    id: "short-film",
    title: "Короткометражка",
    category: "Кино",
    description: "",
    tools: "",
    video: "",
    cover: "",
    vertical: false
  }
];
