import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";
import { TextArea } from "@patternfly/react-core/dist/esm/components/TextArea/index.js";
import { ActionGroup } from "@patternfly/react-core/dist/esm/components/Form/index.js";
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";

import { loadConfig, readFile, writeFile, DEFAULT_CONFIG } from '../services/configService';
import { reloadService } from '../services/systemdService';

declare const process: { env: { APP_NAME: string } };

export const ConfigEditor = () => {
    const [configPath, setConfigPath] = useState<string>(DEFAULT_CONFIG.configFilePath);
    const [serviceName, setServiceName] = useState<string>(DEFAULT_CONFIG.serviceName);
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'danger' | 'warning', message: string } | null>(null);

    const fetchContent = async (path: string) => {
        setIsLoading(true);
        setFeedback(null);
        try {
            const raw = await readFile(path);
            setContent(raw);
        } catch (err: any) {
            setFeedback({ type: 'danger', message: err.message });
            setContent('');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const conf = await loadConfig();
                setConfigPath(conf.configFilePath);
                setServiceName(conf.serviceName);
                await fetchContent(conf.configFilePath);
            } catch (err: any) {
                setFeedback({ type: 'danger', message: err.message });
                setIsLoading(false);
            }
        };
        init();

        const onConfigChanged = () => {
            loadConfig().then(conf => {
                setConfigPath(conf.configFilePath);
                setServiceName(conf.serviceName);
                fetchContent(conf.configFilePath);
            }).catch(() => {});
        };
        window.addEventListener('service-manager:config-changed', onConfigChanged);
        return () => window.removeEventListener('service-manager:config-changed', onConfigChanged);
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setFeedback(null);
        try {
            await writeFile(configPath, content);
            setFeedback({ type: 'success', message: 'Configuration saved successfully. Manual restart might be required.' });
        } catch (err: any) {
            setFeedback({ type: 'danger', message: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleApply = async () => {
        setIsSaving(true);
        setFeedback(null);
        try {
            await writeFile(configPath, content);
            await reloadService(serviceName);
            setFeedback({ type: 'success', message: `Configuration saved and ${process.env.APP_NAME} reloaded successfully.` });
        } catch (err: any) {
            setFeedback({ type: 'danger', message: `Saved but failed to reload service: ${err.message}` });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReload = () => {
        fetchContent(configPath);
    };

    return (
        <Card>
            <CardTitle>
                <Flex>
                    <FlexItem grow={{ default: 'grow' }}>
                        {process.env.APP_NAME} Config Editor
                        <span style={{ fontWeight: 'normal', fontSize: '0.875rem', marginLeft: '0.5rem', color: '#6a6e73' }}>
                            {configPath}
                        </span>
                    </FlexItem>
                    <FlexItem>
                        <Button variant="link" onClick={handleReload} isDisabled={isLoading || isSaving}>
                            Reload from disk
                        </Button>
                    </FlexItem>
                </Flex>
            </CardTitle>
            <CardBody>
                {feedback && (
                    <Alert
                        variant={feedback.type}
                        title={feedback.message}
                        style={{ marginBottom: '1rem' }}
                    />
                )}

                {!feedback && (
                    <Alert
                        variant="warning"
                        title={`Edit with caution. Invalid configuration may cause ${process.env.APP_NAME} to fail on restart.`}
                        style={{ marginBottom: '1rem' }}
                    />
                )}

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <Spinner size="md" />
                    </div>
                ) : (
                    <>
                        <TextArea
                            id="service-config-textarea"
                            value={content}
                            onChange={(e, value) => setContent(value)}
                            rows={30}
                            style={{
                                fontFamily: 'monospace',
                                fontSize: '0.8125rem',
                                backgroundColor: '#151515',
                                color: '#f0f0f0',
                                resize: 'vertical'
                            }}
                            aria-label={`${process.env.APP_NAME} configuration file content`}
                            isDisabled={isSaving}
                        />

                        <ActionGroup style={{ marginTop: '1rem' }}>
                            <Button
                                variant="primary"
                                onClick={handleApply}
                                isLoading={isSaving}
                                isDisabled={isSaving}
                            >
                                Apply Changes
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={handleSave}
                                isLoading={isSaving}
                                isDisabled={isSaving}
                            >
                                Save Only
                            </Button>
                            <Button
                                variant="link"
                                onClick={handleReload}
                                isDisabled={isSaving || isLoading}
                            >
                                Discard Changes
                            </Button>
                        </ActionGroup>
                    </>
                )}
            </CardBody>
        </Card>
    );
};
