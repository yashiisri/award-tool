import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import api from '../../api/axios'
import PageContextBar from '../layout/PageContextBar'
import aimaLogo from '../../aima-logo.png'

export default function JuryResults() {
  const [searchParams] = useSearchParams()
  const awardFromUrl = searchParams.get('award')

  const [awardResults, setAwardResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { data: awards } = await api.get('/jury/awards')
      const targets = awardFromUrl
        ? awards.filter(a => a.id === awardFromUrl)
        : awards

      const settled = await Promise.all(
        targets.map(async award => {
          try {
            const { data } = await api.get(`/jury/results/${award.id}`)
            return { award, results: data, published: true }
          } catch {
            return { award, results: [], published: false }
          }
        })
      )
      setAwardResults(settled)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const anyPublished = awardResults.some(r => r.published)

  return (
    <>
      <PageContextBar
        breadcrumb={['Results']}
        helpText="These are the final results for this award, published by AIMA after all votes were counted."
      />
      <div style={{ minHeight: '100vh', background: 'var(--surface)', padding: '32px 36px', fontFamily: "'Inter', sans-serif" }}>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 0' }}>
            <div style={{ width: 30, height: 30, border: '2px solid #00338D', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!loading && !anyPublished && (
          <div style={{ padding: '80px 24px', background: '#fff', borderRadius: 12, border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Lock size={32} color="#00338D" strokeWidth={1.6} style={{ marginBottom: 18 }} />
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: 'var(--kpmg-navy)', marginBottom: 8 }}>Results Not Published Yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 300 }}>
              The admin will publish the final results after voting closes. Check back soon.
            </p>
          </div>
        )}

        {!loading && anyPublished && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
            {awardResults
              .filter(r => r.published)
              .map(({ award, results }) => (
                <div key={award.id}>
                  <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 600, color: 'var(--kpmg-navy)', margin: 0 }}>
                      Official Results — {award.name}
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Managing India Awards 2026 — Published by AIMA</p>
                  </div>

                  {results.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No votes were recorded for this award.</p>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: results.length > 1 ? '1fr 1fr' : '1fr', gap: 16 }}>
                        <PlaceCard nominee={results[0]} place="Winner" />
                        {results.length > 1 && <PlaceCard nominee={results[1]} place="2nd Place" />}
                      </div>

                      {results.length > 2 && (
                        <div style={{ marginTop: 32 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                            All Nominees
                          </p>
                          <div style={{ background: '#fff', border: '1px solid var(--border-light)', borderRadius: 10, overflow: 'hidden' }}>
                            {results.slice(2).map((nom, i) => (
                              <div key={nom.id} style={{
                                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px',
                                borderBottom: i !== results.length - 3 ? '1px solid var(--border-light)' : 'none',
                              }}>
                                <div style={{
                                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                                  background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {nom.photo_url
                                    ? <img src={nom.photo_url} alt={nom.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 12 }}>{nom.name?.[0]}</span>}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom.name}</div>
                                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom.organisation}</div>
                                </div>
                                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', flexShrink: 0 }}>{nom.total_score || 0} votes</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

            <div style={{ textAlign: 'center', paddingTop: 24 }}>
              <img src={aimaLogo} alt="AIMA" style={{ height: 26, objectFit: 'contain', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Results certified by AIMA Managing Committee</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function PlaceCard({ nominee, place }) {
  if (!nominee) return null
  const isWinner = place === 'Winner'
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: 32,
      border: `1px solid ${isWinner ? '#EADFC0' : 'var(--border-light)'}`,
      borderTop: `3px solid ${isWinner ? 'var(--gold)' : '#94A3B8'}`,
      boxShadow: isWinner
        ? '0 20px 48px rgba(10,22,40,0.08), 0 4px 14px rgba(184,134,11,0.10)'
        : '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <span style={{
        display: 'block', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 20,
        color: isWinner ? '#9A7B1F' : '#64748B',
      }}>
        {place}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{
          width: isWinner ? 72 : 56, height: isWinner ? 72 : 56, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          border: `2px solid ${isWinner ? 'var(--gold)' : '#E2E8F0'}`,
          boxShadow: isWinner ? '0 0 0 4px rgba(184,134,11,0.12)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC',
        }}>
          {nominee.photo_url
            ? <img src={nominee.photo_url} alt={nominee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ color: isWinner ? '#9A7B1F' : '#64748B', fontWeight: 700, fontSize: isWinner ? 24 : 18, fontFamily: "'Playfair Display', serif" }}>{nominee.name?.[0]}</span>}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isWinner ? 22 : 18, fontWeight: 700, color: 'var(--kpmg-navy)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nominee.name}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '5px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nominee.organisation}</p>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '8px 0 0' }}>
            {nominee.total_score || 0} vote{nominee.total_score === 1 ? '' : 's'}{isWinner ? ' — Most Votes' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
