import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TestAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')

  const testSignUp = async () => {
    try {
      setStatus('Signing up...')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })

      if (error) {
        setStatus(`Error: ${error.message}`)
      } else {
        setStatus(`Success! Check your email for verification. User ID: ${data.user?.id}`)
      }
    } catch (err) {
      setStatus(`Exception: ${err.message}`)
    }
  }

  const testSignIn = async () => {
    try {
      setStatus('Signing in...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setStatus(`Error: ${error.message}`)
      } else {
        setStatus(`Signed in! User: ${data.user?.email}`)
      }
    } catch (err) {
      setStatus(`Exception: ${err.message}`)
    }
  }

  const checkProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStatus('No user logged in')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        setStatus(`Profile Error: ${error.message}`)
      } else {
        setStatus(`Profile found: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (err) {
      setStatus(`Exception: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h3>Test Authentication</h3>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: 'block', margin: '10px 0', padding: 8, width: '100%' }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', margin: '10px 0', padding: 8, width: '100%' }}
      />
      <button onClick={testSignUp} style={{ margin: 5, padding: 8 }}>
        Sign Up
      </button>
      <button onClick={testSignIn} style={{ margin: 5, padding: 8 }}>
        Sign In
      </button>
      <button onClick={checkProfile} style={{ margin: 5, padding: 8 }}>
        Check Profile
      </button>
      <div style={{
        marginTop: 20,
        padding: 10,
        background: '#f0f0f0',
        borderRadius: 4,
        whiteSpace: 'pre-wrap'
      }}>
        {status}
      </div>
    </div>
  )
}
