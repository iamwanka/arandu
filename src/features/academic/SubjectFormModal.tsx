import { useState } from 'react';

import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Toggle from '@cloudscape-design/components/toggle';

import { FormPanel, TeacherSelect } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { compose, hasErrors, required, validateFields } from '../../lib/validation';
import { subjectsService } from '../../services';
import type { Subject, SubjectInput } from '../../types';

interface SubjectFormValues {
    code: string;
    name: string;
    gradeLevel: string;
}

function toFormValues(subject?: Subject): SubjectFormValues {
    return {
        code: subject?.code ?? '',
        name: subject?.name ?? '',
        gradeLevel: subject?.gradeLevel ?? '',
    };
}

interface SubjectFormModalProps {
    subject?: Subject;
    onDismiss: () => void;
    onSaved: (subject: Subject) => void;
}

/** Alta y edición de una asignatura, con su docente responsable opcional. */
export default function SubjectFormModal({ subject, onDismiss, onSaved }: SubjectFormModalProps) {
    const isEdit = Boolean(subject);
    const [teacherId, setTeacherId] = useState<string | null>(subject?.teacherId ?? null);
    const [active, setActive] = useState(subject?.active ?? true);
    const [form, setForm] = useState<SubjectFormValues>(() => toFormValues(subject));
    const [touched, setTouched] = useState(false);

    const errors = validateFields(form, {
        code: required('El código'),
        name: compose(required('El nombre')),
    });

    const save = useAsyncAction(
        async () => {
            const input: SubjectInput = {
                code: form.code.trim(),
                name: form.name.trim(),
                gradeLevel: form.gradeLevel.trim() || null,
                teacherId,
                active,
            };

            return isEdit ? subjectsService.update(subject!.id, input) : subjectsService.create(input);
        },
        {
            successMessage: (saved) => (isEdit ? `${saved.name} actualizada.` : `${saved.name} creada.`),
            onSuccess: onSaved,
        },
    );

    const handleSubmit = () => {
        setTouched(true);
        if (hasErrors(errors)) return;
        void save.run();
    };

    return (
        <Modal visible onDismiss={onDismiss} header={isEdit ? 'Editar asignatura' : 'Nueva asignatura'} closeAriaLabel="Cerrar">
            <FormPanel
                onSubmit={handleSubmit}
                onCancel={onDismiss}
                submitting={save.pending}
                error={save.error}
                success={save.success}
            >
                <SpaceBetween size="l">
                    <FormField label="Código" errorText={touched ? errors.code : undefined}>
                        <Input
                            value={form.code}
                            onChange={(event) => setForm((current) => ({ ...current, code: event.detail.value }))}
                            placeholder="Ej. MAT-501"
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Nombre" errorText={touched ? errors.name : undefined}>
                        <Input
                            value={form.name}
                            onChange={(event) => setForm((current) => ({ ...current, name: event.detail.value }))}
                            placeholder="Ej. Matemáticas"
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Grado" constraintText="Opcional. Déjalo vacío si aplica a todos los grados.">
                        <Input
                            value={form.gradeLevel}
                            onChange={(event) => setForm((current) => ({ ...current, gradeLevel: event.detail.value }))}
                            placeholder="Ej. 5° de primaria"
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Docente responsable" constraintText="Opcional.">
                        <TeacherSelect value={teacherId} onChange={(id) => setTeacherId(id)} disabled={save.pending} />
                    </FormField>

                    <FormField label="Estado">
                        <Toggle checked={active} onChange={({ detail }) => setActive(detail.checked)} disabled={save.pending}>
                            {active ? 'Activa' : 'Inactiva'}
                        </Toggle>
                    </FormField>
                </SpaceBetween>
            </FormPanel>
        </Modal>
    );
}
