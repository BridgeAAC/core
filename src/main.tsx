import { render } from 'preact';
import { App } from './ui/App';
import { boardLocale, loadLanguage, uiLang } from './i18n/t';
import './styles.css';

async function start() {
  try {
    boardLocale.value = localStorage.getItem('bridgeaac.boardLocale') ?? undefined;
  } catch {}
  // Load the interface language before the first paint so the app doesn't flash English.
  await Promise.race([loadLanguage(uiLang()), new Promise((r) => setTimeout(r, 1500))]);
  const root = document.getElementById('app');
  if (root) {
    render(<App />, root);
    document.getElementById('intro')?.remove();
  }
}

void start();
