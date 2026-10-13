---
title: Whereistheflag
description: Bugku Reverse，GDB watchpoint patch u128 比较绕过 OLLVM 混淆 Rust 二进制。
---

> **来源:** [Bugku CTF — Whereistheflag](https://ctf.bugku.com/challenges/detail/id/3085.html) 


---

## 一、题目基本信息与环境搜集

对目标二进制文件进行基本信息采集与安全机制检查：

```bash
❯ ll ./Whereistheflag
-rwxrwxr-x 1 zako zako 15M  7月26日 22:06 ./Whereistheflag

❯ file ./Whereistheflag
./Whereistheflag: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), static-pie linked,
for GNU/Linux 3.2.0, BuildID[sha1]=f07be411488f757b25e8636a25dd9ac195c7d40f, stripped

❯ checksec --file=./Whereistheflag
RELRO           STACK CANARY      NX            PIE             RPATH      RUNPATH    Symbols     FORTIFY
Full RELRO      No canary found   NX enabled    PIE enabled     No RPATH   No RUNPATH No Symbols  No
```

**关键信息汇总：**

1. **架构与链接方式**：64 位 Linux ELF，`static-pie linked`，静态链接并启用位置无关执行，不依赖外部动态库，标准库代码全部内嵌。
2. **符号表**：`stripped`，无法通过符号名直接定位 `main` 或标准库函数。
3. **文件体积**：约 15 MB，对逻辑简单的程序而言明显偏大，提示存在高强度混淆或包含大体量运行时代码（Rust async runtime 内联展开）。

---

## 二、源码逻辑与编译参数分析

题目附带 Rust 源码及编译参数：

```rust
use std::str::FromStr;
use lib::runtime::*;

#[main]
async fn main() {
    unsafe { core::arch::asm!("# __OLLVM_PASS_OBFUSCATE_FORCE__"); }
    // RUSTFLAGS="-C target-feature=+crt-static -Z llvm-plugins=ollvm_pass.so
    //   -C passes=rp,rl,cff,bbs,is,bbs,cff,is"
    // RUST_MIN_STACK=16777216 cargo +nightly build --release
    //   --target x86_64-unknown-linux-gnu -Z build-std=std,panic_abort,core,alloc

    if seed() == u128::from_str(ss!("123456789")).unwrap() {
        println!("{}", s2!("bugku{???}"));  // 类似 obfstr 的编译期解密宏
    } else {
        println!("{}", ss!("zako ~"));
        panic!("You can't see me");
    }
}
```

**编译参数解析：**

| 参数 | 说明 |
|---|---|
| `-C target-feature=+crt-static` | 强制静态链接，包含完整 Rust 标准库 |
| `-Z llvm-plugins=ollvm_pass.so` | 加载 OLLVM 混淆插件 |
| `-C passes=rp,rl,cff,bbs,is,bbs,cff,is` | 多轮叠加混淆：控制流平坦化 (cff)、基本块分割 (bbs)、指令替换 (is) 等 |
| `-Z build-std=std,panic_abort,core,alloc` | 对 Rust 标准库本身一同进行混淆编译 |

**逻辑分析：**

程序核心为：若 `seed()`（一个 `u128` 随机值）等于常量 `123456789`，则解密并输出 flag；否则输出 `zako ~` 并 panic。正常运行下该条件几乎不可能成立。

**解题目标**：通过动态调试手段，在运行时找到真正参与比较的两个 128 位操作数所在内存，并将其中一个覆写为另一个的值，使等值判断成立，触发 flag 分支。

---

## 三、静态分析的局限性

将该文件载入 IDA 分析会遇到：

1. **控制流结构被破坏**：多轮 `cff`+`bbs` 将简单分支展开为状态机驱动的巨型 `switch`，反编译伪代码可读性极差。
2. **算术运算被替换（MBA）**：`is` Pass 用混合布尔算术等价替换基本运算，增加静态还原难度。
3. **字符串特征消失**：`ss!`/`s2!` 宏在编译期加密字符串，`"bugku{"`、`"123456789"`、`"zako ~"` 均不以明文存在，`strings`/IDA 字符串窗口均无法直接定位。

因此本题推荐采用**动态调试 + 数据流追踪**。

---

## 四、分析思路

混淆器可以任意变换控制流形态，但比较操作最终必须把两个操作数真实地载入寄存器/内存并执行比较指令。


1. **建立锚点**：以 `write` 系统调用为断点，确认程序进入失败分支的时刻，此时常量 `123456789` 已完成解析并驻留内存。
2. **穷举并筛选候选地址**：搜索该常量在内存中的**所有**副本，并逐一验证其相邻 8 字节（u128 高位）是否为 0，排除字节错位导致的伪匹配。
3. **对所有有效候选同时下条件观察点**：不预先猜测哪个是"最终比较位置"，而是重新运行程序，让每一次针对候选地址的读写都触发断点，借此重建常量在栈上完整的搬运路径。
4. **在反汇编层面直接定位真正的比较指令**：寻找形如 `xor a_lo,[mem_lo]` / `xor a_hi,[mem_hi]`（再 `or` 判断是否为 0）的 128 位相等比较展开模式，从指令语义上**严格确定**另一个操作数（即 `seed()` 返回值）的内存位置，而不是凭"数值看起来随机"来猜测。
5. **对被比较指令即将读取的操作数打补丁**，让两次异或结果均为 0，等值判断成立，`continue` 后观察 flag 输出，形成完整闭合的因果证据链。

---

## 五、GDB 动态调试过程

调试环境：GDB + pwndbg 插件。

### Step 1：拦截 `write` 系统调用，建立分析锚点

```text
pwndbg> start
pwndbg> catch syscall write
pwndbg> c
```

命中：

```
Thread 1 "Whereistheflag" hit Catchpoint 1 (call to syscall write), 0x00007ffff7dc40be in ?? ()
*RDI  1
*RSI  0x555555556b50 ◂— 0xa7e206f6b617a  /* 'zako ~\n' */
*RDX  7
```

确认此刻程序正准备输出 `zako ~`，比较已经完成、常量 `123456789` 已在内存中。



### Step 2：搜索常量的全部副本，并逐一验证 u128 高位

```text
pwndbg> search -t qword 0x00000000075bcd15
Searching for an 8-byte integer: b'\x15\xcd[\x07\x00\x00\x00\x00'
[stack]  0x7fffffffbc70 0x75bcd15
[stack]  0x7fffffffbcb0 0x75bcd15
[stack]  0x7fffffffbd10 0x75bcd15
[stack]  0x7fffffffbe68 0x75bcd15
```

本次共搜到 **4 处**副本。

对每个候选地址的高 8 字节做检查，验证是否满足 `u128(123456789)` 应有的"高位为 0"布局：

```text
pwndbg> x 0x7fffffffbc78
0x7fffffffbc78: 0x00000000     ✔ 符合
pwndbg> x 0x7fffffffbcb8
0x7fffffffbcb8: 0x00000000     ✔ 符合
pwndbg> x 0x7fffffffbd18
0x7fffffffbd18: 0x00000000     ✔ 符合
pwndbg> x 0x7fffffffbe70
0x7fffffffbe70: 0x3df952bc     ✘ 非零
```

**结论**：`0x7fffffffbc70`、`0x7fffffffbcb0`、`0x7fffffffbd10` 三处符合 u128 布局，纳入观察；`0x7fffffffbe68` 高位非零，予以排除。

### Step 3：对所有有效候选同时设置条件访问断点

```text
pwndbg> awatch *0x7fffffffbc70 if *(long long *)0x7fffffffbc70 == 123456789
Hardware access (read/write) watchpoint 2
pwndbg> awatch *0x7fffffffbcb0 if *(long long *)0x7fffffffbcb0 == 123456789
Hardware access (read/write) watchpoint 4
pwndbg> awatch *0x7fffffffbd10 if *(long long *)0x7fffffffbd10 == 123456789
Hardware access (read/write) watchpoint 5
pwndbg> i b
Num  Type            Disp Enb Address           What
2    acc watchpoint  keep y                     *0x7fffffffbc70
      stop only if *(long long *)0x7fffffffbc70 == 123456789
4    acc watchpoint  keep y                     *0x7fffffffbcb0
      stop only if *(long long *)0x7fffffffbcb0 == 123456789
5    acc watchpoint  keep y                     *0x7fffffffbd10
      stop only if *(long long *)0x7fffffffbd10 == 123456789
```

删除原先的 `catch syscall write` 断点，重新运行：

```text
pwndbg> d 1
pwndbg> r
```

### Step 4：追踪常量的完整搬运路径

**第一次命中**（`bd10`）：

```
Thread 1 hit Hardware access (read/write) watchpoint 5: *0x7fffffffbd10
Old value = 12345678
New value = 123456789
► 0x7ffff70b46b9  mov  qword ptr [rdi + 8], rsi     ; [0x7fffffffbd18] <= 0
```

反汇编显示这是把已经解析好的 `123456789`（低 64 位）连同高位 `0` 一起写入 `bd10/bd18`，随后立即又拷贝到 `bcb0/bcb8`：

```
0x7ffff70b46bd  mov  rdi, [rbp-0x90]        ; rdi = 0x7fffffffbcb0
0x7ffff70b46c4  mov  qword ptr [rdi], rax   ; [bcb0] <= 0x75bcd15
0x7ffff70b46c7  mov  qword ptr [rdi+8], rsi ; [bcb8] <= 0
```

**第二次命中**（`bcb0`，写）：

```
Thread 1 hit watchpoint 4: *0x7fffffffbcb0
Old value = 12345678
New value = 123456789
```

**第三次命中**（`bcb0`，读）：

```
Thread 1 hit watchpoint 4: *0x7fffffffbcb0
Value = 123456789
► 0x7ffff70b5aa3  mov  rax, [rax+8]
   0x7ffff70b5ab1  mov  qword ptr [rbp-0x2b8], rdx   ; [be68] <= 0x75bcd15  (印证 Step2 中排除的 be68 只是又一次冗余拷贝)
   0x7ffff70b5ab8  mov  rcx, [rbp-0x80]              ; rcx = 0x7fffffffbc70
   0x7ffff70b5abc  mov  qword ptr [rcx], rdx         ; [bc70] <= 0x75bcd15
```

可以看到常量继续被拷贝到 `bc70`。

**第四次命中**（`bc70`，写）：

```
Thread 1 hit watchpoint 2: *0x7fffffffbc70
Old value = 12345678
New value = 123456789
```

**第五次命中**（`bc70`，读）——**关键的比较指令出现**：

```
Thread 1 hit watchpoint 2: *0x7fffffffbc70
Value = 123456789
► 0x7ffff70b53c2   xor  r15, qword ptr [rbp - 0x208]
   0x7ffff70b53c9   mov  qword ptr [rbp - 0x40], r11
   0x7ffff70b53cd   mov  qword ptr [rbp - 0x58], r10
   0x7ffff70b53d1   mov  r12, qword ptr [rax + 8]
   0x7ffff70b53d5   xor  r12, qword ptr [rbp - 0x200]
   0x7ffff70b53dc   mov  rdi, [rbp - 0x168]
   ...
```

寄存器现场：

```
RAX = 0x7fffffffbc70 ◂— 0x75bcd15
R15 = 0xc58b76a55e5deea7  ; = 0x75bcd15 ^ [rbp-0x208]
R12（xor 之前）= [rax+8] = 0                ; 常量高 64 位
```

### Step 5：确认这是真正的 128 位相等比较

这两条指令构成典型的 **u128 相等比较展开**：

```
low_diff  = const_lo XOR [rbp-0x208]
high_diff = const_hi XOR [rbp-0x200]
equal     = (low_diff OR high_diff) == 0        （紧随其后的分支/cmove 据此选择结果）
```

由此**从指令语义上推导**：

- `[rbp-0x208]` 就是 `seed()` 返回值的**低 64 位**；
- `[rbp-0x200]` 就是 `seed()` 返回值的**高 64 位**。


### Step 6：对真正的比较操作数打补丁

在这两条 `xor` 指令**即将执行、尚未破坏原始值**的这一时刻（当前 RIP 正停在第一条 `xor` 上，尚未执行），直接修改被比较的操作数：

```text
pwndbg> set {long long}($rbp - 0x208) = 0x75bcd15
pwndbg> set {long long}($rbp - 0x200) = 0
pwndbg> c
```

修改后两条 `xor` 的结果均变为 `0`，后续的 `or`/条件跳转判定为"相等"，程序进入 `s2!` 解密并打印分支：

```
Continuing.
bugku{7b476efc-1f1b-4c01-b8f9-d664d12ca75f}
[Inferior 1 (process 25241) exited normally]
```


---
