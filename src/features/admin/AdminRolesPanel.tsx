import { useEffect, useState } from 'react';

import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Select from '@cloudscape-design/components/select';
import Table from '@cloudscape-design/components/table';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { listUsers, updateUserRole } from '../../lib/auth';
import { getRoleLabel, ROLE_OPTIONS } from '../../lib/roles';
import type { AppRole, AppUser } from '../../types';

interface AdminRolesPanelProps {
    currentUserEmail: string;
}

export default function AdminRolesPanel({ currentUserEmail }: AdminRolesPanelProps) {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        console.info('[admin] loadUsers');
        void listUsers()
            .then((nextUsers: AppUser[]) => {
                console.debug('[admin] loadUsers result', nextUsers);
                if (!active) return;
                setUsers(nextUsers);
            })
            .catch((err: unknown) => {
                console.error('[admin] loadUsers error', err);
                if (!active) return;
                setError(err instanceof Error ? err.message : 'No se pudo cargar la lista de usuarios.');
            })
            .finally(() => {
                if (!active) return;
                setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const handleRoleChange = async (email: string, role: AppRole) => {
        console.info('[admin] handleRoleChange', { email, role });
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const updatedUser = await updateUserRole(email, role);
            console.debug('[admin] handleRoleChange updated', updatedUser);
            setUsers((currentUsers) => currentUsers.map((user) => (user.email.toLowerCase() === email.toLowerCase() ? updatedUser : user)));
            setMessage(`Rol actualizado para ${updatedUser.email}.`);
        } catch (err) {
            console.error('[admin] handleRoleChange error', err);
            setError(err instanceof Error ? err.message : 'No se pudo actualizar el rol.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container header={<Header variant="h2">Administración de roles</Header>}>
            <SpaceBetween size="m">
                <Alert type="info">
                    Este panel administra roles de usuario usando la tabla <strong>profiles</strong> de Supabase cuando está configurado.
                </Alert>
                {error ? <Alert type="error">{error}</Alert> : null}
                {message ? <Alert type="success">{message}</Alert> : null}

                <Box>
                    Usuario activo: <strong>{currentUserEmail}</strong>
                </Box>

                <Table
                    columnDefinitions={[
                        {
                            id: 'email',
                            header: 'Correo',
                            cell: (item) => item.email,
                            sortingField: 'email',
                        },
                        {
                            id: 'name',
                            header: 'Nombre',
                            cell: (item) => item.name,
                        },
                        {
                            id: 'role',
                            header: 'Rol',
                            cell: (item) => getRoleLabel(item.role),
                        },
                        {
                            id: 'actions',
                            header: 'Cambiar rol',
                            cell: (item) => (
                                <Select
                                    selectedOption={ROLE_OPTIONS.find((option) => option.value === item.role) ?? null}
                                    onChange={({ detail }) => handleRoleChange(item.email, detail.selectedOption.value as AppRole)}
                                    options={ROLE_OPTIONS.map((option) => ({ label: option.label, value: option.value, description: option.description }))}
                                    placeholder="Selecciona un rol"
                                />
                            ),
                        },
                    ]}
                    items={users}
                    loadingText="Cargando usuarios"
                    empty={<Box>No hay usuarios registrados todavía.</Box>}
                    header="Usuarios"
                    trackBy="email"
                    variant="embedded"
                    resizableColumns
                    ariaLabels={{ selectionGroupLabel: 'Usuarios' }}
                    loading={loading}
                />
            </SpaceBetween>
        </Container>
    );
}
