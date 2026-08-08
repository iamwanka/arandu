import { useMemo, useState } from 'react';

import { useCollection } from '@cloudscape-design/collection-hooks';
import Button from '@cloudscape-design/components/button';
import CollectionPreferences from '@cloudscape-design/components/collection-preferences';
import Pagination from '@cloudscape-design/components/pagination';
import SpaceBetween from '@cloudscape-design/components/space-between';
import type { TableProps } from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';
import Toggle from '@cloudscape-design/components/toggle';

import { DataTable, EmptyState, FeedbackAlert } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { teachersService } from '../../services';
import type { Teacher } from '../../types';
import TeacherFormModal from './TeacherFormModal';

const PAGE_SIZE_OPTIONS = [
    { value: 10, label: '10 docentes' },
    { value: 20, label: '20 docentes' },
    { value: 50, label: '50 docentes' },
];

type ModalState = { mode: 'create' } | { mode: 'edit'; teacher: Teacher } | null;

/** Listado, alta y edición de docentes. Reservado a administradores y coordinadores. */
export default function TeachersPanel() {
    const { data, loading, error, reload, setData } = useAsyncData(() => teachersService.list(), []);
    const teachers = useMemo(() => data ?? [], [data]);

    const [pageSize, setPageSize] = useLocalStorage('arandu-teachers-page-size', 10);
    const [modal, setModal] = useState<ModalState>(null);

    const toggleActive = useAsyncAction(
        (teacher: Teacher, active: boolean) => teachersService.update(teacher.id, { active }),
        {
            successMessage: (updated) => `${updated.fullName} ahora está ${updated.active ? 'activo' : 'inactivo'}.`,
            onSuccess: (updated) => {
                setData((current) => (current ?? []).map((teacher) => (teacher.id === updated.id ? updated : teacher)));
            },
        },
    );

    const columns = useMemo<TableProps.ColumnDefinition<Teacher>[]>(
        () => [
            { id: 'fullName', header: 'Nombre', cell: (item) => item.fullName, sortingField: 'fullName' },
            { id: 'specialty', header: 'Especialidad', cell: (item) => item.specialty ?? '—', sortingField: 'specialty' },
            { id: 'email', header: 'Correo', cell: (item) => item.email ?? '—' },
            { id: 'phone', header: 'Teléfono', cell: (item) => item.phone ?? '—' },
            {
                id: 'active',
                header: 'Estado',
                cell: (item) => (
                    <Toggle
                        checked={item.active}
                        disabled={toggleActive.pending}
                        onChange={({ detail }) => void toggleActive.run(item, detail.checked)}
                    >
                        {item.active ? 'Activo' : 'Inactivo'}
                    </Toggle>
                ),
                sortingField: 'active',
            },
            {
                id: 'actions',
                header: 'Editar',
                cell: (item) => (
                    <Button variant="inline-link" onClick={() => setModal({ mode: 'edit', teacher: item })}>
                        Editar
                    </Button>
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [toggleActive.pending],
    );

    const { items, collectionProps, filterProps, paginationProps, filteredItemsCount, actions } = useCollection(
        teachers,
        {
            filtering: {
                filteringFunction: (item, filteringText) => {
                    const term = filteringText.toLowerCase();
                    return (
                        item.fullName.toLowerCase().includes(term) ||
                        (item.specialty ?? '').toLowerCase().includes(term) ||
                        (item.email ?? '').toLowerCase().includes(term)
                    );
                },
                empty: (
                    <EmptyState title="Sin docentes registrados" description="Crea el primero con el botón «Nuevo docente»." />
                ),
            },
            pagination: { pageSize },
            sorting: { defaultState: { sortingColumn: columns[0] } },
        },
    );

    const emptyState =
        filterProps.filteringText && items.length === 0 ? (
            <EmptyState
                title="Sin resultados"
                description="Ningún docente coincide con tu búsqueda."
                action={<Button onClick={() => actions.setFiltering('')}>Limpiar filtro</Button>}
            />
        ) : (
            collectionProps.empty
        );

    const existingProfileIds = teachers.map((teacher) => teacher.profileId);

    return (
        <SpaceBetween size="l">
            <FeedbackAlert
                error={error ?? toggleActive.error}
                success={toggleActive.success}
                onRetry={error ? () => void reload() : undefined}
                onDismiss={toggleActive.reset}
            />

            <DataTable
                title="Docentes"
                description="Cada docente está vinculado a una cuenta con rol Docente."
                trackBy="id"
                items={items}
                totalCount={filteredItemsCount ?? teachers.length}
                loading={loading}
                loadingText="Cargando docentes"
                filter={
                    <TextFilter
                        {...filterProps}
                        filteringAriaLabel="Buscar docentes"
                        filteringPlaceholder="Buscar por nombre, especialidad o correo"
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
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button iconName="refresh" onClick={() => void reload()} loading={loading}>
                            Actualizar
                        </Button>
                        <Button variant="primary" iconName="add-plus" onClick={() => setModal({ mode: 'create' })}>
                            Nuevo docente
                        </Button>
                    </SpaceBetween>
                }
                columns={columns}
            />

            {modal ? (
                <TeacherFormModal
                    key={modal.mode === 'edit' ? modal.teacher.id : 'new'}
                    teacher={modal.mode === 'edit' ? modal.teacher : undefined}
                    excludeProfileIds={existingProfileIds}
                    onDismiss={() => setModal(null)}
                    onSaved={(saved) => {
                        setData((current) => {
                            const list = current ?? [];
                            const exists = list.some((teacher) => teacher.id === saved.id);
                            return exists ? list.map((teacher) => (teacher.id === saved.id ? saved : teacher)) : [...list, saved];
                        });
                        setModal(null);
                    }}
                />
            ) : null}
        </SpaceBetween>
    );
}
