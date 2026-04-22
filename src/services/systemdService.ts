import cockpit from 'cockpit';

export interface ServiceStatus {
    isActive: boolean;
    state: string;
    description: string;
}

export class SystemdError extends Error {
    constructor(message: string, public readonly originalError?: any) {
        super(message);
        this.name = "SystemdError";
    }
}

const handleSpawnError = (err: any, action: string, serviceName: string) => {
    let message = `Failed to ${action} service ${serviceName}.`;
    if (err?.message?.includes("not found")) {
        message = `Service ${serviceName} not found.`;
    } else if (err?.message?.includes("Access denied") || err?.problem === "access-denied") {
        message = `Permission denied when trying to ${action} ${serviceName}.`;
    } else if (err?.message) {
        message = `${message} Reason: ${err.message}`;
    }
    throw new SystemdError(message, err);
};

export const startService = async (serviceName: string): Promise<void> => {
    try {
        await cockpit.spawn(["systemctl", "start", serviceName], { superuser: "require" });
    } catch (err) {
        handleSpawnError(err, "start", serviceName);
    }
};

export const stopService = async (serviceName: string): Promise<void> => {
    try {
        await cockpit.spawn(["systemctl", "stop", serviceName], { superuser: "require" });
    } catch (err) {
        handleSpawnError(err, "stop", serviceName);
    }
};

export const reloadService = async (serviceName: string): Promise<void> => {
    try {
        await cockpit.spawn(["systemctl", "reload", serviceName], { superuser: "require" });
    } catch (err) {
        handleSpawnError(err, "reload", serviceName);
    }
};

export const getServiceStatus = async (serviceName: string): Promise<ServiceStatus> => {
    try {
        // systemctl show <service> --property=ActiveState,SubState,Description
        const result = await cockpit.spawn(["systemctl", "show", serviceName, "--property=ActiveState,SubState,Description"]);
        const lines = result.split("\n");
        let activeState = "";
        let subState = "";
        let description = "";

        for (const line of lines) {
            if (line.startsWith("ActiveState=")) {
                activeState = line.split("=")[1] || "";
            } else if (line.startsWith("SubState=")) {
                subState = line.split("=")[1] || "";
            } else if (line.startsWith("Description=")) {
                description = line.split("=")[1] || "";
            }
        }

        return {
            isActive: activeState === "active",
            state: activeState === "active" ? subState : activeState,
            description: description || serviceName
        };
    } catch (err) {
        throw new SystemdError(`Failed to get status for ${serviceName}`, err);
    }
};
