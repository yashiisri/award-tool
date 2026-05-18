import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Award, Trophy, FileText, BarChart3 } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import JuryAwards from '../components/jury/JuryAwards'
import JuryNominees from '../components/jury/JuryNominees'
import JuryRanking from '../components/jury/JuryRanking'
import JuryResults from '../components/jury/JuryResults'

const BASE_NAV = [
  { path: '/jury/awards',   icon: Award,    label: 'Award Categories', awardParam: false },
  { path: '/jury/nominees', icon: FileText,  label: 'Nominees & Validate', awardParam: true },
  { path: '/jury/ranking',  icon: Trophy,    label: 'Jury Ranking', awardParam: true },
  { path: '/jury/results',  icon: BarChart3, label: 'Results', awardParam: true },
]

function useSelectedAward() {
  const location = useLocation()
  // Award from current URL takes priority, then fall back to localStorage
  const urlAward = new URLSearchParams(location.search).get('award')
  const [award, setAward] = useState(urlAward || localStorage.getItem('jury_selected_award') || '')

  useEffect(() => {
    if (urlAward) {
      localStorage.setItem('jury_selected_award', urlAward)
      setAward(urlAward)
    } else {
      const stored = localStorage.getItem('jury_selected_award') || ''
      setAward(stored)
    }
  }, [urlAward, location.pathname])

  return award
}

export default function JuryDashboard({ onLogout, username }) {
  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden">
      <JuryDashboardInner onLogout={onLogout} username={username} />
    </div>
  )
}

// Inner component so useLocation works inside BrowserRouter context
function JuryDashboardInner({ onLogout, username }) {
  const selectedAward = useSelectedAward()

  // Build nav items — append ?award= to pages that need it
  const navItems = BASE_NAV.map(item => ({
    ...item,
    path: item.awardParam && selectedAward
      ? `${item.path}?award=${selectedAward}`
      : item.path,
    // Keep the base path for active-state matching
    basePath: item.path,
  }))

  return (
    <>
      <Sidebar navItems={navItems} role="jury" username={username} onLogout={onLogout} />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/awards"   element={<JuryAwards />} />
          <Route path="/nominees" element={<JuryNominees />} />
          <Route path="/ranking"  element={<JuryRanking />} />
          <Route path="/results"  element={<JuryResults />} />
          <Route path="/"         element={<Navigate to="/jury/awards" />} />
          <Route path="*"         element={<Navigate to="/jury/awards" />} />
        </Routes>
      </main>
    </>
  )
}
