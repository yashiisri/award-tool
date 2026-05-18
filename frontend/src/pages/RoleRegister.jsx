import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Award, Shield, Crown, Users, ArrowLeft, Mail, User, Lock, CheckCircle, Info } from 'lucide-react'
import api from '../api/axios'

export default function RoleRegister() {
  const { role } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const roleConfig = {
    admin: {
      icon: Shield,
      title: 'Admin Registration',
      color: 'from-blue-600 to-blue-800',
      description: 'Create your admin account to manage the award system',
      adminOnly: false,
    },
    head_jury: {
      icon: Crown,
      title: 'Head Jury Account',
      color: 'from-purple-600 to-purple-800',
      description: 'Head Jury accounts are created by the Admin',
      adminOnly: true,
    },
    jury: {
      icon: Users,
      title: 'Jury Account',
      color: 'from-indigo-600 to-indigo-800',
      description: 'Jury accounts are created by the Admin',
      adminOnly: true,
    },
  }

  const config = roleConfig[role] || roleConfig.admin
  const Icon = config.icon

  // Jury and Head Jury cannot self-register — admin creates their accounts
  if (config.adminOnly) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <button onClick={() => navigate('/')} className="absolute top-6 left-6 flex items-center text-white hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
        </button>
        <div className="w-full max-w-md text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${config.color} rounded-2xl mb-6 shadow-2xl`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{config.title}</h1>
          <div className="bg-white rounded-2xl shadow-2xl p-8 mt-6">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Info className="w-7 h-7 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">Account Created by Admin</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {role === 'jury' ? 'Jury' : 'Head Jury'} accounts are created by the platform Admin.
              Please contact your administrator to get your login credentials.
            </p>
            <button
              onClick={() => navigate(`/login/${role}`)}
              className={`w-full py-3 bg-gradient-to-r ${config.color} text-white rounded-lg font-semibold hover:shadow-lg transition-all`}
            >
              Go to Login
            </button>
            <div className="mt-4">
              <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                ← Choose a different role
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role,
      })
      setSuccess(true)
      setTimeout(() => navigate(`/login/${role}`), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Username may already exist.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Registration Successful!</h2>
          <p className="text-gray-600">Redirecting you to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <button onClick={() => navigate('/')} className="absolute top-6 left-6 flex items-center text-white hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${config.color} rounded-2xl mb-4 shadow-2xl`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{config.title}</h1>
          <p className="text-gray-400">{config.description}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center mb-6">
            <Award className="w-8 h-8 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" /> Username
              </label>
              <input type="text" name="username" value={formData.username} onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Choose a username" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" /> Email Address
              </label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="your.email@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" /> Password
              </label>
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Create a strong password" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" /> Confirm Password
              </label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Confirm your password" required />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full py-3 bg-gradient-to-r ${config.color} text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to={`/login/${role}`} className="font-semibold text-blue-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Choose a different role
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RoleRegister() {
  const { role } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const roleConfig = {
    admin: {
      icon: Shield,
      title: 'Admin Registration',
      color: 'from-blue-600 to-blue-800',
      description: 'Create your admin account to manage the award system'
    },
    head_jury: {
      icon: Crown,
      title: 'Head Jury Registration',
      color: 'from-purple-600 to-purple-800',
      description: 'Register as Head Jury to oversee award decisions'
    },
    jury: {
      icon: Users,
      title: 'Jury Registration',
      color: 'from-indigo-600 to-indigo-800',
      description: 'Join as a jury member to evaluate nominees'
    }
  }

  const config = roleConfig[role] || roleConfig.admin
  const Icon = config.icon

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: role
      })

      setSuccess(true)
      setTimeout(() => {
        navigate(`/login/${role}`)
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Username may already exist.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">Redirecting you to login...</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full animate-progress"></div>
          </div>
        </div>
      </div>
    )
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

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center mb-6">
            <Award className="w-8 h-8 text-kpmg-blue mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-kpmg-blue focus:border-transparent transition-all"
                placeholder="Choose a username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-kpmg-blue focus:border-transparent transition-all"
                placeholder="your.email@kpmg.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-kpmg-blue focus:border-transparent transition-all"
                placeholder="Create a strong password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-kpmg-blue focus:border-transparent transition-all"
                placeholder="Confirm your password"
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to={`/login/${role}`}
                className={`font-semibold bg-gradient-to-r ${config.color} bg-clip-text text-transparent hover:underline`}
              >
                Sign in here
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
          <p className="text-gray-400 text-sm">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
