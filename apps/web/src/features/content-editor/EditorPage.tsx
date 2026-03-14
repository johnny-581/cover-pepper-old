import { Moon, Sun } from "lucide-react";
import { ContentEditor } from "./ContentEditor";
import { JsonPanel } from "./components/JsonPanel";
import { Button } from "@/components/ui/button";
import { useThemeMode } from "@/components/theme/useThemeMode";

export function EditorPage() {
  const { theme, toggleTheme } = useThemeMode();
  const isDark = theme === "dark";

  return (
    <div className="flex h-screen bg-background text-foreground font-sans text-md">
      <div className="flex-3 overflow-auto bg-background">
        <div className="px-8 pb-8">
          <div className="flex items-center py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={toggleTheme}
              aria-label={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun /> : <Moon />}
              {isDark ? "Light" : "Dark"}
            </Button>
          </div>
          <div className="min-h-[calc(100vh-4rem)] rounded-2xl border border-border bg-background px-10 py-8 text-foreground">
            <ContentEditor />
          </div>
        </div>
      </div>
      <div className="flex-2 min-w-0">
        <JsonPanel />
      </div>
    </div>
  );
}
