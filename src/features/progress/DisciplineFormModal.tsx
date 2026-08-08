import { useState } from 'react';

import Checkbox from '@cloudscape-design/components/checkbox';
import DatePicker from '@cloudscape-design/components/date-picker';
import FormField from '@cloudscape-design/components/form-field';
import Modal from '@cloudscape-design/components/modal';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Textarea from '@cloudscape-design/components/textarea';

import { FormPanel, StudentSelect } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { hasErrors, required, validateFields } from '../../lib/validation';
import { disciplinaryRecordsService } from '../../services';
import type { AppSession, DisciplinaryRecord, DisciplinaryRecordInput } from '../../types';
import { SEVERITY_OPTIONS } from './SEVERITY_OPTIONS';

function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

interface DisciplineFormModalProps {
    session: AppSession;
    onDismiss: () => void;
    onSaved: (record: DisciplinaryRecord) => void;
}

/** Registro de una incidencia disciplinaria nueva. */
export default function DisciplineFormModal({ session, onDismiss, onSaved }: DisciplineFormModalProps) {
    const [studentId, setStudentId] = useState<string | null>(null);
    const [recordDate, setRecordDate] = useState(todayIso());
    const [severity, setSeverity] = useState(SEVERITY_OPTIONS[0]);
    const [description, setDescription] = useState('');
    const [notifiedParent, setNotifiedParent] = useState(false);
    const [touched, setTouched] = useState(false);

    const errors = validateFields({ description }, { description: required('La descripción') });
    const studentMissing = !studentId;

    const save = useAsyncAction(
        () => {
            const input: DisciplinaryRecordInput = {
                studentId: studentId!,
                recordDate,
                severity: severity.value,
                description: description.trim(),
                responsibleId: session.user.id,
                notifiedParent,
            };
            return disciplinaryRecordsService.create(input);
        },
        { successMessage: 'Incidencia registrada.', onSuccess: onSaved },
    );

    const handleSubmit = () => {
        setTouched(true);
        if (hasErrors(errors) || studentMissing) return;
        void save.run();
    };

    return (
        <Modal visible onDismiss={onDismiss} header="Nueva incidencia disciplinaria" closeAriaLabel="Cerrar">
            <FormPanel
                onSubmit={handleSubmit}
                onCancel={onDismiss}
                submitting={save.pending}
                error={save.error}
                success={save.success}
            >
                <SpaceBetween size="l">
                    <FormField label="Estudiante" errorText={touched && studentMissing ? 'Selecciona un estudiante.' : undefined}>
                        <StudentSelect value={studentId} onChange={(id) => setStudentId(id)} disabled={save.pending} />
                    </FormField>

                    <FormField label="Fecha">
                        <DatePicker
                            value={recordDate}
                            onChange={(event) => setRecordDate(event.detail.value)}
                            placeholder="AAAA/MM/DD"
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Gravedad">
                        <Select
                            selectedOption={severity}
                            onChange={({ detail }) =>
                                setSeverity(
                                    SEVERITY_OPTIONS.find((option) => option.value === detail.selectedOption.value) ??
                                    SEVERITY_OPTIONS[0],
                                )
                            }
                            options={SEVERITY_OPTIONS}
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Descripción" errorText={touched ? errors.description : undefined}>
                        <Textarea
                            value={description}
                            onChange={(event) => setDescription(event.detail.value)}
                            rows={4}
                            disabled={save.pending}
                        />
                    </FormField>

                    <Checkbox checked={notifiedParent} onChange={({ detail }) => setNotifiedParent(detail.checked)} disabled={save.pending}>
                        Se notificó al padre o acudiente
                    </Checkbox>
                </SpaceBetween>
            </FormPanel>
        </Modal>
    );
}
