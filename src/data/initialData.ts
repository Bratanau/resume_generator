import { CandidateResume, RecruiterSession, BragsheetEntry } from '../types';

export const initialCandidate: CandidateResume = {
  id: 'alex-novikov',
  slug: 'alex-novikov',
  fullName: 'Алексей Новиков',
  title: 'Senior Full-Stack & Highload Architect',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  location: 'Москва / Remote Worldwide',
  email: 'alex.novikov.dev@gmail.com',
  telegram: '@alex_novikov_tech',
  github: 'https://github.com',
  linkedin: 'https://linkedin.com',
  statusBadge: '🟢 Открыт к предложениям (Senior / Lead)',
  pitch: '7+ лет проектирую распределенные сервисы с нагрузкой от 25k RPS. Сокращаю p99 задержки, перевожу монолиты на event-driven архитектуру и трансформирую инженерные практики в измеримую прибыль бизнеса.',
  campaigns: [
    {
      id: 'cmp-yandex',
      slug: 'yandex-cloud',
      companyName: 'Яндекс (Cloud Platform)',
      roleTitle: 'Senior Infrastructure Engineer',
      customGreeting: 'Привет, команда Яндекс Облака! Этот интерактивный профиль сфокусирован на моем опыте с распределенным кэшированием и k8s операторами.',
      prioritizedSection: 'petProjects',
      accentColor: '#fc3f1d',
      viewsCount: 14,
      lastViewedAt: '5 минут назад',
      status: 'reviewing'
    },
    {
      id: 'cmp-tinkoff',
      slug: 'tinkoff-banking',
      companyName: 'Т-Банк (Fintech Core)',
      roleTitle: 'Staff Backend Engineer',
      customGreeting: 'Рад приветствовать рекрутинговую команду Т-Банка! Сфокусировал опыт на транзакционной надежности, партиционировании PostgreSQL и 99.99% SLA.',
      prioritizedSection: 'experience',
      accentColor: '#ffdd2d',
      viewsCount: 29,
      lastViewedAt: '2 часа назад',
      status: 'interview_scheduled'
    },
    {
      id: 'cmp-avito',
      slug: 'avito-platform',
      companyName: 'Авито (Platform Architecture)',
      roleTitle: 'Tech Lead / Principal',
      customGreeting: 'Привет Авито! Здесь собраны кейсы по шардингу очередей Kafka и снижению MTTR критических сервисов поиска.',
      prioritizedSection: 'experience',
      accentColor: '#00aaeb',
      viewsCount: 8,
      lastViewedAt: 'Вчера',
      status: 'active'
    }
  ],
  skills: [
    {
      category: 'Backend & Highload',
      skills: [
        { name: 'TypeScript / Node.js', level: 96, highlighted: true },
        { name: 'Go (Golang)', level: 88, highlighted: true },
        { name: 'PostgreSQL & ClickHouse', level: 94, highlighted: true },
        { name: 'Redis (Cluster, Streams)', level: 92, highlighted: true },
        { name: 'Kafka & RabbitMQ', level: 90, highlighted: true },
        { name: 'gRPC / Protobuf', level: 85 }
      ]
    },
    {
      category: 'Frontend & Web UX',
      skills: [
        { name: 'React 19 / Next.js', level: 94, highlighted: true },
        { name: 'Tailwind CSS', level: 95 },
        { name: 'WebSockets & WebRTC', level: 86 },
        { name: 'Performance & Web Vitals', level: 92 }
      ]
    },
    {
      category: 'DevOps & Observability',
      skills: [
        { name: 'Docker & Kubernetes', level: 89, highlighted: true },
        { name: 'OpenTelemetry & Prometheus', level: 87 },
        { name: 'Grafana & VictoriaMetrics', level: 84 },
        { name: 'CI/CD (GitLab, GitHub Actions)', level: 90 }
      ]
    }
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'Fintech Scale-up (PayFlow)',
      companyUrl: 'https://example.com',
      role: 'Lead Backend Engineer / System Architect',
      period: '2023 — Настоящее время (2+ года)',
      location: 'Москва (Гибрид)',
      summary: 'Руководство кросс-функциональной платформенной командой из 9 инженеров. Ответственность за платежный шлюз и систему антифрода.',
      starBullets: [
        'Спроектировал и внедрил асинхронный платежный конвейер на базе Kafka и Redis Streams, выдерживающий нагрузку 32 000 RPS в Black Friday без единого drop-события.',
        'Оптимизировал сложные аналитические запросы и настроил многоуровневое партиционирование таблиц PostgreSQL объемом 12 Тб, снизив среднее время транзакции с 480мс до 55мс (-88%).',
        'Внедрил распределенный Tracing (OpenTelemetry) и автоматический circuit-breaker для внешних банковских провайдеров, сократив время локализации сбоев (MTTR) с 40 минут до 3 минут.',
        'Перевел инфраструктуру на автомасштабируемые K8s-кластеры с оптимизацией потребления ресурсов, сократив облачный счет компании на $94 000 в год.'
      ],
      metrics: [
        { label: 'Пиковый RPS', value: '32,000', changeType: 'highlight' },
        { label: 'Снижение p99 задержки', value: '-88%', changeType: 'positive' },
        { label: 'Годовая экономия Cloud', value: '$94,000', changeType: 'positive' },
        { label: 'Uptime SLA', value: '99.99%', changeType: 'positive' }
      ],
      techStack: ['Go', 'TypeScript', 'PostgreSQL', 'Redis', 'Kafka', 'Kubernetes', 'OpenTelemetry'],
      isCurrent: true
    },
    {
      id: 'exp-2',
      company: 'E-commerce Core Solutions (OmniTrade)',
      companyUrl: 'https://example.com',
      role: 'Senior Full-Stack Developer',
      period: '2020 — 2023 (3 года)',
      location: 'Москва',
      summary: 'Разработка личного кабинета продавца и сервиса управления товарными остатками для 45 000 мерчантов.',
      starBullets: [
        'Переписал монолитный модуль инвентаризации на микросервисную event-driven архитектуру, устранив deadlock-конфликты при одновременном оформлении заказов.',
        'Разработал real-time дашборд аналитики продаж с серверными событиями (SSE) и виртуализированными таблицами, обрабатывающими 100k+ строк без зависания браузера.',
        'Внедрил культуру архитектурных RFC и менторил 4 младших разработчиков, двое из которых выросли до middle+ за 10 месяцев.'
      ],
      metrics: [
        { label: 'Мерчантов на платформе', value: '45,000+', changeType: 'highlight' },
        { label: 'Скорость сборки CI', value: '3x быстрее', changeType: 'positive' },
        { label: 'Crash-free сессии', value: '99.95%', changeType: 'positive' }
      ],
      techStack: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Redis', 'Docker', 'GraphQL']
    },
    {
      id: 'exp-3',
      company: 'Digital Agency (CodeWave)',
      companyUrl: 'https://example.com',
      role: 'Software Engineer',
      period: '2018 — 2020 (2 года)',
      location: 'Санкт-Петербург',
      summary: 'Создание B2B веб-платформ и интеграция с ERP/CRM системами для корпоративных клиентов.',
      starBullets: [
        'Разработал API-шлюз для синхронизации остатков с 1С и SAP для крупного ритейлера бытовой техники.',
        'Оптимизировал производительность фронтенда: внедрил code-splitting и SSR, подняв Lighthouse Performance с 42 до 96 баллов.'
      ],
      metrics: [
        { label: 'Lighthouse Score', value: '96 / 100', changeType: 'positive' },
        { label: 'Завершенных B2B проектов', value: '14 систем', changeType: 'highlight' }
      ],
      techStack: ['JavaScript', 'Node.js', 'React', 'MongoDB', 'Redis', 'REST API']
    }
  ],
  petProjects: [
    {
      id: 'pet-1',
      title: 'HyperStream: Distributed In-Memory Message Bus',
      tagline: 'Ультра-легковесная шина сообщений с нулевым копированием на Go & eBPF',
      description: 'Спроектировал open-source брокер сообщений для highload сервисов, обеспечивающий субмикросекундную задержку (sub-millisecond latency) передачи данных между контейнерами в одном k8s поде.',
      techStack: ['Go', 'eBPF', 'RingBuffer', 'Linux Sockets', 'Docker'],
      liveDemoUrl: 'https://github.com/demo/hyperstream',
      githubUrl: 'https://github.com/alex-novikov/hyperstream',
      metrics: '1.2M msg/sec throughput • p99 < 80µs',
      stars: 480,
      highlightedArchitecture: 'Lock-free Ring Buffer + Zero-copy memory mapping via mmap'
    },
    {
      id: 'pet-2',
      title: 'DBSentry: Intelligent Slow-Query Autotuner',
      tagline: 'CLI & Daemon для автоматического анализа execution plan в PostgreSQL',
      description: 'Инструмент на TypeScript и Python, который слушает slow query log, парсит EXPLAIN ANALYZE и автоматически рекомендует оптимальные составные и partial индексы.',
      techStack: ['TypeScript', 'Python', 'PostgreSQL', 'AST Parser', 'CLI'],
      liveDemoUrl: 'https://github.com/demo/dbsentry',
      githubUrl: 'https://github.com/alex-novikov/dbsentry',
      metrics: 'Ускорил 120+ продакшн запросов на 40-70%',
      stars: 310,
      highlightedArchitecture: 'Heuristic Cost Estimator + Safe EXPLAIN Sandbox'
    }
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'МГТУ им. Н.Э. Баумана (ИУ7)',
      degree: 'Программная инженерия и распределенные вычислительные комплексы, Магистр',
      period: '2016 — 2022',
      details: 'Диплом с отличием. Тема: «Оптимизация распределенного консенсуса в гетерогенных сетях»'
    }
  ],
  voiceComments: [
    {
      id: 'vc-1',
      sectionId: 'exp-1',
      sectionTitle: 'Fintech Scale-up (PayFlow) - Метрики',
      authorName: 'Михаил Данилов',
      authorRole: 'Staff Architect @ Ex-Yandex / Mentor',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      timestamp: '2 дня назад',
      audioDurationSeconds: 16,
      tag: 'fire',
      tagLabel: '🔥 Киллер-фича для Яндекса',
      transcription: '«Слушай, пункт про 32 000 RPS и p99 задержку в 55мс — это пушка. Любой техлид сразу цепляется за эти цифры. Советую этот блок в персонализированной ссылке для Яндекса поднять еще выше!»',
      suggestedRewrite: 'Оставил как эталон. Метрики в первом буллете продают тебя сразу на грейд Staff.'
    },
    {
      id: 'vc-2',
      sectionId: 'pet-1',
      sectionTitle: 'Pet Project: HyperStream',
      authorName: 'Анна Кузнецова',
      authorRole: 'Head of Talent @ Global Fintech',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      timestamp: 'Вчера в 17:40',
      audioDurationSeconds: 22,
      tag: 'tip',
      tagLabel: '💡 Совет по конверсии',
      transcription: '«У тебя крутой пет-проект на Go с eBPF, но рекрутеры-гуманитарии могут испугаться термина RingBuffer. Добавь одну строчку простыми словами: какую бизнес-задачу это решает и сколько денег на серверах экономит».',
      suggestedRewrite: 'Добавить бейдж: «Экономит до 60% ресурсов CPU в распределенных кластерах».',
      accepted: false
    }
  ]
};

// Pre-recorded recruiter telemetry sessions for the Webvisor Replay
export const initialSessions: RecruiterSession[] = [
  {
    id: 'rec-session-yandex',
    company: 'Яндекс (Yandex Cloud Platform)',
    recruiterTitle: 'Senior Tech Lead / Hiring Manager',
    recruiterAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    device: 'MacBook Pro 16" (macOS, Chrome 124)',
    location: 'Москва, РФ (IP Yandex LLC)',
    startedAt: '12 минут назад',
    durationSeconds: 164,
    scrollDepth: 94,
    status: 'interview_invited',
    topSectionsDwell: [
      { sectionId: 'petProjects', title: 'Пет-проект HyperStream (Go & eBPF)', seconds: 58 },
      { sectionId: 'exp-1', title: 'Опыт в Fintech Scale-up (32k RPS)', seconds: 46 },
      { sectionId: 'skills', title: 'Матрица навыков (Highload & Go)', seconds: 28 },
      { sectionId: 'education', title: 'Образование (МГТУ Баумана)', seconds: 4 }
    ],
    clickedLinks: ['GitHub: hyperstream', 'Demo Architecture', 'Telegram Contact'],
    insight: 'Хайринг-менеджер Яндекса пролистал образование за 4 секунды, но почти минуту вчитывался в исходный код брокера на Go и кликнул на ссылку в Telegram!',
    events: [
      { t: 0, type: 'scroll', scrollY: 0, y: 10 },
      { t: 1200, type: 'mouse', x: 28, y: 18, sectionId: 'header' },
      { t: 3400, type: 'scroll', scrollY: 350, y: 35 },
      { t: 6000, type: 'dwell', sectionId: 'exp-1', dwellMs: 8000 },
      { t: 8500, type: 'mouse', x: 42, y: 44, sectionId: 'exp-1' },
      { t: 14000, type: 'scroll', scrollY: 900, y: 65 },
      { t: 19000, type: 'dwell', sectionId: 'petProjects', dwellMs: 38000 },
      { t: 26000, type: 'mouse', x: 65, y: 58, sectionId: 'pet-1' },
      { t: 34000, type: 'click', x: 70, y: 59, sectionId: 'pet-1' },
      { t: 52000, type: 'scroll', scrollY: 1400, y: 88 },
      { t: 56000, type: 'scroll', scrollY: 200, y: 15 },
      { t: 62000, type: 'click', x: 80, y: 15, sectionId: 'contacts' }
    ]
  },
  {
    id: 'rec-session-tinkoff',
    company: 'Т-Банк (Fintech Recruitment)',
    recruiterTitle: 'Lead IT Recruiter (Core Systems)',
    recruiterAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    device: 'Windows 11 (Edge, 1920x1080)',
    location: 'Санкт-Петербург, РФ',
    startedAt: '1 час назад',
    durationSeconds: 98,
    scrollDepth: 82,
    status: 'completed',
    topSectionsDwell: [
      { sectionId: 'exp-1', title: 'Опыт в Fintech Scale-up', seconds: 48 },
      { sectionId: 'skills', title: 'Стек: PostgreSQL & Kafka', seconds: 24 },
      { sectionId: 'header', title: 'Контакты и статус', seconds: 16 }
    ],
    clickedLinks: ['Копировать Telegram', 'Скачать ATS-версию'],
    insight: 'Рекрутер искал подтверждение опыта с Kafka и PostgreSQL, задержался на блоке метрик и скопировал ваш Telegram для назначения скриннинга.',
    events: [
      { t: 0, type: 'scroll', scrollY: 0, y: 5 },
      { t: 1800, type: 'mouse', x: 30, y: 22, sectionId: 'header' },
      { t: 4000, type: 'scroll', scrollY: 420, y: 40 },
      { t: 7500, type: 'dwell', sectionId: 'exp-1', dwellMs: 25000 },
      { t: 18000, type: 'mouse', x: 50, y: 45, sectionId: 'exp-1' },
      { t: 32000, type: 'scroll', scrollY: 1100, y: 75 },
      { t: 45000, type: 'click', x: 35, y: 20, sectionId: 'contacts' }
    ]
  },
  {
    id: 'rec-session-live',
    company: 'Avito Tech Team',
    recruiterTitle: 'Staff Architect & Talent Scout',
    recruiterAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    device: 'Linux / Chrome (2560x1440)',
    location: 'Москва, РФ (Сеть Avito)',
    startedAt: 'Прямо сейчас',
    durationSeconds: 45,
    scrollDepth: 65,
    status: 'watching_now',
    topSectionsDwell: [
      { sectionId: 'exp-1', title: 'Опыт: 32k RPS & Kafka', seconds: 28 },
      { sectionId: 'petProjects', title: 'HyperStream Broker', seconds: 12 }
    ],
    clickedLinks: [],
    insight: '🔴 ВНИМАНИЕ: Представитель Авито изучает ваше резюме прямо сейчас! Зафиксирован фокус на опыте с брокерами очередей.',
    events: [
      { t: 0, type: 'scroll', scrollY: 0, y: 10 },
      { t: 800, type: 'mouse', x: 25, y: 15 },
      { t: 2500, type: 'scroll', scrollY: 380, y: 38 },
      { t: 4000, type: 'dwell', sectionId: 'exp-1', dwellMs: 18000 },
      { t: 12000, type: 'mouse', x: 48, y: 46 }
    ]
  }
];

// Initial Bragsheet Entries ("Capital Tracker" for Super Retention)
export const initialBragsheetEntries: BragsheetEntry[] = [
  {
    id: 'brag-1',
    date: 'Ноябрь 2026',
    rawInput: '«Перенес продакшн базу данных с PostgreSQL 11 на 15 версию, работали две ночи с репликами, ни секунды даунтайма для пользователей»',
    corporateTitle: 'Бесшовная миграция кластера СУБД с нулевым временем простоя',
    situation: 'Версия PostgreSQL 11 достигла EOL, не поддерживала JIT-компиляцию запросов и создавала угрозу аудиту безопасности.',
    action: 'Спроектировал и протестировал схему логической репликации с канареечным переключением пула соединений в PgBouncer.',
    result: 'Перенес 4.2 Тб критических транзакционных данных без прерывания обслуживания 140 000 активных клиентов; p95 задержка записи снизилась на 22%.',
    performanceBullet: 'Инициировал и выполнил бессбойную миграцию PostgreSQL 11 → 15 (4.2 TB), повысив безопасность инфраструктуры и снизив latency на 22%.',
    category: 'Architecture',
    scoreBonus: '+20 баллов к промоушену в Staff',
    tags: ['PostgreSQL', 'High Availability', 'Zero Downtime', 'PgBouncer']
  },
  {
    id: 'brag-2',
    date: 'Октябрь 2026',
    rawInput: '«Пофиксил утечку памяти в воркере очередей, который падал раз в три дня при выгрузке отчетов мерчантов»',
    corporateTitle: 'Ликвидация хронической утечки памяти в распределенном воркере',
    situation: 'Фоновые обработчики отчетов аварийно перезапускались по OOM-killer при генерации выгрузок более 500 Мб.',
    action: 'Локализовал циклические ссылки в замыканиях стримов, перевел генерацию XLSX на потоковую передачу чанками через TransformStream.',
    result: 'Сократил потребление RAM воркерами в 4 раза (с 1.8GB до 420MB), устранив 100% OOM-инцидентов и высвободив 12 серверов.',
    performanceBullet: 'Оптимизировал потоковую обработку очередей, снизив расход RAM на 76% и сэкономив вычислительные ресурсы кластера на $14,000/год.',
    category: 'Reliability',
    scoreBonus: '+15 баллов к Performance Review',
    tags: ['Node.js Streams', 'Memory Optimization', 'Cost Saving', 'Reliability']
  },
  {
    id: 'brag-3',
    date: 'Сентябрь 2026',
    rawInput: '«Взял шефство над двумя новыми стажерами, помог им разобраться с CI/CD и закрыть первые фичи в прод»',
    corporateTitle: 'Инженерное наставничество и ускорение онбординга команды',
    situation: 'Онбординг новых инженеров в легаси-кодбазу ранее занимал до 6 недель до первого успешного мерджа.',
    action: 'Создал интерактивный Onboarding Starter Kit с Docker-окружением в один клик и проводил еженедельные парные код-ревью.',
    result: 'Оба инженера вывели свои первые микросервисы в продакшн на 3-й неделе; средний time-to-first-commit сократился в 2 раза.',
    performanceBullet: 'Выстроил процесс менторинга и автоматизировал dev-окружение, сократив срок ввода новичков в строй с 6 до 3 недель.',
    category: 'Leadership',
    scoreBonus: '+12 баллов к Team Impact',
    tags: ['Mentorship', 'People Leadership', 'DX', 'Onboarding']
  }
];
