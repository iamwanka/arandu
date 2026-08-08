import { useState } from 'react';

import Box from '@cloudscape-design/components/box';
import DatePicker from '@cloudscape-design/components/date-picker';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { FormPanel, ProfileSelect } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { compose, hasErrors, maxLength, required, validateFields } from '../../lib/validation';
import { studentsService } from '../../services';
import type { Student, StudentInput } from '../../types';

interface StudentFormValues {
    studentCode: string;
    fullName: string;
    birthDate: string;
    gradeLevel: string;
    address: string;
    phone: string;
}

function toFormValues(student?: Student): StudentFormValues {
    return {
        studentCode: student?.studentCode ?? '',
        fullName: student?.fullName ?? '',
        birthDate: student?.birthDate ?? '',
        gradeLevel: student?.gradeLevel ?? '',
        address: student?.address ?? '',
        phone: student?.phone ?? '',
    };
}

interface StudentFormModalProps {
    /** Presente en edición; ausente cuando se crea un estudiante nuevo. */
    student?: Student;
    /** Perfiles ya vinculados a otro estudiante: se excluyen del selector. */
    excludeProfileIds: string[];
    onDismiss: () => void;
    onSaved: (student: Student) => void;
}

/**
 * Alta y edición de un estudiante.
 *
 * Crear un estudiante requiere vincularlo a una cuenta ya registrada con rol
 * "Estudiante" (el esquema exige `profile_id`); esa cuenta se asigna primero
 * en "Usuarios y roles" y aquí solo se elige. Al editar, el vínculo con la
 * cuenta no cambia — solo los datos propios del estudiante.
 */
export default function StudentFormModal({ student, excludeProfileIds, onDismiss, onSaved }: StudentFormModalProps) {
    const isEdit = Boolean(student);
    const [profileId, setProfileId] = useState<string | null>(student?.profileId ?? null);
    const [form, setForm] = useState<StudentFormValues>(() => toFormValues(student));
    const [touched, setTouched] = useState(false);

    const errors = validateFields(form, {
        fullName: compose(required('El nombre'), maxLength(200, 'El nombre')),
        gradeLevel: required('El grado'),
    });
    const profileMissing = !isEdit && !profileId;

    const save = useAsyncAction(
        async () => {
            const input: StudentInput = {
                profileId: profileId!,
                studentCode: form.studentCode.trim() || null,
                fullName: form.fullName.trim(),
                birthDate: form.birthDate || null,
                gradeLevel: form.gradeLevel.trim() || null,
                address: form.address.trim() || null,
                phone: form.phone.trim() || null,
            };

            return isEdit ? studentsService.update(student!.id, input) : studentsService.create(input);
        },
        {
            successMessage: (saved) => (isEdit ? `${saved.fullName} actualizado.` : `${saved.fullName} creado.`),
            onSuccess: onSaved,
        },
    );

    const handleSubmit = () => {
        setTouched(true);
        if (hasErrors(errors) || profileMissing) return;
        void save.run();
    };

    return (
        <Modal
            visible
            onDismiss={onDismiss}
            header={isEdit ? 'Editar estudiante' : 'Nuevo estudiante'}
            closeAriaLabel="Cerrar"
        >
            <FormPanel
                onSubmit={handleSubmit}
                onCancel={onDismiss}
                submitting={save.pending}
                error={save.error}
                success={save.success}
            >
                <SpaceBetween size="l">
                    {!isEdit ? (
                        <FormField
                            label="Cuenta del estudiante"
                            description="Debe tener el rol Estudiante asignado en Usuarios y roles."
                            errorText={touched && profileMissing ? 'Selecciona la cuenta del estudiante.' : undefined}
                        >
                            <ProfileSelect
                                role="student"
                                excludeProfileIds={excludeProfileIds}
                                value={profileId}
                                onChange={(nextId, profile) => {
                                    setProfileId(nextId);
                                    // Ahorra un paso: si el nombre está vacío, lo toma de la cuenta elegida.
                                    if (profile && !form.fullName.trim()) {
                                        setForm((current) => ({ ...current, fullName: profile.name }));
                                    }
                                }}
                            />
                        </FormField>
                    ) : (
                        <Box color="text-body-secondary">La cuenta vinculada no se puede cambiar desde aquí.</Box>
                    )}

                    <FormField label="Nombre completo" errorText={touched ? errors.fullName : undefined}>
                        <Input
                            value={form.fullName}
                            onChange={(event) => setForm((current) => ({ ...current, fullName: event.detail.value }))}
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Grado o curso" errorText={touched ? errors.gradeLevel : undefined}>
                        <Input
                            value={form.gradeLevel}
                            onChange={(event) => setForm((current) => ({ ...current, gradeLevel: event.detail.value }))}
                            placeholder="Ej. 5° de primaria"
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Código de estudiante" constraintText="Opcional.">
                        <Input
                            value={form.studentCode}
                            onChange={(event) => setForm((current) => ({ ...current, studentCode: event.detail.value }))}
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Fecha de nacimiento" constraintText="Opcional.">
                        <DatePicker
                            value={form.birthDate}
                            onChange={(event) => setForm((current) => ({ ...current, birthDate: event.detail.value }))}
                            placeholder="AAAA/MM/DD"
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Dirección" constraintText="Opcional.">
                        <Input
                            value={form.address}
                            onChange={(event) => setForm((current) => ({ ...current, address: event.detail.value }))}
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Teléfono" constraintText="Opcional.">
                        <Input
                            value={form.phone}
                            onChange={(event) => setForm((current) => ({ ...current, phone: event.detail.value }))}
                            disabled={save.pending}
                        />
                    </FormField>
                </SpaceBetween>
            </FormPanel>
        </Modal>
    );
}
