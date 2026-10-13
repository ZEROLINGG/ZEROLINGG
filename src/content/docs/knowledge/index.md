---
title: Knowledge
description: 按主题沉淀的知識库 — Rust、逆向手法、工具链、网络。
---

长期沉淀的笔记，和时间线式的 [Blog](/ZEROLINGG/blog/)、按题目组织的 [Writeups](../writeups/) 互补。

## 分区

- [Rust](./rust/) — 所有权、并发、FFI、编译期技巧、`build-std`、`nightly` 玩法
- [Reverse](./reverse/) — 反混淆、反调试、动态调试方法论（GDB/pwndbg、watchpoint、patch）
- [Tooling](./tooling/) — `obfstr2` · `anti-dbg` · `shell-engine` · `terminal-mcp` · `ollvm_pass` 的设计与实现笔记
- [Networking](./networking/) — 代理、Workers、协议与实战小工具（如 `free-proxy`）

## 收录规则

1. 一篇只讲一件事，标题即结论。
2. 可复现：命令、版本、环境必写。
3. 和 Writeup 重复时，Writeup 保留完整过程，这里只留可复用的方法。
