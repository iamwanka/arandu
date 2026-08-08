import { useMemo, useState } from 'react';

import { useCollection } from '@cloudscape-design/collection-hooks';
import Button from '@cloudscape-design/components/button';
import CollectionPreferences from '@cloudscape-design/components/collection-preferences';
import Pagination from '@cloudscape-design/components/pagination';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import type { TableProps } from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';

import { DataTable, EmptyState, FeedbackAlert } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { academicPeriodsService, enrollmentsService, studentsService } from '../../services';
import type { AppSession, Enrollment, EnrollmentStatus } from '../../types';
import EnrollmentWizard from './EnrollmentWizard';

const PAGE_SIZE_OPTIONS = [
    { value: 10, label: '10 matrículas' },
    { value: 20, label: '20 matrículas' },
    { value: 50, label: '50 matrículas' },
];

// El esquema no tiene un valor "pendiente" propio: 'inactive' cumple ese rol
// (matrícula registrada pero no confirmada / retirada antes de iniciar).
const STATUS_OPTIONS: Array<{ value: EnrollmentStatus; label: string }> = [
    { value: 'active', label: 'Activa' },
    { value: 'inactive', label: 'Pendiente / inactiva' },
    { value: 'graduated', label: 'Finalizada' },
    { value: 'suspended', label: 'Suspendida' },
];

function getStatusLabel(status: EnrollmentStatus): string {
    return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function StatusBadge({ status }: { status: EnrollmentStatus }) {
    if (status === 'active') return <StatusIndicator type="success">{getStatusLabel(status)}</StatusIndicator>;
    if (status === 'graduated') return <StatusIndicator type="info">{getStatusLabel(status)}</StatusIndicator>;
    if (status === 'suspended') return <StatusIndicator type="warning">{getStatusLabel(status)}</StatusIndicator>;
    return <StatusIndicator type="stopped">{getStatusLabel(status)}</StatusIndicator>;
}

interface EnrollmentsPanelProps {
    session: AppSession;
}

/** Listado de matrículas y punto de entrada al wizard de matrícula nueva. */
export default function EnrollmentsPanel({ session }: EnrollmentsPanelProps) {
    const { data, loading, error, reload, setData } = useAsyncData(() => enrollmentsService.list(), []);
    const enrollments = useMemo(() => data ?? [], [data]);
    const { data: students } = useAsyncData(() => studentsService.list(), []);
    const { data: periods } = useAsyncData(() => academicPeriodsService.list(), []);

    const studentById = useMemo(() => new Map((students ?? []).map((student) => [student.id, student])), [students]);
    const periodById = useMemo(() => new Map((periods ?? []).map((period) => [period.id, period])), [periods]);

    const [pageSize, setPageSize] = useLocalStorage('arandu-enrollments-page-size', 10);
    const [wizardOpen, setWizardOpen] = useState(false);

    const changeStatus = useAsyncAction(
        (enrollment: Enrollment, status: EnrollmentStatus) => enrollmentsService.update(enrollment.id, { status }),
        {
            successMessage: (updated) => `Matrícula actualizada a «${getStatusLabel(updated.status)}».`,
            onSuccess: (updated) => {
                setData((current) => (current ?? []).map((enrollment) => (enrollment.id === updated.id ? updated : enrollment)));
            },
        },
    );

    const columns = useMemo<TableProps.ColumnDefinition<Enrollment>[]>(
        () => [
            {
                id: 'student',
                header: 'Estudiante',
                cell: (item) => studentById.get(item.studentId)?.fullName ?? item.studentId,
            },
            {
                id: 'period',
                header: 'Periodo académico',
                cell: (item) => periodById.get(item.academicPeriodId)?.name ?? item.academicPeriodId,
            },
            { id: 'gradeLevel', header: 'Grado', cell: (item) => item.gradeLevel },
            { id: 'enrollmentDate', header: 'Fecha', cell: (item) => item.enrollmentDate, sortingField: 'enrollmentDate' },
            {
                id: 'status',
                header: 'Estado',
                cell: (item) => (
                    <SpaceBetween size="xs">
                        <StatusBadge status={item.status} />
                        <Select
                            selectedOption={{ value: item.status, label: getStatusLabel(item.status) }}
                            options={STATUS_OPTIONS}
                            disabled={changeStatus.pending}
                            onChange={({ detail }) => {
                                const nextStatus = detail.selectedOption.value as EnrollmentStatus;
                                if (nextStatus === item.status) return;
                                void changeStatus.run(item, nextStatus);
                            }}
                            expandToViewport
                        />
                    </SpaceBetween>
                ),
            },
        ],
        [studentById, periodById, changeStatus],
    );

    const { items, collectionProps, filterProps, paginationProps, filteredItemsCount, actions } = useCollection(enrollments, {
        filtering: {
            filteringFunction: (item, filteringText) => {
                const term = filteringText.toLowerCase();
                const studentName = studentById.get(item.studentId)?.fullName ?? '';
                const periodName = periodById.get(item.academicPeriodId)?.name ?? '';
                return (
                    studentName.toLowerCase().includes(term) ||
                    periodName.toLowerCase().includes(term) ||
                    item.gradeLevel.toLowerCase().includes(term)
                );
            },
            empty: (
                <EmptyState title="Sin matrículas registradas" description="Inicia el proceso con el botón «Nueva matrícula»." />
            ),
        },
        pagination: { pageSize },
        sorting: { defaultState: { sortingColumn: columns[3] } },
    });

    const emptyState =
        filterProps.filteringText && items.length === 0 ? (
            <EmptyState
                title="Sin resultados"
                description="Ninguna matrícula coincide con tu búsqueda."
                action={<Button onClick={() => actions.setFiltering('')}>Limpiar filtro</Button>}
            />
        ) : (
            collectionProps.empty
        );

    if (wizardOpen) {
        return (
            <SpaceBetween size="l">
                <EnrollmentWizard
                    session={session}
                    onDismiss={() => setWizardOpen(false)}
                    onCreated={(created) => {
                        setData((current) => [created, ...(current ?? [])]);
                        setWizardOpen(false);
                    }}
                />
            </SpaceBetween>
        );
    }

    return (
        <SpaceBetween size="l">
            <FeedbackAlert
                error={error ?? changeStatus.error}
                success={changeStatus.success}
                onRetry={error ? () => void reload() : undefined}
                onDismiss={changeStatus.reset}
            />

            <DataTable
                title="Matrículas"
                trackBy="id"
                items={items}
                totalCount={filteredItemsCount ?? enrollments.length}
                loading={loading}
                loadingText="Cargando matrículas"
                filter={
                    <TextFilter
                        {...filterProps}
                        filteringAriaLabel="Buscar matrículas"
                        filteringPlaceholder="Buscar por estudiante, periodo o grado"
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
                        <Button variant="primary" iconName="add-plus" onClick={() => setWizardOpen(true)}>
                            Nueva matrícula
                        </Button>
                    </SpaceBetween>
                }
                columns={columns}
            />
        </SpaceBetween>
    );
}
