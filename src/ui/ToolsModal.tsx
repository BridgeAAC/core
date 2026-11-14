import { useEffect, useState } from 'preact/hooks';
import { panel, speakText, toast } from '../state';
import { settings, updateSettings, type ThemeSetting } from '../settings';
import { kvGet, kvSet } from '../store/db';
import {
  decryptJsonWithPasscode,
  deriveEncryptionKey,
  encryptJson,
  isEncryptedEnvelope,
  verifySecret,
  type DerivedKey,
  type EncryptedEnvelope,
} from '../store/secure';

export type ToolsTab = 'planner' | 'mood' | 'games' | 'aboutme' | 'notes';

interface PlannerTask {
  id: string;
  title: string;
  emoji: string;
  period: 'Morning' | 'Afternoon' | 'Evening';
  done: boolean;
}

const DEFAULT_PLANNER_TASKS: PlannerTask[] = [
  { id: 'pl-1', title: 'Wake Up & Stretch', emoji: '☀️', period: 'Morning', done: false },
  { id: 'pl-2', title: 'Brush Teeth & Wash Face', emoji: '🪥', period: 'Morning', done: false },
  { id: 'pl-3', title: 'Eat Breakfast', emoji: '🥞', period: 'Morning', done: false },
  { id: 'pl-4', title: 'School / Learning Time', emoji: '📚', period: 'Morning', done: false },
  { id: 'pl-5', title: 'Eat Lunch & Drink Water', emoji: '🥪', period: 'Afternoon', done: false },
  { id: 'pl-6', title: 'AAC Practice / Speech', emoji: '💬', period: 'Afternoon', done: false },
  { id: 'pl-7', title: 'Play & Free Time', emoji: '🎨', period: 'Afternoon', done: false },
  { id: 'pl-8', title: 'Eat Dinner with Family', emoji: '🍽️', period: 'Evening', done: false },
  { id: 'pl-9', title: 'Calm Time & Bedtime', emoji: '🌙', period: 'Evening', done: false },
];

interface MoodDefinition {
  id: string;
  label: string;
  emoji: string;
  color: string;
  spoken: string;
  tip: string;
  copingSpeech: string;
}

const MOODS: MoodDefinition[] = [
  {
    id: 'happy',
    label: 'Happy',
    emoji: '😊',
    color: '#22c55e',
    spoken: 'I feel happy!',
    tip: 'Wonderful! Share what made you smile today or keep doing what you enjoy.',
    copingSpeech: 'I am having a great time!',
  },
  {
    id: 'calm',
    label: 'Calm',
    emoji: '😌',
    color: '#06b6d4',
    spoken: 'I feel calm and comfortable.',
    tip: 'You are in a great steady zone—this is a great time for learning or chatting.',
    copingSpeech: 'I feel calm and ready.',
  },
  {
    id: 'excited',
    label: 'Excited',
    emoji: '🤩',
    color: '#eab308',
    spoken: 'I feel super excited!',
    tip: 'Lots of happy energy! If your body feels wiggly, try jumping jacks or a movement break.',
    copingSpeech: 'I am really excited! Can I share something?',
  },
  {
    id: 'tired',
    label: 'Tired',
    emoji: '😴',
    color: '#8b5cf6',
    spoken: 'I feel tired.',
    tip: 'Your body needs rest. Try drinking water, dimming the lights, or resting for 10 minutes.',
    copingSpeech: 'I am tired. Can I rest for a little bit please?',
  },
  {
    id: 'sad',
    label: 'Sad',
    emoji: '😢',
    color: '#3b82f6',
    spoken: 'I feel sad.',
    tip: 'It is okay to feel sad. A hug, a favorite comfort item, or talking to someone you trust can help.',
    copingSpeech: 'I feel sad. Can I have a hug or some comfort please?',
  },
  {
    id: 'frustrated',
    label: 'Frustrated',
    emoji: '😤',
    color: '#f97316',
    spoken: 'I feel frustrated.',
    tip: 'Take 3 slow deep breaths. Let us break the task into smaller steps or ask for help.',
    copingSpeech: 'This is hard and I feel frustrated. Can you help me please?',
  },
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    emoji: '😰',
    color: '#ec4899',
    spoken: 'I feel overwhelmed and anxious.',
    tip: 'Try switching on Calm Mode, putting on headphones, or moving to a quiet space.',
    copingSpeech: 'I feel overwhelmed. I need a quiet break and some space please.',
  },
  {
    id: 'hurting',
    label: 'Sick / Hurting',
    emoji: '🤒',
    color: '#ef4444',
    spoken: 'I do not feel well. Something hurts.',
    tip: 'Let a caregiver, parent, or nurse know right away where it hurts.',
    copingSpeech: 'My body does not feel good. Please check on me.',
  },
];

const MOOD_TRIGGERS = [
  'Good Rest',
  'Fun Activity',
  'With Family',
  'Loud Noise',
  'Hungry / Thirsty',
  'Schedule Change',
  'Hard Task',
  'Need a Break',
];

interface MoodLogEntry {
  id: string;
  moodId: string;
  trigger: string;
  timestamp: number;
}

interface SentenceChallenge {
  prompt: string;
  emoji: string;
  target: string[];
  distractors: string[];
}

const SENTENCE_CHALLENGES: SentenceChallenge[] = [
  {
    prompt: 'Ask for a drink of water',
    emoji: '💧',
    target: ['I', 'want', 'water', 'please'],
    distractors: ['sleep', 'hat'],
  },
  {
    prompt: 'Tell someone how you feel',
    emoji: '😊',
    target: ['I', 'feel', 'very', 'happy'],
    distractors: ['table', 'cold'],
  },
  {
    prompt: 'Ask to go to the park',
    emoji: '🌳',
    target: ['Can', 'we', 'go', 'outside'],
    distractors: ['spoon', 'red'],
  },
  {
    prompt: 'Ask for help with something',
    emoji: '🤝',
    target: ['Please', 'help', 'me', 'open'],
    distractors: ['yellow', 'dog'],
  },
  {
    prompt: 'Say you want to eat an apple',
    emoji: '🍎',
    target: ['I', 'would', 'like', 'apple'],
    distractors: ['car', 'shoes'],
  },
  {
    prompt: 'Ask for a quiet break',
    emoji: '🎧',
    target: ['I', 'need', 'a', 'break'],
    distractors: ['banana', 'run'],
  },
];

interface EmotionScenario {
  situation: string;
  emoji: string;
  correctMoodId: string;
  explanation: string;
}

const EMOTION_SCENARIOS: EmotionScenario[] = [
  {
    situation: 'Your sister shares your favorite game and plays with you!',
    emoji: '🎮',
    correctMoodId: 'happy',
    explanation: 'Sharing and playing together makes us feel happy!',
  },
  {
    situation: 'A loud fire truck siren goes past and it hurts your ears.',
    emoji: '🚒',
    correctMoodId: 'overwhelmed',
    explanation: 'Sudden loud noises can make us feel overwhelmed. Headphones can help!',
  },
  {
    situation: 'You stayed up late and yawned all morning.',
    emoji: '🥱',
    correctMoodId: 'tired',
    explanation: 'Yawning and heavy eyes mean our body is tired and needs rest.',
  },
  {
    situation: 'You tried three times to open a tight jar and it still will not open.',
    emoji: '🫙',
    correctMoodId: 'frustrated',
    explanation: 'When something will not work, it is normal to feel frustrated and ask for help!',
  },
  {
    situation: 'Your ice cream scoop fell onto the sidewalk.',
    emoji: '🍦',
    correctMoodId: 'sad',
    explanation: 'Losing something we were looking forward to can make us feel sad.',
  },
  {
    situation: 'You are snuggled under a warm blanket listening to gentle rain.',
    emoji: '🌧️',
    correctMoodId: 'calm',
    explanation: 'Cozy, quiet moments help our body and mind feel calm.',
  },
];

interface AboutMeProfile {
  name: string;
  age: string;
  communicationStyle: string;
  likes: string;
  dislikes: string;
  allergies: string;
  calmingStrategies: string;
  contacts: string;
}

const DEFAULT_ABOUT_ME: AboutMeProfile = {
  name: '',
  age: '',
  communicationStyle: 'I use BridgeAAC on my tablet to speak. Please give me time to tap my words.',
  likes: 'Music, animals, playing games, spending time with family, favorite snacks',
  dislikes: 'Sudden loud noises, being rushed, bright flashing lights',
  allergies: 'None listed yet (tap Edit to add allergies or medications)',
  calmingStrategies: 'Noise-canceling headphones, deep breaths, Calm color mode, a quiet break',
  contacts: 'Mom / Dad / Caregiver (tap Edit to add phone numbers)',
};

interface CaregiverNote {
  id: string;
  category: 'Communication' | 'Sensory & Behavior' | 'Medical & Health' | 'School & Therapy';
  text: string;
  createdAt: number;
}

export function ToolsModal() {
  const [tab, setTab] = useState<ToolsTab>('planner');

  const [tasks, setTasks] = useState<PlannerTask[]>(DEFAULT_PLANNER_TASKS);
  const [stars, setStars] = useState<number>(0);
  const [rewardGoal, setRewardGoal] = useState<string>('5 Stars = 15 mins of favorite activity!');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEmoji, setNewTaskEmoji] = useState('⭐');
  const [newTaskPeriod, setNewTaskPeriod] = useState<PlannerTask['period']>('Morning');

  const [moodLogs, setMoodLogs] = useState<MoodLogEntry[]>([]);
  const [selectedTrigger, setSelectedTrigger] = useState<string>('With Family');
  const [activeMoodTip, setActiveMoodTip] = useState<MoodDefinition | null>(null);

  const [gameMode, setGameMode] = useState<'sentence' | 'emotion'>('sentence');
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [builtWords, setBuiltWords] = useState<string[]>([]);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [emotionFeedback, setEmotionFeedback] = useState<string | null>(null);
  const [gameStreak, setGameStreak] = useState(0);

  const [aboutMe, setAboutMe] = useState<AboutMeProfile>(DEFAULT_ABOUT_ME);
  const [editingAbout, setEditingAbout] = useState(false);

  const [notes, setNotes] = useState<CaregiverNote[]>([]);
  // Non-empty when notes are protected: 'encrypted', or a legacy gate (old passcode / settings PIN).
  const [savedPasscode, setSavedPasscode] = useState<string>('');
  const [notesUnlocked, setNotesUnlocked] = useState<boolean>(false);
  const [notesKey, setNotesKey] = useState<DerivedKey | null>(null);
  const [notesEnv, setNotesEnv] = useState<EncryptedEnvelope | null>(null);
  const [notesBusy, setNotesBusy] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [noteCategory, setNoteCategory] = useState<CaregiverNote['category']>('Communication');
  const [noteText, setNoteText] = useState('');
  const [noteFilter, setNoteFilter] = useState<string>('All');

  useEffect(() => {
    void (async () => {
      const [
        savedTasks,
        savedStars,
        savedGoal,
        savedMoods,
        savedAbout,
        savedNotes,
        savedPass,
        savedEnc,
        notesOpen,
      ] = await Promise.all([
          kvGet<PlannerTask[]>('planner_tasks'),
          kvGet<number>('gamified_stars'),
          kvGet<string>('planner_reward_goal'),
          kvGet<MoodLogEntry[]>('mood_logs'),
          kvGet<AboutMeProfile>('about_me_profile'),
          kvGet<CaregiverNote[]>('caregiver_notes'),
          kvGet<string>('caregiver_passcode'),
          kvGet<EncryptedEnvelope>('caregiver_notes_enc'),
          kvGet<boolean>('caregiver_notes_open'),
        ]);
      if (Array.isArray(savedTasks) && savedTasks.length > 0) setTasks(savedTasks);
      if (typeof savedStars === 'number') setStars(savedStars);
      if (savedGoal) setRewardGoal(savedGoal);
      if (Array.isArray(savedMoods)) setMoodLogs(savedMoods);
      if (savedAbout) setAboutMe({ ...DEFAULT_ABOUT_ME, ...savedAbout });
      if (isEncryptedEnvelope(savedEnc)) {
        // Encrypted notes: nothing readable until the passcode is entered.
        setNotesEnv(savedEnc);
        setSavedPasscode('encrypted');
        setNotesUnlocked(false);
      } else {
        if (Array.isArray(savedNotes)) setNotes(savedNotes);
        // Legacy (pre-encryption) installs: notes were gated by a notes passcode or the settings
        // PIN. They are encrypted with that secret on the next successful unlock.
        const gate = savedPass || (notesOpen ? '' : settings.value.pin) || '';
        setSavedPasscode(gate);
        setNotesUnlocked(!gate);
      }
    })();
  }, []);

  function close() {
    panel.value = null;
  }

  async function awardStars(delta: number) {
    const next = Math.max(0, stars + delta);
    setStars(next);
    await kvSet('gamified_stars', next);
  }

  async function toggleTask(idx: number) {
    const next = tasks.map((t, i) => (i === idx ? { ...t, done: !t.done } : t));
    const item = next[idx];
    setTasks(next);
    await kvSet('planner_tasks', next);
    if (item.done) {
      await awardStars(1);
      speakText(`Great job finishing ${item.title}! You earned a star.`);
      toast(`⭐ +1 Star! Completed "${item.title}"`, 'success');
    } else {
      speakText(item.title);
    }
  }

  async function moveTask(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= tasks.length || fromIdx === toIdx) return;
    const copy = [...tasks];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    setTasks(copy);
    await kvSet('planner_tasks', copy);
  }

  async function handleAddTask(e: Event) {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    const item: PlannerTask = {
      id: 'pl-' + Date.now().toString(36),
      title,
      emoji: newTaskEmoji.trim() || '📅',
      period: newTaskPeriod,
      done: false,
    };
    const next = [...tasks, item];
    setTasks(next);
    await kvSet('planner_tasks', next);
    setNewTaskTitle('');
    toast(`Added "${title}" to Daily Planner`, 'success');
  }

  async function handleDeleteTask(id: string) {
    const next = tasks.filter((t) => t.id !== id);
    setTasks(next);
    await kvSet('planner_tasks', next);
  }

  async function resetPlannerDay() {
    const next = tasks.map((t) => ({ ...t, done: false }));
    setTasks(next);
    await kvSet('planner_tasks', next);
    toast('Reset schedule for a fresh day!', 'info');
  }

  async function handleLogMood(m: MoodDefinition) {
    speakText(m.spoken);
    setActiveMoodTip(m);
    const entry: MoodLogEntry = {
      id: 'm-' + Date.now().toString(36),
      moodId: m.id,
      trigger: selectedTrigger,
      timestamp: Date.now(),
    };
    const next = [entry, ...moodLogs].slice(0, 120);
    setMoodLogs(next);
    await kvSet('mood_logs', next);
    toast(`Logged mood: ${m.label}`, 'success');
  }

  const currentChallenge = SENTENCE_CHALLENGES[sentenceIdx % SENTENCE_CHALLENGES.length];
  const challengeWordPool = (() => {
    const all = [...currentChallenge.target, ...currentChallenge.distractors];
    return all
      .map((w, i) => ({ w, sort: ((i * 7 + sentenceIdx * 3) % 13) }))
      .sort((a, b) => a.sort - b.sort)
      .map((x) => x.w);
  })();

  function handleTapWordTile(word: string) {
    speakText(word);
    if (builtWords.length >= currentChallenge.target.length) return;
    const next = [...builtWords, word];
    setBuiltWords(next);

    if (next.length === currentChallenge.target.length) {
      const isCorrect = next.every(
        (w, idx) => w.toLowerCase() === currentChallenge.target[idx].toLowerCase(),
      );
      if (isCorrect) {
        const fullSentence = currentChallenge.target.join(' ');
        setTimeout(() => {
          speakText(`Awesome! ${fullSentence}`);
        }, 350);
        void awardStars(2);
        setGameStreak((s) => s + 1);
        toast('🎉 Correct sentence! +2 Stars!', 'success');
      } else {
        setTimeout(() => {
          speakText('Almost! Let us try putting the words in order.');
        }, 350);
        setGameStreak(0);
        toast('Try again! Tap Clear or use a Hint.', 'info');
      }
    }
  }

  const currentScenario = EMOTION_SCENARIOS[scenarioIdx % EMOTION_SCENARIOS.length];

  function handleGuessEmotion(m: MoodDefinition) {
    if (m.id === currentScenario.correctMoodId) {
      speakText(`Yes! ${m.label}. ${currentScenario.explanation}`);
      setEmotionFeedback(`✅ Correct! ${currentScenario.explanation}`);
      void awardStars(2);
      setGameStreak((s) => s + 1);
      toast('🌟 +2 Stars! Great emotion match!', 'success');
    } else {
      speakText(`That is ${m.label}. Try another feeling for this story.`);
      setEmotionFeedback(`Try again! Think about how "${currentScenario.situation}" feels.`);
    }
  }

  async function saveAboutMeProfile(e: Event) {
    e.preventDefault();
    await kvSet('about_me_profile', aboutMe);
    setEditingAbout(false);
    toast('Saved "About Me" profile', 'success');
  }

  function speakFullAboutMe() {
    const intro = [
      aboutMe.name ? `Hi, my name is ${aboutMe.name}.` : 'Hi!',
      aboutMe.age ? `I am ${aboutMe.age} years old.` : '',
      aboutMe.communicationStyle,
      aboutMe.likes ? `Things I love include: ${aboutMe.likes}.` : '',
      aboutMe.dislikes ? `Please know that I dislike: ${aboutMe.dislikes}.` : '',
      aboutMe.allergies ? `Important medical and allergy note: ${aboutMe.allergies}.` : '',
      aboutMe.calmingStrategies ? `What helps me feel calm: ${aboutMe.calmingStrategies}.` : '',
    ]
      .filter(Boolean)
      .join(' ');
    speakText(intro);
  }

  /** Persist notes: encrypted when a passcode key is active, otherwise plaintext. */
  async function persistNotes(next: CaregiverNote[], key: DerivedKey | null = notesKey) {
    if (key) {
      const env = await encryptJson(next, key);
      setNotesEnv(env);
      await kvSet('caregiver_notes_enc', env);
      await kvSet('caregiver_notes', []);
    } else {
      await kvSet('caregiver_notes', next);
    }
  }

  async function handleSetPasscode(e: Event) {
    e.preventDefault();
    if (notesBusy) return;
    const clean = newPasscode.trim();
    setNotesBusy(true);
    try {
      if (clean) {
        const key = await deriveEncryptionKey(clean);
        await persistNotes(notes, key);
        await kvSet('caregiver_passcode', '');
        await kvSet('caregiver_notes_open', false);
        setNotesKey(key);
        setSavedPasscode('encrypted');
        toast('Passcode saved. Caregiver Notes are now encrypted on this device.', 'success');
      } else {
        await kvSet('caregiver_notes', notes);
        await kvSet('caregiver_notes_enc', null);
        await kvSet('caregiver_passcode', '');
        await kvSet('caregiver_notes_open', true);
        setNotesKey(null);
        setNotesEnv(null);
        setSavedPasscode('');
        toast('Passcode removed. Caregiver Notes are no longer encrypted.', 'info');
      }
      setNewPasscode('');
      setNotesUnlocked(true);
    } catch {
      toast('Could not update the passcode on this browser.', 'error');
    } finally {
      setNotesBusy(false);
    }
  }

  async function handleUnlockNotes(e: Event) {
    e.preventDefault();
    if (notesBusy) return;
    const input = passInput.trim();
    setNotesBusy(true);
    try {
      if (notesEnv) {
        const res = await decryptJsonWithPasscode<CaregiverNote[]>(notesEnv, input);
        if (!res) {
          setPassError(true);
          return;
        }
        setNotes(Array.isArray(res.value) ? res.value : []);
        setNotesKey(res.dk);
      } else if (savedPasscode) {
        if (!(await verifySecret(input, savedPasscode))) {
          setPassError(true);
          return;
        }
        // Migrate legacy plaintext notes to encrypted storage using the passcode just entered.
        const key = await deriveEncryptionKey(input);
        await persistNotes(notes, key);
        await kvSet('caregiver_passcode', '');
        setNotesKey(key);
        setSavedPasscode('encrypted');
        toast('Caregiver Notes are now encrypted with this passcode.', 'success');
      }
      setNotesUnlocked(true);
      setPassInput('');
      setPassError(false);
    } finally {
      setNotesBusy(false);
    }
  }

  function lockNotes() {
    if (notesEnv || notesKey) {
      setNotes([]);
      setNotesKey(null);
    }
    setNotesUnlocked(false);
  }

  async function handleAddNote(e: Event) {
    e.preventDefault();
    const t = noteText.trim();
    if (!t) return;
    const item: CaregiverNote = {
      id: 'note-' + Date.now().toString(36),
      category: noteCategory,
      text: t,
      createdAt: Date.now(),
    };
    const next = [item, ...notes];
    setNotes(next);
    await persistNotes(next);
    setNoteText('');
    toast('Saved caregiver observation note', 'success');
  }

  async function handleDeleteNote(id: string) {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    await persistNotes(next);
  }

  function exportCaregiverNotes() {
    const lines = [
      `BridgeAAC Caregiver & SLP Observation Log`,
      `Exported: ${new Date().toLocaleString()}`,
      `----------------------------------------`,
      ...notes.map(
        (n) =>
          `[${new Date(n.createdAt).toLocaleString()}] (${n.category})\n${n.text}\n`,
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BridgeAAC-Caregiver-Notes.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  const completedTasks = tasks.filter((t) => t.done).length;
  const badgeName =
    stars >= 25
      ? '🏆 AAC Champion'
      : stars >= 10
        ? '🌟 Super Communicator'
        : stars >= 5
          ? '🎖️ Routine Explorer'
          : '⭐ Rising Star';

  return (
    <div class="modal-backdrop" onClick={close}>
      <div
        class="modal-card modal-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Daily Planner, Mood, Games, About Me, and Caregiver Notes"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2>Life & Learning Hub</h2>
            <span
              style={{
                background: '#fef08a',
                color: '#713f12',
                fontWeight: 700,
                fontSize: '0.84rem',
                padding: '4px 10px',
                borderRadius: '999px',
                border: '1px solid #facc15',
              }}
            >
              ⭐ {stars} Stars &bull; {badgeName}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              aria-label="Color Mode"
              value={settings.value.theme}
              onChange={(e) =>
                updateSettings({
                  theme: (e.target as HTMLSelectElement).value as ThemeSetting,
                })
              }
              style={{ padding: '5px 8px', borderRadius: '8px', fontSize: '0.84rem' }}
            >
              <option value="auto">Theme: Auto</option>
              <option value="light">☀️ Light Mode</option>
              <option value="dark">🌙 Dark Mode</option>
              <option value="calm">🌿 Calm Mode</option>
              <option value="contrast">⚡ High Contrast</option>
            </select>
            <button type="button" class="icon-close" onClick={close} aria-label="Close">
              ×
            </button>
          </div>
        </div>

        <div class="modal-body">
          <div class="tab-strip" style={{ flexWrap: 'wrap', marginBottom: '10px' }}>
            <button
              type="button"
              class={`tab-btn ${tab === 'planner' ? 'active' : ''}`}
              onClick={() => setTab('planner')}
            >
              📅 Daily Planner
            </button>
            <button
              type="button"
              class={`tab-btn ${tab === 'mood' ? 'active' : ''}`}
              onClick={() => setTab('mood')}
            >
              💛 Mood & Analytics
            </button>
            <button
              type="button"
              class={`tab-btn ${tab === 'games' ? 'active' : ''}`}
              onClick={() => setTab('games')}
            >
              🎮 Learning Games
            </button>
            <button
              type="button"
              class={`tab-btn ${tab === 'aboutme' ? 'active' : ''}`}
              onClick={() => setTab('aboutme')}
            >
              🪪 About Me
            </button>
            <button
              type="button"
              class={`tab-btn ${tab === 'notes' ? 'active' : ''}`}
              onClick={() => setTab('notes')}
            >
              🔒 Caregiver Notes
            </button>
          </div>

          {tab === 'planner' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div class="section-box">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <strong>
                      Today's Progress: {completedTasks} of {tasks.length} steps complete
                    </strong>
                    <div
                      class="progress-bar-track"
                      style={{ marginTop: '6px', height: '12px', borderRadius: '999px' }}
                    >
                      <div
                        class="progress-bar-fill"
                        style={{
                          width: `${tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <div class="hint" style={{ marginTop: '6px' }}>
                      🎁 <strong>Reward Goal:</strong> {rewardGoal}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" class="btn secondary sm" onClick={() => void resetPlannerDay()}>
                      New Day Reset
                    </button>
                  </div>
                </div>
              </div>

              <form class="section-box" onSubmit={(e) => void handleAddTask(e)}>
                <strong>Add Activity (Drag and drop rows below to reorder your schedule)</strong>
                <div class="inline-row" style={{ marginTop: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={newTaskEmoji}
                    onInput={(e) => setNewTaskEmoji((e.target as HTMLInputElement).value)}
                    style={{ maxWidth: '70px' }}
                    placeholder="Emoji"
                  />
                  <input
                    type="text"
                    value={newTaskTitle}
                    onInput={(e) => setNewTaskTitle((e.target as HTMLInputElement).value)}
                    placeholder="Activity name (e.g. Occupational Therapy)"
                    required
                  />
                  <select
                    value={newTaskPeriod}
                    onChange={(e) =>
                      setNewTaskPeriod(
                        (e.target as HTMLSelectElement).value as PlannerTask['period'],
                      )
                    }
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                  </select>
                  <button type="submit" class="btn primary sm">
                    + Add Step
                  </button>
                </div>
              </form>

              <div class="vocab-list" style={{ maxHeight: '360px' }}>
                {tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIdx !== null) {
                        void moveTask(dragIdx, idx);
                        setDragIdx(null);
                      }
                    }}
                    class={`vocab-row ${task.done ? 'current' : ''}`}
                    style={{
                      cursor: 'grab',
                      opacity: task.done ? 0.82 : 1,
                      background: task.done ? 'rgba(34, 197, 94, 0.12)' : undefined,
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}
                      onClick={() => void toggleTask(idx)}
                    >
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => {}}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '1.6rem' }}>{task.emoji}</span>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            textDecoration: task.done ? 'line-through' : 'none',
                          }}
                        >
                          {task.title}
                        </div>
                        <div class="vocab-meta">{task.period} &bull; Drag to reorder</div>
                      </div>
                    </div>

                    <div class="vocab-actions">
                      <button
                        type="button"
                        class="sm-btn"
                        onClick={() => speakText(task.title)}
                        title="Speak step"
                      >
                        🔊 Speak
                      </button>
                      <button
                        type="button"
                        class="sm-btn"
                        disabled={idx === 0}
                        onClick={() => void moveTask(idx, idx - 1)}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        class="sm-btn"
                        disabled={idx === tasks.length - 1}
                        onClick={() => void moveTask(idx, idx + 1)}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        class="sm-btn danger-text"
                        onClick={() => void handleDeleteTask(task.id)}
                        title="Remove step"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'mood' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div class="section-box">
                <strong>How Are You Feeling Right Now?</strong>
                <div class="inline-row" style={{ margin: '8px 0 12px', flexWrap: 'wrap' }}>
                  <span class="hint">What is happening around you?</span>
                  <select
                    value={selectedTrigger}
                    onChange={(e) => setSelectedTrigger((e.target as HTMLSelectElement).value)}
                  >
                    {MOOD_TRIGGERS.map((tr) => (
                      <option key={tr} value={tr}>
                        {tr}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => void handleLogMood(m)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: `2px solid ${m.color}`,
                        background: 'var(--bg-msg)',
                        color: 'var(--card-fg)',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      <span style={{ fontSize: '2rem' }}>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {activeMoodTip && (
                <div
                  class="section-box"
                  style={{
                    borderLeft: `6px solid ${activeMoodTip.color}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <strong>
                      {activeMoodTip.emoji} Supportive Tip for Feeling {activeMoodTip.label}
                    </strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.92rem' }}>{activeMoodTip.tip}</p>
                  </div>
                  <button
                    type="button"
                    class="btn primary sm"
                    onClick={() => speakText(activeMoodTip.copingSpeech)}
                  >
                    🔊 Speak: "{activeMoodTip.copingSpeech}"
                  </button>
                </div>
              )}

              <div class="section-box">
                <strong>Mood Analytics & Patterns ({moodLogs.length} check-ins)</strong>
                {moodLogs.length === 0 ? (
                  <p class="hint" style={{ marginTop: '6px' }}>
                    Tap an emotion above to log how you feel and see your mood patterns over time.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {MOODS.map((m) => {
                      const count = moodLogs.filter((l) => l.moodId === m.id).length;
                      if (count === 0) return null;
                      const pct = Math.round((count / moodLogs.length) * 100);
                      return (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '125px', fontWeight: 600, fontSize: '0.88rem' }}>
                            {m.emoji} {m.label} ({count})
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: '14px',
                              background: 'rgba(148, 163, 184, 0.2)',
                              borderRadius: '999px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: m.color,
                                borderRadius: '999px',
                              }}
                            />
                          </div>
                          <span style={{ width: '42px', fontSize: '0.82rem', textAlign: 'right' }}>
                            {pct}%
                          </span>
                        </div>
                      );
                    })}

                    <div class="phrase-list" style={{ marginTop: '8px', maxHeight: '140px' }}>
                      {moodLogs.slice(0, 12).map((entry) => {
                        const m = MOODS.find((x) => x.id === entry.moodId);
                        return (
                          <div key={entry.id} class="vocab-row">
                            <span>
                              {m?.emoji} <strong>{m?.label}</strong> &mdash;{' '}
                              <span class="hint">{entry.trigger}</span>
                            </span>
                            <span class="vocab-meta">
                              {new Date(entry.timestamp).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'games' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div class="tab-strip">
                  <button
                    type="button"
                    class={`tab-btn ${gameMode === 'sentence' ? 'active' : ''}`}
                    onClick={() => setGameMode('sentence')}
                  >
                    🧩 Sentence Builder
                  </button>
                  <button
                    type="button"
                    class={`tab-btn ${gameMode === 'emotion' ? 'active' : ''}`}
                    onClick={() => setGameMode('emotion')}
                  >
                    🎭 Emotion Match
                  </button>
                </div>
                <span class="hint" style={{ fontWeight: 700 }}>
                  🔥 Streak: {gameStreak}
                </span>
              </div>

              {gameMode === 'sentence' ? (
                <div class="section-box" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '1.8rem', marginRight: '8px' }}>
                        {currentChallenge.emoji}
                      </span>
                      <strong style={{ fontSize: '1.05rem' }}>
                        Goal: {currentChallenge.prompt}
                      </strong>
                    </div>
                    <button
                      type="button"
                      class="btn secondary sm"
                      onClick={() => speakText(currentChallenge.target.join(' '))}
                    >
                      🔊 Hear Target Sentence
                    </button>
                  </div>

                  <div
                    style={{
                      minHeight: '58px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '2px dashed var(--border-subtle)',
                      background: 'var(--bg-msg)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {builtWords.length === 0 ? (
                      <span class="hint">Tap the word tiles below in order to build the sentence...</span>
                    ) : (
                      builtWords.map((w, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: 'var(--accent)',
                            color: '#fff',
                            fontWeight: 700,
                          }}
                        >
                          {w}
                        </span>
                      ))
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {challengeWordPool.map((w, idx) => (
                      <button
                        key={`${w}-${idx}`}
                        type="button"
                        class="btn secondary"
                        style={{ fontSize: '1.02rem', padding: '12px 18px' }}
                        onClick={() => handleTapWordTile(w)}
                      >
                        {w}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <button
                      type="button"
                      class="btn secondary sm"
                      onClick={() => setBuiltWords([])}
                    >
                      Clear Tiles
                    </button>
                    <button
                      type="button"
                      class="btn secondary sm"
                      onClick={() => {
                        const nextWord = currentChallenge.target[builtWords.length];
                        if (nextWord) {
                          speakText(nextWord);
                          toast(`Hint: Next word is "${nextWord}"`, 'info');
                        }
                      }}
                    >
                      💡 Hint
                    </button>
                    <button
                      type="button"
                      class="btn primary sm"
                      onClick={() => {
                        setBuiltWords([]);
                        setSentenceIdx((i) => i + 1);
                      }}
                    >
                      Next Sentence &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <div class="section-box" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '2rem', marginRight: '8px' }}>
                        {currentScenario.emoji}
                      </span>
                      <strong style={{ fontSize: '1.05rem' }}>{currentScenario.situation}</strong>
                    </div>
                    <button
                      type="button"
                      class="btn secondary sm"
                      onClick={() => speakText(currentScenario.situation)}
                    >
                      🔊 Read Story Aloud
                    </button>
                  </div>

                  {emotionFeedback && (
                    <div class="alert-box success" style={{ margin: 0 }}>
                      {emotionFeedback}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: '8px',
                    }}
                  >
                    {MOODS.slice(0, 6).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleGuessEmotion(m)}
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          border: `2px solid ${m.color}`,
                          background: 'var(--bg-msg)',
                          color: 'var(--card-fg)',
                          cursor: 'pointer',
                          fontWeight: 700,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span style={{ fontSize: '1.9rem' }}>{m.emoji}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <button
                      type="button"
                      class="btn primary sm"
                      onClick={() => {
                        setEmotionFeedback(null);
                        setScenarioIdx((i) => i + 1);
                      }}
                    >
                      Next Story &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'aboutme' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong>"About Me" Communication Passport</strong>
                  <p class="hint" style={{ margin: '2px 0 0' }}>
                    Share likes, dislikes, allergies, and communication tips with teachers, nurses,
                    or caregivers.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    class="btn primary sm"
                    onClick={() => speakFullAboutMe()}
                  >
                    🔊 Speak Full Intro
                  </button>
                  <button
                    type="button"
                    class="btn secondary sm"
                    onClick={() => setEditingAbout(!editingAbout)}
                  >
                    {editingAbout ? 'Cancel Edit' : '✏️ Edit Profile'}
                  </button>
                </div>
              </div>

              {editingAbout ? (
                <form class="section-box" onSubmit={(e) => void saveAboutMeProfile(e)}>
                  <div class="inline-row">
                    <label class="field" style={{ flex: 1 }}>
                      <span>My Name / Nickname</span>
                      <input
                        type="text"
                        value={aboutMe.name}
                        onInput={(e) =>
                          setAboutMe({ ...aboutMe, name: (e.target as HTMLInputElement).value })
                        }
                      />
                    </label>
                    <label class="field" style={{ maxWidth: '140px' }}>
                      <span>Age</span>
                      <input
                        type="text"
                        value={aboutMe.age}
                        onInput={(e) =>
                          setAboutMe({ ...aboutMe, age: (e.target as HTMLInputElement).value })
                        }
                      />
                    </label>
                  </div>
                  <label class="field" style={{ marginTop: '8px' }}>
                    <span>How I Communicate</span>
                    <input
                      type="text"
                      value={aboutMe.communicationStyle}
                      onInput={(e) =>
                        setAboutMe({
                          ...aboutMe,
                          communicationStyle: (e.target as HTMLInputElement).value,
                        })
                      }
                    />
                  </label>
                  <label class="field" style={{ marginTop: '8px' }}>
                    <span>Things I Love (Likes & Favorites)</span>
                    <input
                      type="text"
                      value={aboutMe.likes}
                      onInput={(e) =>
                        setAboutMe({ ...aboutMe, likes: (e.target as HTMLInputElement).value })
                      }
                    />
                  </label>
                  <label class="field" style={{ marginTop: '8px' }}>
                    <span>Things That Bother Me (Dislikes & Sensory Triggers)</span>
                    <input
                      type="text"
                      value={aboutMe.dislikes}
                      onInput={(e) =>
                        setAboutMe({ ...aboutMe, dislikes: (e.target as HTMLInputElement).value })
                      }
                    />
                  </label>
                  <label class="field" style={{ marginTop: '8px' }}>
                    <span>Allergies & Medical Information</span>
                    <input
                      type="text"
                      value={aboutMe.allergies}
                      onInput={(e) =>
                        setAboutMe({ ...aboutMe, allergies: (e.target as HTMLInputElement).value })
                      }
                    />
                  </label>
                  <label class="field" style={{ marginTop: '8px' }}>
                    <span>What Helps Me Calm Down</span>
                    <input
                      type="text"
                      value={aboutMe.calmingStrategies}
                      onInput={(e) =>
                        setAboutMe({
                          ...aboutMe,
                          calmingStrategies: (e.target as HTMLInputElement).value,
                        })
                      }
                    />
                  </label>
                  <label class="field" style={{ marginTop: '8px' }}>
                    <span>Family & Emergency Contacts</span>
                    <input
                      type="text"
                      value={aboutMe.contacts}
                      onInput={(e) =>
                        setAboutMe({ ...aboutMe, contacts: (e.target as HTMLInputElement).value })
                      }
                    />
                  </label>
                  <div style={{ marginTop: '12px' }}>
                    <button type="submit" class="btn primary">
                      Save About Me
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '10px',
                  }}
                >
                  <div class="section-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>👋 Who I Am & How I Communicate</strong>
                      <button
                        type="button"
                        class="sm-btn"
                        onClick={() =>
                          speakText(
                            `${aboutMe.name ? `My name is ${aboutMe.name}.` : ''} ${aboutMe.communicationStyle}`,
                          )
                        }
                      >
                        🔊 Speak
                      </button>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.92rem' }}>
                      {aboutMe.name && (
                        <>
                          <strong>Name:</strong> {aboutMe.name}{' '}
                          {aboutMe.age ? `(${aboutMe.age})` : ''}
                          <br />
                        </>
                      )}
                      {aboutMe.communicationStyle}
                    </p>
                  </div>

                  <div
                    class="section-box"
                    style={{ borderColor: 'rgba(220, 38, 38, 0.45)', background: 'rgba(254, 226, 226, 0.2)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>⚕️ Allergies & Medical Needs</strong>
                      <button
                        type="button"
                        class="sm-btn"
                        onClick={() => speakText(`Allergies and medical needs: ${aboutMe.allergies}`)}
                      >
                        🔊 Speak
                      </button>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.92rem' }}>{aboutMe.allergies}</p>
                  </div>

                  <div class="section-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>💚 Things I Love (Likes)</strong>
                      <button
                        type="button"
                        class="sm-btn"
                        onClick={() => speakText(`Things I love include ${aboutMe.likes}`)}
                      >
                        🔊 Speak
                      </button>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.92rem' }}>{aboutMe.likes}</p>
                  </div>

                  <div class="section-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>🚫 Dislikes & Sensory Triggers</strong>
                      <button
                        type="button"
                        class="sm-btn"
                        onClick={() => speakText(`Things that bother me include ${aboutMe.dislikes}`)}
                      >
                        🔊 Speak
                      </button>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.92rem' }}>{aboutMe.dislikes}</p>
                  </div>

                  <div class="section-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>🌿 What Helps Me Calm Down</strong>
                      <button
                        type="button"
                        class="sm-btn"
                        onClick={() => speakText(`What helps me feel calm: ${aboutMe.calmingStrategies}`)}
                      >
                        🔊 Speak
                      </button>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.92rem' }}>
                      {aboutMe.calmingStrategies}
                    </p>
                  </div>

                  <div class="section-box">
                    <strong>📞 Caregiver & Emergency Contacts</strong>
                    <p style={{ margin: '6px 0 0', fontSize: '0.92rem' }}>{aboutMe.contacts}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!notesUnlocked ? (
                <form
                  class="section-box"
                  onSubmit={(e) => void handleUnlockNotes(e)}
                  style={{ maxWidth: '400px' }}
                >
                  <strong>🔒 Passcode-Protected Caregiver Notes</strong>
                  <p class="hint" style={{ margin: '4px 0 10px' }}>
                    Enter the caregiver passcode to view or add private observations.
                  </p>
                  <div class="inline-row">
                    <input
                      type="password"
                      placeholder="Passcode"
                      value={passInput}
                      onInput={(e) => {
                        setPassInput((e.target as HTMLInputElement).value);
                        setPassError(false);
                      }}
                      autoFocus
                    />
                    <button type="submit" class="btn primary sm" disabled={notesBusy}>
                      {notesBusy ? 'Unlocking…' : 'Unlock'}
                    </button>
                  </div>
                  {passError && (
                    <p class="alert-box error" style={{ marginTop: '8px' }}>
                      Incorrect passcode. Try again.
                    </p>
                  )}
                </form>
              ) : (
                <>
                  <div class="section-box">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <strong>Caregiver, Teacher & SLP Observation Log</strong>
                        <p class="hint" style={{ margin: '2px 0 0' }}>
                          Keep private timestamped observations on communication progress, sensory
                          triggers, or daily notes.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {savedPasscode && (
                          <button
                            type="button"
                            class="btn secondary sm"
                            onClick={lockNotes}
                          >
                            🔒 Lock Notes
                          </button>
                        )}
                        {notes.length > 0 && (
                          <button
                            type="button"
                            class="btn secondary sm"
                            onClick={() => exportCaregiverNotes()}
                          >
                            Export Log (.txt)
                          </button>
                        )}
                      </div>
                    </div>

                    <form
                      class="inline-row"
                      style={{ marginTop: '10px', flexWrap: 'wrap' }}
                      onSubmit={(e) => void handleSetPasscode(e)}
                    >
                      <input
                        type="password"
                        placeholder={
                          savedPasscode
                            ? 'Change passcode (blank to remove)'
                            : 'Set passcode to lock Caregiver Notes'
                        }
                        value={newPasscode}
                        onInput={(e) => setNewPasscode((e.target as HTMLInputElement).value)}
                        style={{ maxWidth: '280px' }}
                      />
                      <button type="submit" class="btn secondary sm" disabled={notesBusy}>
                        {savedPasscode ? 'Update Passcode' : 'Set Passcode'}
                      </button>
                    </form>
                    <p class="hint" style={{ margin: '8px 0 0', lineHeight: 1.5 }}>
                      {savedPasscode
                        ? 'Notes are encrypted on this device (AES-256-GCM) with a key derived from your passcode. '
                        : 'Notes are not encrypted. Set a passcode to encrypt them on this device. '}
                      A longer passcode (8+ characters) is much harder to guess than a short PIN. If
                      you forget the passcode, encrypted notes cannot be recovered.
                    </p>
                  </div>

                  <form class="section-box" onSubmit={(e) => void handleAddNote(e)}>
                    <strong>Add Observation Note</strong>
                    <div class="inline-row" style={{ marginTop: '8px', flexWrap: 'wrap' }}>
                      <select
                        value={noteCategory}
                        onChange={(e) =>
                          setNoteCategory(
                            (e.target as HTMLSelectElement).value as CaregiverNote['category'],
                          )
                        }
                      >
                        <option value="Communication">Communication</option>
                        <option value="Sensory & Behavior">Sensory & Behavior</option>
                        <option value="Medical & Health">Medical & Health</option>
                        <option value="School & Therapy">School & Therapy</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Write observation note..."
                        value={noteText}
                        onInput={(e) => setNoteText((e.target as HTMLInputElement).value)}
                        style={{ flex: 1, minWidth: '220px' }}
                        required
                      />
                      <button type="submit" class="btn primary sm">
                        Save Note
                      </button>
                    </div>
                  </form>

                  <div class="inline-row">
                    <span class="hint">Filter by category:</span>
                    <select
                      value={noteFilter}
                      onChange={(e) => setNoteFilter((e.target as HTMLSelectElement).value)}
                    >
                      <option value="All">All Categories ({notes.length})</option>
                      <option value="Communication">Communication</option>
                      <option value="Sensory & Behavior">Sensory & Behavior</option>
                      <option value="Medical & Health">Medical & Health</option>
                      <option value="School & Therapy">School & Therapy</option>
                    </select>
                  </div>

                  <div class="phrase-list" style={{ maxHeight: '240px' }}>
                    {notes.filter((n) => noteFilter === 'All' || n.category === noteFilter).length ===
                    0 ? (
                      <p class="hint">No caregiver notes recorded yet.</p>
                    ) : (
                      notes
                        .filter((n) => noteFilter === 'All' || n.category === noteFilter)
                        .map((n) => (
                          <div key={n.id} class="vocab-row">
                            <div class="vocab-info">
                              <div class="vocab-title">
                                <span class="active-pill">{n.category}</span>
                                <span class="vocab-meta">
                                  {new Date(n.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div style={{ marginTop: '4px' }}>{n.text}</div>
                            </div>
                            <button
                              type="button"
                              class="sm-btn danger-text"
                              onClick={() => void handleDeleteNote(n.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
