import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";
import { Label } from "@patternfly/react-core/dist/esm/components/Label/index.js";
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";

import { loadConfig, resolveWebUIUrl, PluginConfig, DEFAULT_CONFIG } from '../services/configService';
import { getServiceStatus, startService, stopService, reloadService, ServiceStatus } from '../services/systemdService';

declare const process: { env: { APP_NAME: string } };

export const Dashboard = () => {
    const [config, setConfig] = useState<PluginConfig>(DEFAULT_CONFIG);
    const [status, setStatus] = useState<ServiceStatus | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'danger', message: string } | null>(null);

    const fetchStatus = async (serviceName: string) => {
        try {
            const s = await getServiceStatus(serviceName);
            setStatus(s);
        } catch (err: any) {
            setFeedback({ type: 'danger', message: `Failed to fetch status: ${err.message}` });
        }
    };

    const reloadConfig = async () => {
        const conf = await loadConfig();
        setConfig(conf);
        return conf;
    };

    useEffect(() => {
        const init = async () => {
            try {
                const conf = await reloadConfig();
                await fetchStatus(conf.serviceName);
            } catch (err: any) {
                setFeedback({ type: 'danger', message: err.message });
            } finally {
                setIsLoading(false);
            }
        };
        init();

        const onConfigChanged = () => {
            loadConfig().then(conf => setConfig(conf)).catch(() => {});
        };
        window.addEventListener('service-manager:config-changed', onConfigChanged);
        return () => window.removeEventListener('service-manager:config-changed', onConfigChanged);
    }, []);

    useEffect(() => {
        if (isLoading) return;
        const interval = setInterval(() => {
            getServiceStatus(config.serviceName).then(setStatus).catch(() => {});
        }, 5000);
        return () => clearInterval(interval);
    }, [config.serviceName, isLoading]);

    const handleAction = async (action: 'start' | 'stop' | 'reload') => {
        setActionLoading(true);
        setFeedback(null);
        try {
            if (action === 'start') await startService(config.serviceName);
            else if (action === 'stop') await stopService(config.serviceName);
            else if (action === 'reload') await reloadService(config.serviceName);

            setFeedback({ type: 'success', message: `Service ${action}ed successfully.` });
            await fetchStatus(config.serviceName);
        } catch (err: any) {
            setFeedback({ type: 'danger', message: err.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenWebUI = () => {
        const url = resolveWebUIUrl(config.webUIUrl);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (isLoading) {
        return (
            <Card>
                <CardBody style={{ textAlign: 'center', padding: '2rem' }}>
                    <Spinner size="lg" />
                </CardBody>
            </Card>
        );
    }

    const resolvedUrl = resolveWebUIUrl(config.webUIUrl);

    return (
        <Card>
            <CardTitle>{process.env.APP_NAME} Status</CardTitle>
            <CardBody>
                {feedback && (
                    <Alert
                        variant={feedback.type}
                        title={feedback.message}
                        style={{ marginBottom: '1rem' }}
                    />
                )}

                <Flex alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '2rem' }}>
                    <FlexItem><strong>Service:</strong></FlexItem>
                    <FlexItem><code>{config.serviceName}</code></FlexItem>
                    <FlexItem><strong>Status:</strong></FlexItem>
                    <FlexItem>
                        {status ? (
                            <Label color={status.isActive ? 'green' : 'red'}>
                                {status.state.toUpperCase()}
                            </Label>
                        ) : (
                            <Label color="grey">UNKNOWN</Label>
                        )}
                    </FlexItem>
                    <FlexItem>{status?.description}</FlexItem>
                </Flex>

                <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                        <Button
                            variant="primary"
                            onClick={() => handleAction('start')}
                            isDisabled={actionLoading || (status?.isActive ?? false)}
                            isLoading={actionLoading}
                        >
                            Start
                        </Button>
                    </FlexItem>
                    <FlexItem>
                        <Button
                            variant="danger"
                            onClick={() => handleAction('stop')}
                            isDisabled={actionLoading || !(status?.isActive ?? false)}
                        >
                            Stop
                        </Button>
                    </FlexItem>
                    <FlexItem>
                        <Button
                            variant="secondary"
                            onClick={() => handleAction('reload')}
                            isDisabled={actionLoading || !(status?.isActive ?? false)}
                        >
                            Reload
                        </Button>
                    </FlexItem>
                    <FlexItem>
                        <Button
                            variant="link"
                            onClick={handleOpenWebUI}
                        >
                            Open Web UI ({resolvedUrl})
                        </Button>
                    </FlexItem>
                </Flex>
            </CardBody>
        </Card>
    );
};
