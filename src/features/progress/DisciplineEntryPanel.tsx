import { useMemo, useState } from 'react';

import { useCollection } from '@cloudscape-design/collection-hooks';
import Badge from '@cloudscape-design/components/badge';
import Button from '@cloudscape-design/components/button';
import CollectionPreferences from '@cloudscape-design/components/collection-preferences';
import Pagination from '@cloudscape-design/components/pagination';
import SpaceBetween from '@cloudscape-design/components/space-between';
import type { TableProps } from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';

import { DataTable, EmptyState, FeedbackAlert } from '../../components/ui';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { disciplinaryRecordsService, studentsService } from '../../services';
import type { AppSession, DisciplinaryRecord } from '../../types';
import DisciplineFormModal from './DisciplineFormModal';
import { getSeverityLabel } from './SEVERITY_OPTIONS';

const PAGE_SIZE_OPTIONS = [
    { value: 10, label: '10 incidencias' },
    { value: 20, label: '20 incidencias' },
];

interface DisciplineEntryPanelProps {
    session: AppSession;
}

/** Listado y alta de incidencias disciplinarias. Reservado a admin/coordinador/docente. */
export default function DisciplineEntryPanel({ session }: DisciplineEntryPanelProps) {
    const { data, loading, error, reload, setData } = useAsyncData(() => disciplinaryRecordsService.list(), []);
    const records = useMemo(() => data ?? [], [data]);
    const { data: students } = useAsyncData(() => studentsService.list(), []);
    const studentById = useMemo(() => new Map((students ?? []).map((student) => [student.id, student])), [students]);

    const [pageSize, setPageSize] = useLocalStorage('arandu-discipline-page-size', 10);
    const [modalOpen, setModalOpen] = useState(false);

    const columns: TableProps.ColumnDefinition<DisciplinaryRecord>[] = [
        {
            id: 'student',
            header: 'Estudiante',
            cell: (item) => studentById.get(item.studentId)?.fullName ?? item.studentId,
        },
        { id: 'date', header: 'Fecha', cell: (item) => item.recordDate, sortingField: 'recordDate' },
        {
            id: 'severity',
            header: 'Gravedad',
            cell: (item) => (
                <Badge color={item.severity === 'grave' ? 'red' : item.severity === 'moderada' ? 'blue' : 'grey'}>
                    {getSeverityLabel(item.severity)}
                </Badge>
            ),
        },
        { id: 'description', header: 'Descripción', cell: (item) => item.description },
        { id: 'notified', header: 'Notificado', cell: (item) => (item.notifiedParent ? 'Sí' : 'No') },
    ];

    const { items, collectionProps, filterProps, paginationProps, filteredItemsCount, actions } = useCollection(records, {
        filtering: {
            filteringFunction: (item, filteringText) => {
                const term = filteringText.toLowerCase();
                const studentName = studentById.get(item.studentId)?.fullName ?? '';
                return studentName.toLowerCase().includes(term) || item.description.toLowerCase().includes(term);
            },
            empty: (
                <EmptyState title="Sin incidencias registradas" description="Registra la primera con el botón «Nueva incidencia»." />
            ),
        },
        pagination: { pageSize },
        sorting: { defaultState: { sortingColumn: columns[1] } },
    });

    const emptyState =
        filterProps.filteringText && items.length === 0 ? (
            <EmptyState
                title="Sin resultados"
                description="Ninguna incidencia coincide con tu búsqueda."
                action={<Button onClick={() => actions.setFiltering('')}>Limpiar filtro</Button>}
            />
        ) : (
            collectionProps.empty
        );

    return (
        <SpaceBetween size="l">
            <FeedbackAlert error={error} onRetry={error ? () => void reload() : undefined} />

            <DataTable
                title="Incidencias disciplinarias"
                trackBy="id"
                items={items}
                totalCount={filteredItemsCount ?? records.length}
                loading={loading}
                loadingText="Cargando incidencias"
                filter={
                    <TextFilter
                        {...filterProps}
                        filteringAriaLabel="Buscar incidencias"
                        filteringPlaceholder="Buscar por estudiante o descripción"
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
                        <Button variant="primary" iconName="add-plus" onClick={() => setModalOpen(true)}>
                            Nueva incidencia
                        </Button>
                    </SpaceBetween>
                }
                columns={columns}
            />

            {modalOpen ? (
                <DisciplineFormModal
                    session={session}
                    onDismiss={() => setModalOpen(false)}
                    onSaved={(saved) => {
                        setData((current) => [saved, ...(current ?? [])]);
                        setModalOpen(false);
                    }}
                />
            ) : null}
        </SpaceBetween>
    );
}
