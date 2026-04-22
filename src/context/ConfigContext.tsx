import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PluginConfig, DEFAULT_CONFIG, loadConfig } from '../services/configService';

interface ConfigContextValue {
    config: PluginConfig;
    isLoading: boolean;
    /** Call this after saving config from Settings to propagate changes everywhere */
    refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue>({
    config: DEFAULT_CONFIG,
    isLoading: true,
    refreshConfig: async () => {}
});

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
    const [config, setConfig] = useState<PluginConfig>(DEFAULT_CONFIG);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const refreshConfig = async () => {
        try {
            const loaded = await loadConfig();
            setConfig(loaded);
        } catch {
            // keep existing config on error
        }
    };

    useEffect(() => {
        const init = async () => {
            await refreshConfig();
            setIsLoading(false);
        };
        init();
    }, []);

    return (
        <ConfigContext.Provider value={{ config, isLoading, refreshConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
