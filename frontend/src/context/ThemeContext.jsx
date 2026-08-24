import { createContext, useContext, useState, useEffect } from 'react'

/**
 * ThemeContext — lets the pre-login pages (Landing, Role Select, Auth) switch
 * between two brand presentations:
 *   'kpmg' — the dark navy hero treatment (original)
 *   'aima' — a light/white background with blue text, less "flashy"
 * Persisted in localStorage so it's remembered across page navigation.
 */
const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('brand_theme') === 'aima' ? 'aima' : 'kpmg' }
    catch { return 'kpmg' }
  })

  useEffect(() => {
    try { localStorage.setItem('brand_theme', theme) } catch {}
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'kpmg' ? 'aima' : 'kpmg'))

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) return { theme: 'kpmg', setTheme: () => {}, toggleTheme: () => {} }
  return ctx
}
