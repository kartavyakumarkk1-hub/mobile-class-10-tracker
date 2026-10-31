import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  Upload,
  Target,
  History,
  LayoutDashboard,
  ListChecks,
  Plus,
  Minus,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  FileJson,
  FileSpreadsheet,
  Sparkles,
  Flame,
  Filter,
  Edit3,
  Trash2,
  Copy,
  AlertCircle,
  X
} from 'lucide-react';

// ============================================================================
// TypeScript Interfaces & Types
// ============================================================================

export type SubjectId = 'ENG' | 'SNK' | 'SCI' | 'SST' | 'MATH';

export type ResourceKey =
  | 'ncert'
  | 'pyqs'
  | 'pwCompetent'
  | 'dpp'
  | 'questionBank'
  | 'referenceBook';

export interface ResourceMeta {
  key: ResourceKey;
  label: string;
  shortLabel: string;
}

export const RESOURCES: ResourceMeta[] = [
  { key: 'ncert', label: 'NCERT', shortLabel: 'NCERT' },
  { key: 'pyqs', label: 'PYQs', shortLabel: 'PYQs' },
  { key: 'pwCompetent', label: 'PW Competent', shortLabel: 'PW Comp.' },
  { key: 'dpp', label: 'DPP', shortLabel: 'DPP' },
  { key: 'questionBank', label: 'Question Bank', shortLabel: 'Q. Bank' },
  { key: 'referenceBook', label: 'Reference Book', shortLabel: 'Ref. Book' },
];

export const PYQ_YEARS: string[] = [
  '2026 SQP',
  '2025',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
  '2019',
  '2018',
  '2017',
];

export type ResourceRecord = Record<ResourceKey, boolean>;
export type PyqYearRecord = Record<string, boolean>;

export interface ChapterItem {
  id: string;
  number: number;
  title: string;
  unit: string;
  highWeightage?: boolean;
  resources: ResourceRecord;
  pyqYears: PyqYearRecord;
}

export interface SubjectData {
  id: SubjectId;
  code: string;
  name: string;
  subtitle: string;
  accentHex: string;
  ringColor: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  chapters: ChapterItem[];
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  target: number;
  completed: number;
}

export interface TrackerState {
  version: number;
  examDate: string; // YYYY-MM-DD
  subjects: Record<SubjectId, SubjectData>;
  dailyTarget: number;
  dailyHistory: Record<string, DailyRecord>;
}

// ============================================================================
// Helper Functions & Initial Seed Data
// ============================================================================

const STORAGE_KEY = 'cbse_class10_board_tracker_v1';

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOffsetDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultExamDate(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  // CBSE Class 10 Boards typically begin around Feb 15
  const febThisYear = new Date(`${currentYear}-02-15T00:00:00`);
  if (now < febThisYear) {
    return `${currentYear}-02-15`;
  }
  return `${currentYear + 1}-02-15`;
}

function createChapter(
  id: string,
  number: number,
  title: string,
  unit: string,
  highWeightage = false,
  presetDoneResources: ResourceKey[] = [],
  presetDoneYears: string[] = []
): ChapterItem {
  const resources: ResourceRecord = {
    ncert: presetDoneResources.includes('ncert'),
    pyqs: presetDoneResources.includes('pyqs'),
    pwCompetent: presetDoneResources.includes('pwCompetent'),
    dpp: presetDoneResources.includes('dpp'),
    questionBank: presetDoneResources.includes('questionBank'),
    referenceBook: presetDoneResources.includes('referenceBook'),
  };

  const pyqYears: PyqYearRecord = {};
  PYQ_YEARS.forEach((yr) => {
    pyqYears[yr] = presetDoneYears.includes(yr);
  });

  return {
    id,
    number,
    title,
    unit,
    highWeightage,
    resources,
    pyqYears,
  };
}

function buildInitialState(): TrackerState {
  const today = getTodayDateString();
  const dayMinus1 = getOffsetDateString(-1);
  const dayMinus2 = getOffsetDateString(-2);
  const dayMinus3 = getOffsetDateString(-3);
  const dayMinus4 = getOffsetDateString(-4);

  const subjects: Record<SubjectId, SubjectData> = {
    ENG: {
      id: 'ENG',
      code: 'ENG',
      name: 'English',
      subtitle: 'First Flight, Footprints & Grammar',
      accentHex: '#A855F7',
      ringColor: 'text-purple-500',
      badgeBg: 'bg-purple-500/15 border-purple-500/30',
      badgeText: 'text-purple-300',
      dotColor: 'bg-purple-400',
      chapters: [
        createChapter('eng-1', 1, 'A Letter to God & Dust of Snow / Fire and Ice', 'First Flight (Prose & Poetry)', true, ['ncert', 'pyqs', 'questionBank'], ['2026 SQP', '2025', '2024', '2023']),
        createChapter('eng-2', 2, 'Nelson Mandela: Long Walk to Freedom & A Tiger in the Zoo', 'First Flight (Prose & Poetry)', true, ['ncert', 'pyqs'], ['2025', '2024', '2023']),
        createChapter('eng-3', 3, 'Two Stories about Flying & The Ball Poem', 'First Flight (Prose & Poetry)', false, ['ncert'], ['2024']),
        createChapter('eng-4', 4, 'From the Diary of Anne Frank & Amanda!', 'First Flight (Prose & Poetry)', false, ['ncert'], []),
        createChapter('eng-5', 5, 'Glimpses of India & The Trees', 'First Flight (Prose & Poetry)', true, [], []),
        createChapter('eng-6', 6, 'Mijbil the Otter & Fog', 'First Flight (Prose & Poetry)', false, [], []),
        createChapter('eng-7', 7, 'Madam Rides the Bus & The Tale of Custard the Dragon', 'First Flight (Prose & Poetry)', false, [], []),
        createChapter('eng-8', 8, 'The Sermon at Benares & For Anne Gregory', 'First Flight (Prose & Poetry)', true, [], []),
        createChapter('eng-9', 9, 'The Proposal (Play)', 'First Flight (Drama)', false, [], []),
        createChapter('eng-10', 10, 'A Triumph of Surgery & The Thief’s Story', 'Footprints Without Feet', false, ['ncert'], ['2025']),
        createChapter('eng-11', 11, 'The Midnight Visitor & A Question of Trust', 'Footprints Without Feet', false, [], []),
        createChapter('eng-12', 12, 'Footprints Without Feet & The Making of a Scientist', 'Footprints Without Feet', true, [], []),
        createChapter('eng-13', 13, 'The Necklace & Bholi', 'Footprints Without Feet', true, [], []),
        createChapter('eng-14', 14, 'The Book That Saved the Earth', 'Footprints Without Feet', false, [], []),
        createChapter('eng-15', 15, 'Integrated Grammar (Tenses, Modals, Reported Speech, Determiners)', 'Grammar & Writing Skills', true, ['ncert', 'dpp'], ['2026 SQP', '2025', '2024']),
        createChapter('eng-16', 16, 'Formal Letters, Analytical Paragraph & Unseen Passages', 'Grammar & Writing Skills', true, ['ncert'], ['2026 SQP', '2025']),
      ],
    },
    SNK: {
      id: 'SNK',
      code: 'SNK',
      name: 'Sanskrit',
      subtitle: 'Shemushi Part-II & Vyakaran',
      accentHex: '#EC4899',
      ringColor: 'text-pink-500',
      badgeBg: 'bg-pink-500/15 border-pink-500/30',
      badgeText: 'text-pink-300',
      dotColor: 'bg-pink-400',
      chapters: [
        createChapter('snk-1', 1, 'शुचिपर्यावरणम् (Shuchiparyavaranam)', 'शेमुषी भाग-2 (Padyam)', true, ['ncert', 'pyqs'], ['2026 SQP', '2025', '2024']),
        createChapter('snk-2', 2, 'बुद्धिर्बलवती सदा (Buddhirbalavati Sada)', 'शेमुषी भाग-2 (Gadyam)', false, ['ncert'], ['2025', '2024']),
        createChapter('snk-3', 3, 'शिशुलालनम् (Shishulalanam)', 'शेमुषी भाग-2 (Natyam)', false, ['ncert'], []),
        createChapter('snk-4', 4, 'जननी तुल्यवत्सला (Janani Tulyavatsala)', 'शेमुषी भाग-2 (Gadyam)', true, [], []),
        createChapter('snk-5', 5, 'सुभाषितानि (Subhashitani)', 'शेमुषी भाग-2 (Slokas)', true, ['ncert'], ['2026 SQP', '2025']),
        createChapter('snk-6', 6, 'सौहार्दं प्रकृतेः शोभा (Sauhardam Prakriteh Shobha)', 'शेमुषी भाग-2 (Natyam)', false, [], []),
        createChapter('snk-7', 7, 'विचित्रः साक्षी (Vichitrah Sakshi)', 'शेमुषी भाग-2 (Gadyam)', true, [], []),
        createChapter('snk-8', 8, 'सूक्तयः (Suktayah)', 'शेमुषी भाग-2 (Slokas)', false, [], []),
        createChapter('snk-9', 9, 'भूकम्पविभीषिका (Bhukampavibhishika)', 'शेमुषी भाग-2 (Gadyam)', false, [], []),
        createChapter('snk-10', 10, 'अन्योक्तयः (Anyoktayah)', 'शेमुषी भाग-2 (Padyam)', false, [], []),
        createChapter('snk-11', 11, 'सन्धिः, समासः, प्रत्ययाः च (Sandhi, Samasa & Pratyaya)', 'संस्कृत व्याकरणम् (Grammar)', true, ['ncert', 'dpp'], ['2026 SQP', '2025', '2024']),
        createChapter('snk-12', 12, 'वाच्यपरिवर्तनम्, समयः, अव्ययपदानि, अशुद्धिसंशोधनम्', 'संस्कृत व्याकरणम् (Grammar)', true, [], []),
        createChapter('snk-13', 13, 'पत्रलेखनम्, चित्रवर्णनम्, अनुवादः, अपठित-अवबोधनम्', 'रचनात्मकं कार्यम् (Writing)', true, [], []),
      ],
    },
    SCI: {
      id: 'SCI',
      code: 'Science',
      name: 'Science',
      subtitle: 'Chemistry, Biology & Physics (NCERT)',
      accentHex: '#06B6D4',
      ringColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/15 border-cyan-500/30',
      badgeText: 'text-cyan-300',
      dotColor: 'bg-cyan-400',
      chapters: [
        createChapter('sci-1', 1, 'Chemical Reactions and Equations', 'Chemistry Unit (Ch 1–4)', false, ['ncert', 'pyqs', 'pwCompetent', 'dpp', 'questionBank', 'referenceBook'], PYQ_YEARS),
        createChapter('sci-2', 2, 'Acids, Bases and Salts', 'Chemistry Unit (Ch 1–4)', true, ['ncert', 'pwCompetent', 'dpp'], ['2026 SQP', '2025', '2024', '2023', '2022']),
        createChapter('sci-3', 3, 'Metals and Non-Metals', 'Chemistry Unit (Ch 1–4)', true, ['ncert'], ['2025', '2024']),
        createChapter('sci-4', 4, 'Carbon and Its Compounds', 'Chemistry Unit (Ch 1–4)', true, [], []),
        createChapter('sci-5', 5, 'Life Processes', 'Biology Unit (Ch 5–8, 13)', true, ['ncert', 'pyqs', 'dpp'], ['2026 SQP', '2025', '2024', '2023']),
        createChapter('sci-6', 6, 'Control and Coordination', 'Biology Unit (Ch 5–8, 13)', false, ['ncert'], ['2025']),
        createChapter('sci-7', 7, 'How do Organisms Reproduce?', 'Biology Unit (Ch 5–8, 13)', true, [], []),
        createChapter('sci-8', 8, 'Heredity', 'Biology Unit (Ch 5–8, 13)', true, [], []),
        createChapter('sci-9', 9, 'Light – Reflection and Refraction', 'Physics Unit (Ch 9–12)', true, ['ncert', 'dpp', 'questionBank'], ['2026 SQP', '2025', '2024']),
        createChapter('sci-10', 10, 'The Human Eye and the Colourful World', 'Physics Unit (Ch 9–12)', false, [], []),
        createChapter('sci-11', 11, 'Electricity', 'Physics Unit (Ch 9–12)', true, [], []),
        createChapter('sci-12', 12, 'Magnetic Effects of Electric Current', 'Physics Unit (Ch 9–12)', true, [], []),
        createChapter('sci-13', 13, 'Our Environment', 'Biology Unit (Ch 5–8, 13)', false, [], []),
      ],
    },
    SST: {
      id: 'SST',
      code: 'SST',
      name: 'Social Science',
      subtitle: 'History, Geography, Civics & Economics',
      accentHex: '#EAB308',
      ringColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/15 border-amber-500/30',
      badgeText: 'text-amber-300',
      dotColor: 'bg-amber-400',
      chapters: [
        createChapter('sst-1', 1, 'The Rise of Nationalism in Europe', 'History (India & World II)', true, ['ncert', 'pyqs', 'questionBank'], ['2026 SQP', '2025', '2024', '2023']),
        createChapter('sst-2', 2, 'Nationalism in India', 'History (India & World II)', true, ['ncert', 'pyqs'], ['2026 SQP', '2025', '2024']),
        createChapter('sst-3', 3, 'The Making of a Global World', 'History (India & World II)', false, ['ncert'], []),
        createChapter('sst-4', 4, 'The Age of Industrialisation', 'History (India & World II)', false, [], []),
        createChapter('sst-5', 5, 'Print Culture and the Modern World', 'History (India & World II)', true, [], []),
        createChapter('sst-6', 6, 'Resources and Development', 'Geography (Contemporary India II)', false, ['ncert', 'dpp'], ['2025', '2024']),
        createChapter('sst-7', 7, 'Forest and Wildlife Resources', 'Geography (Contemporary India II)', false, [], []),
        createChapter('sst-8', 8, 'Water Resources', 'Geography (Contemporary India II)', false, [], []),
        createChapter('sst-9', 9, 'Agriculture', 'Geography (Contemporary India II)', true, [], []),
        createChapter('sst-10', 10, 'Minerals and Energy Resources', 'Geography (Contemporary India II)', true, [], []),
        createChapter('sst-11', 11, 'Manufacturing Industries', 'Geography (Contemporary India II)', true, [], []),
        createChapter('sst-12', 12, 'Lifelines of National Economy (Map Work)', 'Geography (Contemporary India II)', false, [], []),
        createChapter('sst-13', 13, 'Power Sharing', 'Political Science (Democratic Politics II)', true, ['ncert', 'pyqs'], ['2026 SQP', '2025', '2024']),
        createChapter('sst-14', 14, 'Federalism', 'Political Science (Democratic Politics II)', true, ['ncert'], ['2025']),
        createChapter('sst-15', 15, 'Gender, Religion and Caste', 'Political Science (Democratic Politics II)', false, [], []),
        createChapter('sst-16', 16, 'Political Parties', 'Political Science (Democratic Politics II)', true, [], []),
        createChapter('sst-17', 17, 'Outcomes of Democracy', 'Political Science (Democratic Politics II)', false, [], []),
        createChapter('sst-18', 18, 'Development', 'Economics (Understanding Economic Dev.)', false, ['ncert', 'pyqs'], ['2025', '2024']),
        createChapter('sst-19', 19, 'Sectors of the Indian Economy', 'Economics (Understanding Economic Dev.)', true, ['ncert'], []),
        createChapter('sst-20', 20, 'Money and Credit', 'Economics (Understanding Economic Dev.)', true, [], []),
        createChapter('sst-21', 21, 'Globalisation and the Indian Economy', 'Economics (Understanding Economic Dev.)', false, [], []),
      ],
    },
    MATH: {
      id: 'MATH',
      code: 'Mathematics',
      name: 'Mathematics',
      subtitle: 'NCERT Core, Exemplar & Board PYQs',
      accentHex: '#F43F5E',
      ringColor: 'text-rose-500',
      badgeBg: 'bg-rose-500/15 border-rose-500/30',
      badgeText: 'text-rose-300',
      dotColor: 'bg-rose-400',
      chapters: [
        createChapter('math-1', 1, 'Real Numbers', 'Unit I: Number Systems', false, ['ncert', 'pyqs', 'pwCompetent', 'dpp', 'questionBank', 'referenceBook'], PYQ_YEARS),
        createChapter('math-2', 2, 'Polynomials', 'Unit II: Algebra', false, ['ncert', 'pyqs', 'dpp', 'referenceBook'], ['2026 SQP', '2025', '2024', '2023', '2022']),
        createChapter('math-3', 3, 'Pair of Linear Equations in Two Variables', 'Unit II: Algebra', true, ['ncert', 'dpp', 'referenceBook'], ['2026 SQP', '2025', '2024']),
        createChapter('math-4', 4, 'Quadratic Equations', 'Unit II: Algebra', true, ['ncert', 'dpp'], ['2025', '2024']),
        createChapter('math-5', 5, 'Arithmetic Progressions', 'Unit II: Algebra', true, ['ncert'], ['2025']),
        createChapter('math-6', 6, 'Triangles', 'Unit IV: Geometry', true, ['ncert'], ['2026 SQP', '2025']),
        createChapter('math-7', 7, 'Coordinate Geometry', 'Unit III: Coordinate Geometry', false, ['ncert', 'dpp'], ['2025', '2024']),
        createChapter('math-8', 8, 'Introduction to Trigonometry', 'Unit V: Trigonometry', true, ['ncert', 'pwCompetent', 'dpp'], ['2026 SQP', '2025', '2024']),
        createChapter('math-9', 9, 'Some Applications of Trigonometry', 'Unit V: Trigonometry', true, [], []),
        createChapter('math-10', 10, 'Circles', 'Unit IV: Geometry', true, [], []),
        createChapter('math-11', 11, 'Areas Related to Circles', 'Unit VI: Mensuration', false, [], []),
        createChapter('math-12', 12, 'Surface Areas and Volumes', 'Unit VI: Mensuration', true, [], []),
        createChapter('math-13', 13, 'Statistics', 'Unit VII: Statistics & Probability', true, ['ncert'], ['2025']),
        createChapter('math-14', 14, 'Probability', 'Unit VII: Statistics & Probability', false, ['ncert'], ['2025']),
      ],
    },
  };

  const dailyHistory: Record<string, DailyRecord> = {
    [dayMinus4]: { date: dayMinus4, target: 50, completed: 42 },
    [dayMinus3]: { date: dayMinus3, target: 50, completed: 50 },
    [dayMinus2]: { date: dayMinus2, target: 50, completed: 38 },
    [dayMinus1]: { date: dayMinus1, target: 60, completed: 64 },
    [today]: { date: today, target: 60, completed: 36 },
  };

  return {
    version: 1,
    examDate: getDefaultExamDate(),
    subjects,
    dailyTarget: 60,
    dailyHistory,
  };
}

// ============================================================================
// Progress Calculation Utilities
// ============================================================================

function getChapterStats(chapter: ChapterItem) {
  const resourceValues = RESOURCES.map((r) => chapter.resources[r.key]);
  const completedResources = resourceValues.filter(Boolean).length;
  const totalResources = RESOURCES.length;

  const yearValues = PYQ_YEARS.map((y) => Boolean(chapter.pyqYears[y]));
  const completedYears = yearValues.filter(Boolean).length;
  const totalYears = PYQ_YEARS.length;

  const resourcePct = Math.round((completedResources / totalResources) * 100);
  const pyqYearPct = Math.round((completedYears / totalYears) * 100);

  const isFullyCompleted = completedResources === totalResources;
  const isStarted = completedResources > 0 || completedYears > 0;

  return {
    completedResources,
    totalResources,
    completedYears,
    totalYears,
    resourcePct,
    pyqYearPct,
    isFullyCompleted,
    isStarted,
  };
}

function getSubjectStats(subject: SubjectData) {
  let completedRes = 0;
  let totalRes = 0;
  let completedYrs = 0;
  let totalYrs = 0;
  let completedChapters = 0;
  let inProgressChapters = 0;

  subject.chapters.forEach((ch) => {
    const st = getChapterStats(ch);
    completedRes += st.completedResources;
    totalRes += st.totalResources;
    completedYrs += st.completedYears;
    totalYrs += st.totalYears;
    if (st.isFullyCompleted) {
      completedChapters += 1;
    } else if (st.isStarted) {
      inProgressChapters += 1;
    }
  });

  const resourcePct = totalRes > 0 ? Math.round((completedRes / totalRes) * 100) : 0;
  const pyqPct = totalYrs > 0 ? Math.round((completedYrs / totalYrs) * 100) : 0;

  return {
    completedRes,
    totalRes,
    completedYrs,
    totalYrs,
    completedChapters,
    inProgressChapters,
    totalChapters: subject.chapters.length,
    resourcePct,
    pyqPct,
  };
}

// ============================================================================
// Circular Progress SVG Component
// ============================================================================

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  accentHex: string;
  label?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 86,
  strokeWidth = 7,
  accentHex,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={accentHex}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold tracking-tight text-white">
          {clamped}
          <span className="text-xs font-normal text-slate-400">%</span>
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// Main Application Component
// ============================================================================

export default function App() {
  // Load initial state from localStorage safely
  const [state, setState] = useState<TrackerState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TrackerState;
        if (parsed && parsed.subjects && parsed.dailyHistory) {
          const today = getTodayDateString();
          if (!parsed.dailyHistory[today]) {
            parsed.dailyHistory[today] = {
              date: today,
              target: parsed.dailyTarget || 60,
              completed: 0,
            };
          }
          return parsed;
        }
      }
    } catch {
      // Fallback to default state if localStorage is blocked or corrupted
    }
    return buildInitialState();
  });

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subjects' | 'daily' | 'backup'>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('SCI');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in-progress' | 'pending'>('all');
  const [selectedPyqYearFilter, setSelectedPyqYearFilter] = useState<string>('ALL');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [showAllPyqYears, setShowAllPyqYears] = useState<boolean>(true);
  const [historySortOrder, setHistorySortOrder] = useState<'chronological' | 'reverse'>('chronological');

  // Modals / Inputs state
  const [editingExamDate, setEditingExamDate] = useState<boolean>(false);
  const [tempExamDate, setTempExamDate] = useState<string>(state.examDate);
  const [customQuestionInput, setCustomQuestionInput] = useState<string>('');
  const [targetInput, setTargetInput] = useState<string>(String(state.dailyTarget));

  // Add/Edit historical date record
  const [logDateInput, setLogDateInput] = useState<string>(getTodayDateString());
  const [logTargetInput, setLogTargetInput] = useState<string>(String(state.dailyTarget));
  const [logCompletedInput, setLogCompletedInput] = useState<string>('0');

  // Add new chapter modal state
  const [showAddChapterModal, setShowAddChapterModal] = useState<boolean>(false);
  const [newChapterTitle, setNewChapterTitle] = useState<string>('');
  const [newChapterUnit, setNewChapterUnit] = useState<string>('');
  const [newChapterHighWeightage, setNewChapterHighWeightage] = useState<boolean>(false);

  // Import/Export state
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Persist to localStorage whenever state updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota / iframe restrictions
    }
  }, [state]);

  // Ensure today's record always exists
  const todayStr = getTodayDateString();
  const todayRecord: DailyRecord = state.dailyHistory[todayStr] || {
    date: todayStr,
    target: state.dailyTarget,
    completed: 0,
  };

  // Calculate days remaining until CBSE Class 10 Board Exam
  const daysRemaining = useMemo(() => {
    const todayDate = new Date(`${todayStr}T00:00:00`);
    const targetDate = new Date(`${state.examDate}T00:00:00`);
    if (isNaN(targetDate.getTime())) return 0;
    const diffMs = targetDate.getTime() - todayDate.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [state.examDate, todayStr]);

  // Calculate overall statistics across all 5 subjects
  const subjectOrder: SubjectId[] = ['ENG', 'SNK', 'SCI', 'SST', 'MATH'];

  const overallStats = useMemo(() => {
    let completedResources = 0;
    let totalResources = 0;
    let completedPyqYears = 0;
    let totalPyqYears = 0;
    let completedChapters = 0;
    let totalChapters = 0;

    const perResourceCompleted: Record<ResourceKey, number> = {
      ncert: 0,
      pyqs: 0,
      pwCompetent: 0,
      dpp: 0,
      questionBank: 0,
      referenceBook: 0,
    };

    subjectOrder.forEach((subId) => {
      const sub = state.subjects[subId];
      const st = getSubjectStats(sub);
      completedResources += st.completedRes;
      totalResources += st.totalRes;
      completedPyqYears += st.completedYrs;
      totalPyqYears += st.totalYrs;
      completedChapters += st.completedChapters;
      totalChapters += st.totalChapters;

      sub.chapters.forEach((ch) => {
        RESOURCES.forEach((r) => {
          if (ch.resources[r.key]) {
            perResourceCompleted[r.key] += 1;
          }
        });
      });
    });

    const overallResourcePct =
      totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0;
    const overallPyqPct =
      totalPyqYears > 0 ? Math.round((completedPyqYears / totalPyqYears) * 100) : 0;

    return {
      completedResources,
      totalResources,
      completedPyqYears,
      totalPyqYears,
      completedChapters,
      totalChapters,
      overallResourcePct,
      overallPyqPct,
      perResourceCompleted,
    };
  }, [state.subjects]);

  // Calculate streak of consecutive days with completed > 0
  const activeStreak = useMemo(() => {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const dStr = getOffsetDateString(-i);
      const rec = state.dailyHistory[dStr];
      if (rec && rec.completed > 0) {
        streak++;
      } else if (i === 0) {
        // If today is 0 so far, still check yesterday
        continue;
      } else {
        break;
      }
    }
    return streak;
  }, [state.dailyHistory]);

  // ============================================================================
  // Handlers for Mutating State
  // ============================================================================

  const toggleChapterResource = (
    subjectId: SubjectId,
    chapterId: string,
    resourceKey: ResourceKey
  ) => {
    setState((prev) => {
      const subject = prev.subjects[subjectId];
      const updatedChapters = subject.chapters.map((ch) => {
        if (ch.id !== chapterId) return ch;
        const nextVal = !ch.resources[resourceKey];
        const nextResources = { ...ch.resources, [resourceKey]: nextVal };
        return {
          ...ch,
          resources: nextResources,
        };
      });

      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subjectId]: {
            ...subject,
            chapters: updatedChapters,
          },
        },
      };
    });
  };

  const toggleChapterPyqYear = (
    subjectId: SubjectId,
    chapterId: string,
    year: string
  ) => {
    setState((prev) => {
      const subject = prev.subjects[subjectId];
      const updatedChapters = subject.chapters.map((ch) => {
        if (ch.id !== chapterId) return ch;
        const nextYearVal = !ch.pyqYears[year];
        const nextPyqYears = { ...ch.pyqYears, [year]: nextYearVal };
        const allYearsDone = PYQ_YEARS.every((y) => Boolean(nextPyqYears[y]));
        return {
          ...ch,
          pyqYears: nextPyqYears,
          resources: {
            ...ch.resources,
            pyqs: allYearsDone ? true : ch.resources.pyqs,
          },
        };
      });

      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subjectId]: {
            ...subject,
            chapters: updatedChapters,
          },
        },
      };
    });
  };

  const toggleAllChapterResources = (subjectId: SubjectId, chapterId: string, markComplete: boolean) => {
    setState((prev) => {
      const subject = prev.subjects[subjectId];
      const updatedChapters = subject.chapters.map((ch) => {
        if (ch.id !== chapterId) return ch;
        const nextResources: ResourceRecord = {
          ncert: markComplete,
          pyqs: markComplete,
          pwCompetent: markComplete,
          dpp: markComplete,
          questionBank: markComplete,
          referenceBook: markComplete,
        };
        const nextPyqYears: PyqYearRecord = {};
        PYQ_YEARS.forEach((yr) => {
          nextPyqYears[yr] = markComplete;
        });
        return {
          ...ch,
          resources: nextResources,
          pyqYears: nextPyqYears,
        };
      });

      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subjectId]: {
            ...subject,
            chapters: updatedChapters,
          },
        },
      };
    });
  };

  const toggleAllPyqYearsForChapter = (subjectId: SubjectId, chapterId: string, markComplete: boolean) => {
    setState((prev) => {
      const subject = prev.subjects[subjectId];
      const updatedChapters = subject.chapters.map((ch) => {
        if (ch.id !== chapterId) return ch;
        const nextPyqYears: PyqYearRecord = {};
        PYQ_YEARS.forEach((yr) => {
          nextPyqYears[yr] = markComplete;
        });
        return {
          ...ch,
          pyqYears: nextPyqYears,
          resources: {
            ...ch.resources,
            pyqs: markComplete,
          },
        };
      });

      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subjectId]: {
            ...subject,
            chapters: updatedChapters,
          },
        },
      };
    });
  };

  const updateTodayCompleted = (newCompleted: number) => {
    const clamped = Math.max(0, Math.round(newCompleted));
    setState((prev) => {
      const existing = prev.dailyHistory[todayStr] || {
        date: todayStr,
        target: prev.dailyTarget,
        completed: 0,
      };
      return {
        ...prev,
        dailyHistory: {
          ...prev.dailyHistory,
          [todayStr]: {
            ...existing,
            completed: clamped,
          },
        },
      };
    });
  };

  const updateDailyTargetValue = (newTarget: number) => {
    const validTarget = Math.max(1, Math.round(newTarget));
    setTargetInput(String(validTarget));
    setState((prev) => {
      const existing = prev.dailyHistory[todayStr] || {
        date: todayStr,
        target: validTarget,
        completed: 0,
      };
      return {
        ...prev,
        dailyTarget: validTarget,
        dailyHistory: {
          ...prev.dailyHistory,
          [todayStr]: {
            ...existing,
            target: validTarget,
          },
        },
      };
    });
    triggerToast(`Daily target updated to ${validTarget} questions.`);
  };

  const handleSaveHistoricalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDateInput) return;
    const tVal = Math.max(1, parseInt(logTargetInput, 10) || state.dailyTarget);
    const cVal = Math.max(0, parseInt(logCompletedInput, 10) || 0);

    setState((prev) => ({
      ...prev,
      dailyTarget: logDateInput === todayStr ? tVal : prev.dailyTarget,
      dailyHistory: {
        ...prev.dailyHistory,
        [logDateInput]: {
          date: logDateInput,
          target: tVal,
          completed: cVal,
        },
      },
    }));
    triggerToast(`Saved progress record for ${logDateInput}.`);
  };

  const deleteHistoryEntry = (dateKey: string) => {
    setState((prev) => {
      const nextHistory = { ...prev.dailyHistory };
      delete nextHistory[dateKey];
      return {
        ...prev,
        dailyHistory: nextHistory,
      };
    });
    triggerToast(`Removed history entry for ${dateKey}.`);
  };

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = newChapterTitle.trim();
    if (!trimmedTitle) return;
    const unitName = newChapterUnit.trim() || 'Additional Syllabus Unit';

    setState((prev) => {
      const sub = prev.subjects[selectedSubject];
      const nextNum = sub.chapters.length + 1;
      const newCh = createChapter(
        `${selectedSubject.toLowerCase()}-custom-${Date.now()}`,
        nextNum,
        trimmedTitle,
        unitName,
        newChapterHighWeightage
      );
      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [selectedSubject]: {
            ...sub,
            chapters: [...sub.chapters, newCh],
          },
        },
      };
    });

    setNewChapterTitle('');
    setNewChapterUnit('');
    setNewChapterHighWeightage(false);
    setShowAddChapterModal(false);
    triggerToast(`Added "${trimmedTitle}" to ${state.subjects[selectedSubject].name}.`);
  };

  // ============================================================================
  // Backup, Export (JSON & CSV), and Restore Handlers
  // ============================================================================

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(state, null, 2);
    downloadFile(
      jsonString,
      `cbse-class10-tracker-backup-${todayStr}.json`,
      'application/json'
    );
    triggerToast('Downloaded full tracker backup (.json).');
  };

  const handleExportCSV = () => {
    const rows: string[][] = [];
    // Section 1: Chapters, Resources & PYQ Years
    rows.push([
      'RECORD_TYPE',
      'SUBJECT_CODE',
      'SUBJECT_NAME',
      'CHAPTER_NO',
      'CHAPTER_TITLE',
      'UNIT',
      'NCERT',
      'PYQs',
      'PW_COMPETENT',
      'DPP',
      'QUESTION_BANK',
      'REFERENCE_BOOK',
      ...PYQ_YEARS.map((y) => `PYQ_${y.replace(/\s+/g, '_')}`),
      'DATE',
      'DAILY_TARGET',
      'QUESTIONS_COMPLETED',
      'COMPLETION_PCT',
    ]);

    subjectOrder.forEach((subId) => {
      const sub = state.subjects[subId];
      sub.chapters.forEach((ch) => {
        const st = getChapterStats(ch);
        rows.push([
          'CHAPTER',
          sub.code,
          `"${sub.name.replace(/"/g, '""')}"`,
          String(ch.number),
          `"${ch.title.replace(/"/g, '""')}"`,
          `"${ch.unit.replace(/"/g, '""')}"`,
          ch.resources.ncert ? '1' : '0',
          ch.resources.pyqs ? '1' : '0',
          ch.resources.pwCompetent ? '1' : '0',
          ch.resources.dpp ? '1' : '0',
          ch.resources.questionBank ? '1' : '0',
          ch.resources.referenceBook ? '1' : '0',
          ...PYQ_YEARS.map((y) => (ch.pyqYears[y] ? '1' : '0')),
          '',
          '',
          '',
          `${st.resourcePct}%`,
        ]);
      });
    });

    // Section 2: Daily History
    const sortedDates = Object.keys(state.dailyHistory).sort();
    sortedDates.forEach((dateKey) => {
      const rec = state.dailyHistory[dateKey];
      const pct = rec.target > 0 ? Math.round((rec.completed / rec.target) * 100) : 0;
      rows.push([
        'DAILY_HISTORY',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ...PYQ_YEARS.map(() => ''),
        rec.date,
        String(rec.target),
        String(rec.completed),
        `${pct}%`,
      ]);
    });

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    downloadFile(
      csvContent,
      `cbse-class10-tracker-export-${todayStr}.csv`,
      'text/csv;charset=utf-8;'
    );
    triggerToast('Downloaded tracker & daily history (.csv).');
  };

  const applyImportedData = (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) {
      triggerToast('Please provide valid JSON or CSV backup data.', 'error');
      return;
    }

    // Check if JSON
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as TrackerState;
        if (!parsed.subjects || !parsed.dailyHistory) {
          throw new Error('Missing subjects or dailyHistory fields in JSON.');
        }
        setState(parsed);
        setTargetInput(String(parsed.dailyTarget || 60));
        setTempExamDate(parsed.examDate || getDefaultExamDate());
        setImportJsonText('');
        triggerToast('Successfully restored all tracker progress from JSON!');
        return;
      } catch {
        triggerToast('Invalid JSON backup file. Please check the file format.', 'error');
        return;
      }
    }

    // Check if CSV exported by this tracker
    if (trimmed.startsWith('RECORD_TYPE,')) {
      try {
        const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
        const nextState = buildInitialState();
        const nextHistory: Record<string, DailyRecord> = {};

        for (let i = 1; i < lines.length; i++) {
          // Simple CSV line parser respecting quotes
          const cols: string[] = [];
          let cur = '';
          let inQuotes = false;
          for (let c = 0; c < lines[i].length; c++) {
            const ch = lines[i][c];
            if (ch === '"') {
              inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
              cols.push(cur);
              cur = '';
            } else {
              cur += ch;
            }
          }
          cols.push(cur);

          const recType = cols[0];
          if (recType === 'CHAPTER') {
            const subCode = cols[1];
            const chNum = parseInt(cols[3], 10);
            const matchedSubId = subjectOrder.find(
              (id) => nextState.subjects[id].code === subCode || id === subCode
            );
            if (matchedSubId) {
              const sub = nextState.subjects[matchedSubId];
              const chIdx = sub.chapters.findIndex((c) => c.number === chNum);
              if (chIdx !== -1) {
                sub.chapters[chIdx].resources = {
                  ncert: cols[6] === '1',
                  pyqs: cols[7] === '1',
                  pwCompetent: cols[8] === '1',
                  dpp: cols[9] === '1',
                  questionBank: cols[10] === '1',
                  referenceBook: cols[11] === '1',
                };
                PYQ_YEARS.forEach((y, yIdx) => {
                  sub.chapters[chIdx].pyqYears[y] = cols[12 + yIdx] === '1';
                });
              }
            }
          } else if (recType === 'DAILY_HISTORY') {
            const dateColIdx = 12 + PYQ_YEARS.length;
            const dateVal = cols[dateColIdx];
            const targetVal = parseInt(cols[dateColIdx + 1], 10) || 60;
            const compVal = parseInt(cols[dateColIdx + 2], 10) || 0;
            if (dateVal) {
              nextHistory[dateVal] = {
                date: dateVal,
                target: targetVal,
                completed: compVal,
              };
            }
          }
        }

        if (Object.keys(nextHistory).length > 0) {
          nextState.dailyHistory = nextHistory;
        }
        setState(nextState);
        setImportJsonText('');
        triggerToast('Successfully restored tracker progress from CSV!');
        return;
      } catch {
        triggerToast('Could not parse CSV backup file.', 'error');
        return;
      }
    }

    triggerToast('Unrecognized file format. Please upload a valid JSON or CSV backup.', 'error');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        applyImportedData(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopyBackupToClipboard = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(jsonStr);
        triggerToast('Copied JSON backup to clipboard!');
        return;
      }
    } catch {
      // Fallback below
    }
    const textArea = document.createElement('textarea');
    textArea.value = jsonStr;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    triggerToast('Copied JSON backup to clipboard!');
  };

  // ============================================================================
  // Filtered Chapters & Grouped Units for Active Subject
  // ============================================================================

  const activeSubjectData = state.subjects[selectedSubject];
  const activeSubjectStats = useMemo(
    () => getSubjectStats(activeSubjectData),
    [activeSubjectData]
  );

  const filteredChapters = useMemo(() => {
    return activeSubjectData.chapters.filter((ch) => {
      const matchesSearch =
        !searchQuery.trim() ||
        ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(ch.number).includes(searchQuery.trim());

      if (!matchesSearch) return false;

      const st = getChapterStats(ch);
      if (statusFilter === 'completed') return st.isFullyCompleted;
      if (statusFilter === 'in-progress') return st.isStarted && !st.isFullyCompleted;
      if (statusFilter === 'pending') return !st.isStarted;
      return true;
    });
  }, [activeSubjectData, searchQuery, statusFilter]);

  const groupedUnits = useMemo(() => {
    const groups: { unit: string; chapters: ChapterItem[] }[] = [];
    filteredChapters.forEach((ch) => {
      const existing = groups.find((g) => g.unit === ch.unit);
      if (existing) {
        existing.chapters.push(ch);
      } else {
        groups.push({ unit: ch.unit, chapters: [ch] });
      }
    });
    return groups;
  }, [filteredChapters]);

  // Daily Target Metrics
  const todayTarget = todayRecord.target || state.dailyTarget;
  const todayCompleted = todayRecord.completed || 0;
  const todayRemaining = Math.max(0, todayTarget - todayCompleted);
  const todayCompletionPct =
    todayTarget > 0 ? Math.round((todayCompleted / todayTarget) * 100) : 0;

  // Sorted Daily History Records
  const sortedHistoryRecords = useMemo(() => {
    const list = Object.values(state.dailyHistory);
    list.sort((a, b) =>
      historySortOrder === 'chronological'
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date)
    );
    return list;
  }, [state.dailyHistory, historySortOrder]);

  return (
    <div className="min-h-screen bg-[#080B0E] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 pb-24 md:pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl border border-slate-700/80 bg-[#121820]/95 px-4 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-md">
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-1 text-slate-400 hover:text-white"
            aria-label="Close notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#080B0E]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Class 10 CBSE
            </span>
            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              Board Prep Tracker
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Days Remaining Pill */}
            <button
              type="button"
              onClick={() => {
                setTempExamDate(state.examDate);
                setEditingExamDate(!editingExamDate);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-[#10161D] px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:border-emerald-500/50 transition"
              title="Click to configure CBSE Board Exam start date"
            >
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>{daysRemaining}d left</span>
              <Edit3 className="h-3 w-3 text-slate-400 ml-0.5" />
            </button>

            {/* Quick Backup Button */}
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeTab === 'backup'
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-white/10 bg-[#10161D] text-slate-300 hover:border-white/20 hover:text-white'
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Backup / Export</span>
            </button>
          </div>
        </div>

        {/* Editable Exam Date Bar */}
        {editingExamDate && (
          <div className="border-t border-white/[0.06] bg-[#0D131A] px-4 py-2.5">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span>Target CBSE Class 10 Board Exam Date:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={tempExamDate}
                  onChange={(e) => setTempExamDate(e.target.value)}
                  className="rounded-lg border border-white/15 bg-[#080B0E] px-2.5 py-1 text-xs text-white focus:border-emerald-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (tempExamDate) {
                      setState((prev) => ({ ...prev, examDate: tempExamDate }));
                      setEditingExamDate(false);
                      triggerToast(`Updated Board Exam date to ${tempExamDate}.`);
                    }
                  }}
                  className="rounded-lg bg-emerald-500 px-3 py-1 font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Save Date
                </button>
                <button
                  type="button"
                  onClick={() => setEditingExamDate(false)}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop & Tablet Primary Navigation Tabs */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar" aria-label="Main Navigation">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Overview Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('subjects')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'subjects'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent'
              }`}
            >
              <ListChecks className="h-4 w-4" />
              <span>Subject & PYQ Tracker</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('daily')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'daily'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent'
              }`}
            >
              <Target className="h-4 w-4" />
              <span>Daily Target & History</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'backup'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent'
              }`}
            >
              <Download className="h-4 w-4" />
              <span>Data Backup & Export</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        {/* ===================================================================
            TAB 1: OVERVIEW DASHBOARD
        =================================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Status Strip: Streak, Days Remaining, Overall Syllabus Completion */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/[0.07] bg-[#10161D] p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Days Remaining</span>
                  <Clock className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {daysRemaining}
                  </span>
                  <span className="text-xs font-medium text-emerald-400">days</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Exam Date: {state.examDate}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#10161D] p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Overall Progress</span>
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {overallStats.overallResourcePct}%
                  </span>
                  <span className="text-xs text-slate-400">
                    ({overallStats.completedResources}/{overallStats.totalResources})
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {overallStats.completedChapters}/{overallStats.totalChapters} chapters fully done
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#10161D] p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Daily Q. Target</span>
                  <Target className="h-4 w-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {todayCompleted}
                    <span className="text-lg font-normal text-slate-400">/{todayTarget}</span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {todayCompletionPct}%
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {todayRemaining} questions remaining today
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#10161D] p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>PYQ Year Coverage</span>
                  <Flame className="h-4 w-4 text-orange-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {overallStats.overallPyqPct}%
                  </span>
                  <span className="text-xs text-slate-400">
                    ({overallStats.completedPyqYears}/{overallStats.totalPyqYears})
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {activeStreak} day active question streak
                </p>
              </div>
            </div>

            {/* Hero Card: Daily Question Target + Quick Update & Overall Study Resource Breakdown */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Daily Question Target Card */}
              <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-[#111922] to-[#0D131A] p-5 lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
                        Active Velocity
                      </span>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                        {todayStr}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('daily')}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      View Full History →
                    </button>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white sm:text-2xl">
                        Daily Question Target
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {todayCompleted} completed of {todayTarget} daily target •{' '}
                        <span className="text-slate-200 font-medium">
                          {todayRemaining} remaining
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-extrabold text-emerald-400 sm:text-4xl">
                        {todayCompletionPct}
                        <span className="text-lg font-semibold">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-300"
                      style={{ width: `${Math.min(100, todayCompletionPct)}%` }}
                    />
                  </div>
                </div>

                {/* Quick Controls to Update Completed Questions */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs font-medium text-slate-400">
                      Quick Log:
                    </span>
                    <button
                      type="button"
                      onClick={() => updateTodayCompleted(todayCompleted - 5)}
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.09] hover:text-white"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTodayCompleted(todayCompleted - 1)}
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.09] hover:text-white"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTodayCompleted(todayCompleted + 1)}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTodayCompleted(todayCompleted + 5)}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTodayCompleted(todayCompleted + 10)}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
                    >
                      +10
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label htmlFor="dashboard-completed-input" className="text-xs text-slate-400">
                      Set Done:
                    </label>
                    <input
                      id="dashboard-completed-input"
                      type="number"
                      min={0}
                      value={todayCompleted}
                      onChange={(e) => updateTodayCompleted(Number(e.target.value))}
                      className="w-20 rounded-lg border border-white/15 bg-[#080B0E] px-2.5 py-1 text-xs font-semibold text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Overall Resource Completion Breakdown Card */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#10161D] p-5 lg:col-span-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
                      Resource Matrix
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {overallStats.totalChapters} Total Chapters
                    </span>
                  </div>
                  <h2 className="mt-1 text-lg font-bold text-white">
                    Tracked Study Resources
                  </h2>

                  <div className="mt-4 space-y-2.5">
                    {RESOURCES.map((res) => {
                      const count = overallStats.perResourceCompleted[res.key];
                      const pct =
                        overallStats.totalChapters > 0
                          ? Math.round((count / overallStats.totalChapters) * 100)
                          : 0;
                      return (
                        <div key={res.key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-300">{res.label}</span>
                            <span className="text-slate-400">
                              <strong className="text-white">{count}</strong>/{overallStats.totalChapters} ch ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum Matrix: 5 Subjects Grid (Inspired by Reference Mockup 1) */}
            <div>
              <div className="mb-3.5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white">
                    Curriculum Matrix
                  </h2>
                  <p className="text-xs text-slate-400">
                    Click any subject card to open its chapter-wise resource & PYQ year tracker
                  </p>
                </div>
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  5 Subjects Total
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                {subjectOrder.map((subId) => {
                  const sub = state.subjects[subId];
                  const st = getSubjectStats(sub);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubject(sub.id);
                        setActiveTab('subjects');
                      }}
                      className="group flex flex-col items-center justify-between rounded-2xl border border-white/[0.07] bg-[#10161D] p-5 text-center transition hover:border-white/20 hover:bg-[#141C25]"
                    >
                      <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${sub.badgeBg} ${sub.badgeText}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sub.dotColor}`} />
                          {sub.id}
                        </span>
                        <span>PYQs: {st.pyqPct}%</span>
                      </div>

                      <div className="my-2">
                        <CircularProgress
                          percentage={st.resourcePct}
                          accentHex={sub.accentHex}
                          size={92}
                          strokeWidth={7}
                        />
                      </div>

                      <div className="mt-2 w-full">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${sub.dotColor}`} />
                          <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                            {sub.name}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {st.completedChapters} / {st.totalChapters} Ch Fully Complete
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {st.completedRes}/{st.totalRes} resources • {st.completedYrs}/{st.totalYrs} PYQ yrs
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: SUBJECT & CHAPTER-WISE TRACKER + YEAR-WISE PYQ TRACKER
        =================================================================== */}
        {activeTab === 'subjects' && (
          <div className="space-y-5">
            {/* Subject Selector Bar */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#10161D] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  Target Domain (Select Subject)
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddChapterModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Custom Chapter</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {subjectOrder.map((subId) => {
                  const sub = state.subjects[subId];
                  const st = getSubjectStats(sub);
                  const isSelected = selectedSubject === subId;
                  return (
                    <button
                      key={subId}
                      type="button"
                      onClick={() => setSelectedSubject(subId)}
                      className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition ${
                        isSelected
                          ? 'border-emerald-500/50 bg-[#16202B] text-white shadow-sm'
                          : 'border-white/[0.06] bg-[#0B0F14] text-slate-400 hover:border-white/15 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${sub.dotColor}`} />
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">
                            {sub.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {sub.id} • {st.totalChapters} Ch
                          </div>
                        </div>
                      </div>
                      <span className="ml-2 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-bold text-slate-200">
                        {st.resourcePct}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Subject Coverage Summary Card + Filters */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#10161D] p-4 sm:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <CircularProgress
                    percentage={activeSubjectStats.resourcePct}
                    accentHex={activeSubjectData.accentHex}
                    size={72}
                    strokeWidth={6}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${activeSubjectData.badgeBg} ${activeSubjectData.badgeText}`}>
                        {activeSubjectData.id}
                      </span>
                      <h2 className="text-lg font-bold text-white sm:text-xl">
                        {activeSubjectData.name}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeSubjectData.subtitle}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <span>
                        Resources:{' '}
                        <strong className="text-white">
                          {activeSubjectStats.completedRes}/{activeSubjectStats.totalRes}
                        </strong>{' '}
                        ({activeSubjectStats.resourcePct}%)
                      </span>
                      <span>•</span>
                      <span>
                        Year-wise PYQs:{' '}
                        <strong className="text-emerald-400">
                          {activeSubjectStats.completedYrs}/{activeSubjectStats.totalYrs}
                        </strong>{' '}
                        ({activeSubjectStats.pyqPct}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Search & Status Filters */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search chapter or unit..."
                      className="w-full sm:w-52 rounded-xl border border-white/10 bg-[#080B0E] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#080B0E] p-1">
                    {(['all', 'in-progress', 'completed', 'pending'] as const).map((stKey) => (
                      <button
                        key={stKey}
                        type="button"
                        onClick={() => setStatusFilter(stKey)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                          statusFilter === stKey
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {stKey === 'in-progress' ? 'Active' : stKey}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Year-wise PYQ Filter Bar (Matches Image 2) */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3.5">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-slate-400 mr-1">
                    <Filter className="h-3 w-3 text-emerald-400" />
                    PYQ Year Focus:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPyqYearFilter('ALL')}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition whitespace-nowrap ${
                      selectedPyqYearFilter === 'ALL'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    All Years (2017–2026)
                  </button>
                  {PYQ_YEARS.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSelectedPyqYearFilter(yr)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition whitespace-nowrap ${
                        selectedPyqYearFilter === yr
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/[0.04] text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllPyqYears(!showAllPyqYears)}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 whitespace-nowrap"
                >
                  {showAllPyqYears ? 'Compact PYQ View' : 'Expand All PYQ Years'}
                </button>
              </div>
            </div>

            {/* Chapter List Grouped by Unit */}
            {groupedUnits.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.07] bg-[#10161D] p-10 text-center">
                <p className="text-sm text-slate-400">
                  No chapters match your current filter criteria.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="mt-3 rounded-xl bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedUnits.map((group) => (
                  <div key={group.unit} className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-emerald-400" />
                        <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                          {group.unit}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400">
                        {group.chapters.length}{' '}
                        {group.chapters.length === 1 ? 'Chapter' : 'Chapters'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {group.chapters.map((chapter) => {
                        const st = getChapterStats(chapter);
                        const isExpanded =
                          expandedChapters[chapter.id] !== undefined
                            ? expandedChapters[chapter.id]
                            : showAllPyqYears;

                        return (
                          <div
                            key={chapter.id}
                            className={`rounded-2xl border transition ${
                              st.isFullyCompleted
                                ? 'border-emerald-500/35 bg-[#0F1918]'
                                : st.isStarted
                                ? 'border-cyan-500/25 bg-[#10161D]'
                                : 'border-white/[0.07] bg-[#10161D]'
                            } p-4 sm:p-5`}
                          >
                            {/* Chapter Header Row */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleAllChapterResources(
                                      selectedSubject,
                                      chapter.id,
                                      !st.isFullyCompleted
                                    )
                                  }
                                  title={
                                    st.isFullyCompleted
                                      ? 'Mark all resources incomplete'
                                      : 'Mark entire chapter complete'
                                  }
                                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                                    st.isFullyCompleted
                                      ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                                      : st.isStarted
                                      ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
                                      : 'border-white/15 bg-white/[0.03] text-slate-400 hover:border-white/30 hover:text-white'
                                  }`}
                                >
                                  {st.isFullyCompleted ? (
                                    <Check className="h-4 w-4 stroke-[3]" />
                                  ) : (
                                    <span className="text-xs font-bold">
                                      {String(chapter.number).padStart(2, '0')}
                                    </span>
                                  )}
                                </button>

                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
                                      Chapter {String(chapter.number).padStart(2, '0')}
                                    </span>
                                    {chapter.highWeightage && (
                                      <span className="rounded-md border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-purple-300">
                                        High Weightage
                                      </span>
                                    )}
                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                        st.isFullyCompleted
                                          ? 'bg-emerald-500/20 text-emerald-300'
                                          : st.isStarted
                                          ? 'bg-cyan-500/20 text-cyan-300'
                                          : 'bg-white/[0.06] text-slate-400'
                                      }`}
                                    >
                                      {st.isFullyCompleted
                                        ? '• Done'
                                        : st.isStarted
                                        ? '• In Progress'
                                        : 'Pending'}
                                    </span>
                                  </div>
                                  <h4 className="mt-1 text-base font-bold text-white">
                                    {chapter.title}
                                  </h4>
                                </div>
                              </div>

                              {/* Chapter Completion Metrics */}
                              <div className="flex items-center justify-between sm:justify-end gap-4">
                                <div className="text-right">
                                  <div className="text-xs font-semibold text-slate-300">
                                    {st.completedResources}/{st.totalResources} Resources •{' '}
                                    <span className="text-emerald-400">{st.resourcePct}%</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {st.completedYears}/{st.totalYears} PYQ Years Solved
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedChapters((prev) => ({
                                      ...prev,
                                      [chapter.id]: !isExpanded,
                                    }))
                                  }
                                  className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-slate-300 hover:bg-white/[0.08] hover:text-white"
                                  aria-label="Toggle PYQ Years Panel"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Chapter Progress Bar */}
                            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                                style={{ width: `${st.resourcePct}%` }}
                              />
                            </div>

                            {/* 6 Study Resource Checkboxes */}
                            <div className="mt-4">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                  Study Resources (Click to Toggle)
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleAllChapterResources(
                                      selectedSubject,
                                      chapter.id,
                                      !st.isFullyCompleted
                                    )
                                  }
                                  className="text-[11px] font-medium text-slate-400 hover:text-emerald-300"
                                >
                                  {st.isFullyCompleted ? 'Clear All' : 'Check All 6'}
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                                {RESOURCES.map((res) => {
                                  const isChecked = chapter.resources[res.key];
                                  return (
                                    <button
                                      key={res.key}
                                      type="button"
                                      onClick={() =>
                                        toggleChapterResource(
                                          selectedSubject,
                                          chapter.id,
                                          res.key
                                        )
                                      }
                                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${
                                        isChecked
                                          ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-200'
                                          : 'border-white/[0.07] bg-[#0B0F14] text-slate-400 hover:border-white/20 hover:text-slate-200'
                                      }`}
                                    >
                                      <span
                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                          isChecked
                                            ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                                            : 'border-slate-600 bg-transparent'
                                        }`}
                                      >
                                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                      </span>
                                      <span className="truncate">{res.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Year-wise PYQ Tracking Section */}
                            {isExpanded && (
                              <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#0B0F14] p-3.5">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                                      Year-Wise PYQ Tracker (2017–2026)
                                    </span>
                                    <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                                      {st.completedYears}/{st.totalYears} Years Completed ({st.pyqYearPct}%)
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleAllPyqYearsForChapter(
                                        selectedSubject,
                                        chapter.id,
                                        st.completedYears < st.totalYears
                                      )
                                    }
                                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
                                  >
                                    {st.completedYears === st.totalYears
                                      ? 'Uncheck All Years'
                                      : 'Mark All Years Done'}
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5 lg:grid-cols-10">
                                  {PYQ_YEARS.map((yr) => {
                                    const yrDone = Boolean(chapter.pyqYears[yr]);
                                    const isHighlightedYear =
                                      selectedPyqYearFilter !== 'ALL' &&
                                      selectedPyqYearFilter === yr;
                                    return (
                                      <button
                                        key={yr}
                                        type="button"
                                        onClick={() =>
                                          toggleChapterPyqYear(
                                            selectedSubject,
                                            chapter.id,
                                            yr
                                          )
                                        }
                                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${
                                          yrDone
                                            ? 'border-cyan-500/45 bg-cyan-500/15 text-cyan-200'
                                            : isHighlightedYear
                                            ? 'border-amber-400/60 bg-amber-500/10 text-amber-200'
                                            : 'border-white/[0.06] bg-[#10161D] text-slate-400 hover:border-white/20 hover:text-white'
                                        }`}
                                      >
                                        <span
                                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                                            yrDone
                                              ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                                              : 'border-slate-600'
                                          }`}
                                        >
                                          {yrDone && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                        </span>
                                        <span>{yr}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom Chapter Modal */}
            {showAddChapterModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#10161D] p-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">
                      Add Chapter to {activeSubjectData.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddChapterModal(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <form onSubmit={handleAddChapter} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Chapter Title
                      </label>
                      <input
                        type="text"
                        required
                        value={newChapterTitle}
                        onChange={(e) => setNewChapterTitle(e.target.value)}
                        placeholder="e.g., Magnetic Effects Practice Unit"
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#080B0E] px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Unit / Section Name
                      </label>
                      <input
                        type="text"
                        value={newChapterUnit}
                        onChange={(e) => setNewChapterUnit(e.target.value)}
                        placeholder="e.g., Term 2 Revision Unit"
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#080B0E] px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newChapterHighWeightage}
                        onChange={(e) => setNewChapterHighWeightage(e.target.checked)}
                        className="rounded border-slate-600 text-emerald-500 focus:ring-0"
                      />
                      <span>Mark as High Weightage Chapter</span>
                    </label>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddChapterModal(false)}
                        className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                      >
                        Add Chapter
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 3: DAILY QUESTION TARGET & DAILY HISTORY
        =================================================================== */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            {/* Section 5: Daily Question Target Control Panel */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="rounded-2xl border border-emerald-500/25 bg-[#10161D] p-5 lg:col-span-7">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Daily Question Target ({todayStr})
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                    {todayCompletionPct}% Completed
                  </span>
                </div>

                {/* 4 Required Metrics Grid */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/[0.06] bg-[#0B0F14] p-3">
                    <span className="text-[11px] text-slate-400">Daily Target</span>
                    <div className="mt-1 text-xl font-extrabold text-white">
                      {todayTarget}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-[#0B0F14] p-3">
                    <span className="text-[11px] text-slate-400">Completed</span>
                    <div className="mt-1 text-xl font-extrabold text-emerald-400">
                      {todayCompleted}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-[#0B0F14] p-3">
                    <span className="text-[11px] text-slate-400">Remaining</span>
                    <div className="mt-1 text-xl font-extrabold text-amber-400">
                      {todayRemaining}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-[#0B0F14] p-3">
                    <span className="text-[11px] text-slate-400">Completion %</span>
                    <div className="mt-1 text-xl font-extrabold text-cyan-400">
                      {todayCompletionPct}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, todayCompletionPct)}%` }}
                  />
                </div>

                {/* Controls to Update Questions Completed & Daily Target */}
                <div className="mt-5 grid grid-cols-1 gap-4 border-t border-white/[0.07] pt-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Update Questions Completed Today
                    </label>
                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateTodayCompleted(todayCompleted - 5)}
                        className="rounded-lg border border-white/10 bg-[#0B0F14] p-2 text-slate-300 hover:bg-white/[0.08] hover:text-white"
                        title="Subtract 5"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={todayCompleted}
                        onChange={(e) => updateTodayCompleted(Number(e.target.value))}
                        className="w-24 rounded-lg border border-white/15 bg-[#080B0E] px-3 py-1.5 text-center text-sm font-bold text-white focus:border-emerald-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateTodayCompleted(todayCompleted + 5)}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 p-2 text-emerald-300 hover:bg-emerald-500/25"
                        title="Add 5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTodayCompleted(todayCompleted + 10)}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25"
                      >
                        +10
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Set Daily Question Target
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={targetInput}
                        onChange={(e) => setTargetInput(e.target.value)}
                        className="w-24 rounded-lg border border-white/15 bg-[#080B0E] px-3 py-1.5 text-sm font-bold text-white focus:border-emerald-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateDailyTargetValue(Number(targetInput) || 60)}
                        className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                      >
                        Update Target
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Log or Edit Any Date's Record */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#10161D] p-5 lg:col-span-5">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    Log or Update Any Date Record
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Today’s activity is recorded automatically. You can also log or adjust any past date below.
                </p>

                <form onSubmit={handleSaveHistoricalEntry} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Date
                    </label>
                    <input
                      type="date"
                      value={logDateInput}
                      onChange={(e) => {
                        const d = e.target.value;
                        setLogDateInput(d);
                        if (state.dailyHistory[d]) {
                          setLogTargetInput(String(state.dailyHistory[d].target));
                          setLogCompletedInput(String(state.dailyHistory[d].completed));
                        }
                      }}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#080B0E] px-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Daily Target
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={logTargetInput}
                        onChange={(e) => setLogTargetInput(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#080B0E] px-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Questions Completed
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={logCompletedInput}
                        onChange={(e) => setLogCompletedInput(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#080B0E] px-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-cyan-500/20 border border-cyan-500/40 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition"
                  >
                    Save Date Record
                  </button>
                </form>
              </div>
            </div>

            {/* Section 6: Daily History Chronological Table */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#10161D] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">
                    Daily Question-Solving History
                  </h2>
                  <p className="text-xs text-slate-400">
                    Chronological record of daily question targets, actual questions completed, and completion percentages
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setHistorySortOrder(
                        historySortOrder === 'chronological' ? 'reverse' : 'chronological'
                      )
                    }
                    className="rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-white/25 hover:text-white"
                  >
                    Order:{' '}
                    {historySortOrder === 'chronological'
                      ? 'Chronological (Oldest → Newest)'
                      : 'Newest First'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3 text-right">Daily Question Target</th>
                      <th className="py-3 px-3 text-right">Actual Completed</th>
                      <th className="py-3 px-3 text-right">Remaining</th>
                      <th className="py-3 px-3">Target Completion %</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-xs">
                    {sortedHistoryRecords.map((rec) => {
                      const pct =
                        rec.target > 0
                          ? Math.round((rec.completed / rec.target) * 100)
                          : 0;
                      const rem = Math.max(0, rec.target - rec.completed);
                      const isToday = rec.date === todayStr;

                      return (
                        <tr
                          key={rec.date}
                          className={isToday ? 'bg-emerald-500/[0.06]' : 'hover:bg-white/[0.02]'}
                        >
                          <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span>{rec.date}</span>
                              {isToday && (
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                  Today
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-300">
                            {rec.target}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-400">
                            {rec.completed}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-400">
                            {rem}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-white/[0.07]">
                                <div
                                  className={`h-full rounded-full ${
                                    pct >= 100 ? 'bg-emerald-400' : 'bg-cyan-400'
                                  }`}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                              <span
                                className={`font-bold ${
                                  pct >= 100 ? 'text-emerald-400' : 'text-slate-200'
                                }`}
                              >
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setLogDateInput(rec.date);
                                  setLogTargetInput(String(rec.target));
                                  setLogCompletedInput(String(rec.completed));
                                }}
                                className="text-slate-400 hover:text-cyan-300"
                                title="Edit this date"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              {!isToday && (
                                <button
                                  type="button"
                                  onClick={() => deleteHistoryEntry(rec.date)}
                                  className="text-slate-500 hover:text-rose-400"
                                  title="Delete entry"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 4: DATA BACKUP, EXPORT & IMPORT
        =================================================================== */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Export Card */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#10161D] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Download className="h-5 w-5" />
                    <h2 className="text-base font-bold text-white">
                      Export Tracker Data
                    </h2>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                    Download a complete backup of your CBSE Class 10 preparation progress, including all 5 subjects, chapter-wise study resource toggles, year-wise PYQ completion (2017–2026), daily question targets, and chronological daily history.
                  </p>

                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      onClick={handleExportJSON}
                      className="flex w-full items-center justify-between rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-4 py-3 text-left transition hover:bg-emerald-500/25"
                    >
                      <div className="flex items-center gap-3">
                        <FileJson className="h-5 w-5 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">
                            Download JSON Backup (.json)
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Recommended for 1-click full progress restore
                          </div>
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-emerald-300" />
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="flex w-full items-center justify-between rounded-xl border border-cyan-500/35 bg-cyan-500/15 px-4 py-3 text-left transition hover:bg-cyan-500/25"
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-cyan-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">
                            Download CSV Spreadsheet (.csv)
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Compatible with Excel, Google Sheets & CSV Import
                          </div>
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-cyan-300" />
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyBackupToClipboard}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#0B0F14] px-4 py-2.5 text-left transition hover:border-white/25"
                    >
                      <div className="flex items-center gap-3">
                        <Copy className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-300">
                          Copy Raw JSON Backup to Clipboard
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mt-6 border-t border-white/[0.06] pt-4 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Auto-saved locally in browser storage</span>
                  <span>Version 1.0</span>
                </div>
              </div>

              {/* Import / Restore Card */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#10161D] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Upload className="h-5 w-5" />
                    <h2 className="text-base font-bold text-white">
                      Import & Restore Data
                    </h2>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                    Restore your progress from a previously exported <code className="text-slate-200">.json</code> or <code className="text-slate-200">.csv</code> backup file, or paste your backup JSON directly below.
                  </p>

                  <div className="mt-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.csv,application/json,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/10 px-4 py-3.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Backup File (.json or .csv)</span>
                    </button>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Or Paste Exported Backup JSON / CSV:
                    </label>
                    <textarea
                      rows={4}
                      value={importJsonText}
                      onChange={(e) => setImportJsonText(e.target.value)}
                      placeholder='{"version":1,"examDate":"2027-02-15","subjects":...}'
                      className="w-full rounded-xl border border-white/15 bg-[#080B0E] p-3 font-mono text-[11px] text-slate-200 placeholder-slate-600 focus:border-emerald-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => applyImportedData(importJsonText)}
                      className="mt-2 w-full rounded-xl bg-emerald-500 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                    >
                      Restore Progress from Text
                    </button>
                  </div>
                </div>

                {/* Reset Option with In-Page Confirmation */}
                <div className="mt-6 border-t border-white/[0.06] pt-4">
                  {!showResetConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-300"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset Tracker to Default Demo Data</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2">
                      <span className="text-xs text-rose-200">
                        Reset all progress to default state?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const fresh = buildInitialState();
                            setState(fresh);
                            setShowResetConfirm(false);
                            triggerToast('Tracker reset to default syllabus state.');
                          }}
                          className="rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-400"
                        >
                          Confirm Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-slate-300 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Matches Reference Mockups) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-white/[0.08] bg-[#0B0F14]/95 py-2 backdrop-blur-md md:hidden"
        aria-label="Mobile Bottom Navigation"
      >
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-semibold ${
            activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-semibold ${
            activeTab === 'subjects' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <ListChecks className="h-4 w-4" />
          <span>Checklist</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-semibold ${
            activeTab === 'daily' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Target className="h-4 w-4" />
          <span>Daily Goal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-semibold ${
            activeTab === 'backup' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Download className="h-4 w-4" />
          <span>Backup</span>
        </button>
      </nav>
    </div>
  );
}
