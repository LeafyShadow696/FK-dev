#!/usr/bin/env python3
"""PNG Security Lab - local companion shell.

This is intentionally a LOCAL, allow-listed shell for PNG laboratory work.
It does not execute arbitrary commands supplied by the browser or network.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path

SIG = b"\x89PNG\r\n\x1a\n"


def chunks(data: bytes):
    if not data.startswith(SIG):
        raise ValueError("not a PNG signature")
    pos = 8
    while pos + 12 <= len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        end = pos + 12 + length
        if end > len(data):
            yield pos, data[pos + 4:pos + 8], length, None, "TRUNCATED"
            return
        ctype = data[pos + 4:pos + 8]
        payload = data[pos + 8:pos + 8 + length]
        stored = struct.unpack(">I", data[pos + 8 + length:end])[0]
        import zlib
        calc = zlib.crc32(ctype + payload) & 0xffffffff
        yield pos, ctype, length, stored, "OK" if stored == calc else "CRC BAD"
        pos = end
        if ctype == b"IEND":
            return


def inspect(path: Path) -> dict:
    data = path.read_bytes()
    result = {
        "file": str(path),
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "signature": data[:8] == SIG,
        "chunks": [],
    }
    if result["signature"]:
        for off, typ, length, crc, state in chunks(data):
            result["chunks"].append({
                "offset": off,
                "type": typ.decode("latin1"),
                "length": length,
                "crc": None if crc is None else f"{crc:08X}",
                "state": state,
            })
    return result


def main() -> int:
    parser = argparse.ArgumentParser(prog="pnglab-shell", description="Safe local PNG inspection CLI")
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("inspect", help="inspect PNG signature/chunks/CRC")
    p.add_argument("file", type=Path)
    p.add_argument("--json", action="store_true")
    args = parser.parse_args()
    if args.command == "inspect":
        result = inspect(args.file)
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"File: {result['file']}")
            print(f"Bytes: {result['bytes']}")
            print(f"SHA-256: {result['sha256']}")
            print(f"Signature: {'OK' if result['signature'] else 'BAD'}")
            for row in result["chunks"]:
                print(f"0x{row['offset']:08X} {row['type']:4s} {row['length']:8d} B CRC={row['crc'] or '—'} {row['state']}")
        return 0
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
