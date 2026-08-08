import { useState } from 'react';

import Box from '@cloudscape-design/components/box';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { FormPanel, ProfileSelect } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { email as emailRule, hasErrors, required, validateFields } from '../../lib/validation';
import { teachersService } from '../../services';
import type { Teacher, TeacherInput } from '../../types';

interface TeacherFormValues {
    teacherCode: string;
    fullName: string;
    specialty: string;
    email: string;
    phone: string;
}

function toFormValues(teacher?: Teacher): TeacherFormValues {
    return {
        teacherCode: teacher?.teacherCode ?? '',
        fullName: teacher?.fullName ?? '',
        specialty: teacher?.specialty ?? '',
        email: teacher?.email ?? '',
        phone: teacher?.phone ?? '',
    };
}

interface TeacherFormModalProps {
    /** Presente en edición; ausente cuando se crea un docente nuevo. */
    teacher?: Teacher;
    /** Perfiles ya vinculados a otro docente: se excluyen del selector. */
    excludeProfileIds: string[];
    onDismiss: () => void;
    onSaved: (teacher: Teacher) => void;
}

/**
 * Alta y edición de un docente.
 *
 * Igual que con estudiantes, el docente debe corresponder a una cuenta ya
 * registrada con rol "Docente" (asignado desde Usuarios y roles).
 */
export default function TeacherFormModal({ teacher, excludeProfileIds, onDismiss, onSaved }: TeacherFormModalProps) {
    const isEdit = Boolean(teacher);
    const [profileId, setProfileId] = useState<string | null>(teacher?.profileId ?? null);
    const [form, setForm] = useState<TeacherFormValues>(() => toFormValues(teacher));
    const [touched, setTouched] = useState(false);

    const errors = validateFields(form, {
        fullName: required('El nombre'),
        specialty: required('La especialidad'),
        email: form.email ? emailRule() : () => null,
    });
    const profileMissing = !isEdit && !profileId;

    const save = useAsyncAction(
        async () => {
            const input: TeacherInput = {
                profileId: profileId!,
                teacherCode: form.teacherCode.trim() || null,
                fullName: form.fullName.trim(),
                specialty: form.specialty.trim() || null,
                email: form.email.trim() || null,
                phone: form.phone.trim() || null,
                active: teacher?.active ?? true,
            };

            return isEdit ? teachersService.update(teacher!.id, input) : teachersService.create(input);
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
        <Modal visible onDismiss={onDismiss} header={isEdit ? 'Editar docente' : 'Nuevo docente'} closeAriaLabel="Cerrar">
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
                            label="Cuenta del docente"
                            description="Debe tener el rol Docente asignado en Usuarios y roles."
                            errorText={touched && profileMissing ? 'Selecciona la cuenta del docente.' : undefined}
                        >
                            <ProfileSelect
                                role="teacher"
                                excludeProfileIds={excludeProfileIds}
                                value={profileId}
                                onChange={(nextId, profile) => {
                                    setProfileId(nextId);
                                    if (profile) {
                                        setForm((current) => ({
                                            ...current,
                                            fullName: current.fullName.trim() || profile.name,
                                            email: current.email.trim() || profile.email,
                                        }));
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

                    <FormField label="Especialidad" errorText={touched ? errors.specialty : undefined}>
                        <Input
                            value={form.specialty}
                            onChange={(event) => setForm((current) => ({ ...current, specialty: event.detail.value }))}
                            placeholder="Ej. Matemáticas"
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Código de docente" constraintText="Opcional.">
                        <Input
                            value={form.teacherCode}
                            onChange={(event) => setForm((current) => ({ ...current, teacherCode: event.detail.value }))}
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Correo de contacto" errorText={touched ? errors.email : undefined} constraintText="Opcional.">
                        <Input
                            type="email"
                            value={form.email}
                            onChange={(event) => setForm((current) => ({ ...current, email: event.detail.value }))}
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
