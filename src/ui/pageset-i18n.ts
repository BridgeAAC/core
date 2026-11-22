import type { LangCode } from '../i18n';

export interface PageSetStrings {
  title: string;
  subtitle: string;
  all: string;
  strict: string;
  language: string;
  back: string;
  next: string;
  loading: string;
  loaded: (name: string, grid: string) => string;
  desc: Record<42 | 50 | 60 | 84 | 108, string>;
}

export const PAGESET_STRINGS: Record<LangCode, PageSetStrings> = {
  en: {
    title: 'Choose a starting board',
    subtitle: 'Pick the one that fits best. You can switch or edit it any time.',
    all: 'All', strict: 'Strict ARASAAC', language: 'Language:', back: 'Back', next: 'Continue', loading: 'Loading...',
    loaded: (n, g) => `Loaded "${n}" (${g})`,
    desc: {
      42: 'Bigger buttons and fewer choices. A good place to start.',
      60: 'The everyday set. Room to grow without crowding the screen.',
      84: 'More words on the home page for confident communicators.',
      108: 'The most words per page. Best on larger tablets.',
      50: 'Every button uses an ARASAAC picture, color-coded by word type.',
    },
  },
  es: {
    title: 'Elige un tablero para empezar',
    subtitle: 'Elige el que mejor se adapte. Puedes cambiarlo o editarlo cuando quieras.',
    all: 'Todos', strict: 'Solo ARASAAC', language: 'Idioma:', back: 'Atrás', next: 'Continuar', loading: 'Cargando...',
    loaded: (n, g) => `Se cargó "${n}" (${g})`,
    desc: {
      42: 'Botones más grandes y menos opciones. Un buen punto de partida.',
      60: 'El tablero de todos los días. Espacio para crecer sin llenar la pantalla.',
      84: 'Más palabras en la página de inicio para comunicadores con experiencia.',
      108: 'La mayor cantidad de palabras por página. Mejor en tabletas grandes.',
      50: 'Cada botón usa un pictograma de ARASAAC, con colores por tipo de palabra.',
    },
  },
  fr: {
    title: 'Choisissez un tableau de départ',
    subtitle: 'Choisissez celui qui convient le mieux. Vous pourrez le changer ou le modifier à tout moment.',
    all: 'Tous', strict: 'ARASAAC uniquement', language: 'Langue :', back: 'Retour', next: 'Continuer', loading: 'Chargement...',
    loaded: (n, g) => `« ${n} » chargé (${g})`,
    desc: {
      42: 'Des boutons plus grands et moins de choix. Idéal pour commencer.',
      60: 'Le tableau du quotidien. De la place pour progresser sans surcharger l’écran.',
      84: 'Plus de mots sur la page d’accueil pour les communicateurs à l’aise.',
      108: 'Le plus de mots par page. Idéal sur les grandes tablettes.',
      50: 'Chaque bouton utilise un pictogramme ARASAAC, coloré selon le type de mot.',
    },
  },
  de: {
    title: 'Wähle eine Starttafel',
    subtitle: 'Wähle die passende aus. Du kannst sie jederzeit wechseln oder bearbeiten.',
    all: 'Alle', strict: 'Nur ARASAAC', language: 'Sprache:', back: 'Zurück', next: 'Weiter', loading: 'Wird geladen...',
    loaded: (n, g) => `„${n}“ geladen (${g})`,
    desc: {
      42: 'Größere Tasten und weniger Auswahl. Ein guter Anfang.',
      60: 'Die Tafel für jeden Tag. Platz zum Wachsen, ohne den Bildschirm zu überladen.',
      84: 'Mehr Wörter auf der Startseite für sichere Kommunikatoren.',
      108: 'Die meisten Wörter pro Seite. Am besten auf großen Tablets.',
      50: 'Jede Taste hat ein ARASAAC-Bild, farbig nach Wortart.',
    },
  },
  pt: {
    title: 'Escolha um quadro inicial',
    subtitle: 'Escolha o que combina melhor. Você pode trocar ou editar quando quiser.',
    all: 'Todos', strict: 'Só ARASAAC', language: 'Idioma:', back: 'Voltar', next: 'Continuar', loading: 'Carregando...',
    loaded: (n, g) => `"${n}" carregado (${g})`,
    desc: {
      42: 'Botões maiores e menos opções. Um bom começo.',
      60: 'O quadro do dia a dia. Espaço para crescer sem lotar a tela.',
      84: 'Mais palavras na página inicial para quem já se comunica com confiança.',
      108: 'O máximo de palavras por página. Melhor em tablets grandes.',
      50: 'Cada botão usa um pictograma ARASAAC, com cores por tipo de palavra.',
    },
  },
  it: {
    title: 'Scegli una tabella iniziale',
    subtitle: 'Scegli quella più adatta. Puoi cambiarla o modificarla quando vuoi.',
    all: 'Tutte', strict: 'Solo ARASAAC', language: 'Lingua:', back: 'Indietro', next: 'Continua', loading: 'Caricamento...',
    loaded: (n, g) => `"${n}" caricata (${g})`,
    desc: {
      42: 'Pulsanti più grandi e meno scelte. Un buon punto di partenza.',
      60: 'La tabella di tutti i giorni. Spazio per crescere senza affollare lo schermo.',
      84: 'Più parole nella pagina iniziale per comunicatori sicuri.',
      108: 'Il maggior numero di parole per pagina. Ideale sui tablet grandi.',
      50: 'Ogni pulsante usa un pittogramma ARASAAC, colorato per tipo di parola.',
    },
  },
  ar: {
    title: 'اختر لوحة للبدء',
    subtitle: 'اختر الأنسب لك. يمكنك تغييرها أو تعديلها في أي وقت.',
    all: 'الكل', strict: 'ARASAAC فقط', language: 'اللغة:', back: 'رجوع', next: 'متابعة', loading: 'جارٍ التحميل...',
    loaded: (n, g) => `تم تحميل "${n}" (${g})`,
    desc: {
      42: 'أزرار أكبر وخيارات أقل. بداية جيدة.',
      60: 'اللوحة اليومية. مساحة للتطور دون ازدحام الشاشة.',
      84: 'كلمات أكثر في الصفحة الرئيسية للمتواصلين الواثقين.',
      108: 'أكبر عدد من الكلمات في الصفحة. الأفضل للأجهزة اللوحية الكبيرة.',
      50: 'كل زر يستخدم صورة من ARASAAC، ملونة حسب نوع الكلمة.',
    },
  },
  zh: {
    title: '选择一个起始词板',
    subtitle: '选择最合适的一个。之后随时可以更换或编辑。',
    all: '全部', strict: '仅 ARASAAC', language: '语言：', back: '返回', next: '继续', loading: '正在加载...',
    loaded: (n, g) => `已加载“${n}”（${g}）`,
    desc: {
      42: '按钮更大，选项更少。适合刚开始使用。',
      60: '日常词板。有成长空间，屏幕也不拥挤。',
      84: '主页上词汇更多，适合熟练的沟通者。',
      108: '每页词汇最多。最适合大屏平板。',
      50: '每个按钮都使用 ARASAAC 图片，并按词类着色。',
    },
  },
  hi: {
    title: 'शुरुआती बोर्ड चुनें',
    subtitle: 'जो सबसे अच्छा लगे वह चुनें। आप इसे कभी भी बदल या संपादित कर सकते हैं।',
    all: 'सभी', strict: 'केवल ARASAAC', language: 'भाषा:', back: 'वापस', next: 'जारी रखें', loading: 'लोड हो रहा है...',
    loaded: (n, g) => `"${n}" लोड हो गया (${g})`,
    desc: {
      42: 'बड़े बटन और कम विकल्प। शुरुआत के लिए अच्छा।',
      60: 'रोज़ का बोर्ड। स्क्रीन भरे बिना आगे बढ़ने की जगह।',
      84: 'होम पेज पर ज़्यादा शब्द, आत्मविश्वासी संवादकों के लिए।',
      108: 'हर पेज पर सबसे ज़्यादा शब्द। बड़े टैबलेट पर सबसे अच्छा।',
      50: 'हर बटन में ARASAAC चित्र है, शब्द के प्रकार के अनुसार रंग।',
    },
  },
  tl: {
    title: 'Pumili ng panimulang board',
    subtitle: 'Piliin ang pinakaangkop. Puwede mo itong palitan o i-edit kahit kailan.',
    all: 'Lahat', strict: 'ARASAAC lang', language: 'Wika:', back: 'Bumalik', next: 'Magpatuloy', loading: 'Naglo-load...',
    loaded: (n, g) => `Na-load ang "${n}" (${g})`,
    desc: {
      42: 'Mas malalaking button at mas kaunting pagpipilian. Magandang simula.',
      60: 'Ang pang-araw-araw na board. May puwang lumago nang hindi siksik ang screen.',
      84: 'Mas maraming salita sa home page para sa mga sanay nang makipag-usap.',
      108: 'Pinakamaraming salita bawat page. Pinakamainam sa malalaking tablet.',
      50: 'Bawat button ay may larawang ARASAAC, may kulay ayon sa uri ng salita.',
    },
  },
};
