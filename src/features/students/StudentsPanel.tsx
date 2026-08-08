import { useMemo, useState } from 'react';

import { useCollection } from '@cloudscape-design/collection-hooks';
import Button from '@cloudscape-design/components/button';
import CollectionPreferences from '@cloudscape-design/components/collection-preferences';
import Pagination from '@cloudscape-design/components/pagination';
import SpaceBetween from '@cloudscape-design/components/space-between';
import type { TableProps } from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';

import { DataTable, EmptyState, FeedbackAlert } from '../../components/ui';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { studentsService } from '../../services';
import type { Student } from '../../types';
import ManageGuardiansModal from './ManageGuardiansModal';
import StudentFormModal from './StudentFormModal';

const PAGE_SIZE_OPTIONS = [
    { value: 10, label: '10 estudiantes' },
    { value: 20, label: '20 estudiantes' },
    { value: 50, label: '50 estudiantes' },
];

type ModalState = { mode: 'create' } | { mode: 'edit'; student: Student } | null;

/** Listado, alta y edición de estudiantes. Reservado a administradores y coordinadores. */
export default function StudentsPanel() {
    const { data, loading, error, reload, setData } = useAsyncData(() => studentsService.list(), []);
    const students = useMemo(() => data ?? [], [data]);

    const [pageSize, setPageSize] = useLocalStorage('arandu-students-page-size', 10);
    const [modal, setModal] = useState<ModalState>(null);
    const [guardiansFor, setGuardiansFor] = useState<Student | null>(null);

    const columns = useMemo<TableProps.ColumnDefinition<Student>[]>(
        () => [
            { id: 'fullName', header: 'Nombre', cell: (item) => item.fullName, sortingField: 'fullName' },
            { id: 'gradeLevel', header: 'Grado', cell: (item) => item.gradeLevel ?? '—', sortingField: 'gradeLevel' },
            { id: 'studentCode', header: 'Código', cell: (item) => item.studentCode ?? '—' },
            { id: 'phone', header: 'Teléfono', cell: (item) => item.phone ?? '—' },
            {
                id: 'guardians',
                header: 'Acudientes',
                cell: (item) => (
                    <Button variant="inline-link" onClick={() => setGuardiansFor(item)}>
                        Gestionar
                    </Button>
                ),
            },
            {
                id: 'actions',
                header: 'Editar',
                cell: (item) => (
                    <Button variant="inline-link" onClick={() => setModal({ mode: 'edit', student: item })}>
                        Editar
                    </Button>
                ),
            },
        ],
        [],
    );

    const { items, collectionProps, filterProps, paginationProps, filteredItemsCount, actions } = useCollection(
        students,
        {
            filtering: {
                filteringFunction: (item, filteringText) => {
                    const term = filteringText.toLowerCase();
                    return (
                        item.fullName.toLowerCase().includes(term) ||
                        (item.studentCode ?? '').toLowerCase().includes(term) ||
                        (item.gradeLevel ?? '').toLowerCase().includes(term)
                    );
                },
                empty: (
                    <EmptyState
                        title="Sin estudiantes registrados"
                        description="Crea el primero con el botón «Nuevo estudiante»."
                    />
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
                description="Ningún estudiante coincide con tu búsqueda."
                action={<Button onClick={() => actions.setFiltering('')}>Limpiar filtro</Button>}
            />
        ) : (
            collectionProps.empty
        );

    const existingProfileIds = students.map((student) => student.profileId);

    return (
        <SpaceBetween size="l">
            <FeedbackAlert error={error} onRetry={error ? () => void reload() : undefined} />

            <DataTable
                title="Estudiantes"
                description="Cada estudiante está vinculado a una cuenta con rol Estudiante."
                trackBy="id"
                items={items}
                totalCount={filteredItemsCount ?? students.length}
                loading={loading}
                loadingText="Cargando estudiantes"
                filter={
                    <TextFilter
                        {...filterProps}
                        filteringAriaLabel="Buscar estudiantes"
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
                            Nuevo estudiante
                        </Button>
                    </SpaceBetween>
                }
                columns={columns}
            />

            {modal ? (
                <StudentFormModal
                    key={modal.mode === 'edit' ? modal.student.id : 'new'}
                    student={modal.mode === 'edit' ? modal.student : undefined}
                    excludeProfileIds={existingProfileIds}
                    onDismiss={() => setModal(null)}
                    onSaved={(saved) => {
                        setData((current) => {
                            const list = current ?? [];
                            const exists = list.some((student) => student.id === saved.id);
                            return exists ? list.map((student) => (student.id === saved.id ? saved : student)) : [...list, saved];
                        });
                        setModal(null);
                    }}
                />
            ) : null}

            {guardiansFor ? <ManageGuardiansModal student={guardiansFor} onDismiss={() => setGuardiansFor(null)} /> : null}
        </SpaceBetween>
    );
}
