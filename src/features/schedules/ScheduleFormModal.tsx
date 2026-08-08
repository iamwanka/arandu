import { useState } from 'react';

import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Modal from '@cloudscape-design/components/modal';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { FormPanel, TeacherSelect } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { compose, hasErrors, required, timeString, validateFields } from '../../lib/validation';
import { hasScheduleConflict, schedulesService } from '../../services';
import type { DayOfWeek, Schedule, ScheduleInput } from '../../types';
import SubjectSelect from '../academic/SubjectSelect';
import { DAY_OPTIONS } from './DAY_OPTIONS';

interface ScheduleFormValues {
    gradeLevel: string;
    startTime: string;
    endTime: string;
    classroom: string;
}

function toFormValues(schedule?: Schedule): ScheduleFormValues {
    return {
        gradeLevel: schedule?.gradeLevel ?? '',
        startTime: schedule?.startTime?.slice(0, 5) ?? '',
        endTime: schedule?.endTime?.slice(0, 5) ?? '',
        classroom: schedule?.classroom ?? '',
    };
}

interface ScheduleFormModalProps {
    schedule?: Schedule;
    onDismiss: () => void;
    onSaved: (schedule: Schedule) => void;
}

/** Alta y edición de una franja horaria, con validación de choque de docente/aula. */
export default function ScheduleFormModal({ schedule, onDismiss, onSaved }: ScheduleFormModalProps) {
    const isEdit = Boolean(schedule);
    const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(schedule?.dayOfWeek ?? 1);
    const [subjectId, setSubjectId] = useState<string | null>(schedule?.subjectId ?? null);
    const [teacherId, setTeacherId] = useState<string | null>(schedule?.teacherId ?? null);
    const [form, setForm] = useState<ScheduleFormValues>(() => toFormValues(schedule));
    const [touched, setTouched] = useState(false);
    const [conflictError, setConflictError] = useState<string | null>(null);

    const errors = validateFields(form, {
        gradeLevel: required('El grado'),
        startTime: timeString('La hora de inicio'),
        endTime: compose(timeString('La hora de fin'), (value) =>
            value && form.startTime && value <= form.startTime ? 'Debe ser posterior a la hora de inicio.' : null,
        ),
    });
    const subjectMissing = !subjectId;

    const save = useAsyncAction(
        async () => {
            const input: ScheduleInput = {
                gradeLevel: form.gradeLevel.trim(),
                dayOfWeek,
                startTime: form.startTime,
                endTime: form.endTime,
                subjectId: subjectId!,
                teacherId,
                classroom: form.classroom.trim() || null,
            };

            return isEdit ? schedulesService.update(schedule!.id, input) : schedulesService.create(input);
        },
        { successMessage: 'Horario guardado.', onSuccess: onSaved },
    );

    const [checkingConflict, setCheckingConflict] = useState(false);

    const handleSubmit = async () => {
        setTouched(true);
        setConflictError(null);
        if (hasErrors(errors) || subjectMissing) return;

        setCheckingConflict(true);
        const conflict = await hasScheduleConflict({
            dayOfWeek,
            startTime: form.startTime,
            endTime: form.endTime,
            teacherId,
            classroom: form.classroom.trim() || null,
            excludeId: schedule?.id,
        }).finally(() => setCheckingConflict(false));

        if (conflict) {
            setConflictError('El docente o el aula ya tienen una clase en esa franja horaria ese día.');
            return;
        }

        void save.run();
    };

    return (
        <Modal visible onDismiss={onDismiss} header={isEdit ? 'Editar horario' : 'Nuevo horario'} closeAriaLabel="Cerrar">
            <FormPanel
                onSubmit={() => void handleSubmit()}
                onCancel={onDismiss}
                submitting={save.pending || checkingConflict}
                error={conflictError ?? save.error}
                success={save.success}
            >
                <SpaceBetween size="l">
                    <FormField label="Grado o curso" errorText={touched ? errors.gradeLevel : undefined}>
                        <Input
                            value={form.gradeLevel}
                            onChange={(event) => setForm((current) => ({ ...current, gradeLevel: event.detail.value }))}
                            placeholder="Ej. 5° de primaria"
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Día">
                        <Select
                            selectedOption={{
                                value: String(dayOfWeek),
                                label: DAY_OPTIONS.find((option) => option.value === dayOfWeek)?.label ?? '',
                            }}
                            onChange={({ detail }) => setDayOfWeek(Number(detail.selectedOption.value) as DayOfWeek)}
                            options={DAY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))}
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Hora de inicio" errorText={touched ? errors.startTime : undefined} constraintText="Formato HH:MM.">
                        <Input
                            value={form.startTime}
                            onChange={(event) => setForm((current) => ({ ...current, startTime: event.detail.value }))}
                            placeholder="08:00"
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Hora de fin" errorText={touched ? errors.endTime : undefined} constraintText="Formato HH:MM.">
                        <Input
                            value={form.endTime}
                            onChange={(event) => setForm((current) => ({ ...current, endTime: event.detail.value }))}
                            placeholder="09:00"
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField
                        label="Asignatura"
                        errorText={touched && subjectMissing ? 'Selecciona una asignatura.' : undefined}
                    >
                        <SubjectSelect value={subjectId} onChange={(id) => setSubjectId(id)} disabled={save.pending} />
                    </FormField>

                    <FormField label="Docente" constraintText="Opcional.">
                        <TeacherSelect value={teacherId} onChange={(id) => setTeacherId(id)} disabled={save.pending} />
                    </FormField>

                    <FormField label="Aula" constraintText="Opcional.">
                        <Input
                            value={form.classroom}
                            onChange={(event) => setForm((current) => ({ ...current, classroom: event.detail.value }))}
                            disabled={save.pending}
                        />
                    </FormField>
                </SpaceBetween>
            </FormPanel>
        </Modal>
    );
}
