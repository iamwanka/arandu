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
import { academicPeriodsService } from '../../services';
import type { AcademicPeriod } from '../../types';
import AcademicPeriodFormModal from './AcademicPeriodFormModal';

const PAGE_SIZE_OPTIONS = [
    { value: 10, label: '10 periodos' },
    { value: 20, label: '20 periodos' },
];

type ModalState = { mode: 'create' } | { mode: 'edit'; period: AcademicPeriod } | null;

/** Listado, alta y edición de periodos académicos. Reservado a administradores y coordinadores. */
export default function AcademicPeriodsPanel() {
    const { data, loading, error, reload, setData } = useAsyncData(() => academicPeriodsService.list(), []);
    const periods = useMemo(() => data ?? [], [data]);

    const [pageSize, setPageSize] = useLocalStorage('arandu-periods-page-size', 10);
    const [modal, setModal] = useState<ModalState>(null);

    const toggleActive = useAsyncAction(
        (period: AcademicPeriod, isActive: boolean) => academicPeriodsService.update(period.id, { isActive }),
        {
            successMessage: (updated) => `${updated.name} ahora está ${updated.isActive ? 'vigente' : 'no vigente'}.`,
            onSuccess: (updated) => {
                setData((current) => (current ?? []).map((period) => (period.id === updated.id ? updated : period)));
            },
        },
    );

    const columns = useMemo<TableProps.ColumnDefinition<AcademicPeriod>[]>(
        () => [
            { id: 'name', header: 'Nombre', cell: (item) => item.name, sortingField: 'name' },
            { id: 'startDate', header: 'Inicio', cell: (item) => item.startDate, sortingField: 'startDate' },
            { id: 'endDate', header: 'Fin', cell: (item) => item.endDate, sortingField: 'endDate' },
            {
                id: 'isActive',
                header: 'Vigente',
                cell: (item) => (
                    <Toggle
                        checked={item.isActive}
                        disabled={toggleActive.pending}
                        onChange={({ detail }) => void toggleActive.run(item, detail.checked)}
                    >
                        {item.isActive ? 'Sí' : 'No'}
                    </Toggle>
                ),
                sortingField: 'isActive',
            },
            {
                id: 'actions',
                header: 'Editar',
                cell: (item) => (
                    <Button variant="inline-link" onClick={() => setModal({ mode: 'edit', period: item })}>
                        Editar
                    </Button>
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [toggleActive.pending],
    );

    const { items, collectionProps, filterProps, paginationProps, filteredItemsCount, actions } = useCollection(periods, {
        filtering: {
            filteringFunction: (item, filteringText) => item.name.toLowerCase().includes(filteringText.toLowerCase()),
            empty: <EmptyState title="Sin periodos registrados" description="Crea el primero con el botón «Nuevo periodo»." />,
        },
        pagination: { pageSize },
        sorting: { defaultState: { sortingColumn: columns[0] } },
    });

    const emptyState =
        filterProps.filteringText && items.length === 0 ? (
            <EmptyState
                title="Sin resultados"
                description="Ningún periodo coincide con tu búsqueda."
                action={<Button onClick={() => actions.setFiltering('')}>Limpiar filtro</Button>}
            />
        ) : (
            collectionProps.empty
        );

    return (
        <SpaceBetween size="l">
            <FeedbackAlert
                error={error ?? toggleActive.error}
                success={toggleActive.success}
                onRetry={error ? () => void reload() : undefined}
                onDismiss={toggleActive.reset}
            />

            <DataTable
                title="Periodos académicos"
                trackBy="id"
                items={items}
                totalCount={filteredItemsCount ?? periods.length}
                loading={loading}
                loadingText="Cargando periodos"
                filter={
                    <TextFilter
                        {...filterProps}
                        filteringAriaLabel="Buscar periodos"
                        filteringPlaceholder="Buscar por nombre"
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
                            Nuevo periodo
                        </Button>
                    </SpaceBetween>
                }
                columns={columns}
            />

            {modal ? (
                <AcademicPeriodFormModal
                    key={modal.mode === 'edit' ? modal.period.id : 'new'}
                    period={modal.mode === 'edit' ? modal.period : undefined}
                    onDismiss={() => setModal(null)}
                    onSaved={(saved) => {
                        setData((current) => {
                            const list = current ?? [];
                            const exists = list.some((period) => period.id === saved.id);
                            return exists ? list.map((period) => (period.id === saved.id ? saved : period)) : [...list, saved];
                        });
                        setModal(null);
                    }}
                />
            ) : null}
        </SpaceBetween>
    );
}
