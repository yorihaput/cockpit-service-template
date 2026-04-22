# Cockpit Service Manager Template

This project is a generalized Cockpit plugin template designed to manage various systemd services. It is based on the [Cockpit Starter Kit](https://github.com/cockpit-project/starter-kit) but has been modified to support multiple service configurations via environment files.

## Features

- **Dashboard**: Monitor service status (Active/Inactive) with Start/Stop/Reload controls.
- **Logs**: Integrated journalctl log viewer for the specific service.
- **Config Editor**: Direct text editor for service configuration files with "Apply Changes" (Save & Reload) support.
- **Settings**: Persistent configuration for Service Name, Config Path, and Web UI URL (with `{hostname}` support).
- **Multi-Environment Build**: Build different versions of the plugin (e.g., for Mihomo, AdGuardHome, etc.) from a single codebase using `.env` files.

---

## Development Dependencies

On Debian/Ubuntu:

    sudo apt install gettext nodejs npm make

On Fedora:

    sudo dnf install gettext nodejs npm make

On openSUSE Tumbleweed and Leap:

    sudo zypper in gettext-runtime nodejs npm make

---

## Setup & Configuration

### 1. Create Environment Files
You can create multiple `.env` files with a service suffix, for example: `.env.mihomo`, `.env.adguardhome`.

Example `.env.mihomo`:
```env
APP_NAME=Mihomo
APP_LABEL="Mihomo Manager"
DEFAULT_SERVICE_NAME=mihomo
DEFAULT_CONFIG_PATH=/etc/mihomo/config.yaml
DEFAULT_WEB_UI_URL=http://{hostname}:9090
CONFIG_STORAGE_PATH=/etc/cockpit/mihomo-plugin.json
```

### 2. Build with Specific Environment
Run `make` with the `ENV` variable to select your configuration:

```bash
# Build for Mihomo
make ENV=mihomo

# Build for AdGuardHome
make ENV=adguardhome
```
If the `ENV` variable is not specified, the system will look for a default `.env` file.

---

## Development Workflow

1. **Build Project**:
   ```bash
   make ENV=your_service_name
   ```

2. **Installation (Development)**:
   Run `make devel-install` to create a symlink to the Cockpit plugin directory.
   ```bash
   make devel-install
   ```

3. **Watch Mode**:
   Automatically update the bundle on every code change:
   ```bash
   make watch ENV=your_service_name
   ```

4. **Uninstall (Development)**:
   ```bash
   make devel-uninstall
   ```

---

## Technical Details

### Project Structure
- `src/pages/`: Page components (Dashboard, Logs, Config Editor, Settings).
- `src/services/`: Logic for systemd and file system interaction.
- `src/manifest.json`: Plugin metadata (Label is auto-updated from `.env` during build).
- `build.js`: Build script handling `.env` injection and asset management.

### Coding Standards
- Uses [ESLint](https://eslint.org/) for JS/TS code style.
- Uses [Stylelint](https://stylelint.io/) for CSS/SCSS code style.
- Run `make codecheck` to verify code quality.

---

## Credits
This project was built using the [Cockpit Starter Kit](https://github.com/cockpit-project/starter-kit) as a foundation.

## Further Reading
 * [Cockpit Deployment and Developer documentation](https://cockpit-project.org/guide/latest/)
 * [Make your project easily discoverable](https://cockpit-project.org/blog/making-a-cockpit-application.html)
