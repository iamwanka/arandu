import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { DataTable, EmptyState, FeedbackAlert, SectionCard } from '../../../../components/ui';
import { useAsyncData } from '../../../../hooks/useAsyncData';
import { schedulesService, subjectsService, teachersService } from '../../../../services';
import type { AppSession, DayOfWeek } from '../../../../types';

interface TeacherOverviewProps {
    session: AppSession;
    onNavigate: (path: string) => void;
}

function todayDayOfWeek(): DayOfWeek {
    const jsDay = new Date().getDay();
    return (jsDay === 0 ? 7 : jsDay) as DayOfWeek;
}

/** Resumen para docentes: sus asignaturas y el horario de hoy, con acceso directo a registrar notas/asistencia. */
export default function TeacherOverview({ session, onNavigate }: TeacherOverviewProps) {
    const { data, loading, error } = useAsyncData(async () => {
        const teachers = await teachersService.list();
        const myTeacher = teachers.find((teacher) => teacher.profileId === session.user.id) ?? null;

        if (!myTeacher) {
            return { myTeacher: null, mySubjects: [], todaySchedule: [] };
        }

        const [subjects, schedules] = await Promise.all([subjectsService.list(), schedulesService.list()]);
        const mySubjects = subjects.filter((subject) => subject.teacherId === myTeacher.id);
        const todaySchedule = schedules
            .filter((schedule) => schedule.teacherId === myTeacher.id && schedule.dayOfWeek === todayDayOfWeek())
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return { myTeacher, mySubjects, todaySchedule };
    }, [session.user.id]);

    const subjectById = new Map((data?.mySubjects ?? []).map((subject) => [subject.id, subject]));

    return (
        <SectionCard title="Tu día" description="Asignaturas a tu cargo y horario de hoy.">
            <SpaceBetween size="l">
                <FeedbackAlert error={error} />

                {!loading && data && !data.myTeacher ? (
                    <EmptyState
                        title="Sin registro de docente vinculado"
                        description="Tu cuenta todavía no está vinculada a un registro de docente. Contacta a un administrador."
                    />
                ) : (
                    <>
                        <SpaceBetween direction="horizontal" size="xs">
                            <Button onClick={() => onNavigate('/dashboard/progress')}>Registrar calificaciones</Button>
                            <Button onClick={() => onNavigate('/dashboard/progress')}>Registrar asistencia</Button>
                        </SpaceBetween>

                        <DataTable
                            title="Horario de hoy"
                            trackBy="id"
                            items={data?.todaySchedule ?? []}
                            loading={loading}
                            loadingText="Cargando horario"
                            emptyTitle="Sin clases hoy"
                            emptyDescription="No tienes clases programadas para hoy en el horario."
                            columns={[
                                { id: 'time', header: 'Hora', cell: (item) => `${item.startTime.slice(0, 5)} – ${item.endTime.slice(0, 5)}` },
                                { id: 'subject', header: 'Asignatura', cell: (item) => subjectById.get(item.subjectId)?.name ?? '—' },
                                { id: 'grade', header: 'Grado', cell: (item) => item.gradeLevel },
                                { id: 'classroom', header: 'Aula', cell: (item) => item.classroom ?? '—' },
                            ]}
                        />
                    </>
                )}
            </SpaceBetween>
        </SectionCard>
    );
}
