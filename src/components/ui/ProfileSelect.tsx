import Select from '@cloudscape-design/components/select';

import { useAsyncData } from '../../hooks/useAsyncData';
import { listProfilesByRole } from '../../services/profiles';
import type { AppRole, AppUser } from '../../types';

interface ProfileSelectProps {
    role: AppRole;
    /** IDs de perfil a excluir, típicamente los que ya están vinculados a otro registro. */
    excludeProfileIds?: string[];
    value: string | null;
    /** Recibe también el perfil completo para que el llamador no tenga que volver a consultarlo (p. ej. para precargar un nombre). */
    onChange: (profileId: string | null, profile: AppUser | null) => void;
    placeholder?: string;
    disabled?: boolean;
}

/**
 * Selector de un perfil existente con un rol determinado.
 *
 * Estudiantes y docentes en Arandu deben corresponder a una cuenta ya
 * registrada (`profile_id` es obligatorio en el esquema): este componente es
 * el punto único donde se elige esa cuenta, tanto para "Nuevo estudiante" como
 * para "Nuevo docente". El rol se asigna desde "Usuarios y roles"; aquí solo
 * se lista y se filtra.
 */
export default function ProfileSelect({
    role,
    excludeProfileIds = [],
    value,
    onChange,
    placeholder = 'Selecciona una cuenta',
    disabled,
}: ProfileSelectProps) {
    const { data, loading } = useAsyncData(() => listProfilesByRole(role), [role]);

    const excluded = new Set(excludeProfileIds);
    const candidates = (data ?? []).filter((profile) => !excluded.has(profile.id));

    const options = candidates.map((profile) => ({
        label: profile.name,
        value: profile.id,
        description: profile.email,
    }));

    const selectedOption = options.find((option) => option.value === value) ?? null;

    return (
        <Select
            selectedOption={selectedOption}
            onChange={({ detail }) => {
                const nextId = detail.selectedOption.value ?? null;
                const profile = candidates.find((candidate) => candidate.id === nextId) ?? null;
                onChange(nextId, profile);
            }}
            options={options}
            loadingText="Cargando cuentas…"
            statusType={loading ? 'loading' : 'finished'}
            empty="No hay cuentas disponibles con ese rol para vincular. Asígnalo primero en Usuarios y roles."
            placeholder={placeholder}
            filteringType="auto"
            disabled={disabled}
            expandToViewport
        />
    );
}
