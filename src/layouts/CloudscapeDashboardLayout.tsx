import type { ReactNode } from 'react';
import AppLayout from '@cloudscape-design/components/app-layout';
import Box from '@cloudscape-design/components/box';
import Header from '@cloudscape-design/components/header';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import SpaceBetween from '@cloudscape-design/components/space-between';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import type { SideNavigationProps } from '@cloudscape-design/components/side-navigation';

import { useThemeContext } from '../context/themeContextBase';
import { getRoleLabel } from '../lib/roles';
import type { AppSession } from '../types';

const THEME_ITEM_IDS = {
    system: 'theme-system',
    light: 'theme-light',
    dark: 'theme-dark',
} as const;

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
    const { preference, setPreference } = useThemeContext();

    return (
        <AppLayout
            navigation={
                <SideNavigation
                    header={{ text: 'Navegación', href: '#' }}
                    items={navigationItems}
                    activeHref={activeHref}
                    onFollow={(event) => {
                        event.preventDefault();
                        const nextHref = (event.detail as { href?: string }).href;
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
                            identity={{
                                title: 'Arandu',
                                href: '#',
                                logo: { src: '/favicon.svg', alt: 'Arandu' },
                            }}
                            utilities={[
                                {
                                    type: 'menu-dropdown',
                                    text: `${session.user.name} · ${getRoleLabel(session.user.role)}`,
                                    description: session.user.email,
                                    iconName: 'user-profile',
                                    items: [
                                        {
                                            id: 'theme-group',
                                            text: 'Tema',
                                            items: [
                                                {
                                                    id: THEME_ITEM_IDS.system,
                                                    itemType: 'checkbox',
                                                    text: 'Sistema',
                                                    checked: preference === 'system',
                                                },
                                                {
                                                    id: THEME_ITEM_IDS.light,
                                                    itemType: 'checkbox',
                                                    text: 'Claro',
                                                    checked: preference === 'light',
                                                },
                                                {
                                                    id: THEME_ITEM_IDS.dark,
                                                    itemType: 'checkbox',
                                                    text: 'Oscuro',
                                                    checked: preference === 'dark',
                                                },
                                            ],
                                        },
                                        { id: 'signout', text: 'Cerrar sesión', iconName: 'sign-out' },
                                    ],
                                    onItemClick: ({ detail }) => {
                                        if (detail.id === 'signout') {
                                            void onSignOut();
                                        } else if (detail.id === THEME_ITEM_IDS.system) {
                                            setPreference('system');
                                        } else if (detail.id === THEME_ITEM_IDS.light) {
                                            setPreference('light');
                                        } else if (detail.id === THEME_ITEM_IDS.dark) {
                                            setPreference('dark');
                                        }
                                    },
                                },
                            ]}
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

