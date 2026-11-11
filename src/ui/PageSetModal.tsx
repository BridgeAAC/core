import { useState } from 'preact/hooks';
import { installStarter, openVocab, panel, toast, vocab } from '../state';
import { updateSettings } from '../settings';
import { PAGE_SETS, type PageSetSize } from '../data/starter';
import { SUPPORTED_LANGUAGES, type LangCode, resolveActiveLang } from '../i18n';

interface PageSetModalProps {
  isOnboarding?: boolean;
}

export function PageSetModal({ isOnboarding = false }: PageSetModalProps) {
  const currentLang = resolveActiveLang(vocab.value?.locale);
  const [selectedSize, setSelectedSize] = useState<PageSetSize>(60);
  const [selectedLocale, setSelectedLocale] = useState<LangCode>(
    (SUPPORTED_LANGUAGES.some((l) => l.code === currentLang) ? currentLang : 'en') as LangCode,
  );
  const [filter, setFilter] = useState<'all' | 'bridgewords' | 'arasaac'>('all');
  const [installing, setInstalling] = useState(false);

  const filteredSets = PAGE_SETS.filter((p) => {
    if (filter === 'bridgewords') return p.category === 'bridgewords';
    if (filter === 'arasaac') return p.category === 'arasaac';
    return true;
  });

  function handleBack() {
    if (isOnboarding) {
      updateSettings({ onboarded: true });
    }
    panel.value = null;
  }

  async function handleNext() {
    if (installing) return;
    setInstalling(true);
    try {
      const chosen = PAGE_SETS.find((p) => p.size === selectedSize) ?? PAGE_SETS[1];
      const id = await installStarter(selectedLocale, selectedSize);
      await openVocab(id);
      updateSettings({ onboarded: true });
      toast(`Loaded "${chosen.name}" (${chosen.grid})`, 'success');
      panel.value = null;
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div class="modal-backdrop pageset-backdrop" onClick={handleBack}>
      <div
        class="modal-card pageset-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Choose a Page Set"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="pageset-header">
          <h1 class="pageset-title">Choose a Page Set</h1>
          <p class="pageset-subtitle">
            Select the vocabulary that best fits your needs. You can change this later.
          </p>
        </div>

        <div class="pageset-toolbar">
          <div class="pageset-segmented" role="tablist" aria-label="Page set category">
            <button
              type="button"
              class={`pageset-seg-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              role="tab"
              aria-selected={filter === 'all'}
            >
              All
            </button>
            <button
              type="button"
              class={`pageset-seg-btn ${filter === 'bridgewords' ? 'active' : ''}`}
              onClick={() => setFilter('bridgewords')}
              role="tab"
              aria-selected={filter === 'bridgewords'}
            >
              BridgeWords
            </button>
            <button
              type="button"
              class={`pageset-seg-btn ${filter === 'arasaac' ? 'active' : ''}`}
              onClick={() => setFilter('arasaac')}
              role="tab"
              aria-selected={filter === 'arasaac'}
            >
              Strict ARASAAC
            </button>
          </div>

          <label class="pageset-lang-label">
            <span>Language:</span>
            <select
              value={selectedLocale}
              onChange={(e) => setSelectedLocale((e.target as HTMLSelectElement).value as LangCode)}
              class="pageset-lang-select"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.englishName})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div class="pageset-grid">
          {filteredSets.map((p) => {
            const isSelected = selectedSize === p.size;
            const isFeatured = filter === 'all' && p.category === 'arasaac';
            return (
              <button
                key={p.size}
                type="button"
                class={`pageset-card ${isSelected ? 'selected' : ''} ${isFeatured ? 'featured' : ''}`}
                onClick={() => setSelectedSize(p.size)}
                aria-pressed={isSelected}
              >
                <div class="pageset-card-main">
                  <h2 class="pageset-card-title">{p.name}</h2>
                  <p class="pageset-card-desc">{p.description}</p>
                </div>
                <div class={`pageset-badge ${p.badge ? 'is-arasaac' : ''}`}>
                  {p.badge ? `${p.grid} • ${p.badge}` : p.grid}
                </div>
              </button>
            );
          })}
        </div>

        <div class="pageset-footer">
          <button
            type="button"
            class="pageset-btn pageset-btn-back"
            onClick={handleBack}
            disabled={installing}
          >
            Back
          </button>
          <button
            type="button"
            class="pageset-btn pageset-btn-next"
            onClick={() => void handleNext()}
            disabled={installing}
          >
            {installing ? 'Loading...' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
