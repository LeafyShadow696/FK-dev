# Local shell access

The PWA runs in the browser and therefore does not receive arbitrary operating-system shell privileges.

For shell-based laboratory work, clone the repository and use the local companion:

```bash
git clone https://github.com/LeafyShadow696/FK-dev.git
cd FK-dev/png-security-lab
bash tools/pnglab-shell.sh inspect path/to/file.png
```

The companion currently provides deterministic PNG inspection only. This keeps the browser deployment from becoming a remotely reachable command-execution endpoint.

For native memory-safety research, run the C/C++ parser harness separately on a local machine under ASan/UBSan and feed it exported fixtures from the PWA.
