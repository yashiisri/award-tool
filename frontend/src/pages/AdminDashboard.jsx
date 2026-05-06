import { Routes, Route, Navigate } from 'react-router-dom'
import { Award, Users, Settings, FileText, MessageSquare, BarChart3, UserPlus } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Awards from '../components/admin/Awards'
import ViewNominees from '../components/admin/ViewNominees'
import JuryComments from '../components/admin/JuryComments'
import JuryVoteStatus from '../components/admin/JuryVoteStatus'
import VoteControl from '../components/admin/VoteControl'
import AuditTrail from '../components/admin/AuditTrail'
import ManageUsers from '../components/admin/ManageUsers'

const NAV = [
  { path: '/admin/awards',      icon: Award,        label: 'Awards' },
  { path: '/admin/nominees',    icon: Users,        label: 'View Nominees' },
   { path: '/admin/vote-control',icon: Settings,     label: 'Vote Control' },
  { path: '/admin/comments',    icon: MessageSquare,label: 'Jury Comments' },
  { path: '/admin/vote-status', icon: BarChart3,    label: 'Jury Vote Status' },
 
  { path: '/admin/audit',       icon: FileText,     label: 'Audit Trail' },
  { path: '/admin/users',       icon: UserPlus,     label: 'Manage Users' },
]

export default function AdminDashboard({ onLogout, username }) {
  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden">
      <Sidebar navItems={NAV} role="admin" username={username} onLogout={onLogout} />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/awards"       element={<Awards />} />
          <Route path="/nominees"     element={<ViewNominees />} />
          <Route path="/comments"     element={<JuryComments />} />
          <Route path="/vote-status"  element={<JuryVoteStatus />} />
          <Route path="/vote-control" element={<VoteControl />} />
          <Route path="/audit"        element={<AuditTrail />} />
          <Route path="/users"        element={<ManageUsers />} />
          <Route path="/"             element={<Navigate to="/admin/awards" />} />
          <Route path="*"             element={<Navigate to="/admin/awards" />} />
        </Routes>
      </main>
    </div>
  )
}
