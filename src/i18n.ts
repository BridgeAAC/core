import { settings } from './settings';

export type LangCode = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'ar' | 'zh' | 'hi' | 'tl';

export interface LanguageInfo {
  code: LangCode;
  bcp47: string;
  arasaac: string;
  nativeName: string;
  englishName: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', bcp47: 'en-US', arasaac: 'en', nativeName: 'English', englishName: 'English', dir: 'ltr' },
  { code: 'es', bcp47: 'es-MX', arasaac: 'es', nativeName: 'Español', englishName: 'Spanish', dir: 'ltr' },
  { code: 'fr', bcp47: 'fr-FR', arasaac: 'fr', nativeName: 'Français', englishName: 'French', dir: 'ltr' },
  { code: 'de', bcp47: 'de-DE', arasaac: 'de', nativeName: 'Deutsch', englishName: 'German', dir: 'ltr' },
  { code: 'pt', bcp47: 'pt-BR', arasaac: 'pt', nativeName: 'Português', englishName: 'Portuguese', dir: 'ltr' },
  { code: 'it', bcp47: 'it-IT', arasaac: 'it', nativeName: 'Italiano', englishName: 'Italian', dir: 'ltr' },
  { code: 'ar', bcp47: 'ar-SA', arasaac: 'ar', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl' },
  { code: 'zh', bcp47: 'zh-CN', arasaac: 'zh', nativeName: '中文', englishName: 'Chinese (Mandarin)', dir: 'ltr' },
  { code: 'hi', bcp47: 'hi-IN', arasaac: 'en', nativeName: 'हिन्दी', englishName: 'Hindi', dir: 'ltr' },
  { code: 'tl', bcp47: 'fil-PH', arasaac: 'en', nativeName: 'Tagalog', englishName: 'Tagalog (Filipino)', dir: 'ltr' },
];

export function normalizeLangCode(raw?: string | null): LangCode {
  if (!raw) return 'en';
  const prefix = raw.trim().toLowerCase().replace(/_/g, '-').split('-')[0];
  if (prefix === 'fil') return 'tl';
  const match = SUPPORTED_LANGUAGES.find((l) => l.code === prefix);
  return match ? match.code : 'en';
}

export function getLanguageInfo(raw?: string | null): LanguageInfo {
  const code = normalizeLangCode(raw);
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? SUPPORTED_LANGUAGES[0];
}

export function resolveActiveLang(vocabLocale?: string | null): LangCode {
  const pref = settings.value.uiLanguage;
  if (pref && pref !== 'auto') return normalizeLangCode(pref);
  if (vocabLocale) return normalizeLangCode(vocabLocale);
  if (typeof navigator !== 'undefined' && navigator.language) {
    return normalizeLangCode(navigator.language);
  }
  return 'en';
}

export interface UiStrings {
  home: string;
  back: string;
  findWord: string;
  pages: string;
  vocabularies: string;
  keyboard: string;
  phrases: string;
  edit: string;
  done: string;
  install: string;
  settings: string;
  speak: string;
  stop: string;
  word: string;
  letter: string;
  clear: string;
  save: string;
  messagePlaceholder: string;
  editingBanner: string;
  undo: string;
  redo: string;
}

const UI_TRANSLATIONS: Record<LangCode, UiStrings> = {
  en: {
    home: 'Home',
    back: 'Back',
    findWord: 'Find Word',
    pages: 'Pages',
    vocabularies: 'Vocabularies',
    keyboard: 'Keyboard',
    phrases: 'Phrases',
    edit: 'Edit',
    done: 'Done',
    install: 'Install',
    settings: 'Settings',
    speak: 'Speak',
    stop: 'Stop',
    word: 'Word',
    letter: 'Letter',
    clear: 'Clear',
    save: 'Save',
    messagePlaceholder: 'Tap the buttons to build a message',
    editingBanner: 'Editing. Tap a button to change it, or drag it somewhere else.',
    undo: 'Undo',
    redo: 'Redo',
  },
  es: {
    home: 'Inicio',
    back: 'Atrás',
    findWord: 'Buscar',
    pages: 'Páginas',
    vocabularies: 'Tableros',
    keyboard: 'Teclado',
    phrases: 'Frases',
    edit: 'Editar',
    done: 'Listo',
    install: 'Instalar',
    settings: 'Ajustes',
    speak: 'Hablar',
    stop: 'Parar',
    word: 'Palabra',
    letter: 'Letra',
    clear: 'Borrar',
    save: 'Guardar',
    messagePlaceholder: 'Toca los botones para formar un mensaje',
    editingBanner: 'Modo edición. Toca un botón para cambiarlo o arrástralo.',
    undo: 'Deshacer',
    redo: 'Rehacer',
  },
  fr: {
    home: 'Accueil',
    back: 'Retour',
    findWord: 'Chercher',
    pages: 'Pages',
    vocabularies: 'Tableaux',
    keyboard: 'Clavier',
    phrases: 'Phrases',
    edit: 'Modifier',
    done: 'Terminé',
    install: 'Installer',
    settings: 'Réglages',
    speak: 'Parler',
    stop: 'Arrêter',
    word: 'Mot',
    letter: 'Lettre',
    clear: 'Effacer',
    save: 'Sauver',
    messagePlaceholder: 'Touchez les boutons pour écrire un message',
    editingBanner: 'Modification. Touchez un bouton pour le modifier ou glissez-le.',
    undo: 'Annuler',
    redo: 'Rétablir',
  },
  de: {
    home: 'Start',
    back: 'Zurück',
    findWord: 'Wort suchen',
    pages: 'Seiten',
    vocabularies: 'Vokabulare',
    keyboard: 'Tastatur',
    phrases: 'Sätze',
    edit: 'Bearbeiten',
    done: 'Fertig',
    install: 'App',
    settings: 'Optionen',
    speak: 'Sprechen',
    stop: 'Stopp',
    word: 'Wort',
    letter: 'Buchst.',
    clear: 'Löschen',
    save: 'Merken',
    messagePlaceholder: 'Tippe auf Felder, um eine Nachricht zu bilden',
    editingBanner: 'Bearbeitungsmodus. Tippe auf ein Feld oder ziehe es an einen neuen Platz.',
    undo: 'Rückgängig',
    redo: 'Wiederholen',
  },
  pt: {
    home: 'Início',
    back: 'Voltar',
    findWord: 'Buscar',
    pages: 'Páginas',
    vocabularies: 'Pranchas',
    keyboard: 'Teclado',
    phrases: 'Frases',
    edit: 'Editar',
    done: 'Pronto',
    install: 'Instalar',
    settings: 'Ajustes',
    speak: 'Falar',
    stop: 'Parar',
    word: 'Palavra',
    letter: 'Letra',
    clear: 'Limpar',
    save: 'Salvar',
    messagePlaceholder: 'Toque nos botões para montar uma mensagem',
    editingBanner: 'Editando. Toque em um botão para alterar ou arraste-o.',
    undo: 'Desfazer',
    redo: 'Refazer',
  },
  it: {
    home: 'Home',
    back: 'Indietro',
    findWord: 'Cerca',
    pages: 'Pagine',
    vocabularies: 'Tabelle',
    keyboard: 'Tastiera',
    phrases: 'Frasi',
    edit: 'Modifica',
    done: 'Fatto',
    install: 'Installa',
    settings: 'Impostazioni',
    speak: 'Parla',
    stop: 'Ferma',
    word: 'Parola',
    letter: 'Lettera',
    clear: 'Cancella',
    save: 'Salva',
    messagePlaceholder: 'Tocca i pulsanti per comporre un messaggio',
    editingBanner: 'Modifica attiva. Tocca un pulsante per cambiarlo o trascinalo.',
    undo: 'Annulla',
    redo: 'Ripeti',
  },
  ar: {
    home: 'الرئيسية',
    back: 'رجوع',
    findWord: 'بحث',
    pages: 'الصفحات',
    vocabularies: 'اللوحات',
    keyboard: 'لوحة المفاتيح',
    phrases: 'عبارات',
    edit: 'تعديل',
    done: 'تم',
    install: 'تثبيت',
    settings: 'الإعدادات',
    speak: 'تحدث',
    stop: 'إيقاف',
    word: 'كلمة',
    letter: 'حرف',
    clear: 'مسح',
    save: 'حفظ',
    messagePlaceholder: 'اضغط على الأزرار لتكوين رسالة',
    editingBanner: 'وضع التعديل. اضغط على زر لتعديله أو اسحبه لمكان آخر.',
    undo: 'تراجع',
    redo: 'إعادة',
  },
  zh: {
    home: '首页',
    back: '返回',
    findWord: '查词',
    pages: '页面',
    vocabularies: '词库',
    keyboard: '键盘',
    phrases: '常用语',
    edit: '编辑',
    done: '完成',
    install: '安装',
    settings: '设置',
    speak: '朗读',
    stop: '停止',
    word: '删词',
    letter: '退格',
    clear: '清空',
    save: '收藏',
    messagePlaceholder: '点击按钮组合句子',
    editingBanner: '编辑模式：点击按钮进行修改，或拖动调整位置。',
    undo: '撤销',
    redo: '重做',
  },
  hi: {
    home: 'मुख्य',
    back: 'पीछे',
    findWord: 'खोजें',
    pages: 'पन्ने',
    vocabularies: 'शब्दावली',
    keyboard: 'कीबोर्ड',
    phrases: 'वाक्य',
    edit: 'बदलें',
    done: 'पूर्ण',
    install: 'इंस्टॉल',
    settings: 'सेटिंग्स',
    speak: 'बोलें',
    stop: 'रोकें',
    word: 'शब्द',
    letter: 'अक्षर',
    clear: 'साफ़',
    save: 'सहेजें',
    messagePlaceholder: 'संदेश बनाने के लिए बटन दबाएँ',
    editingBanner: 'संपादन मोड: बटन बदलने के लिए उस पर टैप करें या खींचें।',
    undo: 'पूर्ववत',
    redo: 'फिर से',
  },
  tl: {
    home: 'Home',
    back: 'Balik',
    findWord: 'Hanapin',
    pages: 'Pahina',
    vocabularies: 'Bokabularyo',
    keyboard: 'Tipaan',
    phrases: 'Parirala',
    edit: 'Baguhin',
    done: 'Tapos',
    install: 'I-install',
    settings: 'Settings',
    speak: 'Magsalita',
    stop: 'Hinto',
    word: 'Salita',
    letter: 'Titik',
    clear: 'Burahin',
    save: 'I-save',
    messagePlaceholder: 'Pindutin ang mga button para bumuo ng mensahe',
    editingBanner: 'Nag-e-edit. Pindutin ang button para baguhin o i-drag ito.',
    undo: 'I-undo',
    redo: 'I-redo',
  },
};

export function ui(lang?: LangCode | string | null): UiStrings {
  const code = lang ? normalizeLangCode(lang) : resolveActiveLang();
  return UI_TRANSLATIONS[code] ?? UI_TRANSLATIONS.en;
}
