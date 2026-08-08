import Select from '@cloudscape-design/components/select';

import { useAsyncData } from '../../hooks/useAsyncData';
import { teachersService } from '../../services';
import type { Teacher } from '../../types';

interface TeacherSelectProps {
    value: string | null;
    onChange: (teacherId: string | null, teacher: Teacher | null) => void;
    placeholder?: string;
    disabled?: boolean;
}

/**
 * Selector de un docente activo, para asignarlo como responsable de una
 * asignatura o de una franja horaria. A diferencia de `ProfileSelect`, elige
 * un registro de `teachers` (no una cuenta): el vínculo con la cuenta ya
 * quedó resuelto al crear el docente.
 */
export default function TeacherSelect({ value, onChange, placeholder = 'Sin asignar', disabled }: TeacherSelectProps) {
    const { data, loading, error, reload } = useAsyncData(() => teachersService.list(), []);

    const candidates = (data ?? []).filter((teacher) => teacher.active);
    const options = candidates.map((teacher) => ({
        label: teacher.fullName,
        value: teacher.id,
        description: teacher.specialty ?? undefined,
    }));

    const selectedOption = options.find((option) => option.value === value) ?? null;

    return (
        <Select
            selectedOption={selectedOption}
            onChange={({ detail }) => {
                const nextId = detail.selectedOption.value ?? null;
                const teacher = candidates.find((candidate) => candidate.id === nextId) ?? null;
                onChange(nextId, teacher);
            }}
            options={options}
            loadingText="Cargando docentes…"
            statusType={loading ? 'loading' : error ? 'error' : 'finished'}
            errorText={error ?? undefined}
            recoveryText="Reintentar"
            onLoadItems={() => void reload()}
            empty="No hay docentes activos. Crea uno primero en Docentes."
            placeholder={placeholder}
            filteringType="auto"
            disabled={disabled}
            expandToViewport
        />
    );
}
