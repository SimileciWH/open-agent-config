import { Check, Moon, Sun } from "lucide-react";
import { useState } from "react";
import {
  applyLanguagePreference,
  getStoredLanguagePreference,
  type LanguagePreference,
} from "@/lib/i18n";
import type { Mode } from "@/stores/ui-store";
import { useUIStore } from "@/stores/ui-store";

const LANGUAGE_OPTIONS: Array<{
  value: Exclude<LanguagePreference, "system">;
  label: string;
}> = [
  { value: "en", label: "EN" },
  { value: "zh", label: "简中" },
  { value: "zh-TW", label: "繁中" },
];
const AUTO_LABEL = "auto";

function ModeIcon({ mode }: { mode: Exclude<Mode, "system"> }) {
  return mode === "light" ? (
    <Sun size={18} strokeWidth={2} />
  ) : (
    <Moon size={18} strokeWidth={2} />
  );
}

export function QuickPreferences() {
  const [languagePreference, setLanguagePreference] = useState(
    getStoredLanguagePreference,
  );
  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);
  const autoSelected = languagePreference === "system" && mode === "system";

  const chooseLanguage = async (
    preference: Exclude<LanguagePreference, "system">,
  ) => {
    setLanguagePreference(preference);
    await applyLanguagePreference(preference);
  };

  const chooseMode = (nextMode: Exclude<Mode, "system">) => {
    setMode(nextMode);
  };

  const chooseAuto = async () => {
    setLanguagePreference("system");
    setMode("system");
    await applyLanguagePreference("system");
  };

  return (
    <fieldset className="min-w-0 max-w-[min(100%,26rem)] overflow-x-auto [scrollbar-width:none]">
      <legend className="sr-only">Language and appearance preferences</legend>
      <div className="flex min-w-max items-center gap-0.5 rounded-2xl border border-border/70 bg-background/80 p-1 shadow-sm backdrop-blur-sm">
        <fieldset className="flex items-center gap-0.5">
          <legend className="sr-only">Language</legend>
          {LANGUAGE_OPTIONS.map(({ value, label }) => {
            const selected = languagePreference === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                aria-label={label}
                title={label}
                onClick={() => void chooseLanguage(value)}
                className="flex h-9 min-w-11 items-center justify-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm"
              >
                <span>{label}</span>
                {selected && <Check size={13} strokeWidth={2.5} />}
              </button>
            );
          })}
        </fieldset>

        <span className="mx-1 h-5 w-px bg-border/70" aria-hidden="true" />

        <fieldset className="flex items-center gap-0.5">
          <legend className="sr-only">Appearance</legend>
          {(["light", "dark"] as const).map((nextMode) => {
            const selected = mode === nextMode;
            return (
              <button
                key={nextMode}
                type="button"
                aria-pressed={selected}
                aria-label={nextMode === "light" ? "Light" : "Dark"}
                title={nextMode === "light" ? "Light" : "Dark"}
                onClick={() => chooseMode(nextMode)}
                className="flex h-9 w-10 items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm"
              >
                <ModeIcon mode={nextMode} />
                {selected && <Check size={13} strokeWidth={2.5} />}
              </button>
            );
          })}
        </fieldset>

        <button
          type="button"
          aria-pressed={autoSelected}
          aria-label={AUTO_LABEL}
          title={AUTO_LABEL}
          onClick={() => void chooseAuto()}
          className="flex h-9 items-center justify-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm"
        >
          <span>{AUTO_LABEL}</span>
          {autoSelected && <Check size={13} strokeWidth={2.5} />}
        </button>
      </div>
    </fieldset>
  );
}
