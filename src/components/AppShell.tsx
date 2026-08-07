import { useState } from 'react';
import type { ReactNode } from 'react';
import AppLayout from '@cloudscape-design/components/app-layout';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';
import TopNavigation from '@cloudscape-design/components/top-navigation';

import AppNavigation from './AppNavigation';
import type { AppRoute } from '../routes';
import type { AppSession } from '../types';

interface AppShellProps {
    routes: AppRoute[];
    activeRoute: string;
    onRouteChange: (routeId: string) => void;
    session: AppSession | null;
    onSignOut: () => Promise<void>;
    children: ReactNode;
}

export default function AppShell({ routes, activeRoute, onRouteChange, session, onSignOut, children }: AppShellProps) {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleOpenSignOutModal = () => {
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
    };

    const handleConfirmSignOut = async () => {
        await onSignOut();
        setIsModalVisible(false);
    };

    return (
        <AppLayout
            navigation={<AppNavigation routes={routes} activeRoute={activeRoute} onRouteChange={onRouteChange} />}
            navigationHide={false}
            content={
                <Box padding="l">
                    <SpaceBetween size="l">
                        <TopNavigation
                            identity={{ title: `Arandu — ${session?.user.email ?? ''}`, href: '#' }}
                            utilities={
                                session
                                    ? [
                                        {
                                            type: 'button',
                                            text: 'Cerrar sesión',
                                            onClick: handleOpenSignOutModal,
                                        },
                                    ]
                                    : []
                            }
                        />
                        {children}
                    </SpaceBetween>
                    <Modal
                        visible={isModalVisible}
                        onDismiss={handleCloseModal}
                        header={`Cerrar sesión`}
                        footer={
                            <SpaceBetween direction="horizontal" size="xs">
                                <Button onClick={handleCloseModal}>Cancelar</Button>
                                <Button onClick={handleConfirmSignOut} variant="primary">
                                    Confirmar
                                </Button>
                            </SpaceBetween>
                        }
                    >
                        <Box padding={{ bottom: 'l' }}>
                            ¿Deseas cerrar sesión de <strong>{session?.user.email}</strong>?
                        </Box>
                    </Modal>
                </Box>
            }
            contentType="default"
        />
    );
}
