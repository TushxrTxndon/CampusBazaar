import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, registerStudent, registerFaculty, getOAuthProviders, initiateGoogleLogin } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const Register = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState(1) // 1: User info, 2: User type (optional)
  const [userType, setUserType] = useState('') // 'student', 'faculty', or ''
  const [formData, setFormData] = useState({
    EmailID: '',
    FirstName: '',
    LastName: '',
    Password: '',
    ConfirmPassword: '',
    // Student fields
    EnrollmentNo: '',
    Course: '',
    Batch: '',
    // Faculty fields
    FacultyID: '',
    Department: '',
    Designation: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [oauthProviders, setOauthProviders] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

  const handleUserTypeSelect = async (type) => {
    setUserType(type)
    // First register the user, then move to step 2
    if (!formData.EmailID || !formData.FirstName || !formData.LastName || !formData.Password) {
      setError('Please complete the form first')
      return
    }

    if (formData.Password !== formData.ConfirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.Password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const { ConfirmPassword, EnrollmentNo, Course, Batch, FacultyID, Department, Designation, ...userData } = formData
      await registerUser(userData)
      setStep(2)
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    // Register user without student/faculty info
    if (!formData.EmailID || !formData.FirstName || !formData.LastName || !formData.Password) {
      setError('Please complete the form first')
      return
    }

    if (formData.Password !== formData.ConfirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.Password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const { ConfirmPassword, EnrollmentNo, Course, Batch, FacultyID, Department, Designation, ...userData } = formData
      await registerUser(userData)
      setSuccess(true)
      login({
        EmailID: formData.EmailID,
        FirstName: formData.FirstName,
        LastName: formData.LastName,
        UserType: 'regular'
      })
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (step === 1) {
      // Validate user registration
      if (!formData.EmailID || !formData.FirstName || !formData.LastName || !formData.Password) {
        setError('All fields are required')
        return
      }

      if (formData.Password !== formData.ConfirmPassword) {
        setError('Passwords do not match')
        return
      }

      if (formData.Password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }

      setLoading(true)

      try {
        // Register user first
        const { ConfirmPassword, EnrollmentNo, Course, Batch, FacultyID, Department, Designation, ...userData } = formData
        await registerUser(userData)
        
        // Move to step 2 to select user type
        setStep(2)
        setLoading(false)
      } catch (err) {
        setError(err.response?.data?.detail || 'Registration failed. Please try again.')
        setLoading(false)
      }
    } else if (step === 2) {
      // Step 2: Register as Student or Faculty (optional)
      setLoading(true)

      try {
        if (userType === 'student') {
          // Validate student fields
          if (!formData.EnrollmentNo || !formData.Course || !formData.Batch) {
            setError('All student fields are required')
            setLoading(false)
            return
          }
          await registerStudent({
            EnrollmentNo: formData.EnrollmentNo,
            Course: formData.Course,
            Batch: formData.Batch,
            EmailID: formData.EmailID
          })
        } else if (userType === 'faculty') {
          // Validate faculty fields
          if (!formData.FacultyID || !formData.Department || !formData.Designation) {
            setError('All faculty fields are required')
            setLoading(false)
            return
          }
          await registerFaculty({
            FacultyID: formData.FacultyID,
            Department: formData.Department,
            Designation: formData.Designation,
            EmailID: formData.EmailID
          })
        }
        // If userType is empty, user is already registered as regular user in step 1

        setSuccess(true)
        login({
          EmailID: formData.EmailID,
          FirstName: formData.FirstName,
          LastName: formData.LastName,
          UserType: userType || 'regular'
        })
        
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } catch (err) {
        setError(err.response?.data?.detail || 'Registration failed. Please try again.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-card card">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join CampusBazaar today</p>

            {error && (
              <div className="alert alert-error">{error}</div>
            )}

            {success && (
              <div className="alert alert-success">
                Registration successful! Redirecting...
              </div>
            )}

            {/* OAuth Signup Buttons */}
            {oauthProviders.length > 0 && step === 1 && (
              <div className="oauth-section">
                <div className="oauth-buttons">
                  {oauthProviders.map(provider => (
                    <button
                      key={provider.name}
                      type="button"
                      onClick={() => {
                        if (provider.name === 'google') {
                          initiateGoogleLogin('signup')
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
                      Sign up with {provider.display_name}
                    </button>
                  ))}
                </div>
                <div className="oauth-divider" style={{ marginTop: '20px', marginBottom: '20px' }}>
                  <span>Or</span>
                </div>
              </div>
            )}

            {step === 1 ? (
              <>
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
                    <label htmlFor="FirstName">First Name</label>
                    <input
                      type="text"
                      id="FirstName"
                      name="FirstName"
                      value={formData.FirstName}
                      onChange={handleChange}
                      required
                      placeholder="John"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="LastName">Last Name</label>
                    <input
                      type="text"
                      id="LastName"
                      name="LastName"
                      value={formData.LastName}
                      onChange={handleChange}
                      required
                      placeholder="Doe"
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
                        minLength="6"
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

                  <div className="input-group">
                    <label htmlFor="ConfirmPassword">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="ConfirmPassword"
                        name="ConfirmPassword"
                        value={formData.ConfirmPassword}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        minLength="6"
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-large"
                    disabled={loading}
                    style={{ width: '100%' }}
                  >
                    {loading ? 'Creating Account...' : 'Continue'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="user-type-selection" style={{ marginBottom: '24px', textAlign: 'center' }}>
                  <p style={{ marginBottom: '12px', color: 'var(--gray)' }}>Are you a student or faculty? (Optional)</p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setUserType('student')}
                      className={`btn ${userType === 'student' ? 'btn-primary' : 'btn-outline'}`}
                    >
                      I'm a Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType('faculty')}
                      className={`btn ${userType === 'faculty' ? 'btn-primary' : 'btn-outline'}`}
                    >
                      I'm Faculty
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType('')}
                      className={`btn ${userType === '' ? 'btn-primary' : 'btn-outline'}`}
                    >
                      Regular User
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                  {userType === 'student' ? (
                    <>
                      <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Student Information</h3>
                    <div className="input-group">
                      <label htmlFor="EnrollmentNo">Enrollment Number</label>
                      <input
                        type="text"
                        id="EnrollmentNo"
                        name="EnrollmentNo"
                        value={formData.EnrollmentNo}
                        onChange={handleChange}
                        required
                        placeholder="EN2024001"
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="Course">Course</label>
                      <input
                        type="text"
                        id="Course"
                        name="Course"
                        value={formData.Course}
                        onChange={handleChange}
                        required
                        placeholder="Computer Science"
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="Batch">Batch</label>
                      <input
                        type="text"
                        id="Batch"
                        name="Batch"
                        value={formData.Batch}
                        onChange={handleChange}
                        required
                        placeholder="2024"
                      />
                    </div>
                  </>
                ) : userType === 'faculty' ? (
                  <>
                    <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Faculty Information</h3>
                    <div className="input-group">
                      <label htmlFor="FacultyID">Faculty ID</label>
                      <input
                        type="text"
                        id="FacultyID"
                        name="FacultyID"
                        value={formData.FacultyID}
                        onChange={handleChange}
                        required
                        placeholder="FAC2024001"
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="Department">Department</label>
                      <input
                        type="text"
                        id="Department"
                        name="Department"
                        value={formData.Department}
                        onChange={handleChange}
                        required
                        placeholder="Computer Science"
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="Designation">Designation</label>
                      <input
                        type="text"
                        id="Designation"
                        name="Designation"
                        value={formData.Designation}
                        onChange={handleChange}
                        required
                        placeholder="Professor"
                      />
                    </div>
                  </>
                  ) : (
                    <p style={{ textAlign: 'center', color: 'var(--gray)', padding: '20px' }}>
                      You can complete your registration as a regular user, or select Student/Faculty above to add additional information.
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1)
                        setUserType('')
                      }}
                      className="btn btn-outline"
                      style={{ flex: 1 }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      {loading ? 'Completing...' : 'Complete Registration'}
                    </button>
                  </div>
                </form>
              </>
            )}

            <p className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register

