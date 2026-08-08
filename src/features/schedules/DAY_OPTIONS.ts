import type { DayOfWeek } from '../../types';

export const DAY_OPTIONS: Array<{ value: DayOfWeek; label: string }> = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' },
];

export function getDayLabel(day: DayOfWeek): string {
    return DAY_OPTIONS.find((option) => option.value === day)?.label ?? String(day);
}
