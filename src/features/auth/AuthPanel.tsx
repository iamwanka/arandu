import { useMemo, useState } from 'react';

import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import FormField from '@cloudscape-design/components/form-field';
import Header from '@cloudscape-design/components/header';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Container from '@cloudscape-design/components/container';

import { useAuthContext } from '../../context/AuthContext';
import { getRoleLabel } from '../../lib/roles';

export default function AuthPanel() {
    const { session, signInWithPassword, signUpWithPassword, signOut } = useAuthContext();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const heading = useMemo(() => (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'), [mode]);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            await (mode === 'login'
                ? signInWithPassword(email, password)
                : signUpWithPassword(email, password));

            setPassword('');
            setMessage(mode === 'login' ? 'Sesión iniciada correctamente.' : 'Cuenta creada con éxito.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo completar la operación.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        setLoading(true);
        await signOut();
        setLoading(false);
    };

    return (
        <Container header={<Header variant="h2">{heading}</Header>}>
            <SpaceBetween size="m">
                {error ? <Alert type="error">{error}</Alert> : null}
                {message ? <Alert type="success">{message}</Alert> : null}

                {!session ? (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleSubmit();
                        }}
                    >
                        <SpaceBetween size="m">
                            <FormField label="Correo electrónico">
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.detail.value)}
                                    placeholder="usuario@arandu.com"
                                />
                            </FormField>

                            <FormField label="Contraseña">
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.detail.value)}
                                    placeholder="Tu contraseña"
                                />
                            </FormField>

                            <div className="auth-actions">
                                <Button formAction="submit" variant="primary" loading={loading} disabled={loading}>
                                    {mode === 'login' ? 'Entrar' : 'Registrar'}
                                </Button>
                                <Button variant="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                                    {mode === 'login' ? 'Crear cuenta' : 'Volver al inicio de sesión'}
                                </Button>
                            </div>
                        </SpaceBetween>
                    </form>
                ) : (
                    <SpaceBetween size="m">
                        <Alert type="success">Sesión activa para {session.user.email}</Alert>
                        <Box>
                            Rol actual: <strong>{getRoleLabel(session.user.role)}</strong>
                        </Box>
                        <Button variant="primary" loading={loading} onClick={() => void handleSignOut()}>
                            Cerrar sesión
                        </Button>
                    </SpaceBetween>
                )}
            </SpaceBetween>
        </Container>
    );
}
