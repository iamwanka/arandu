import { useState } from 'react';

import DatePicker from '@cloudscape-design/components/date-picker';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Toggle from '@cloudscape-design/components/toggle';

import { FormPanel } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { hasErrors, isoDate, required, validateFields } from '../../lib/validation';
import { academicPeriodsService } from '../../services';
import type { AcademicPeriod, AcademicPeriodInput } from '../../types';

interface PeriodFormValues {
    name: string;
    startDate: string;
    endDate: string;
}

function toFormValues(period?: AcademicPeriod): PeriodFormValues {
    return {
        name: period?.name ?? '',
        startDate: period?.startDate ?? '',
        endDate: period?.endDate ?? '',
    };
}

interface AcademicPeriodFormModalProps {
    period?: AcademicPeriod;
    onDismiss: () => void;
    onSaved: (period: AcademicPeriod) => void;
}

/** Alta y edición de un periodo académico. */
export default function AcademicPeriodFormModal({ period, onDismiss, onSaved }: AcademicPeriodFormModalProps) {
    const isEdit = Boolean(period);
    const [isActive, setIsActive] = useState(period?.isActive ?? false);
    const [form, setForm] = useState<PeriodFormValues>(() => toFormValues(period));
    const [touched, setTouched] = useState(false);

    const errors = validateFields(form, {
        name: required('El nombre'),
        startDate: isoDate('La fecha de inicio'),
        endDate: (value) => {
            const base = isoDate('La fecha de fin')(value);
            if (base) return base;
            return form.startDate && value < form.startDate ? 'La fecha de fin no puede ser anterior al inicio.' : null;
        },
    });

    const save = useAsyncAction(
        async () => {
            const input: AcademicPeriodInput = {
                name: form.name.trim(),
                startDate: form.startDate,
                endDate: form.endDate,
                isActive,
            };

            return isEdit ? academicPeriodsService.update(period!.id, input) : academicPeriodsService.create(input);
        },
        {
            successMessage: (saved) => (isEdit ? `${saved.name} actualizado.` : `${saved.name} creado.`),
            onSuccess: onSaved,
        },
    );

    const handleSubmit = () => {
        setTouched(true);
        if (hasErrors(errors)) return;
        void save.run();
    };

    return (
        <Modal
            visible
            onDismiss={onDismiss}
            header={isEdit ? 'Editar periodo académico' : 'Nuevo periodo académico'}
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
                    <FormField label="Nombre" errorText={touched ? errors.name : undefined}>
                        <Input
                            value={form.name}
                            onChange={(event) => setForm((current) => ({ ...current, name: event.detail.value }))}
                            placeholder="Ej. 2026 - 1º Trimestre"
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Fecha de inicio" errorText={touched ? errors.startDate : undefined}>
                        <DatePicker
                            value={form.startDate}
                            onChange={(event) => setForm((current) => ({ ...current, startDate: event.detail.value }))}
                            placeholder="AAAA/MM/DD"
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Fecha de fin" errorText={touched ? errors.endDate : undefined}>
                        <DatePicker
                            value={form.endDate}
                            onChange={(event) => setForm((current) => ({ ...current, endDate: event.detail.value }))}
                            placeholder="AAAA/MM/DD"
                            disabled={save.pending}
                        />
                    </FormField>

                    <FormField label="Periodo vigente" description="Se usa como periodo por defecto para matrícula y calificaciones.">
                        <Toggle checked={isActive} onChange={({ detail }) => setIsActive(detail.checked)} disabled={save.pending}>
                            {isActive ? 'Vigente' : 'No vigente'}
                        </Toggle>
                    </FormField>
                </SpaceBetween>
            </FormPanel>
        </Modal>
    );
}
