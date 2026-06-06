import { Menu, Moon, Sun } from 'lucide-react'
import { useContext } from 'react'
import { ThemeContext } from '../contexts/ThemeContext'
import { Link } from 'react-router-dom'

export default function Topbar({ onMenuClick }) {
  const { theme, toggleTheme } = useContext(ThemeContext)

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors lg:hidden"
        >
          <Menu size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
