/**
 * Asistencia diaria.
 *
 * Igual que `grades`: el registro es por lote (un docente marca la
 * asistencia de un curso completo en un día) y la clave natural es
 * `(student_id, attendance_date)` — `upsertAttendance` corrige el estado del
 * día en vez de duplicarlo.
 */

import { toAppError } from '../lib/errors';
import { toAttendance } from '../lib/mappers';
import { requireSupabase } from '../lib/supabase';
import type { Attendance, AttendanceInput } from '../types';

export async function listAttendanceForDate(date: string): Promise<Attendance[]> {
    const client = requireSupabase();

    const { data, error } = await client.from('attendance').select('*').eq('attendance_date', date);

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toAttendance);
}

/** Asistencia de un estudiante, opcionalmente acotada a un rango de fechas (p. ej. un periodo académico). */
export async function listAttendanceForStudent(
    studentId: string,
    range?: { from: string; to: string },
): Promise<Attendance[]> {
    const client = requireSupabase();

    let query = client.from('attendance').select('*').eq('student_id', studentId);
    if (range) {
        query = query.gte('attendance_date', range.from).lte('attendance_date', range.to);
    }

    const { data, error } = await query.order('attendance_date', { ascending: false });

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toAttendance);
}

/** Asistencia de todos los estudiantes en un rango de fechas, para el reporte institucional. */
export async function listAttendanceForRange(from: string, to: string): Promise<Attendance[]> {
    const client = requireSupabase();

    const { data, error } = await client
        .from('attendance')
        .select('*')
        .gte('attendance_date', from)
        .lte('attendance_date', to);

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toAttendance);
}

/** Crea o corrige el registro de asistencia de varios estudiantes para un mismo día. */
export async function upsertAttendance(inputs: AttendanceInput[]): Promise<Attendance[]> {
    if (inputs.length === 0) return [];

    const client = requireSupabase();

    const rows = inputs.map((input) => ({
        student_id: input.studentId,
        attendance_date: input.attendanceDate,
        status: input.status,
        recorded_by: input.recordedBy,
    }));

    const { data, error } = await client
        .from('attendance')
        .upsert(rows, { onConflict: 'student_id,attendance_date' })
        .select('*');

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toAttendance);
}

/** Porcentaje de asistencia (presente + justificado cuentan como asistió), redondeado a un decimal. */
export function computeAttendanceRate(records: Attendance[]): number | null {
    if (records.length === 0) return null;
    const attended = records.filter((record) => record.status !== 'absent').length;
    return Math.round((attended / records.length) * 1000) / 10;
}
