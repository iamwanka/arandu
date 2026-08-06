import { useEffect, useMemo, useState } from 'react';

import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Container from '@cloudscape-design/components/container';
import FormField from '@cloudscape-design/components/form-field';
import Header from '@cloudscape-design/components/header';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Spinner from '@cloudscape-design/components/spinner';
import { TextContent } from '@cloudscape-design/components';

import '@cloudscape-design/global-styles/index.css';
import { isSupabaseConfigured, supabase } from './lib/supabase';

export default function App() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const heading = useMemo(() => (mode === 'login' ? 'Welcome back' : 'Create an account'), [mode]);

  const handleSubmit = async () => {
    if (!supabase) {
      setError('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your environment.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          throw signInError;
        }
        setMessage('Signed in successfully.');
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          throw signUpError;
        }
        setMessage('Account created. Check your inbox for the confirmation email if required.');
      }

      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setLoading(false);
  };

  return (
    <SpaceBetween size="l">
      <Header variant="h1">Supabase auth starter</Header>

      <Container>
        <SpaceBetween size="m">
          <TextContent>
            <h2>{heading}</h2>
            <p>Use Supabase Auth with polished Cloudscape forms and feedback states.</p>
          </TextContent>

          {error ? <Alert type="error">{error}</Alert> : null}
          {message ? <Alert type="success">{message}</Alert> : null}

          {!isSupabaseConfigured ? (
            <Alert type="info">
              Add your Supabase URL and anon key to the Vite environment before testing the flow.
            </Alert>
          ) : null}

          {!session ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <SpaceBetween size="m">
                <FormField label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.detail.value)}
                    placeholder="you@example.com"
                  />
                </FormField>

                <FormField label="Password">
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.detail.value)}
                    placeholder="Enter your password"
                  />
                </FormField>

                <SpaceBetween size="s" direction="horizontal">
                  <Button variant="primary" loading={loading} disabled={loading}>
                    {mode === 'login' ? 'Log in' : 'Sign up'}
                  </Button>
                  <Button variant="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                    {mode === 'login' ? 'Create an account' : 'Back to login'}
                  </Button>
                </SpaceBetween>
              </SpaceBetween>
            </form>
          ) : (
            <SpaceBetween size="m">
              <Alert type="success">You are signed in.</Alert>
              <Box>{session.user?.email ?? 'Active session'}</Box>
              <Button variant="primary" loading={loading} onClick={() => void handleSignOut()}>
                {loading ? <Spinner size="normal" /> : 'Sign out'}
              </Button>
            </SpaceBetween>
          )}
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
}
