// import { Link, useLocation } from 'react-router-dom'
// import { LogOut } from 'lucide-react'
// import kpmgLogo from '../../kpmg-logo.png'

// const ROLE_META = {
//   admin:     { label: 'Administrator', accent: '#00338D', light: '#EEF2FF' },
//   head_jury: { label: 'Head Jury',     accent: '#00338D', light: '#EEF2FF' },
//   jury:      { label: 'Jury Member',   accent: '#00338D', light: '#EEF2FF' },
// }

// export default function Sidebar({ navItems, role, username, onLogout }) {
//   const location = useLocation()
//   const meta = ROLE_META[role] || ROLE_META.jury

//   return (
//     <aside style={{
//       width: 240,
//       flexShrink: 0,
//       background: 'white',
//       borderRight: '1px solid #E8ECF0',
//       display: 'flex',
//       flexDirection: 'column',
//       height: '100vh',
//       position: 'sticky',
//       top: 0,
//       fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
//     }}>
//       {/* Logo area */}
//       <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F0F4F8' }}>
//         <img src={kpmgLogo} alt="KPMG" style={{ height: 36, width: 'auto', objectFit: 'contain', marginBottom: 16 }} />

//         {/* User badge */}
//         <div style={{
//           display: 'flex', alignItems: 'center', gap: 10,
//           padding: '10px 12px',
//           background: '#F7F9FC',
//           border: '1px solid #E8ECF0',
//           borderRadius: 10,
//         }}>
//           <div style={{
//             width: 32, height: 32, borderRadius: 8,
//             background: '#00338D',
//             display: 'flex', alignItems: 'center', justifyContent: 'center',
//             color: 'white', fontSize: 13, fontWeight: 800, flexShrink: 0,
//           }}>
//             {(username || meta.label)?.[0]?.toUpperCase()}
//           </div>
//           <div style={{ minWidth: 0 }}>
//             <div style={{ color: '#9BA8B5', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Welcome</div>
//             <div style={{ color: '#0A1628', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
//               {username || meta.label}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Nav */}
//       <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
//         {navItems.map(({ path, basePath, icon: Icon, label, badge }) => {
//           const active = location.pathname === (basePath || path)
//           return (
//             <Link
//               key={basePath || path}
//               to={path}
//               style={{
//                 display: 'flex', alignItems: 'center', gap: 10,
//                 padding: '9px 12px',
//                 borderRadius: 8,
//                 textDecoration: 'none',
//                 fontSize: 13,
//                 fontWeight: active ? 600 : 500,
//                 color: active ? '#00338D' : '#6B7A8D',
//                 background: active ? '#EEF2FF' : 'transparent',
//                 transition: 'all 0.15s ease',
//               }}
//               onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F7F9FC' }}
//               onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
//             >
//               <Icon size={15} style={{ flexShrink: 0, color: active ? '#00338D' : '#9BA8B5' }} />
//               <span style={{ flex: 1 }}>{label}</span>
//               {badge && (
//                 <span style={{ padding: '1px 7px', background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 10 }}>{badge}</span>
//               )}
//               {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00338D', flexShrink: 0 }} />}
//             </Link>
//           )
//         })}
//       </nav>

//       {/* Logout */}
//       <div style={{ padding: '10px', borderTop: '1px solid #F0F4F8' }}>
//         <button
//           onClick={onLogout}
//           style={{
//             width: '100%', display: 'flex', alignItems: 'center', gap: 10,
//             padding: '9px 12px', borderRadius: 8,
//             background: 'none', border: 'none', cursor: 'pointer',
//             color: '#9BA8B5', fontSize: 13, fontWeight: 500,
//             transition: 'all 0.15s ease',
//           }}
//           onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#ef4444' }}
//           onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9BA8B5' }}
//         >
//           <LogOut size={15} />
//           Sign Out
//         </button>
//       </div>
//     </aside>
//   )
// }
import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import kpmgLogo from '../../kpmg-logo.png';

const ROLE_META = {
  admin:     { label: 'Administrator', accent: '#00338D', light: '#EEF2FF' },
  head_jury: { label: 'Head Jury',     accent: '#00338D', light: '#EEF2FF' },
  jury:      { label: 'Jury Member',   accent: '#00338D', light: '#EEF2FF' },
};

export default function Sidebar({ navItems, role, username, onLogout }) {
  const location = useLocation();
  const meta = ROLE_META[role] || ROLE_META.jury;
  const userInitial = (username || meta.label)?.[0]?.toUpperCase();

  return (
    <aside
      style={{
        width: 260,                    // Slightly wider for premium feel
        flexShrink: 0,
        background: 'white',
        borderRight: '1px solid #E5E9F0',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        boxShadow: '2px 0 12px rgba(0, 0, 0, 0.035)',
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Header / Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid #F1F4F9',
      }}>
        <img
          src={kpmgLogo}
          alt="KPMG"
          style={{
            height: 42,
            width: 'auto',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* User Profile - More Premium */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #F1F4F9',
        background: 'linear-gradient(145deg, #F8FAFC, #F1F5F9)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 14px',
          background: 'white',
          borderRadius: 12,
          border: '1px solid #E5E9F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}>
          {/* Avatar */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: meta.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 18,
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0, 51, 141, 0.2)',
          }}>
            {userInitial}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              color: '#0F172A',
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {username || meta.label}
            </div>
            
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
              padding: '2px 10px',
              background: meta.light,
              color: meta.accent,
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 9999,
              letterSpacing: '0.02em',
            }}>
              {meta.label}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: '12px 12px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {navItems.map(({ path, basePath, icon: Icon, label, badge }) => {
          const active = location.pathname === (basePath || path);

          return (
            <Link
              key={basePath || path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 16px',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? '#00338D' : '#475569',
                background: active ? '#EEF2FF' : 'transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = '#F8FAFC';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Icon
                size={18}
                style={{
                  flexShrink: 0,
                  color: active ? '#00338D' : '#64748B',
                }}
              />
              <span style={{ flex: 1 }}>{label}</span>

              {badge && (
                <span style={{
                  padding: '2px 9px',
                  background: '#EF4444',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 9999,
                }}>
                  {badge}
                </span>
              )}

              {active && (
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#00338D',
                  marginLeft: 'auto',
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{
        padding: '16px 12px',
        borderTop: '1px solid #F1F4F9',
        marginTop: 'auto',
      }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '11px 16px',
            borderRadius: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748B',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FEF2F2';
            e.currentTarget.style.color = '#EF4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#64748B';
          }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}