import type { FormEvent, ReactNode } from 'react';
import Button from '@cloudscape-design/components/button';
import Form from '@cloudscape-design/components/form';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';

import FeedbackAlert from './FeedbackAlert';

interface FormPanelProps {
    /** Omítelo cuando el formulario vive dentro de un `Modal` que ya trae su propio título. */
    title?: string;
    description?: string;
    children: ReactNode;
    onSubmit: () => void;
    onCancel?: () => void;
    submitLabel?: string;
    cancelLabel?: string;
    /** Deshabilita el envío mientras la acción está en curso. */
    submitting?: boolean;
    /** Deshabilita el envío por validación pendiente. */
    disabled?: boolean;
    error?: string | null;
    success?: string | null;
}

/**
 * Formulario estándar.
 *
 * Encapsula el envío (incluida la tecla Enter), el estado de guardado y el
 * feedback de error/éxito. Los campos se declaran como hijos usando el
 * `FormField` de Cloudscape.
 */
export default function FormPanel({
    title,
    description,
    children,
    onSubmit,
    onCancel,
    submitLabel = 'Guardar',
    cancelLabel = 'Cancelar',
    submitting = false,
    disabled = false,
    error,
    success,
}: FormPanelProps) {
    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (submitting || disabled) return;
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit}>
            <Form
                header={
                    title ? (
                        <Header variant="h2" description={description}>
                            {title}
                        </Header>
                    ) : undefined
                }
                actions={
                    <SpaceBetween direction="horizontal" size="xs">
                        {onCancel ? (
                            <Button formAction="none" variant="link" onClick={onCancel} disabled={submitting}>
                                {cancelLabel}
                            </Button>
                        ) : null}
                        <Button variant="primary" loading={submitting} disabled={disabled}>
                            {submitLabel}
                        </Button>
                    </SpaceBetween>
                }
            >
                <SpaceBetween size="l">
                    <FeedbackAlert error={error} success={success} />
                    {children}
                </SpaceBetween>
            </Form>
        </form>
    );
}
