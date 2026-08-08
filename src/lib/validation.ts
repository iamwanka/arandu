/**
 * Validaciones de formulario reutilizables.
 *
 * Devuelven `null` cuando el valor es válido y un mensaje en español cuando no
 * lo es, de forma que se puedan enchufar directamente en `errorText` del
 * `FormField` de Cloudscape.
 */

export type Validator<T> = (value: T) => string | null;

/** Errores por campo. Un campo ausente significa que es válido. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function required(label = 'Este campo'): Validator<string | null | undefined> {
    return (value) => (value && value.trim().length > 0 ? null : `${label} es obligatorio.`);
}

export function minLength(length: number, label = 'Este campo'): Validator<string | null | undefined> {
    return (value) =>
        (value ?? '').trim().length >= length ? null : `${label} debe tener al menos ${length} caracteres.`;
}

export function maxLength(length: number, label = 'Este campo'): Validator<string | null | undefined> {
    return (value) => ((value ?? '').length <= length ? null : `${label} no puede superar ${length} caracteres.`);
}

export function email(): Validator<string | null | undefined> {
    return (value) => (EMAIL_PATTERN.test((value ?? '').trim()) ? null : 'Ingresa un correo electrónico válido.');
}

export function isoDate(label = 'La fecha'): Validator<string | null | undefined> {
    return (value) => {
        if (!value) return `${label} es obligatoria.`;
        return Number.isNaN(Date.parse(value)) ? `${label} no tiene un formato válido.` : null;
    };
}

/** Encadena validadores y devuelve el primer error encontrado. */
export function compose<T>(...validators: Array<Validator<T>>): Validator<T> {
    return (value) => {
        for (const validate of validators) {
            const error = validate(value);
            if (error) return error;
        }
        return null;
    };
}

/**
 * Valida un objeto completo contra un mapa de validadores.
 *
 * ```ts
 * const errors = validateFields(form, {
 *   fullName: required('El nombre'),
 *   email: compose(required('El correo'), email()),
 * });
 * ```
 */
export function validateFields<T extends object>(
    values: T,
    rules: Partial<{ [K in keyof T]: Validator<T[K]> }>,
): FieldErrors<T> {
    const errors: FieldErrors<T> = {};

    for (const key of Object.keys(rules) as Array<keyof T>) {
        const validate = rules[key];
        if (!validate) continue;

        const error = validate(values[key]);
        if (error) {
            errors[key] = error;
        }
    }

    return errors;
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
    return Object.keys(errors).length > 0;
}
