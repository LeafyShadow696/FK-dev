# PNG Security Lab PWA

Cross-device browser/PWA PNG parser regression lab.

Flow: Browser → PWA → Drag & Drop / Select PNG → WebAssembly → local results.

The browser UI performs binary inspection and safe PNG mutation locally. It does not execute operating-system commands.

## Local shell companion

For operating-system access, use the separate local companion from a terminal on a machine you control:

```bash
python3 tools/pnglab-shell.py inspect path/to/test.png
python3 tools/pnglab-shell.py inspect path/to/test.png --json
```

The companion deliberately exposes an allow-listed PNG inspection command rather than an arbitrary remote shell. A public PWA must not expose unrestricted OS command execution through an HTTP endpoint.

## Research workflow

```text
malformed PNG
    ↓
browser binary inspection / mutation
    ↓
WASM parser validation
    ↓
reproducible fixture
    ↓
native C/C++ parser under ASan/UBSan (separate local environment)
    ↓
stack trace
    ↓
root-cause identification
    ↓
fix
    ↓
regression test
```

## Safety boundary

This repository intentionally contains no shellcode, RCE payload, exploit primitive, browser-to-OS command bridge, or automatic execution on PNG open. The local companion is for deterministic inspection only.
