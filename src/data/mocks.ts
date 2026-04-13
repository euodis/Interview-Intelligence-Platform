import { 
    Vacancy, Competency, InterviewPlan, Interviewer, Candidate, 
    InterviewSession, BlockEvaluation, CandidateSummary 
} from './types';
  
// --- 1. СПРАВОЧНИКИ ---

export const mockInterviewers: Interviewer[] = [
  { id: 'int-1', name: 'Анна Соколова', role: 'Lead HR' },
  { id: 'int-2', name: 'Джон Доу', role: 'Senior Frontend' },
  { id: 'int-3', name: 'Елена Петрова', role: 'System Architect' },
  { id: 'int-4', name: 'Максим Иванов', role: 'Frontend Lead' },
  { id: 'int-5', name: 'Алексей Смирнов', role: 'Backend Lead' },
  { id: 'int-6', name: 'Сара Коннор', role: 'Product Design' },
  { id: 'int-7', name: 'Давид Гольдман', role: 'Engineering Manager' },
  { id: 'int-8', name: 'Елена Бош', role: 'Data Engineer' }
];

export const mockCompetencies: Competency[] = [
  { id: 'comp-1', name: 'React Deep Dive', description: 'Глубокое понимание React, рендеринга, хуков, мемоизации и архитектуры стейта.' },
  { id: 'comp-2', name: 'System Design', description: 'Умение проектировать микрофронтенды, анализировать производительность и CI/CD.' },
  { id: 'comp-3', name: 'JavaScript Core', description: 'Event Loop, прототипы, асинхронность, замыкания.' },
  { id: 'comp-4', name: 'Soft Skills / Опыт', description: 'Опыт менторства, разрешение конфликтов, работа со стейкхолдерами.' },
];

// --- 2. ВАКАНСИЯ И ПЛАН ---

export const mockVacancies: Vacancy[] = [
  {
    id: 'vac-1',
    title: 'Senior Frontend Engineer (Platform)',
    level: 'Senior',
    status: 'АКТИВНА',
    competencies: mockCompetencies,
    createdAt: '2026-04-10T10:00:00Z',
  }
];

export const mockPlans: InterviewPlan[] = [
  {
    id: 'plan-1',
    vacancyId: 'vac-1',
    blocks: [
      {
        id: 'block-react',
        competencyId: 'comp-1',
        title: 'React Architecture & Performance',
        questions: [
          'Расскажи про алгоритм реконсиляции дерева. Как работает Fiber?',
          'В каких случаях useMemo и useCallback могут только навредить?',
          'Как бы ты организовал глобальный стейт в крупном Enterprise-приложении?'
        ],
        required: true,
      },
      {
        id: 'block-js',
        competencyId: 'comp-3',
        title: 'JavaScript Execution & Core',
        questions: [
          'Опиши последовательность фаз в Event Loop (macrotasks vs microtasks).',
          'Как мы можем предотвратить memory leaks в SPA?',
        ],
        required: true,
      },
      {
        id: 'block-sys',
        competencyId: 'comp-2',
        title: 'Frontend System Design',
        questions: [
          'Нам нужно разделить модульный монолит на микрофронтенды. Твой подход?',
          'Как организуешь сборку, чтобы time-to-interactive был минимальным?',
        ],
        required: true,
      },
      {
        id: 'block-soft',
        competencyId: 'comp-4',
        title: 'Engineering Culture & Mentorship',
        questions: [
          'Как ревьюируешь PR джунов так, чтобы они росли, а не обижались?',
          'Случай, когда пришлось спорить с продактом из-за технического долга?',
        ],
        required: false,
      }
    ]
  }
];

// --- 3. КАНДИДАТЫ ---

export const mockCandidates: Candidate[] = [
  { id: 'cand-1', vacancyId: 'vac-1', name: 'Алексей Смирнов', status: 'ОЦЕНЕН', currentCompany: 'Tinkoff', experienceYears: 6 },
  { id: 'cand-2', vacancyId: 'vac-1', name: 'Марина Кравец', status: 'ОЦЕНЕН', currentCompany: 'Yandex', experienceYears: 7 },
  { id: 'cand-3', vacancyId: 'vac-1', name: 'Денис Попов', status: 'ОЦЕНЕН', currentCompany: 'Startup "FinUp"', experienceYears: 4 },
  { id: 'cand-4', vacancyId: 'vac-1', name: 'Олег Тихонов', status: 'ОЦЕНЕН', currentCompany: 'EPAM', experienceYears: 8 },
  { id: 'cand-5', vacancyId: 'vac-1', name: 'Кирилл Котов', status: 'В ПРОЦЕССЕ', currentCompany: 'Avito', experienceYears: 5 },
];

// --- 4. СЕССИИ (Интервью назначенное/завершенное) ---

export const mockSessions: InterviewSession[] = [
  // Кандидат 1: Сильный
  { id: 'sess-1-1', candidateId: 'cand-1', interviewerId: 'int-2', status: 'ЗАВЕРШЕНО', scheduledAt: '2026-04-11T12:00:00Z' },
  { id: 'sess-1-2', candidateId: 'cand-1', interviewerId: 'int-3', status: 'ЗАВЕРШЕНО', scheduledAt: '2026-04-12T14:00:00Z' },
  // Кандидат 2: Расхождение
  { id: 'sess-2-1', candidateId: 'cand-2', interviewerId: 'int-2', status: 'ЗАВЕРШЕНО', scheduledAt: '2026-04-11T15:00:00Z' },
  { id: 'sess-2-2', candidateId: 'cand-2', interviewerId: 'int-3', status: 'ЗАВЕРШЕНО', scheduledAt: '2026-04-13T10:00:00Z' },
  // Кандидат 3: Слабый
  { id: 'sess-3-1', candidateId: 'cand-3', interviewerId: 'int-2', status: 'ЗАВЕРШЕНО', scheduledAt: '2026-04-10T16:00:00Z' },
  // Кандидат 4: Спорный / Доп. этап (не хватило времени / не раскрыли тему)
  { id: 'sess-4-1', candidateId: 'cand-4', interviewerId: 'int-3', status: 'ЗАВЕРШЕНО', scheduledAt: '2026-04-12T11:00:00Z' },
  // Кандидат 5: В процессе (Еще должен пройти интервью)
  { id: 'sess-5-1', candidateId: 'cand-5', interviewerId: 'int-1', status: 'ЗАВЕРШЕНО', scheduledAt: '2026-04-13T09:00:00Z' },
  { id: 'sess-5-2', candidateId: 'cand-5', interviewerId: 'int-2', status: 'ОЖИДАЕТ', scheduledAt: '2026-04-14T10:00:00Z' },
];

// --- 5. ПРОТОКОЛЫ (ОЦЕНКИ БЛОКОВ) ---

export const mockBlockEvaluations: BlockEvaluation[] = [
  // Кандидат 1 (Сильный)
  { id: 'eval-1-1', sessionId: 'sess-1-1', blockId: 'block-react', score: 5, notes: 'Отличные знания Fiber и оптимизации рендеринга. Привел отличные примеры из своего текущего проекта.' },
  { id: 'eval-1-2', sessionId: 'sess-1-1', blockId: 'block-sys', score: 4, notes: 'Хороший базис System Design, немного "закопался" в выборе bundler-ов для микрофронтендов, но архитектуру выстроил грамотно.' },
  { id: 'eval-1-3', sessionId: 'sess-1-2', blockId: 'block-js', score: 5, notes: 'Уверенно расписал Event Loop и понимает как профилировать memory leaks.' },
  { id: 'eval-1-4', sessionId: 'sess-1-2', blockId: 'block-soft', score: 5, notes: 'Ярко выраженные лидерские качества, много менторит.' },

  // Кандидат 2 (Расхождения в System Design и Architecture)
  { id: 'eval-2-1', sessionId: 'sess-2-1', blockId: 'block-sys', score: 2, notes: 'Совсем не справилась с задачей микрофронтендов. Предложила строить всё через iframes. Архитектурное мышление хромает.' },
  { id: 'eval-2-2', sessionId: 'sess-2-1', blockId: 'block-react', score: 4, notes: 'React знает хорошо.' },
  { id: 'eval-2-3', sessionId: 'sess-2-2', blockId: 'block-sys', score: 5, notes: 'Гениально расписала монолитную платформу и SSR. Прекрасный кандидат.' },
  { id: 'eval-2-4', sessionId: 'sess-2-2', blockId: 'block-js', score: 4, notes: 'Крепкий мидл+/сеньор по JS.' },

  // Кандидат 3 (Слабый)
  { id: 'eval-3-1', sessionId: 'sess-3-1', blockId: 'block-react', score: 2, notes: 'Не смог объяснить, почему useCallback не является панацеей от потери производительности.' },
  { id: 'eval-3-2', sessionId: 'sess-3-1', blockId: 'block-js', score: 2, notes: 'Путается в промисах и асинхронности.' },
  { id: 'eval-3-3', sessionId: 'sess-3-1', blockId: 'block-soft', score: 3, notes: 'Довольно закрытый разработчик. Работает исключительно по задачам.' },

  // Кандидат 4 (На дополнительный этап)
  { id: 'eval-4-1', sessionId: 'sess-4-1', blockId: 'block-react', score: 4, notes: 'React знает отлично, пишет чисто.' },
  { id: 'eval-4-2', sessionId: 'sess-4-1', blockId: 'block-sys', score: 3, notes: 'Не успели разобрать System Design из-за того, что закопались в React. Теоретически понимает, но практический опыт неясен.' },
  
  // Кандидат 5 (В процессе)
  { id: 'eval-5-1', sessionId: 'sess-5-1', blockId: 'block-soft', score: 4, notes: 'Приятный в общении, адекватный опыт.' }, // HR-скрининг
];

// --- 6. AI SUMMARIES ---

export const mockSummaries: CandidateSummary[] = [
  // Кандидат 1 (Сильный)
  {
    id: 'sum-1',
    candidateId: 'cand-1',
    overallScore: 4.8,
    strengths: ['Глубокие технические знания React', 'Сильные навыки менторства', 'Понимание архитектуры'],
    risks: ['Небольшие пробелы в tooling (но не критично)'],
    discrepancies: null,
    recommendation: 'НАЗНАЧИТЬ_ОФФЕР',
    rationale: 'Кандидат продемонстрировал исключительные технические знания, уверенное владение архитектурными паттернами и отличные лидерские качества. Все интервьюеры единогласно рекомендуют найм на уровень Senior.',
    notableEvidence: [
       '"Отличные знания Fiber и оптимизации рендеринга. Привел отличные примеры из своего текущего проекта." (React Architecture)',
       '"Ярко выраженные лидерские качества, много менторит." (Engineering Culture)'
    ],
    nextStepSuggestion: 'Подготовить сильный оффер по верхней границе вилки для кандидатов уровня Senior. Утвердить желаемую дату выхода.'
  },
  // Кандидат 2 (Расхождения)
  {
    id: 'sum-2',
    candidateId: 'cand-2',
    overallScore: 3.8,
    strengths: ['Уверенные знания JS Core', 'Отличное понимание монолитной архитектуры и SSR'],
    risks: ['Слабое понимание современных подходов к микрофронтендам'],
    discrepancies: 'Обнаружено расхождение по блоку "Frontend System Design" (разница в 3 балла). Дмитрий (Staff Engineer) оценивал знание микрофронтендов и поставил 2, а Елена (Team Lead) высоко оценила опыт работы с SSR-монолитом и поставила 5 балов.',
    recommendation: 'СИНХРОНИЗАЦИЯ',
    rationale: 'Кандидат является сильным инженером (3.8/5), но в команде нет единого мнения о том, отвечает ли её архитектурный бэкграунд текущим вызовам перехода на микрофронтенды. Необходима синхронизация экспертов для выработки общего решения.',
    notableEvidence: [
       '"Совсем не справилась с задачей микрофронтендов... Архитектурное мышление хромает." (Оценка 2)',
       '"Гениально расписала монолитную платформу и SSR. Прекрасный кандидат." (Оценка 5)'
    ],
    nextStepSuggestion: 'Организовать 15-минутный Calibration-звонок между Дмитрием и Еленой для разрешения конфликта до принятия решения об оффере.'
  },
  // Кандидат 3 (Слабый)
  {
    id: 'sum-3',
    candidateId: 'cand-3',
    overallScore: 2.3,
    strengths: ['Базовый опыт продуктовой разработки'],
    risks: ['Слабые знания Core JS (асинхронность)', 'Поверхностное знание React хуков', 'Слабо развиты софт-скиллы'],
    discrepancies: null,
    recommendation: 'ОТКАЗ',
    rationale: 'Кандидат не дотягивает до уровня Senior. Не продемонстрировано глубокого понимания механики работы React и JS Core, что является критичным для данной позиции.',
    notableEvidence: [
       '"Не смог объяснить, почему useCallback не является панацеей от потери производительности." (React Architecture)',
       '"Путается в промисах и асинхронности." (JavaScript Execution)'
    ],
    nextStepSuggestion: 'Направить стандартный вежливый отказ кандидату. Рекомендовать подтянуть теоретическую базу.'
  },
  // Кандидат 4 (Доп этап)
  {
    id: 'sum-4',
    candidateId: 'cand-4',
    overallScore: 3.5,
    strengths: ['Чистый код и уверенный React'],
    risks: ['Сессия System Design сорвана из-за нехватки времени', 'Остается риск непопадания в уровень Senior из-за отсутствия данных по архитектуре'],
    discrepancies: null,
    recommendation: 'ДОП_ИНТЕРВЬЮ',
    rationale: 'Несмотря на хорошие показатели по профильной части (React), критический блок System Design не был покрыт должным образом, что не позволяет выставить финальную оценку уровня Senior.',
    notableEvidence: [
       '"Не успели разобрать System Design из-за того, что закопались в React... практический опыт неясен." (System Design)'
    ],
    nextStepSuggestion: 'Назначить дополнительное 45-минутное интервью строго по System Design.'
  }
];
