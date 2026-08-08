import Select from '@cloudscape-design/components/select';

import { useAsyncData } from '../../hooks/useAsyncData';
import { subjectsService } from '../../services';
import type { Subject } from '../../types';

interface SubjectSelectProps {
    value: string | null;
    onChange: (subjectId: string | null, subject: Subject | null) => void;
    disabled?: boolean;
}

/** Selector de una asignatura activa, usado para registrar calificaciones. */
export default function SubjectSelect({ value, onChange, disabled }: SubjectSelectProps) {
    const { data, loading } = useAsyncData(() => subjectsService.list(), []);

    const subjects = (data ?? []).filter((subject) => subject.active);
    const options = subjects.map((subject) => ({
        label: `${subject.name} (${subject.code})`,
        value: subject.id,
        description: subject.gradeLevel ?? undefined,
    }));

    const selectedOption = options.find((option) => option.value === value) ?? null;

    return (
        <Select
            selectedOption={selectedOption}
            onChange={({ detail }) => {
                const nextId = detail.selectedOption.value ?? null;
                const subject = subjects.find((candidate) => candidate.id === nextId) ?? null;
                onChange(nextId, subject);
            }}
            options={options}
            loadingText="Cargando asignaturas…"
            statusType={loading ? 'loading' : 'finished'}
            empty="No hay asignaturas activas. Crea una primero en la pestaña Asignaturas."
            placeholder="Selecciona una asignatura"
            filteringType="auto"
            disabled={disabled}
            expandToViewport
        />
    );
}
