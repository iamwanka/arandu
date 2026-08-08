import type { ReactNode } from 'react';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';

interface EmptyStateProps {
    title: string;
    description?: string;
    /** Acción sugerida, por ejemplo "Crear estudiante". */
    action?: ReactNode;
}

/** Estado vacío consistente para tablas y listados. */
export default function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <Box textAlign="center" color="inherit" padding={{ vertical: 'l' }}>
            <SpaceBetween size="xs">
                <Box variant="strong" color="inherit">
                    {title}
                </Box>
                {description ? (
                    <Box variant="p" color="text-body-secondary">
                        {description}
                    </Box>
                ) : null}
                {action}
            </SpaceBetween>
        </Box>
    );
}
