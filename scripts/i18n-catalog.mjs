// Lists every interface string that goes through t(), so the locale files can be checked
// for missing translations. Run: node scripts/i18n-catalog.mjs [--json]
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import fs from 'node:fs';
import path from 'node:path';

const traverse = _traverse.default || _traverse;
const keys = new Set();
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk('src').filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes('/locales/'));

// Lists of built-in content whose English text is translated where it's shown or spoken.
const CONTENT = {
  'src/engine/speech.ts': { NEURAL_OFFLINE_MODELS: ['description'] },
  'src/ui/ToolsModal.tsx': {
    DEFAULT_REWARD: [],
    DEFAULT_PLANNER_TASKS: ['title', 'period'],
    MOODS: ['label', 'spoken', 'tip', 'copingSpeech'],
    MOOD_TRIGGERS: [],
    SENTENCE_CHALLENGES: ['prompt', 'target', 'distractors'],
    EMOTION_SCENARIOS: ['situation', 'explanation'],
    DEFAULT_ABOUT_ME: ['communicationStyle', 'likes', 'dislikes', 'allergies', 'calmingStrategies', 'contacts'],
  },
};

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const ast = parse(src, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const content = CONTENT[f];
  traverse(ast, {
    CallExpression(p) {
      if (p.node.callee.type === 'Identifier' && p.node.callee.name === 't') {
        const a = p.node.arguments[0];
        if (a?.type === 'StringLiteral') keys.add(a.value);
      }
    },
    VariableDeclarator(p) {
      if (!content || !(p.node.id.name in content)) return;
      const fields = content[p.node.id.name];
      const init = p.node.init;
      const addStr = (n) => n?.type === 'StringLiteral' && n.value && keys.add(n.value);
      if (init.type === 'StringLiteral') addStr(init);
      if (init.type === 'ArrayExpression' && !fields.length) init.elements.forEach(addStr);
      const objs = init.type === 'ArrayExpression' ? init.elements : [init];
      for (const o of objs) {
        if (o?.type !== 'ObjectExpression') continue;
        for (const prop of o.properties) {
          const k = prop.key?.name;
          if (!fields.includes(k)) continue;
          if (prop.value.type === 'ArrayExpression') {
            const words = prop.value.elements.map((e) => e.value);
            if (k === 'target') keys.add(words.join(' '));
            else words.forEach((w) => keys.add(w));
          } else addStr(prop.value);
        }
      }
    },
  });
}

const list = [...keys].filter((k) => /\p{L}/u.test(k)).sort();
if (process.argv.includes('--json')) console.log(JSON.stringify(list, null, 1));
else {
  const langs = ['es', 'fr', 'de', 'pt', 'it', 'ar', 'zh', 'hi', 'tl'];
  console.log(`${list.length} strings`);
  for (const l of langs) {
    const file = `src/locales/${l}.ts`;
    const text = fs.readFileSync(file, 'utf8');
    const dict = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1) || '{}');
    const missing = list.filter((k) => dict[k] === undefined);
    console.log(`${l}: ${missing.length} missing`);
  }
}
