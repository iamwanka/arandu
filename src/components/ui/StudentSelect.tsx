import Select from '@cloudscape-design/components/select';

import { useAsyncData } from '../../hooks/useAsyncData';
import { studentsService } from '../../services';
import type { Student } from '../../types';

interface StudentSelectProps {
    value: string | null;
    onChange: (studentId: string | null, student: Student | null) => void;
    placeholder?: string;
    disabled?: boolean;
}

/** Selector de un estudiante ya registrado, para el flujo de matrícula. */
export default function StudentSelect({ value, onChange, placeholder = 'Selecciona un estudiante', disabled }: StudentSelectProps) {
    const { data, loading, error, reload } = useAsyncData(() => studentsService.list(), []);

    const students = data ?? [];
    const options = students.map((student) => ({
        label: student.fullName,
        value: student.id,
        description: [student.gradeLevel, student.studentCode].filter(Boolean).join(' · ') || undefined,
    }));

    const selectedOption = options.find((option) => option.value === value) ?? null;

    return (
        <Select
            selectedOption={selectedOption}
            onChange={({ detail }) => {
                const nextId = detail.selectedOption.value ?? null;
                const student = students.find((candidate) => candidate.id === nextId) ?? null;
                onChange(nextId, student);
            }}
            options={options}
            loadingText="Cargando estudiantes…"
            statusType={loading ? 'loading' : error ? 'error' : 'finished'}
            errorText={error ?? undefined}
            recoveryText="Reintentar"
            onLoadItems={() => void reload()}
            empty="No hay estudiantes registrados. Crea uno primero en Estudiantes."
            placeholder={placeholder}
            filteringType="auto"
            disabled={disabled}
            expandToViewport
        />
    );
}
