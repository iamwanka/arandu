import type { IconProps } from '@cloudscape-design/components/icon';
import type { StatusIndicatorProps } from '@cloudscape-design/components/status-indicator';

import type { Attendance, AttendanceStatus, DisciplinaryRecord, Grade, Subject } from '../../../../types';

interface ThresholdResult {
    type: StatusIndicatorProps.Type;
    label: string;
}

/** Sobre 10, coincide con la escala de calificaciones de la base (`grades.grade_value`). */
export function gradeStatus(value: number): ThresholdResult {
    if (value >= 7) return { type: 'success', label: 'Buen desempeño' };
    if (value >= 6) return { type: 'warning', label: 'En progreso' };
    return { type: 'error', label: 'Necesita apoyo' };
}

export function attendanceStatus(ratePercent: number): ThresholdResult {
    if (ratePercent >= 90) return { type: 'success', label: 'Asistencia sólida' };
    if (ratePercent >= 80) return { type: 'warning', label: 'Atención' };
    return { type: 'error', label: 'Asistencia baja' };
}

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
    present: 'Presente',
    absent: 'Ausente',
    justified: 'Justificada',
};

export interface ActivityItem {
    id: string;
    date: string;
    iconName: IconProps.Name;
    text: string;
}

/**
 * Notas, asistencia y disciplina combinadas en una sola línea de tiempo.
 *
 * `prefix` antepone el nombre del estudiante a cada entrada — lo usa
 * `ParentOverview` para mezclar la actividad de varios hijos en un solo feed
 * sin perder de quién es cada registro.
 */
export function buildActivityItems(
    grades: Grade[],
    attendance: Attendance[],
    discipline: DisciplinaryRecord[],
    subjectById: Map<string, Subject>,
    prefix?: string,
): ActivityItem[] {
    const label = (text: string) => (prefix ? `${prefix}: ${text}` : text);

    const items: ActivityItem[] = [
        ...grades.map((grade) => ({
            id: `grade-${grade.id}`,
            date: grade.createdAt,
            iconName: 'edit' as const,
            text: label(
                `Nota registrada en ${subjectById.get(grade.subjectId)?.name ?? 'una asignatura'}: ${grade.gradeValue.toFixed(1)}`,
            ),
        })),
        ...attendance.map((record) => ({
            id: `attendance-${record.id}`,
            date: record.createdAt,
            iconName: 'calendar' as const,
            text: label(
                `Asistencia del ${new Date(record.attendanceDate).toLocaleDateString('es-CO')}: ${ATTENDANCE_LABELS[record.status]}`,
            ),
        })),
        ...discipline.map((record) => ({
            id: `discipline-${record.id}`,
            date: record.createdAt,
            iconName: 'flag' as const,
            text: label(`Incidencia disciplinaria registrada (${record.severity})`),
        })),
    ];

    return items.sort((a, b) => b.date.localeCompare(a.date));
}
