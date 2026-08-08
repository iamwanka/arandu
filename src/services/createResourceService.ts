/**
 * Fábrica de servicios CRUD sobre Supabase.
 *
 * Concentra en un solo lugar el patrón que repetirían todos los módulos:
 * validar el cliente, ejecutar la consulta, normalizar el error y traducir las
 * filas al modelo de dominio. Cada módulo académico solo declara su tabla, su
 * mapeo y sus columnas de búsqueda.
 */

import type { Database, TableName } from '../lib/database.types';
import { AppError, toAppError } from '../lib/errors';
import { requireSupabase } from '../lib/supabase';
import type { ListQuery, PagedResult } from '../types';

type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];

interface QueryResult<T> {
    data: T | null;
    error: unknown;
    count?: number | null;
}

/**
 * Vista mínima del constructor de consultas de PostgREST.
 *
 * `supabase-js` infiere el tipo de `from()` a partir de un literal de tabla y
 * colapsa a `never` cuando la tabla llega como parámetro genérico, así que
 * dentro de la fábrica describimos solo los métodos que usamos. Los tipos
 * concretos se recuperan en la frontera pública: todo lo que sale de aquí es
 * `Model`, ya validado por el mapeo de cada servicio.
 */
interface QueryBuilder<R> extends PromiseLike<QueryResult<R[]>> {
    select(columns: string, options?: { count?: 'exact'; head?: boolean }): QueryBuilder<R>;
    insert(values: object): QueryBuilder<R>;
    update(values: object): QueryBuilder<R>;
    delete(): QueryBuilder<R>;
    eq(column: string, value: unknown): QueryBuilder<R>;
    or(expression: string): QueryBuilder<R>;
    order(column: string, options?: { ascending?: boolean }): QueryBuilder<R>;
    range(from: number, to: number): QueryBuilder<R>;
    single(): PromiseLike<QueryResult<R>>;
    maybeSingle(): PromiseLike<QueryResult<R | null>>;
}

interface GenericClient<R> {
    from(table: string): QueryBuilder<R>;
}

export interface ResourceServiceConfig<T extends TableName, Model, Input> {
    /** Tabla de `public` sobre la que opera el servicio. */
    table: T;
    /** Nombre legible de la entidad, usado en los mensajes de error. */
    label: string;
    /** Fila de Supabase -> modelo de dominio. */
    toModel: (row: Row<T>) => Model;
    /** Entrada de formulario -> columnas de la tabla. Debe tolerar entradas parciales. */
    toRow: (input: Partial<Input>) => Partial<Row<T>>;
    /** Columnas de texto sobre las que aplica `ListQuery.search`. */
    searchColumns?: Array<Extract<keyof Row<T>, string>>;
    /** Orden por defecto de los listados. */
    defaultOrderBy?: Extract<keyof Row<T>, string>;
    defaultAscending?: boolean;
}

export interface ResourceService<Model, Input> {
    list(query?: ListQuery): Promise<Model[]>;
    listPaged(query?: ListQuery): Promise<PagedResult<Model>>;
    getById(id: string): Promise<Model | null>;
    create(input: Input): Promise<Model>;
    update(id: string, patch: Partial<Input>): Promise<Model>;
    remove(id: string): Promise<void>;
}

const DEFAULT_PAGE_SIZE = 25;

/**
 * PostgREST separa los filtros de `or()` con comas y usa paréntesis para
 * agrupar, así que un término de búsqueda con esos caracteres rompería la
 * expresión. Los eliminamos en lugar de escaparlos: son irrelevantes para una
 * búsqueda por nombre o código.
 */
function sanitizeSearchTerm(term: string): string {
    return term
        .trim()
        .replace(/[,()%\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function createResourceService<T extends TableName, Model, Input>(
    config: ResourceServiceConfig<T, Model, Input>,
): ResourceService<Model, Input> {
    const {
        table,
        label,
        toModel,
        toRow,
        searchColumns = [],
        defaultOrderBy = 'created_at' as Extract<keyof Row<T>, string>,
        defaultAscending = false,
    } = config;

    function getClient(): GenericClient<Row<T>> {
        return requireSupabase() as unknown as GenericClient<Row<T>>;
    }

    function buildSearchExpression(search?: string): string | null {
        if (!search || searchColumns.length === 0) return null;

        const term = sanitizeSearchTerm(search);
        if (!term) return null;

        return searchColumns.map((column) => `${column}.ilike.%${term}%`).join(',');
    }

    async function runList(query: ListQuery, withCount: boolean): Promise<PagedResult<Model>> {
        let builder = getClient()
            .from(table)
            .select('*', withCount ? { count: 'exact' } : undefined);

        const searchExpression = buildSearchExpression(query.search);
        if (searchExpression) {
            builder = builder.or(searchExpression);
        }

        builder = builder.order(query.orderBy ?? defaultOrderBy, {
            ascending: query.ascending ?? defaultAscending,
        });

        if (query.page !== undefined || query.pageSize !== undefined) {
            const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
            const page = query.page ?? 0;
            const from = page * pageSize;
            builder = builder.range(from, from + pageSize - 1);
        }

        const { data, error, count } = await builder;

        if (error) {
            throw toAppError(error);
        }

        const items = (data ?? []).map(toModel);

        return { items, total: count ?? items.length };
    }

    return {
        async list(query = {}) {
            const { items } = await runList(query, false);
            return items;
        },

        listPaged(query = {}) {
            return runList(query, true);
        },

        async getById(id) {
            const { data, error } = await getClient().from(table).select('*').eq('id', id).maybeSingle();

            if (error) {
                throw toAppError(error);
            }

            return data ? toModel(data) : null;
        },

        async create(input) {
            const { data, error } = await getClient().from(table).insert(toRow(input)).select('*').single();

            if (error) {
                throw toAppError(error);
            }

            if (!data) {
                throw new AppError('unknown', `No se pudo crear el registro de ${label}.`);
            }

            return toModel(data);
        },

        async update(id, patch) {
            const changes = toRow(patch);

            if (Object.keys(changes).length === 0) {
                throw new AppError('validation', `No se enviaron cambios para actualizar ${label}.`);
            }

            const { data, error } = await getClient()
                .from(table)
                .update(changes)
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                throw toAppError(error);
            }

            if (!data) {
                throw new AppError('not-found', `No se encontró el registro de ${label} a actualizar.`);
            }

            return toModel(data);
        },

        async remove(id) {
            const { error } = await getClient().from(table).delete().eq('id', id);

            if (error) {
                throw toAppError(error);
            }
        },
    };
}
