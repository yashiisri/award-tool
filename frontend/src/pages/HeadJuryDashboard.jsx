import { Routes, Route, Navigate } from 'react-router-dom'
import { Award, Users, MessageSquare, BarChart3, Vote } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import HJAwards from '../components/headjury/HJAwards'
import HJNominees from '../components/headjury/HJNominees'
import HJJuryComments from '../components/headjury/HJJuryComments'
import HJVoteStatus from '../components/headjury/HJVoteStatus'
import HJVoting from '../components/headjury/HJVoting'

const NAV = [
  { path: '/head_jury/awards',     icon: Award,         label: 'Awards' },
  { path: '/head_jury/nominees',   icon: Users,         label: 'Nominees' },
  { path: '/head_jury/comments',   icon: MessageSquare, label: 'Jury Comments' },
  { path: '/head_jury/vote-status',icon: BarChart3,     label: 'Vote Status' },
  { path: '/head_jury/voting',     icon: Vote,          label: 'Your Vote' },
]

export default function HeadJuryDashboard({ onLogout, username }) {
  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden">
      <Sidebar navItems={NAV} role="head_jury" username={username} onLogout={onLogout} />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/awards"      element={<HJAwards />} />
          <Route path="/nominees"    element={<HJNominees />} />
          <Route path="/comments"    element={<HJJuryComments />} />
          <Route path="/vote-status" element={<HJVoteStatus />} />
          <Route path="/voting"      element={<HJVoting />} />
          <Route path="/"            element={<Navigate to="/head_jury/awards" />} />
          <Route path="*"            element={<Navigate to="/head_jury/awards" />} />
        </Routes>
      </main>
    </div>
  )
}
