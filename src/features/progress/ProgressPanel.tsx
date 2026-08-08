import Tabs from '@cloudscape-design/components/tabs';

import type { AppSession } from '../../types';
import AttendanceEntryPanel from './AttendanceEntryPanel';
import DisciplineEntryPanel from './DisciplineEntryPanel';
import GradeEntryPanel from './GradeEntryPanel';
import MyProgressView from './MyProgressView';

interface ProgressPanelProps {
    session: AppSession;
}

/**
 * Sección "Progreso": el mismo punto de navegación sirve dos propósitos
 * distintos según el rol, tal como refleja la ruta en `appRoutes.ts`.
 *
 * - admin/coordinator/teacher: herramientas de registro (notas y asistencia).
 * - student/parent: consulta de solo lectura de su propio progreso.
 */
export default function ProgressPanel({ session }: ProgressPanelProps) {
    const { role } = session.user;

    if (role === 'student' || role === 'parent') {
        return <MyProgressView session={session} />;
    }

    return (
        <Tabs
            tabs={[
                { id: 'grades', label: 'Registrar calificaciones', content: <GradeEntryPanel session={session} /> },
                { id: 'attendance', label: 'Registrar asistencia', content: <AttendanceEntryPanel session={session} /> },
                { id: 'discipline', label: 'Disciplina', content: <DisciplineEntryPanel session={session} /> },
            ]}
        />
    );
}
