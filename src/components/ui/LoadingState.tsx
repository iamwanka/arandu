import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Spinner from '@cloudscape-design/components/spinner';

interface LoadingStateProps {
    text?: string;
    size?: 'normal' | 'big' | 'large';
}

/** Indicador de carga a pantalla o sección completa. */
export default function LoadingState({ text = 'Cargando…', size = 'large' }: LoadingStateProps) {
    return (
        <Box textAlign="center" padding="l">
            <SpaceBetween size="s" alignItems="center">
                <Spinner size={size} />
                <Box color="text-body-secondary">{text}</Box>
            </SpaceBetween>
        </Box>
    );
}
