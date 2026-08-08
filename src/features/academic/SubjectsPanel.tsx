import { useMemo, useState } from 'react';

import { useCollection } from '@cloudscape-design/collection-hooks';
import Button from '@cloudscape-design/components/button';
import CollectionPreferences from '@cloudscape-design/components/collection-preferences';
import Pagination from '@cloudscape-design/components/pagination';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import type { TableProps } from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';

import { DataTable, EmptyState, FeedbackAlert } from '../../components/ui';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { subjectsService, teachersService } from '../../services';
import type { Subject } from '../../types';
import SubjectFormModal from './SubjectFormModal';

const PAGE_SIZE_OPTIONS = [
    { value: 10, label: '10 asignaturas' },
    { value: 20, label: '20 asignaturas' },
    { value: 50, label: '50 asignaturas' },
];

type ModalState = { mode: 'create' } | { mode: 'edit'; subject: Subject } | null;

/** Listado, alta y edición de asignaturas. Reservado a administradores y coordinadores. */
export default function SubjectsPanel() {
    const { data, loading, error, reload, setData } = useAsyncData(() => subjectsService.list(), []);
    const subjects = useMemo(() => data ?? [], [data]);
    const { data: teachers } = useAsyncData(() => teachersService.list(), []);
    const teacherById = useMemo(() => new Map((teachers ?? []).map((teacher) => [teacher.id, teacher])), [teachers]);

    const [pageSize, setPageSize] = useLocalStorage('arandu-subjects-page-size', 10);
    const [modal, setModal] = useState<ModalState>(null);

    const columns = useMemo<TableProps.ColumnDefinition<Subject>[]>(
        () => [
            { id: 'code', header: 'Código', cell: (item) => item.code, sortingField: 'code' },
            { id: 'name', header: 'Nombre', cell: (item) => item.name, sortingField: 'name' },
            { id: 'gradeLevel', header: 'Grado', cell: (item) => item.gradeLevel ?? '—', sortingField: 'gradeLevel' },
            {
                id: 'teacher',
                header: 'Docente responsable',
                cell: (item) => (item.teacherId ? teacherById.get(item.teacherId)?.fullName ?? '—' : '—'),
            },
            {
                id: 'active',
                header: 'Estado',
                cell: (item) =>
                    item.active ? (
                        <StatusIndicator type="success">Activa</StatusIndicator>
                    ) : (
                        <StatusIndicator type="stopped">Inactiva</StatusIndicator>
                    ),
                sortingField: 'active',
            },
            {
                id: 'actions',
                header: 'Editar',
                cell: (item) => (
                    <Button variant="inline-link" onClick={() => setModal({ mode: 'edit', subject: item })}>
                        Editar
                    </Button>
                ),
            },
        ],
        [teacherById],
    );

    const { items, collectionProps, filterProps, paginationProps, filteredItemsCount, actions } = useCollection(subjects, {
        filtering: {
            filteringFunction: (item, filteringText) => {
                const term = filteringText.toLowerCase();
                return (
                    item.name.toLowerCase().includes(term) ||
                    item.code.toLowerCase().includes(term) ||
                    (item.gradeLevel ?? '').toLowerCase().includes(term)
                );
            },
            empty: <EmptyState title="Sin asignaturas registradas" description="Crea la primera con el botón «Nueva asignatura»." />,
        },
        pagination: { pageSize },
        sorting: { defaultState: { sortingColumn: columns[0] } },
    });

    const emptyState =
        filterProps.filteringText && items.length === 0 ? (
            <EmptyState
                title="Sin resultados"
                description="Ninguna asignatura coincide con tu búsqueda."
                action={<Button onClick={() => actions.setFiltering('')}>Limpiar filtro</Button>}
            />
        ) : (
            collectionProps.empty
        );

    return (
        <SpaceBetween size="l">
            <FeedbackAlert error={error} onRetry={error ? () => void reload() : undefined} />

            <DataTable
                title="Asignaturas"
                trackBy="id"
                items={items}
                totalCount={filteredItemsCount ?? subjects.length}
                loading={loading}
                loadingText="Cargando asignaturas"
                filter={
                    <TextFilter
                        {...filterProps}
                        filteringAriaLabel="Buscar asignaturas"
                        filteringPlaceholder="Buscar por nombre, código o grado"
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
                            Nueva asignatura
                        </Button>
                    </SpaceBetween>
                }
                columns={columns}
            />

            {modal ? (
                <SubjectFormModal
                    key={modal.mode === 'edit' ? modal.subject.id : 'new'}
                    subject={modal.mode === 'edit' ? modal.subject : undefined}
                    onDismiss={() => setModal(null)}
                    onSaved={(saved) => {
                        setData((current) => {
                            const list = current ?? [];
                            const exists = list.some((subject) => subject.id === saved.id);
                            return exists ? list.map((subject) => (subject.id === saved.id ? saved : subject)) : [...list, saved];
                        });
                        setModal(null);
                    }}
                />
            ) : null}
        </SpaceBetween>
    );
}
