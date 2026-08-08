/**
 * Vínculo entre un estudiante y su acudiente (`parent_student_relationships`).
 *
 * No usa la fábrica genérica porque no se lista de forma independiente: se
 * consulta siempre en el contexto de un estudiante y se desactiva en vez de
 * borrarse (mantiene el historial, igual que `profiles.active`).
 */

import { AppError, toAppError } from '../lib/errors';
import { toParentStudentLink } from '../lib/mappers';
import { requireSupabase } from '../lib/supabase';
import type { ParentStudentLink } from '../types';

export async function listParentLinksForStudent(studentId: string): Promise<ParentStudentLink[]> {
    const client = requireSupabase();

    const { data, error } = await client
        .from('parent_student_relationships')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at');

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toParentStudentLink);
}

export async function createParentLink(input: {
    parentProfileId: string;
    studentId: string;
    relationship: string;
}): Promise<ParentStudentLink> {
    const client = requireSupabase();

    const { data, error } = await client
        .from('parent_student_relationships')
        .insert({
            parent_profile_id: input.parentProfileId,
            student_id: input.studentId,
            relationship: input.relationship,
        })
        .select('*')
        .single();

    if (error) {
        throw toAppError(error);
    }

    if (!data) {
        throw new AppError('unknown', 'No se pudo crear el vínculo con el acudiente.');
    }

    return toParentStudentLink(data);
}

export async function updateParentLinkActive(id: string, active: boolean): Promise<ParentStudentLink> {
    const client = requireSupabase();

    const { data, error } = await client
        .from('parent_student_relationships')
        .update({ active })
        .eq('id', id)
        .select('*')
        .single();

    if (error) {
        throw toAppError(error);
    }

    if (!data) {
        throw new AppError('not-found', 'No se encontró el vínculo a actualizar.');
    }

    return toParentStudentLink(data);
}
