import { useMemo, useState } from 'react';

import Button from '@cloudscape-design/components/button';
import FormField from '@cloudscape-design/components/form-field';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import type { TableProps } from '@cloudscape-design/components/table';

import { DataTable, EmptyState, FeedbackAlert } from '../../components/ui';
import { useAsyncData } from '../../hooks/useAsyncData';
import { hasPermission } from '../../lib/roles';
import { schedulesService, subjectsService, teachersService } from '../../services';
import type { AppSession, Schedule } from '../../types';
import { getDayLabel } from './DAY_OPTIONS';
import ScheduleFormModal from './ScheduleFormModal';

type ModalState = { mode: 'create' } | { mode: 'edit'; schedule: Schedule } | null;

interface SchedulesPanelProps {
    session: AppSession;
}

/**
 * Horarios por grado. Visible a todos los roles (estudiantes y padres
 * también consultan el horario); solo admin/coordinador ven las acciones de
 * crear/editar.
 */
export default function SchedulesPanel({ session }: SchedulesPanelProps) {
    const canManage = hasPermission(session.user.role, 'manage-schedules');

    const { data, loading, error, reload, setData } = useAsyncData(() => schedulesService.list(), []);
    const schedules = useMemo(() => data ?? [], [data]);

    const { data: subjects } = useAsyncData(() => subjectsService.list(), []);
    const { data: teachers } = useAsyncData(() => teachersService.list(), []);
    const subjectById = useMemo(() => new Map((subjects ?? []).map((subject) => [subject.id, subject])), [subjects]);
    const teacherById = useMemo(() => new Map((teachers ?? []).map((teacher) => [teacher.id, teacher])), [teachers]);

    const gradeLevels = useMemo(
        () => Array.from(new Set(schedules.map((schedule) => schedule.gradeLevel))).sort(),
        [schedules],
    );
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
    const activeGrade = selectedGrade ?? gradeLevels[0] ?? null;

    const weekly = useMemo(
        () =>
            schedules
                .filter((schedule) => schedule.gradeLevel === activeGrade)
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)),
        [schedules, activeGrade],
    );

    const [modal, setModal] = useState<ModalState>(null);

    const columns: TableProps.ColumnDefinition<Schedule>[] = [
        { id: 'day', header: 'Día', cell: (item) => getDayLabel(item.dayOfWeek) },
        { id: 'time', header: 'Hora', cell: (item) => `${item.startTime.slice(0, 5)} – ${item.endTime.slice(0, 5)}` },
        { id: 'subject', header: 'Asignatura', cell: (item) => subjectById.get(item.subjectId)?.name ?? '—' },
        {
            id: 'teacher',
            header: 'Docente',
            cell: (item) => (item.teacherId ? teacherById.get(item.teacherId)?.fullName ?? '—' : '—'),
        },
        { id: 'classroom', header: 'Aula', cell: (item) => item.classroom ?? '—' },
        ...(canManage
            ? [
                {
                    id: 'actions',
                    header: 'Editar',
                    cell: (item: Schedule) => (
                        <Button variant="inline-link" onClick={() => setModal({ mode: 'edit', schedule: item })}>
                            Editar
                        </Button>
                    ),
                },
            ]
            : []),
    ];

    return (
        <SpaceBetween size="l">
            <FeedbackAlert error={error} onRetry={error ? () => void reload() : undefined} />

            {gradeLevels.length > 0 ? (
                <FormField label="Grado o curso">
                    <Select
                        selectedOption={activeGrade ? { label: activeGrade, value: activeGrade } : null}
                        onChange={({ detail }) => setSelectedGrade(detail.selectedOption.value ?? null)}
                        options={gradeLevels.map((grade) => ({ label: grade, value: grade }))}
                    />
                </FormField>
            ) : null}

            <DataTable
                title={activeGrade ? `Horario — ${activeGrade}` : 'Horario'}
                description="Franjas horarias ordenadas por día y hora."
                trackBy="id"
                items={weekly}
                loading={loading}
                loadingText="Cargando horario"
                emptyTitle="Sin horarios registrados"
                emptyDescription={
                    canManage ? 'Crea el primero con el botón «Nuevo horario».' : 'Todavía no hay horarios publicados.'
                }
                actions={
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button iconName="refresh" onClick={() => void reload()} loading={loading}>
                            Actualizar
                        </Button>
                        {canManage ? (
                            <Button variant="primary" iconName="add-plus" onClick={() => setModal({ mode: 'create' })}>
                                Nuevo horario
                            </Button>
                        ) : null}
                    </SpaceBetween>
                }
                columns={columns}
            />

            {!loading && gradeLevels.length === 0 ? (
                <EmptyState
                    title="Sin horarios registrados"
                    description={
                        canManage ? 'Crea el primero con el botón «Nuevo horario».' : 'Todavía no hay horarios publicados.'
                    }
                />
            ) : null}

            {modal && canManage ? (
                <ScheduleFormModal
                    key={modal.mode === 'edit' ? modal.schedule.id : 'new'}
                    schedule={modal.mode === 'edit' ? modal.schedule : undefined}
                    onDismiss={() => setModal(null)}
                    onSaved={(saved) => {
                        setData((current) => {
                            const list = current ?? [];
                            const exists = list.some((schedule) => schedule.id === saved.id);
                            return exists ? list.map((schedule) => (schedule.id === saved.id ? saved : schedule)) : [...list, saved];
                        });
                        setModal(null);
                    }}
                />
            ) : null}
        </SpaceBetween>
    );
}
