const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

const ABSOLUTE_FORMAT: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
};

/**
 * Tiempo relativo ("hace 3 días") con la fecha absoluta disponible al pasar
 * el cursor — el patrón de "Timestamps" de Cloudscape, pensado para feeds de
 * actividad donde la recencia importa más que la fecha exacta.
 */
export function formatRelativeTimestamp(iso: string): { relative: string; absolute: string } {
    const date = new Date(iso);
    const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    let relative: string;
    if (Math.abs(diffSeconds) < 60) {
        relative = RELATIVE_FORMATTER.format(diffSeconds, 'second');
    } else if (Math.abs(diffMinutes) < 60) {
        relative = RELATIVE_FORMATTER.format(diffMinutes, 'minute');
    } else if (Math.abs(diffHours) < 24) {
        relative = RELATIVE_FORMATTER.format(diffHours, 'hour');
    } else if (Math.abs(diffDays) < 30) {
        relative = RELATIVE_FORMATTER.format(diffDays, 'day');
    } else if (Math.abs(diffDays) < 365) {
        relative = RELATIVE_FORMATTER.format(Math.round(diffDays / 30), 'month');
    } else {
        relative = RELATIVE_FORMATTER.format(Math.round(diffDays / 365), 'year');
    }

    return { relative, absolute: date.toLocaleString('es-CO', ABSOLUTE_FORMAT) };
}
