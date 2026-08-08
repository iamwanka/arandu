import { useMemo } from 'react';

import { useCollection } from '@cloudscape-design/collection-hooks';
import Badge from '@cloudscape-design/components/badge';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import CollectionPreferences from '@cloudscape-design/components/collection-preferences';
import Pagination from '@cloudscape-design/components/pagination';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import type { TableProps } from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';
import Toggle from '@cloudscape-design/components/toggle';

import { DataTable, EmptyState, FeedbackAlert } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getRoleLabel, ROLE_OPTIONS } from '../../lib/roles';
import { listProfiles, updateProfileActive, updateProfileRole } from '../../services/profiles';
import type { AppRole, AppUser } from '../../types';

const PAGE_SIZE_OPTIONS = [
    { value: 10, label: '10 usuarios' },
    { value: 20, label: '20 usuarios' },
    { value: 50, label: '50 usuarios' },
];

interface AdminRolesPanelProps {
    currentUserEmail: string;
}

/** Gestión de usuarios: rol y estado de cuenta. Reservado al rol administrador. */
export default function AdminRolesPanel({ currentUserEmail }: AdminRolesPanelProps) {
    const { data, loading, error, reload, setData } = useAsyncData(listProfiles, []);
    const users = useMemo(() => data ?? [], [data]);
    const [pageSize, setPageSize] = useLocalStorage('arandu-users-page-size', 10);

    const changeRole = useAsyncAction(
        (email: string, role: AppRole) => updateProfileRole(email, role),
        {
            successMessage: (user) => `Rol de ${user.email} actualizado a ${getRoleLabel(user.role)}.`,
            onSuccess: (updated) => {
                // Actualización local: evita recargar toda la tabla por un solo cambio.
                setData((current) =>
                    (current ?? []).map((user) =>
                        user.email.toLowerCase() === updated.email.toLowerCase() ? updated : user,
                    ),
                );
            },
        },
    );

    const changeActive = useAsyncAction(
        (email: string, active: boolean) => updateProfileActive(email, active),
        {
            successMessage: (user) => `${user.email} ahora está ${user.active ? 'activo' : 'inactivo'}.`,
            onSuccess: (updated) => {
                setData((current) =>
                    (current ?? []).map((user) =>
                        user.email.toLowerCase() === updated.email.toLowerCase() ? updated : user,
                    ),
                );
            },
        },
    );

    // No se puede dejar la plataforma sin administradores: se bloquea tanto
    // desactivar como reasignar el rol del único admin activo que queda. Es una
    // guarda de interfaz, no de seguridad — RLS permite la operación porque
    // cualquier admin puede gestionar `profiles`; ver docs/guia-componentes.md.
    const activeAdminCount = useMemo(
        () => users.filter((user) => user.role === 'admin' && user.active).length,
        [users],
    );
    const isLastActiveAdmin = (user: AppUser) => user.role === 'admin' && user.active && activeAdminCount === 1;

    const columns = useMemo<TableProps.ColumnDefinition<AppUser>[]>(
        () => [
            {
                id: 'email',
                header: 'Correo',
                cell: (item) => (
                    <SpaceBetween direction="horizontal" size="xs">
                        <span>{item.email}</span>
                        {item.email.toLowerCase() === currentUserEmail.toLowerCase() ? (
                            <Badge color="blue">tú</Badge>
                        ) : null}
                    </SpaceBetween>
                ),
                sortingField: 'email',
            },
            {
                id: 'name',
                header: 'Nombre',
                cell: (item) => item.name,
                sortingField: 'name',
            },
            {
                id: 'role',
                header: 'Rol actual',
                cell: (item) => getRoleLabel(item.role),
                sortingField: 'role',
            },
            {
                id: 'active',
                header: 'Estado',
                cell: (item) => (
                    <SpaceBetween size="xs">
                        <Toggle
                            checked={item.active}
                            disabled={changeActive.pending || (item.active && isLastActiveAdmin(item))}
                            onChange={({ detail }) => {
                                if (!detail.checked && isLastActiveAdmin(item)) return;
                                void changeActive.run(item.email, detail.checked);
                            }}
                        >
                            {item.active ? 'Activo' : 'Inactivo'}
                        </Toggle>
                        {item.active && isLastActiveAdmin(item) ? (
                            <Box variant="small" color="text-status-inactive">
                                Único administrador activo
                            </Box>
                        ) : null}
                    </SpaceBetween>
                ),
                sortingField: 'active',
            },
            {
                id: 'actions',
                header: 'Cambiar rol',
                cell: (item) => (
                    <SpaceBetween size="xs">
                        <Select
                            expandToViewport
                            disabled={changeRole.pending || isLastActiveAdmin(item)}
                            selectedOption={
                                ROLE_OPTIONS.filter((option) => option.value === item.role).map((option) => ({
                                    label: option.label,
                                    value: option.value,
                                }))[0] ?? null
                            }
                            options={ROLE_OPTIONS.map((option) => ({
                                label: option.label,
                                value: option.value,
                                description: option.description,
                            }))}
                            onChange={({ detail }) => {
                                const nextRole = detail.selectedOption.value as AppRole;
                                if (nextRole === item.role) return;
                                void changeRole.run(item.email, nextRole);
                            }}
                            placeholder="Selecciona un rol"
                            ariaLabel={`Cambiar el rol de ${item.email}`}
                        />
                        {isLastActiveAdmin(item) ? (
                            <Box variant="small" color="text-status-inactive">
                                No puedes cambiar el rol del único administrador activo
                            </Box>
                        ) : null}
                    </SpaceBetween>
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [currentUserEmail, changeRole.pending, changeActive.pending, activeAdminCount],
    );

    const { items, collectionProps, filterProps, paginationProps, filteredItemsCount, actions } = useCollection(
        users,
        {
            filtering: {
                filteringFunction: (item, filteringText) => {
                    const term = filteringText.toLowerCase();
                    return (
                        item.email.toLowerCase().includes(term) ||
                        item.name.toLowerCase().includes(term) ||
                        getRoleLabel(item.role).toLowerCase().includes(term)
                    );
                },
                empty: (
                    <EmptyState
                        title="Sin usuarios registrados"
                        description="Los usuarios aparecerán aquí en cuanto se registren en la plataforma."
                    />
                ),
            },
            pagination: { pageSize },
            sorting: { defaultState: { sortingColumn: columns[0] } },
        },
    );

    // El estado "sin resultados del filtro" se calcula aparte de `empty` de
    // useCollection: referenciar `actions` dentro de la misma llamada que lo
    // devuelve crea una dependencia circular que el linter rechaza.
    const emptyState =
        filterProps.filteringText && items.length === 0 ? (
            <EmptyState
                title="Sin resultados"
                description="Ningún usuario coincide con tu búsqueda."
                action={<Button onClick={() => actions.setFiltering('')}>Limpiar filtro</Button>}
            />
        ) : (
            collectionProps.empty
        );

    return (
        <SpaceBetween size="l">
            <FeedbackAlert
                error={error ?? changeRole.error ?? changeActive.error}
                success={changeRole.success ?? changeActive.success}
                onRetry={error ? () => void reload() : undefined}
                onDismiss={() => {
                    changeRole.reset();
                    changeActive.reset();
                }}
            />

            <DataTable
                title="Usuarios"
                description="Los roles y el estado de cuenta se guardan en la tabla profiles de Supabase y determinan el acceso a cada sección."
                trackBy="email"
                items={items}
                totalCount={filteredItemsCount ?? users.length}
                loading={loading}
                loadingText="Cargando usuarios"
                filter={
                    <TextFilter
                        {...filterProps}
                        filteringAriaLabel="Buscar usuarios"
                        filteringPlaceholder="Buscar por nombre, correo o rol"
                        countText={filterProps.filteringText ? `${filteredItemsCount ?? 0} coincidencias` : ''}
                    />
                }
                preferences={
                    <CollectionPreferences
                        title="Preferencias"
                        confirmLabel="Confirmar"
                        cancelLabel="Cancelar"
                        preferences={{ pageSize }}
                        onConfirm={({ detail }) => setPageSize(detail.pageSize ?? 10)}
                        pageSizePreference={{ title: 'Tamaño de página', options: PAGE_SIZE_OPTIONS }}
                    />
                }
                sortingColumn={collectionProps.sortingColumn}
                sortingDescending={collectionProps.sortingDescending}
                onSortingChange={collectionProps.onSortingChange}
                empty={emptyState}
                pagination={<Pagination {...paginationProps} />}
                actions={
                    <Button iconName="refresh" onClick={() => void reload()} loading={loading}>
                        Actualizar
                    </Button>
                }
                columns={columns}
            />
        </SpaceBetween>
    );
}
