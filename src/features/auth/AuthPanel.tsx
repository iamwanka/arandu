import { useState } from 'react';

import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Container from '@cloudscape-design/components/container';
import FormField from '@cloudscape-design/components/form-field';
import Header from '@cloudscape-design/components/header';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { FeedbackAlert } from '../../components/ui';
import { useAuthContext } from '../../context/authContextBase';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { getRoleLabel } from '../../lib/roles';
import { compose, email as emailRule, hasErrors, minLength, required, validateFields } from '../../lib/validation';

type AuthMode = 'login' | 'signup';

interface FormState {
    email: string;
    password: string;
    confirmPassword: string;
}

interface Credentials {
    email: string;
    password: string;
}

const EMPTY_FORM: FormState = { email: '', password: '', confirmPassword: '' };

export default function AuthPanel() {
    const { session, signInWithPassword, signUpWithPassword, signOut } = useAuthContext();

    const [mode, setMode] = useState<AuthMode>('login');
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [touched, setTouched] = useState(false);

    const errors = validateFields(form, {
        email: compose(required('El correo'), emailRule()),
        password: compose(required('La contraseña'), minLength(6, 'La contraseña')),
        ...(mode === 'signup'
            ? {
                confirmPassword: (value: string) =>
                    value !== form.password ? 'Las contraseñas no coinciden.' : null,
            }
            : {}),
    });

    const submit = useAsyncAction(
        async ({ email, password }: Credentials) => {
            if (mode === 'login') {
                await signInWithPassword(email, password);
                return 'Sesión iniciada correctamente.';
            }

            const created = await signUpWithPassword(email, password);

            return created
                ? 'Cuenta creada con éxito.'
                : 'Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.';
        },
        {
            successMessage: (message) => message,
            onSuccess: () => setForm((current) => ({ ...current, password: '', confirmPassword: '' })),
        },
    );

    const signOutAction = useAsyncAction(signOut);

    const handleSubmit = () => {
        setTouched(true);
        if (hasErrors(errors)) return;
        void submit.run({ email: form.email.trim().toLowerCase(), password: form.password });
    };

    const switchMode = () => {
        setMode((current) => (current === 'login' ? 'signup' : 'login'));
        setForm(EMPTY_FORM);
        setTouched(false);
        submit.reset();
    };

    if (session) {
        return (
            <Container header={<Header variant="h2">Sesión activa</Header>}>
                <SpaceBetween size="m">
                    <FeedbackAlert success={`Sesión activa para ${session.user.email}`} error={signOutAction.error} />
                    <Box>
                        Rol actual: <strong>{getRoleLabel(session.user.role)}</strong>
                    </Box>
                    <Button variant="primary" loading={signOutAction.pending} onClick={() => void signOutAction.run()}>
                        Cerrar sesión
                    </Button>
                </SpaceBetween>
            </Container>
        );
    }

    return (
        <Container header={<Header variant="h2">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</Header>}>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit();
                }}
            >
                <SpaceBetween size="m">
                    <FeedbackAlert error={submit.error} success={submit.success} onDismiss={submit.reset} />

                    <FormField label="Correo electrónico" errorText={touched ? errors.email : undefined}>
                        <Input
                            type="email"
                            value={form.email}
                            onChange={(event) => setForm((current) => ({ ...current, email: event.detail.value }))}
                            placeholder="usuario@arandu.com"
                            autoComplete
                            disabled={submit.pending}
                        />
                    </FormField>

                    <FormField
                        label="Contraseña"
                        errorText={touched ? errors.password : undefined}
                        constraintText="Mínimo 6 caracteres."
                    >
                        <Input
                            type="password"
                            value={form.password}
                            onChange={(event) => setForm((current) => ({ ...current, password: event.detail.value }))}
                            placeholder="Tu contraseña"
                            autoComplete={mode === 'login'}
                            disabled={submit.pending}
                        />
                    </FormField>

                    {mode === 'signup' ? (
                        <FormField label="Confirmar contraseña" errorText={touched ? errors.confirmPassword : undefined}>
                            <Input
                                type="password"
                                value={form.confirmPassword}
                                onChange={(event) =>
                                    setForm((current) => ({ ...current, confirmPassword: event.detail.value }))
                                }
                                placeholder="Repite tu contraseña"
                                disabled={submit.pending}
                            />
                        </FormField>
                    ) : null}

                    <div className="auth-actions">
                        <Button formAction="submit" variant="primary" loading={submit.pending}>
                            {mode === 'login' ? 'Entrar' : 'Registrar'}
                        </Button>
                        <Button formAction="none" variant="link" onClick={switchMode} disabled={submit.pending}>
                            {mode === 'login' ? 'Crear cuenta' : 'Volver al inicio de sesión'}
                        </Button>
                    </div>
                </SpaceBetween>
            </form>
        </Container>
    );
}
