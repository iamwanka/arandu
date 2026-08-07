import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';

import type { AppRoute } from '../routes';

interface AppNavigationProps {
    routes: AppRoute[];
    activeRoute: string;
    onRouteChange: (routeId: string) => void;
}

export default function AppNavigation({ routes, activeRoute, onRouteChange }: AppNavigationProps) {
    return (
        <Box padding="l" className="app-navigation">
            <SpaceBetween direction="vertical" size="s">
                {routes.map((route) => (
                    <Button
                        key={route.id}
                        variant={route.id === activeRoute ? 'primary' : 'link'}
                        onClick={() => onRouteChange(route.id)}
                    >
                        {route.label}
                    </Button>
                ))}
            </SpaceBetween>
        </Box>
    );
}
