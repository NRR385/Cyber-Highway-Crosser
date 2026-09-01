import { useTheme } from "./context/ThemeContext";
import { HighwayCrosser } from "./game/HighwayCrosser";
import { Sun, Moon } from "lucide-react";

function App() {
  const { dark, toggleTheme } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        dark ? "bg-[#121214] text-slate-100" : "bg-[#FDFDFD] text-slate-900"
      }`}
    >
      {/* Minimal header */}
      <header
        className={`flex items-center justify-between px-6 py-3 border-b shrink-0 ${
          dark ? "bg-[#0d0d0f] border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">&#x1F438;</span>
          <span
            className={`text-sm font-bold uppercase tracking-widest ${
              dark ? "text-slate-100" : "text-slate-900"
            }`}
          >
            Cyber Highway Crosser
          </span>
        </div>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={`p-2 rounded-[4px] border transition-colors cursor-pointer ${
            dark
              ? "bg-[#1a1a1c] border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white"
              : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900"
          }`}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Game — centered in remaining space */}
      <main className="flex-1 flex items-start lg:items-center justify-center overflow-y-auto">
        <HighwayCrosser />
      </main>
    </div>
  );
}

export default App;