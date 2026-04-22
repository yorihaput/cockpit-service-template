import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import cockpit from 'cockpit';
import { loadConfig, PluginConfig } from '../services/configService';

declare const process: { env: { APP_NAME: string } };

export const Logs = () => {
    const [logs, setLogs] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<PluginConfig | null>(null);

    const fetchLogs = async (serviceName: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const output = await cockpit.spawn(["journalctl", "-u", serviceName, "-n", "100", "--no-pager"], { superuser: "require" });
            setLogs(output);
        } catch (err: any) {
            setError(err.message || "Failed to load logs.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const conf = await loadConfig();
                setConfig(conf);
                await fetchLogs(conf.serviceName);
            } catch (err: any) {
                setError("Failed to load config.");
                setIsLoading(false);
            }
        };
        init();

        const onConfigChanged = () => {
            loadConfig().then(conf => {
                setConfig(conf);
                fetchLogs(conf.serviceName);
            }).catch(() => {});
        };
        window.addEventListener('service-manager:config-changed', onConfigChanged);
        return () => window.removeEventListener('service-manager:config-changed', onConfigChanged);
    }, []);

    const handleRefresh = () => {
        if (config) {
            fetchLogs(config.serviceName);
        }
    };

    return (
        <Card>
            <CardTitle>
                {process.env.APP_NAME} Logs
                <Button variant="link" onClick={handleRefresh} isDisabled={isLoading} style={{ float: 'right' }}>
                    Refresh
                </Button>
            </CardTitle>
            <CardBody>
                {error && <Alert variant="danger" title={error} style={{ marginBottom: '1rem' }} />}

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <Spinner size="md" />
                    </div>
                ) : (
                    <pre style={{
                        backgroundColor: '#151515',
                        color: '#f0f0f0',
                        padding: '1rem',
                        borderRadius: '4px',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '500px',
                        overflowY: 'auto'
                    }}>
                        {logs || "No logs available."}
                    </pre>
                )}
            </CardBody>
        </Card>
    );
};
