import cockpit from 'cockpit';

export interface PluginConfig {
    configFilePath: string;
    serviceName: string;
    /** URL template – supports {hostname} placeholder, e.g. "http://{hostname}:3000" */
    webUIUrl: string;
}

// These are injected by build.js from .env
declare const process: {
    env: {
        DEFAULT_SERVICE_NAME: string;
        DEFAULT_CONFIG_PATH: string;
        DEFAULT_WEB_UI_URL: string;
        CONFIG_STORAGE_PATH: string;
        APP_NAME: string;
        APP_LABEL: string;
    }
};

export const DEFAULT_CONFIG: PluginConfig = {
    configFilePath: process.env.DEFAULT_CONFIG_PATH,
    serviceName: process.env.DEFAULT_SERVICE_NAME,
    webUIUrl: process.env.DEFAULT_WEB_UI_URL
};

const CONFIG_PATH = process.env.CONFIG_STORAGE_PATH;

/**
 * Resolve the Web UI URL template.
 */
export const resolveWebUIUrl = (template: string): string => {
    const hostname = window.location.hostname || 'localhost';
    return template.replace(/\{hostname\}/g, hostname);
};

export class ConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigError";
    }
}

export const loadConfig = async (): Promise<PluginConfig> => {
    try {
        const file = cockpit.file(CONFIG_PATH, { superuser: "try" });
        const content = await file.read();
        if (!content) {
            return DEFAULT_CONFIG;
        }
        const parsed = JSON.parse(content);
        return {
            configFilePath: parsed.configFilePath ?? DEFAULT_CONFIG.configFilePath,
            serviceName: parsed.serviceName ?? DEFAULT_CONFIG.serviceName,
            webUIUrl: parsed.webUIUrl ?? DEFAULT_CONFIG.webUIUrl,
        };
    } catch (err: any) {
        if (err?.problem === "access-denied" || err?.problem === "not-found") {
            return DEFAULT_CONFIG;
        }
        throw new ConfigError(`Failed to load configuration: ${err.message || err}`);
    }
};

export const saveConfig = async (config: PluginConfig): Promise<void> => {
    try {
        validateConfig(config);
        const file = cockpit.file(CONFIG_PATH, { superuser: "require" });
        await file.replace(JSON.stringify(config, null, 2));
        // Broadcast to all other tabs
        window.dispatchEvent(new CustomEvent('service-manager:config-changed'));
    } catch (err: any) {
        if (err instanceof ConfigError) throw err;
        if (err?.problem === "access-denied") {
            throw new ConfigError("Permission denied. Cockpit needs superuser access to save configuration.");
        }
        throw new ConfigError(`Failed to save configuration: ${err.message || err}`);
    }
};

export const validateConfig = (config: PluginConfig): void => {
    if (!config.configFilePath || config.configFilePath.trim() === '') {
        throw new ConfigError("Config File Path cannot be empty.");
    }
    if (!config.serviceName || config.serviceName.trim() === '') {
        throw new ConfigError("Service Name cannot be empty.");
    }
    if (!config.webUIUrl || config.webUIUrl.trim() === '') {
        throw new ConfigError("Web UI URL cannot be empty.");
    }
};

export const readFile = async (path: string): Promise<string> => {
    try {
        const file = cockpit.file(path, { superuser: "require" });
        const content = await file.read();
        return content ?? "";
    } catch (err: any) {
        if (err?.problem === "access-denied") {
            throw new ConfigError(`Permission denied reading file: ${path}`);
        }
        if (err?.problem === "not-found") {
            throw new ConfigError(`File not found: ${path}`);
        }
        throw new ConfigError(`Failed to read file: ${err.message || err}`);
    }
};

export const writeFile = async (path: string, content: string): Promise<void> => {
    try {
        const file = cockpit.file(path, { superuser: "require" });
        await file.replace(content);
    } catch (err: any) {
        if (err?.problem === "access-denied") {
            throw new ConfigError(`Permission denied writing file: ${path}`);
        }
        throw new ConfigError(`Failed to write file: ${err.message || err}`);
    }
};
