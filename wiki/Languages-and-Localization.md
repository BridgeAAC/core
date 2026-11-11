# Languages & Localization Guide

BridgeAAC is built for a global community. It features complete, localized starter vocabularies across **10 languages**, custom on-screen keyboards, specialized word prediction dictionaries, neural voice models, and full bidirectional **Right-to-Left (RTL)** text flow.

> [!NOTE]
> **Complete Offline Multilingual Independence**: All 10 starter vocabularies, dictionaries, and character keyboards are bundled locally. Communicators can switch languages offline at any time.

---

## 1. Supported Languages Overview

Every language includes an **11-page starter vocabulary** (Home, Quick Chat, Food & Drink, Places, People, Actions, Feelings, Describe, Things, Time, Colors) with 100% symbol coverage:

| Language | Code | Direction | Wordlist Size | On-Screen Keyboard | Offline Neural Piper Voice |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **English** | `en` | LTR | 2,500+ words | Standard QWERTY | `en_US-amy-low`, `en_US-hfc_female-medium`, `en_GB-alba-medium` |
| **Spanish** (*Español*) | `es` | LTR | 1,800+ words | QWERTY with `ñ`, `á`, `é`, `í`, `ó`, `ú` | `es_MX-ald-medium`, `es_ES-davefx-medium` |
| **French** (*Français*) | `fr` | LTR | 1,600+ words | AZERTY with `é`, `è`, `ê`, `à`, `ç` | `fr_FR-siwis-medium` |
| **German** (*Deutsch*) | `de` | LTR | 1,700+ words | QWERTZ with `ä`, `ö`, `ü`, `ß` | `de_DE-thorsten-medium` |
| **Portuguese** (*Português*) | `pt` | LTR | 1,500+ words | QWERTY with `ã`, `õ`, `ç`, `é` | `pt_BR-faber-medium` |
| **Italian** (*Italiano*) | `it` | LTR | 1,500+ words | Standard QWERTY | `it_IT-riccardo-x_low` |
| **Arabic** (*العربية*) | `ar` | **RTL** | 1,400+ words | 28-letter Arabic Keyboard | `ar_JO-kareem-medium` |
| **Chinese** (*中文/普通话*) | `zh` | LTR | 1,200+ words | Pinyin QWERTY Keyboard | `zh_CN-huayan-medium` |
| **Hindi** (*हिन्दी*) | `hi` | LTR | 1,100+ words | Devanagari Vowel/Consonant Keyboard | Built-in meSpeak Phonetic + System TTS |
| **Tagalog** (*Filipino*) | `tl` | LTR | 1,200+ words | Standard Filipino QWERTY | Built-in meSpeak Phonetic + System TTS |

---

## 2. Arabic & Right-to-Left (RTL) Engine

Arabic requires specialized bidirectional layout processing. When an Arabic vocabulary is active:

1. **Grid Mirroring (`dir="rtl"`)**:
   - The communication grid flows from right to left. Column 0 begins on the right edge of the screen.
   - Core pronouns (*أنا*, *نحن*) appear in the rightmost column according to native reading patterns.
2. **Message Window Flow**:
   - Spoken message tiles flow right-to-left.
   - Deletion and backspace remove items from the visual left (end of sentence).
3. **Arabic Keyboard**:
   - Includes a full 28-letter Arabic keyboard with common vowel diacritics (*fatḥah*, *ḍammah*, *kasrah*, *sukūn*).
4. **Phonetic Speech & Piper Integration**:
   - Uses `ar_JO-kareem-medium` for natural Jordanian / Levantine neural speech, with meSpeak phonetic romanization fallback.

---

## 3. Localized On-Screen Keyboards

For communicators who spell novel words or want to combine grid communication with literacy:

- **Quick Keyboard**: Tap the **Keyboard** icon in the message bar to slide up the on-screen keyboard without leaving the active vocabulary.
- **Word Prediction**: As you type letters, intelligent suggestions appear above the keyboard bar. The prediction engine factors in word frequency, prefix matching, and learned personal vocabulary phrases.
- **Backspace & Word Delete**: Features both a single-character backspace and a quick `Delete Word` action for easy correction.

---

## 4. Switching Vocabularies & Bilingual Communication

Bilingual AAC users often switch between home language and school language:

1. Tap **Vocab** in the top navigation bar.
2. Under **Starter Vocabularies**, tap the desired language (e.g., *Spanish*).
3. The board, UI menus, and keyboards instantly update to the chosen language.
4. You can keep multiple customized boards in your library (e.g., *Home Spanish Board* and *School English Board*) and toggle between them in two taps.
