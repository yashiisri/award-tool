import { useState, useEffect } from 'react'
import { Vote, Star, MessageSquare, User, X, Send } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function Voting() {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [nominees, setNominees] = useState([])
  const [scores, setScores] = useState({})
  const [hovered, setHovered] = useState({})
  const [commentModal, setCommentModal] = useState(null)
  const [comment, setComment] = useState('')
  const [voted, setVoted] = useState(new Set())

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { if (selectedCategory) fetchNominees() }, [selectedCategory])

  const fetchCategories = async () => {
    try { const { data } = await api.get('/admin/categories'); setCategories(data) }
    catch (err) { console.error(err) }
  }

  const fetchNominees = async () => {
    try { const { data } = await api.get(`/jury/nominees/${selectedCategory}`); setNominees(data) }
    catch (err) { console.error(err) }
  }

  const handleVote = async (nomineeId, score) => {
    try {
      await api.post('/jury/vote', { nominee_id: nomineeId, category_id: selectedCategory, score })
      setScores({ ...scores, [nomineeId]: score }); setVoted(new Set([...voted, nomineeId]))
    } catch (err) { alert(err.response?.data?.detail || 'Voting not enabled for this category') }
  }

  const handleComment = async () => {
    if (!comment.trim()) return
    try { await api.post('/jury/comment', { nominee_id: commentModal, comment }); setCommentModal(null); setComment('') }
    catch (err) { console.error(err) }
  }

  const displayScore = (id) => hovered[id] ?? scores[id] ?? 0

  return (
    <div className="p-8">
      <PageHeader icon={Vote} title="Voting & Scoring" subtitle="Score nominees and submit your feedback" accent="#0091DA" light="#EAF5FC" />

      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Category</label>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full max-w-sm px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#0091DA]/30 text-sm shadow-sm">
          <option value="">Choose a category</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nominees.map((nom) => {
          const score = displayScore(nom.id)
          const hasVoted = voted.has(nom.id)
          return (
            <div key={nom.id} className={`p-6 bg-white border rounded-2xl transition-all ${hasVoted ? 'border-yellow-200 bg-yellow-50/20' : 'border-gray-100 hover:shadow-md'}`}>
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 bg-[#EAF5FC] rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-[#0091DA]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#1a1a2e]">{nom.name}</h3>
                  {hasVoted && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-lg mt-1 font-medium"><Star className="w-3 h-3 fill-yellow-500" /> Voted</span>}
                </div>
              </div>

              <div className="mb-5">
                <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">Your score</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} disabled={hasVoted}
                      onMouseEnter={() => setHovered({ ...hovered, [nom.id]: s })}
                      onMouseLeave={() => setHovered({ ...hovered, [nom.id]: undefined })}
                      onClick={() => handleVote(nom.id, s)}
                      className="p-0.5 disabled:cursor-not-allowed transition-transform hover:scale-110">
                      <Star className={`w-7 h-7 transition-colors ${s <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setCommentModal(nom.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 hover:text-[#0091DA] hover:border-[#0091DA]/30 hover:bg-[#EAF5FC] text-sm font-medium transition-all">
                <MessageSquare className="w-4 h-4" /> Add Comment
              </button>
            </div>
          )
        })}
      </div>

      {commentModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-[#1a1a2e]">Add Comment</h2>
              <button onClick={() => { setCommentModal(null); setComment('') }} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0091DA]/30 resize-none text-sm mb-4" rows="4" placeholder="Share your thoughts on this nominee..." />
            <div className="flex gap-3">
              <button onClick={handleComment} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0091DA] text-white rounded-xl font-semibold text-sm hover:bg-[#007ab8] transition-colors">
                <Send className="w-4 h-4" /> Submit
              </button>
              <button onClick={() => { setCommentModal(null); setComment('') }} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
