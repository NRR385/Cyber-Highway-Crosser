import { useTheme } from "./context/ThemeContext";
import { HighwayCrosser } from "./game/HighwayCrosser";
import { Sun, Moon } from "lucide-react";

function App() {
  const { dark, toggleTheme } = useTheme();

  return (
    <div
      className={`h-screen w-full flex flex-col transition-colors duration-300 overflow-hidden ${
        dark ? "bg-[#09090b] text-slate-100" : "bg-[#FDFDFD] text-slate-900"
      }`}
    >
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={`p-2 rounded-full border transition-colors cursor-pointer shadow-lg ${
            dark
              ? "bg-[#1a1a1c]/80 backdrop-blur-sm border-slate-800 text-slate-400 hover:border-cyan-500 hover:text-cyan-400"
              : "bg-white/80 backdrop-blur-sm border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900"
          }`}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Game Area */}
      <main className="flex-1 w-full h-full">
        <HighwayCrosser />
      </main>
    </div>
  );
}

export default App;