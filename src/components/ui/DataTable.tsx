import type { ReactNode } from 'react';
import Header from '@cloudscape-design/components/header';
import Table, { type TableProps } from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';

import EmptyState from './EmptyState';

interface DataTableProps<T> {
    title: string;
    description?: string;
    columns: ReadonlyArray<TableProps.ColumnDefinition<T>>;
    items: ReadonlyArray<T>;
    /** Propiedad que identifica cada fila de forma única. */
    trackBy: string;
    loading?: boolean;
    loadingText?: string;
    /** Botones del encabezado: crear, exportar, refrescar… */
    actions?: ReactNode;
    /**
     * Buscador simple controlado por la vista. Para filtrado con `useCollection`
     * (recomendado para listados que también necesitan orden o paginación), usa
     * `filter` en su lugar y pásale `filterProps` directamente.
     */
    search?: {
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
    };
    /** Slot de filtro completo, p. ej. `<TextFilter {...filterProps} />` de `useCollection`. Tiene prioridad sobre `search`. */
    filter?: ReactNode;
    /** `CollectionPreferences` u otro control de preferencias de la tabla. */
    preferences?: ReactNode;
    sortingColumn?: TableProps<T>['sortingColumn'];
    sortingDescending?: boolean;
    onSortingChange?: TableProps<T>['onSortingChange'];
    emptyTitle?: string;
    emptyDescription?: string;
    emptyAction?: ReactNode;
    /**
     * Estado vacío completo, para distinguir "no hay datos" de "el filtro no
     * encontró nada" (usa `collectionProps.empty` de `useCollection` para eso).
     * Tiene prioridad sobre `emptyTitle`/`emptyDescription`/`emptyAction`.
     */
    empty?: ReactNode;
    /** Total real de registros cuando el listado está paginado en el servidor. */
    totalCount?: number;
    pagination?: ReactNode;
    variant?: TableProps.Variant;
}

/**
 * Tabla estándar de la aplicación.
 *
 * Envuelve el `Table` de Cloudscape con las piezas que toda vista de listado
 * necesita —encabezado con contador, buscador, estado de carga y estado
 * vacío— para que los módulos solo declaren columnas y datos.
 *
 * El error no se renderiza aquí: usa `FeedbackAlert` encima de la tabla, de
 * modo que un fallo de recarga no borre los datos que ya se están mostrando.
 */
export default function DataTable<T>({
    title,
    description,
    columns,
    items,
    trackBy,
    loading = false,
    loadingText = 'Cargando datos',
    actions,
    search,
    filter,
    preferences,
    sortingColumn,
    sortingDescending,
    onSortingChange,
    emptyTitle = 'Sin registros',
    emptyDescription = 'Todavía no hay información para mostrar.',
    emptyAction,
    empty,
    totalCount,
    pagination,
    variant = 'container',
}: DataTableProps<T>) {
    const counter = loading ? undefined : `(${totalCount ?? items.length})`;

    const filterSlot =
        filter ??
        (search ? (
            <TextFilter
                filteringText={search.value}
                filteringPlaceholder={search.placeholder ?? 'Buscar'}
                filteringAriaLabel={`Buscar en ${title}`}
                onChange={({ detail }) => search.onChange(detail.filteringText)}
                countText={search.value ? `${items.length} coincidencias` : ''}
            />
        ) : undefined);

    return (
        <Table
            variant={variant}
            columnDefinitions={columns as TableProps.ColumnDefinition<T>[]}
            items={items}
            trackBy={trackBy}
            loading={loading}
            loadingText={loadingText}
            resizableColumns
            stickyHeader
            wrapLines
            sortingColumn={sortingColumn}
            sortingDescending={sortingDescending}
            onSortingChange={onSortingChange}
            header={
                <Header variant="h2" description={description} counter={counter} actions={actions}>
                    {title}
                </Header>
            }
            filter={filterSlot}
            preferences={preferences}
            pagination={pagination}
            empty={empty ?? <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />}
        />
    );
}
