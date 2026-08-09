import Box from '@cloudscape-design/components/box';
import Icon from '@cloudscape-design/components/icon';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { EmptyState } from '../../../../components/ui';
import { formatRelativeTimestamp } from '../../../../lib/timestamps';
import type { ActivityItem } from './indicators';

interface ActivityFeedProps {
    items: ActivityItem[];
    emptyDescription: string;
}

/** Línea de tiempo compacta de notas/asistencia/disciplina, para que el resumen de un rol de solo lectura se sienta vivo y no una foto fija. */
export default function ActivityFeed({ items, emptyDescription }: ActivityFeedProps) {
    if (items.length === 0) {
        return <EmptyState title="Sin actividad reciente" description={emptyDescription} />;
    }

    return (
        <SpaceBetween size="s">
            {items.map((item) => {
                const { relative, absolute } = formatRelativeTimestamp(item.date);
                return (
                    <SpaceBetween key={item.id} direction="horizontal" size="xs">
                        <Icon name={item.iconName} variant="subtle" />
                        <div>
                            <Box>{item.text}</Box>
                            <Box color="text-body-secondary" fontSize="body-s">
                                <time dateTime={item.date} title={absolute}>
                                    {relative}
                                </time>
                            </Box>
                        </div>
                    </SpaceBetween>
                );
            })}
        </SpaceBetween>
    );
}
