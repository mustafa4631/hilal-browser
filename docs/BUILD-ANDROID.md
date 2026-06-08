# Building Hilal Browser on Android

Hilal Android builds use GeckoView and Fenix.

Run `./bin/hil setup` before Android build commands.

---

## One-Time Development Setup (Bootstrapping)

Android builds require the Android SDK, NDK, and Java Development Kit (JDK).
Firefox's bootstrapper installs them under `~/.mozbuild/`.

1. Inside the `engine/` directory, run:
   ```bash
   ./mach bootstrap
   ```
2. When prompted to select the application to build, select **Firefox for Android** (usually option `4`).
3. Follow the prompts to let the bootstrapper download the Android NDK, Android SDK, and standard toolchains.

---

## Architecture Targets

Android targets use the `mozconfigs/` entries below:

| Mapped Configuration | Target Architecture | Typical Use Case |
| --- | --- | --- |
| `android-arm64` | `aarch64-linux-android` | Modern Android phones & tablets (Default) |
| `android-x86_64` | `x86_64-linux-android` | Android Studio Emulator running on macOS/Linux |
| `android-arm` | `arm-linux-androideabi` | Legacy 32-bit ARM physical devices |
| `android-x86` | `i686-linux-android` | Legacy 32-bit x86 emulators |

---

## Building and Installing

`scripts/build-android.sh` applies patches, copies the selected mozconfig, and
runs `./mach`.

### 1. GeckoView backend build
The engine (GeckoView) must be compiled first:
```bash
# Builds for 64-bit ARM (default)
scripts/build-android.sh arm64 build

# Builds for the Emulator (64-bit x86)
scripts/build-android.sh x86_64 build
```

### 2. Gradle compilation & APK Packaging
```bash
# Build debug APK for arm64
scripts/build-android.sh arm64 gradle fenix:assembleDebug

# Build release APK for arm64
scripts/build-android.sh arm64 gradle fenix:assembleRelease
```
The compiled APK files will be located under:
`engine/mobile/android/fenix/app/build/outputs/apk/`

### 3. Deploying to Emulator or Connected Device
```bash
# For connected ARM64 device
scripts/build-android.sh arm64 install

# For active x86_64 emulator
scripts/build-android.sh x86_64 install
```

---

## Front-End Note for Desktop Developers

> [!WARNING]
> Firefox for Android uses a native Android/Kotlin front-end called **Fenix** wrapping the **GeckoView** engine.
> Desktop front-end modifications under the `browser/` folder (such as Desktop Workspaces, titlebar transparency overlays, or desktop preference pages) do not apply to or compile into the Android app. 
> Core engine modifications, WebRTC overrides, and standard network/security prefs will compile and take effect.

---

## Cleaning the Build

To wipe build caches:
```bash
# Clobber build state for arm64
scripts/build-android.sh arm64 clean
```
