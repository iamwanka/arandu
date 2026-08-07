import type { ReactNode } from 'react';
import AppLayout from '@cloudscape-design/components/app-layout';
import Box from '@cloudscape-design/components/box';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import SpaceBetween from '@cloudscape-design/components/space-between';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import type { SideNavigationProps } from '@cloudscape-design/components/side-navigation';

import type { AppSession } from '../types';

interface CloudscapeDashboardLayoutProps {
    session: AppSession;
    navigationItems: SideNavigationProps.Item[];
    activeHref: string;
    onNavigation: (href: string) => void;
    onSignOut: () => Promise<void>;
    title: string;
    subtitle?: string;
    children: ReactNode;
}

export default function CloudscapeDashboardLayout({
    session,
    navigationItems,
    activeHref,
    onNavigation,
    onSignOut,
    title,
    subtitle,
    children,
}: CloudscapeDashboardLayoutProps) {
    return (
        <AppLayout
            navigation={
                <SideNavigation
                    header={{ text: 'Navegación' }}
                    items={navigationItems}
                    activeHref={activeHref}
                    onFollow={(event) => {
                        event.preventDefault();
                        const nextHref = event.detail.item.href as string | undefined;
                        if (nextHref) {
                            onNavigation(nextHref);
                        }
                    }}
                />
            }
            contentType="default"
            headerSelector="#cloudscape-dashboard-header"
            content={
                <Box padding="l">
                    <SpaceBetween size="l">
                        <TopNavigation
                            identity={{ title: 'Arandu', href: '#' }}
                            utilities={
                                session
                                    ? [
                                        {
                                            type: 'button',
                                            text: session.user.email,
                                            onClick: () => { },
                                        },
                                        {
                                            type: 'button',
                                            text: 'Cerrar sesión',
                                            onClick: onSignOut,
                                        },
                                    ]
                                    : []
                            }
                        />
                        <Box>
                            <Header id="cloudscape-dashboard-header" variant="h2">
                                {title}
                            </Header>
                            {subtitle ? <Box padding={{ bottom: 'l' }}>{subtitle}</Box> : null}
                            {children}
                        </Box>
                    </SpaceBetween>
                </Box>
            }
        />
    );
}

