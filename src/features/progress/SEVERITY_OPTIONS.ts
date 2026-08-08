export const SEVERITY_OPTIONS = [
    { value: 'leve', label: 'Leve' },
    { value: 'moderada', label: 'Moderada' },
    { value: 'grave', label: 'Grave' },
];

export function getSeverityLabel(value: string): string {
    return SEVERITY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
