import { Languages } from 'lucide-react';
import { LANGUAGE_OPTIONS, useLanguage } from '../lib/i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return <label className="language-switcher" aria-label="Language">
    <Languages size={15}/>
    <select value={language} onChange={(e) => setLanguage(e.target.value as typeof language)}>
      {LANGUAGE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
    </select>
  </label>;
}
