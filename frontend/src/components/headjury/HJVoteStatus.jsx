import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart3, RefreshCw, Trophy, Building2, Users, Crown } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'
import RankMedal from '../layout/RankMedal'

const ACCENT = 'var(--kpmg-blue)'
const CHOICE_META = {
  first:  { label: '1st Choice', rank: 1 },
  second: { label: '2nd Choice', rank: 2 },
}

function RankBadge({ rank }) {
  return <RankMedal rank={rank} size={26} />
}

export default function HJVoteStatus() {
  const [searchParams] = useSearchParams()
  const awardFromUrl = searchParams.get('award')

  const [choices, setChoices] = useState([])
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [choiceRes, awardRes] = await Promise.all([
        api.get('/head-jury/ranking-status'),
        api.get('/jury/awards'),
      ])
      setChoices(choiceRes.data)
      setAwards(awardRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = awardFromUrl ? choices.filter(r => r.award_id === awardFromUrl) : choices

  // Award-first: for each award, who voted for whom (per jury member), the
  // combined leaderboard, and — since this is a live, unpublished view —
  // who is currently ahead (not the same as the admin's official published
  // Results page, so this reads as "leading" rather than a final "winner").
  const byAward = filtered.reduce((acc, r) => {
    if (!acc[r.award_id]) acc[r.award_id] = { award_id: r.award_id, award_name: r.award_name, entries: [], byJury: {} }
    acc[r.award_id].entries.push(r)
    if (!acc[r.award_id].byJury[r.jury_id]) acc[r.award_id].byJury[r.jury_id] = []
    acc[r.award_id].byJury[r.jury_id].push(r)
    return acc
  }, {})

  const awardSections = Object.values(byAward).map(aw => {
    Object.values(aw.byJury).forEach(entries =>
      entries.sort((a, b) => (a.choice === 'first' ? -1 : 1) - (b.choice === 'first' ? -1 : 1))
    )

    const nomineeVotes = aw.entries.reduce((acc, r) => {
      const key = r.nominee_id
      if (!acc[key]) acc[key] = { name: r.nominee_name, org: r.nominee_org, votes: 0, firstChoiceVotes: 0 }
      acc[key].votes += 1
      if (r.choice === 'first') acc[key].firstChoiceVotes += 1
      return acc
    }, {})
    const leaderboard = Object.values(nomineeVotes).sort((a, b) => b.votes - a.votes || b.firstChoiceVotes - a.firstChoiceVotes)
    const isTiedForFirst = leaderboard.length > 1 && leaderboard[0].votes === leaderboard[1].votes

    return { ...aw, leaderboard, isTiedForFirst, jurorsVoted: Object.keys(aw.byJury).length }
  }).sort((a, b) => b.entries.length - a.entries.length)

  const totalJurors = new Set(filtered.map(r => r.jury_id)).size

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Inter', sans-serif" }}>
      <PageHeader
        icon={BarChart3} title="Jury Vote Status" subtitle="Live, award-by-award view of jury choices and who's currently ahead" accent={ACCENT}
        action={
          <button onClick={fetchAll} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
            background: '#fff', color: 'var(--text-secondary)', border: '1px solid var(--border)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} /> Refresh
          </button>
        }
      />

      {awardFromUrl && awards.find(a => a.id === awardFromUrl) && (
        <div style={{ marginBottom: 22, padding: '14px 18px', background: '#EEF3FF', borderLeft: `3px solid ${ACCENT}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Trophy size={17} color={ACCENT} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, color: ACCENT, fontSize: 13, margin: 0 }}>{awards.find(a => a.id === awardFromUrl)?.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: 0 }}>Select from Awards to change</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 1, marginBottom: 28, background: '#fff', border: '1px solid var(--border-light)' }}>
        {[
          { label: 'Total Choices Cast', value: filtered.length },
          { label: 'Jury Members Voted', value: totalJurors },
          { label: 'Awards With Votes', value: awardSections.length },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '16px 24px', borderRight: i < 2 ? '1px solid var(--border-light)' : 'none' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: ACCENT, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {choices.length === 0 && !loading ? (
        <div style={{ padding: '72px 24px', background: '#fff', border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Trophy size={36} color="var(--border)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No jury votes submitted yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {awardSections.map(aw => (
            <div key={aw.award_id}>
              {/* Award header + who's leading */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Trophy size={16} color={ACCENT} />
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600, color: 'var(--kpmg-navy)', margin: 0 }}>{aw.award_name}</h2>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>· {aw.jurorsVoted} jury member{aw.jurorsVoted !== 1 ? 's' : ''} voted</span>
                </div>
                {aw.leaderboard.length > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
                    background: 'linear-gradient(90deg,#FFF8E7,#FEF3C7)', border: '1px solid #FDE68A',
                  }}>
                    <Crown size={14} color="#B45309" />
                    <span style={{ fontSize: 11, color: '#92400E' }}>
                      {aw.isTiedForFirst ? 'Currently tied:' : 'Currently leading:'}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                      {aw.isTiedForFirst
                        ? aw.leaderboard.filter(n => n.votes === aw.leaderboard[0].votes).map(n => n.name).join(' & ')
                        : aw.leaderboard[0].name}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
                {/* Leaderboard for this award */}
                <div style={{ background: '#fff', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--border-light)', background: '#FAFBFD' }}>
                    <Trophy size={15} color={ACCENT} />
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>Leaderboard</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>· combined jury votes</span>
                  </div>
                  <div>
                    {aw.leaderboard.map((nom, i) => (
                      <div key={nom.name + i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px', borderBottom: i !== aw.leaderboard.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                        <div style={{ width: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <RankBadge rank={i + 1} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom.name}</div>
                          {nom.org && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11 }}>
                              <Building2 size={10} />{nom.org}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, color: ACCENT, fontSize: 14 }}>{nom.votes}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{nom.votes === 1 ? 'vote' : 'votes'} · {nom.firstChoiceVotes} as 1st</div>
                        </div>
                        <div style={{ width: 60, flexShrink: 0 }}>
                          <div style={{ height: 4, background: '#F4F5F7', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: ACCENT, width: `${(nom.votes / (aw.leaderboard[0]?.votes || 1)) * 100}%`, transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Per-jury breakdown for this award */}
                <div style={{ background: '#fff', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--border-light)', background: '#FAFBFD' }}>
                    <Users size={15} color={ACCENT} />
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>Votes by Jury Member</span>
                  </div>
                  <div>
                    {Object.entries(aw.byJury).map(([juryId, entries]) => (
                      <div key={juryId} style={{ padding: '11px 20px', borderBottom: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{juryId}</div>
                        {entries.map(entry => {
                          const meta = CHOICE_META[entry.choice] || {}
                          return (
                            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                <RankMedal rank={meta.rank} size={18} />
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.nominee_name}</span>
                              </div>
                              <span style={{ fontWeight: 700, color: ACCENT, fontSize: 10, flexShrink: 0, marginLeft: 10, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                                {meta.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
