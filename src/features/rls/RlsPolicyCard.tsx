import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';

export default function RlsPolicyCard() {
    return (
        <Container header={<Header variant="h2">RLS base y política de acceso</Header>}>
            <SpaceBetween size="m">
                <Box variant="div">
                    <strong>Objetivo:</strong> proteger el acceso a tablas sensibles como usuarios, perfiles y registros académicos mediante políticas por fila.
                </Box>
                <Box variant="div">
                    <strong>Regla recomendada:</strong> usar <code>auth.uid()</code> y <code>auth.jwt()</code> para validar el rol del usuario autenticado y permitir lecturas/actualizaciones solo cuando la relación con el recurso sea válida.
                </Box>
                <Box variant="div">
                    <strong>Ejemplo de extensión:</strong> para la tabla <code>profiles</code>, permitir lectura a administradores y al propio usuario; las escrituras solo para administradores o el propietario.
                </Box>
            </SpaceBetween>
        </Container>
    );
}
