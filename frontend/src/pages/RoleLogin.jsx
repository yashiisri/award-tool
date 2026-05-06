import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Award, Shield, Crown, Users, ArrowLeft } from 'lucide-react'
import api from '../api/axios'

export default function RoleLogin({ onLogin }) {
  const { role } = useParams()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const roleConfig = {
    admin: {
      icon: Shield,
      title: 'Admin Portal',
      color: 'from-blue-600 to-blue-800',
      bgColor: 'bg-blue-600',
      description: 'Manage awards, nominees, and system controls'
    },
    head_jury: {
      icon: Crown,
      title: 'Head Jury Portal',
      color: 'from-purple-600 to-purple-800',
      bgColor: 'bg-purple-600',
      description: 'Oversee jury activities and final decisions'
    },
    jury: {
      icon: Users,
      title: 'Jury Portal',
      color: 'from-indigo-600 to-indigo-800',
      bgColor: 'bg-indigo-600',
      description: 'Evaluate and vote on nominees'
    }
  }

  const config = roleConfig[role] || roleConfig.admin
  const Icon = config.icon

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', { username, password })
      
      if (data.role !== role) {
        setError(`Invalid credentials for ${config.title}`)
        setLoading(false)
        return
      }

      onLogin(data.access_token, data.role)
    } catch (err) {
      setError('Invalid username or password')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center text-white hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Home
      </button>

      <div className="w-full max-w-md">
        {/* Role Badge */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${config.color} rounded-2xl mb-4 shadow-2xl`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{config.title}</h1>
          <p className="text-gray-400">{config.description}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center mb-6">
            <Award className="w-8 h-8 text-kpmg-blue mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Sign In</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-kpmg-blue focus:border-transparent transition-all"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-kpmg-blue focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 bg-gradient-to-r ${config.color} text-white rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to={`/register/${role}`}
                className={`font-semibold bg-gradient-to-r ${config.color} bg-clip-text text-transparent hover:underline`}
              >
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Need a different role?{' '}
              <button
                onClick={() => navigate('/')}
                className="text-kpmg-blue font-semibold hover:underline"
              >
                Choose role
              </button>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm flex items-center justify-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Secured with 256-bit encryption
          </p>
        </div>
      </div>
    </div>
  )
}
