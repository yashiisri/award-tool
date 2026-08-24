import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Award, Users, MessageSquare, BarChart3, Vote, Medal } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import HJAwards from '../components/headjury/HJAwards'
import HJNominees from '../components/headjury/HJNominees'
import HJJuryComments from '../components/headjury/HJJuryComments'
import HJVotingProgress from '../components/headjury/HJVotingProgress'
import HJVoting from '../components/headjury/HJVoting'
import HJResults from '../components/headjury/HJResults'

const BASE_NAV = [
  { path: '/head_jury/awards',           icon: Award,         label: 'Awards',           awardParam: false },
  { path: '/head_jury/nominees',         icon: Users,         label: 'Nominees',         awardParam: true  },
  { path: '/head_jury/comments',         icon: MessageSquare, label: 'Jury Comments',    awardParam: false },
  { path: '/head_jury/voting-progress',  icon: BarChart3,     label: 'Voting Progress',  awardParam: false },
  { path: '/head_jury/voting',           icon: Vote,          label: 'Your Vote',        awardParam: true  },
  { path: '/head_jury/results',          icon: Medal,         label: 'Results',          awardParam: true  },
]

function useSelectedAward() {
  const location = useLocation()
  const urlAward = new URLSearchParams(location.search).get('award')
  const [award, setAward] = useState(urlAward || localStorage.getItem('hj_selected_award') || '')

  useEffect(() => {
    if (urlAward) {
      localStorage.setItem('hj_selected_award', urlAward)
      setAward(urlAward)
    } else {
      setAward(localStorage.getItem('hj_selected_award') || '')
    }
  }, [urlAward, location.pathname])

  return award
}

export default function HeadJuryDashboard({ onLogout, username }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface)' }}>
      <HeadJuryDashboardInner onLogout={onLogout} username={username} />
    </div>
  )
}

function HeadJuryDashboardInner({ onLogout, username }) {
  const selectedAward = useSelectedAward()

  const navItems = BASE_NAV.map(item => ({
    ...item,
    path: item.awardParam && selectedAward
      ? `${item.path}?award=${selectedAward}`
      : item.path,
    basePath: item.path,
  }))

  return (
    <>
      <Sidebar navItems={navItems} role="head_jury" username={username} onLogout={onLogout} />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/awards"           element={<HJAwards />} />
          <Route path="/nominees"         element={<HJNominees />} />
          <Route path="/comments"         element={<HJJuryComments />} />
          <Route path="/voting-progress"  element={<HJVotingProgress />} />
          <Route path="/voting"           element={<HJVoting />} />
          <Route path="/results"          element={<HJResults />} />
          <Route path="/"                 element={<Navigate to="/head_jury/awards" />} />
          <Route path="*"                 element={<Navigate to="/head_jury/awards" />} />
        </Routes>
      </main>
    </>
  )
}
