---
# Template for CTF writeups.
# This file starts with an underscore, so Astro ignores it — it never becomes a page.
# Copy it to writeups/<category>/<challenge-name>.md and fill in the sections below.
title: CHALLENGE_NAME
description: One-line summary of the challenge.
sidebar:
  label: CHALLENGE_NAME
---

<!-- Delete this comment block when you copy the template. -->

## Info

- **Event:** EVENT_NAME + YEAR
- **Category:** Reverse / PWN
- **Difficulty:** easy / medium / hard
- **Files:** `challenge.bin`, `libc.so`, ...

## Recon

What the binary is, what protections are on:

```sh
file challenge.bin
checksec --file=challenge.bin
```

## Analysis

Key logic, vulnerability / trick, relevant decompiler output or assembly.

## Exploit

```python
from pwn import *

# explain the idea in one paragraph, then the script
```

## Flag

```
flag{...}
```

## Takeaways

What to remember next time.
