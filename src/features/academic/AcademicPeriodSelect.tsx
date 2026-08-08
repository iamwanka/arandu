import Select from '@cloudscape-design/components/select';

import { useAsyncData } from '../../hooks/useAsyncData';
import { academicPeriodsService } from '../../services';
import type { AcademicPeriod } from '../../types';

interface AcademicPeriodSelectProps {
    value: string | null;
    onChange: (periodId: string | null, period: AcademicPeriod | null) => void;
    disabled?: boolean;
}

/** Selector de periodo académico, usado por el wizard de matrícula. */
export default function AcademicPeriodSelect({ value, onChange, disabled }: AcademicPeriodSelectProps) {
    const { data, loading, error, reload } = useAsyncData(() => academicPeriodsService.list(), []);

    const periods = data ?? [];
    const options = periods.map((period) => ({
        label: period.name,
        value: period.id,
        description: period.isActive ? 'Vigente' : `${period.startDate} — ${period.endDate}`,
    }));

    const selectedOption = options.find((option) => option.value === value) ?? null;

    return (
        <Select
            selectedOption={selectedOption}
            onChange={({ detail }) => {
                const nextId = detail.selectedOption.value ?? null;
                const period = periods.find((candidate) => candidate.id === nextId) ?? null;
                onChange(nextId, period);
            }}
            options={options}
            loadingText="Cargando periodos…"
            statusType={loading ? 'loading' : error ? 'error' : 'finished'}
            errorText={error ?? undefined}
            recoveryText="Reintentar"
            onLoadItems={() => void reload()}
            empty="No hay periodos académicos. Crea uno primero en la pestaña Periodos."
            placeholder="Selecciona un periodo"
            filteringType="auto"
            disabled={disabled}
            expandToViewport
        />
    );
}
