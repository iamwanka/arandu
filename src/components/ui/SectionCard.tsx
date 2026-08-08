import type { ReactNode } from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';

interface SectionCardProps {
    title: string;
    description?: string;
    /** Botones o enlaces del encabezado. */
    actions?: ReactNode;
    children: ReactNode;
}

/** Contenedor base de cualquier sección de contenido del dashboard. */
export default function SectionCard({ title, description, actions, children }: SectionCardProps) {
    return (
        <Container
            header={
                <Header variant="h2" description={description} actions={actions}>
                    {title}
                </Header>
            }
        >
            <SpaceBetween size="l">{children}</SpaceBetween>
        </Container>
    );
}
