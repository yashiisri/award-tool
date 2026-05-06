import { Routes, Route, Navigate } from 'react-router-dom'
import { Award, Vote, FileText, BarChart3 } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import JuryAwards from '../components/jury/JuryAwards'
import JuryNominees from '../components/jury/JuryNominees'
import JuryVoting from '../components/jury/JuryVoting'
import JuryResults from '../components/jury/JuryResults'

const NAV = [
  { path: '/jury/awards',   icon: Award,   label: 'Award Categories' },
  { path: '/jury/nominees', icon: FileText, label: 'Nominees & Validate' },
  { path: '/jury/voting',   icon: Vote,    label: 'Voting' },
  { path: '/jury/results',  icon: BarChart3,label: 'Results' },
]

export default function JuryDashboard({ onLogout, username }) {
  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden">
      <Sidebar navItems={NAV} role="jury" username={username} onLogout={onLogout} />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/awards"   element={<JuryAwards />} />
          <Route path="/nominees" element={<JuryNominees />} />
          <Route path="/voting"   element={<JuryVoting />} />
          <Route path="/results"  element={<JuryResults />} />
          <Route path="/"         element={<Navigate to="/jury/awards" />} />
          <Route path="*"         element={<Navigate to="/jury/awards" />} />
        </Routes>
      </main>
    </div>
  )
}
