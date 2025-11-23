import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginUser, getOAuthProviders, initiateGoogleLogin } from '../services/api'
import './Auth.css'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    EmailID: '',
    Password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthProviders, setOauthProviders] = useState([])
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Fetch available OAuth providers
    getOAuthProviders()
      .then(data => setOauthProviders(data.providers || []))
      .catch(err => console.error('Failed to load OAuth providers:', err))
    
    // Check for OAuth error in URL
    const urlParams = new URLSearchParams(window.location.search)
    const oauthError = urlParams.get('error')
    if (oauthError) {
      setError(decodeURIComponent(oauthError))
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.EmailID || !formData.Password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const userData = await loginUser(formData)
      login(userData)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-card card">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account</p>

            {error && (
              <div className="alert alert-error">{error}</div>
            )}

            {/* OAuth Login Buttons */}
            {oauthProviders.length > 0 && (
              <div className="oauth-section">
                <div className="oauth-divider">
                  <span>Or continue with</span>
                </div>
                <div className="oauth-buttons">
                  {oauthProviders.map(provider => (
                    <button
                      key={provider.name}
                      type="button"
                      onClick={() => {
                        if (provider.name === 'google') {
                          initiateGoogleLogin('login')
                        }
                      }}
                      className={`oauth-btn oauth-btn-${provider.name}`}
                    >
                      {provider.name === 'google' && (
                        <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '8px' }}>
                          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.96-2.184l-2.908-2.258c-.806.54-1.837.86-3.052.86-2.347 0-4.333-1.585-5.038-3.716H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                          <path fill="#FBBC05" d="M3.962 10.702c-.18-.54-.282-1.117-.282-1.702s.102-1.162.282-1.702V4.966H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.034l3.005-2.332z"/>
                          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.966L3.962 7.298C4.667 5.163 6.653 3.58 9 3.58z"/>
                        </svg>
                      )}
                      Continue with {provider.display_name}
                    </button>
                  ))}
                </div>
                <div className="oauth-divider" style={{ marginTop: '20px' }}>
                  <span>Or</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label htmlFor="EmailID">Email Address</label>
                <input
                  type="email"
                  id="EmailID"
                  name="EmailID"
                  value={formData.EmailID}
                  onChange={handleChange}
                  required
                  placeholder="your.email@university.edu"
                />
              </div>

              <div className="input-group">
                <label htmlFor="Password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="Password"
                    name="Password"
                    value={formData.Password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px',
                      color: 'var(--gray)',
                      fontSize: '18px'
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="auth-footer">
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

