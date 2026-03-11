import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/index.js'

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const { login, register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    let result
    if (mode === 'login') {
      result = await login(form.email, form.password)
    } else {
      result = await register(form.name, form.email, form.password)
    }

    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>⬡</span>
          <span style={styles.logoText}>CollabSpace</span>
        </div>

        <h2 style={styles.title}>
          {mode === 'login' ? 'Masuk ke akun' : 'Buat akun baru'}
        </h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Nama</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Nama lengkap"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="email@contoh.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Minimal 6 karakter"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            style={{ ...styles.btn, opacity: isLoading ? 0.6 : 1 }}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <div style={styles.toggle}>
          {mode === 'login' ? (
            <>Belum punya akun? <button style={styles.link} onClick={() => setMode('register')}>Daftar</button></>
          ) : (
            <>Sudah punya akun? <button style={styles.link} onClick={() => setMode('login')}>Masuk</button></>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    width: 400,
    background: 'var(--bgPanel)',
    border: '1px solid #1E2433',
    padding: '48px 40px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  logoIcon: { fontSize: 28, color: '#00E5C3' },
  logoText: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text)',
    letterSpacing: '0.05em',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: 24,
  },
  error: {
    background: 'rgba(255,77,109,0.1)',
    border: '1px solid #FF4D6D',
    color: '#FF4D6D',
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 16,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, color: 'var(--textMuted)', letterSpacing: '0.05em' },
  input: {
    background: 'var(--bg)',
    border: '1px solid #1E2433',
    color: 'var(--text)',
    padding: '12px 14px',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  btn: {
    background: '#00E5C3',
    color: 'var(--bg)',
    border: 'none',
    padding: '14px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
    fontFamily: 'inherit',
    letterSpacing: '0.05em',
  },
  toggle: { marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--textMuted)' },
  link: {
    background: 'none',
    border: 'none',
    color: '#00E5C3',
    cursor: 'pointer',
    fontSize: 13,
    padding: 0,
  },
}