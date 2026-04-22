import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { Form, FormGroup } from "@patternfly/react-core/dist/esm/components/Form/index.js";
import { TextInput } from "@patternfly/react-core/dist/esm/components/TextInput/index.js";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";
import { ActionGroup } from "@patternfly/react-core/dist/esm/components/Form/index.js";

import { loadConfig, saveConfig, resolveWebUIUrl, PluginConfig, DEFAULT_CONFIG, validateConfig } from '../services/configService';

declare const process: { env: { APP_NAME: string } };

export const Settings = () => {
    const [config, setConfig] = useState<PluginConfig>(DEFAULT_CONFIG);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'danger', message: string } | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const loadedConfig = await loadConfig();
                setConfig(loadedConfig);
            } catch (err: any) {
                setFeedback({ type: 'danger', message: err.message });
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    const handleChange = (value: string, field: keyof PluginConfig) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setFeedback(null);
        try {
            validateConfig(config);
            await saveConfig(config);
            setFeedback({ type: 'success', message: 'Configuration saved successfully.' });
        } catch (err: any) {
            setFeedback({ type: 'danger', message: err.message });
        } finally {
            setIsSaving(false);
        }
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
    const urlIsTemplate = config.webUIUrl.includes('{hostname}');

    return (
        <Card>
            <CardTitle>{process.env.APP_NAME} Settings</CardTitle>
            <CardBody>
                {feedback && (
                    <Alert
                        variant={feedback.type}
                        title={feedback.message}
                        style={{ marginBottom: '1rem' }}
                    />
                )}

                <Form>
                    <FormGroup label="Config File Path" fieldId="configFilePath" isRequired>
                        <TextInput
                            isRequired
                            type="text"
                            id="configFilePath"
                            name="configFilePath"
                            value={config.configFilePath}
                            onChange={(e, value) => handleChange(value, 'configFilePath')}
                        />
                    </FormGroup>

                    <FormGroup label="Service Name" fieldId="serviceName" isRequired>
                        <TextInput
                            isRequired
                            type="text"
                            id="serviceName"
                            name="serviceName"
                            value={config.serviceName}
                            onChange={(e, value) => handleChange(value, 'serviceName')}
                        />
                    </FormGroup>

                    <FormGroup
                        label="Web UI URL"
                        fieldId="webUIUrl"
                        isRequired
                    >
                        <TextInput
                            isRequired
                            type="text"
                            id="webUIUrl"
                            name="webUIUrl"
                            value={config.webUIUrl}
                            onChange={(e, value) => handleChange(value, 'webUIUrl')}
                        />
                        <p style={{ fontSize: '0.875rem', color: '#6a6e73', marginTop: '0.25rem', marginBottom: 0 }}>
                            Use <code>{'{hostname}'}</code> which will be automatically replaced with current browser host.
                            {' '}Example: <code>{'http://{hostname}:3000'}</code>, <code>{'http://{hostname}'}</code>, or static URL.
                            {urlIsTemplate && <span> → Resolved as: <strong>{resolvedUrl}</strong></span>}
                        </p>
                    </FormGroup>

                    <ActionGroup>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            isLoading={isSaving}
                            isDisabled={isSaving}
                        >
                            Save Settings
                        </Button>
                    </ActionGroup>
                </Form>
            </CardBody>
        </Card>
    );
};
