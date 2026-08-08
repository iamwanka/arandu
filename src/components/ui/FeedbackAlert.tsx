import Alert from '@cloudscape-design/components/alert';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';

interface FeedbackAlertProps {
    /** Mensaje de error ya traducido (normalmente el `error` de un hook). */
    error?: string | null;
    /** Mensaje de confirmación tras una acción exitosa. */
    success?: string | null;
    info?: string | null;
    /** Si se pasa, el error muestra un botón para reintentar. */
    onRetry?: () => void;
    /** Si se pasa, los mensajes se pueden cerrar. */
    onDismiss?: () => void;
}

/**
 * Único punto donde la aplicación pinta feedback de estado.
 *
 * Las vistas pasan directamente el `error`/`success` de `useAsyncData` o
 * `useAsyncAction`; no renderiza nada cuando no hay mensajes.
 */
export default function FeedbackAlert({ error, success, info, onRetry, onDismiss }: FeedbackAlertProps) {
    if (!error && !success && !info) {
        return null;
    }

    return (
        <SpaceBetween size="s">
            {error ? (
                <Alert
                    type="error"
                    header="No se pudo completar la operación"
                    dismissible={Boolean(onDismiss)}
                    onDismiss={onDismiss}
                    action={onRetry ? <Button onClick={onRetry}>Reintentar</Button> : undefined}
                >
                    {error}
                </Alert>
            ) : null}

            {success ? (
                <Alert type="success" dismissible={Boolean(onDismiss)} onDismiss={onDismiss}>
                    {success}
                </Alert>
            ) : null}

            {info ? <Alert type="info">{info}</Alert> : null}
        </SpaceBetween>
    );
}
