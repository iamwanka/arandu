/** Vocabulario controlado para `generated_reports.report_type` (columna de texto libre en la base). */
export const REPORT_TYPE_OPTIONS = [
    { value: 'boletin', label: 'Boletín' },
    { value: 'asistencia', label: 'Reporte de asistencia' },
    { value: 'rendimiento', label: 'Reporte de rendimiento' },
] as const;

export function getReportTypeLabel(reportType: string): string {
    return REPORT_TYPE_OPTIONS.find((option) => option.value === reportType)?.label ?? reportType;
}
