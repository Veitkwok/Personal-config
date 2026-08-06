# Personal-config · Shadowrocket 分流配置

面向 **iOS / macOS Shadowrocket** 的可分发分流配置。  
**主配置：`vps-routing.conf`**

> 不含节点订阅、密码、MITM 证书、私人 DERP/IP。  
> 每次改动都通过 **Git 提交** 记录，可在 GitHub 上查看历史与 diff（见文末）。

---

## 快速开始

```text
https://raw.githubusercontent.com/Veitkwok/Personal-config/main/vps-routing.conf
```

1. Shadowrocket → **配置** → **+** → 粘贴上述 URL → 下载  
2. 勾选使用；**全局路由 = 配置**；延迟测试建议 **CONNECT**  
3. 首页用**订阅**添加节点（节点名建议含 `HK`/`香港`、`US`/`美国` 等）  
4. 以后改 GitHub 后，在 conf 上点 **更新配置** 即可  

首次加载会拉取 **Johnshall 广告库（include）**，编译可能稍慢，属正常。

---

## 当前设计要点（2026-08-07）

| 项目 | 说明 |
|------|------|
| 广告 | `[General] include = …/sr_ad_only.conf`（主配置优先于 include） |
| Tailscale | **不**使用 SR 内置 TS 策略；`100.64/10` + `tailscale.com`/`ts.net` → **DIRECT**，配合 **官方 Tailscale 客户端** |
| 私人 DERP | **不写进 conf**；在 Tailscale 控制台 derpMap 配置（建议节点带 `IPv4`） |
| 隐私 | 无个人 VPS IP、无私人域名 Host |
| 模块 | 证书模块 / Apns 等本机安装；提供 `PROXY` 组名兼容 |
| DNS | 国内优先，海外 DoH 仅 fallback`#proxy`，利于国内 App + Reality 节点 |

### 策略组（英文）

`HK` / `US` / `Screens` / `Proxy` / `PROXY` / `Failsafe` / `AI` / `Social` / `Mail` / `Google` / `Apple` / `Microsoft` / `China` / YouTube / Telegram / Netflix / Spotify / PayPal  

- **Failsafe**：未匹配流量兜底（可选手动改 DIRECT）  
- **Screens**：节点名含 Screens 时才有成员；没有则组为空，无妨  

### iPhone 建议

- 本 conf 作**代理分流**即可  
- **关闭** Shadowrocket 设置里的 **Tailscale 集成**（内置 TS 在 iOS 上不稳定，且可能影响其它 App）  
- 若需要 SSH 到 tailnet：关 SR，用**官方 Tailscale App**（与 SR 二选一）  

### macOS（Air / mini）建议

- **Shadowrocket（或 Clash）管代理** + **官方 Tailscale 管 100.x**  
- conf **不会**把 `100.64.0.0/10` 放进 `tun-excluded-routes`（避免 Mac 路由踩坑）  
- 私人 DERP 用控制台 derpMap，不依赖本 conf 域名  

---

## 仓库文件

| 文件 | 说明 |
|------|------|
| **`vps-routing.conf`** | **当前主配置** |
| `README.md` | 本说明 |
| `VPS-HK-US.conf` / `VPS.conf` | 历史文件，勿作主用 |

---

## GitHub 是否可溯源？有没有历史版本？

**有。** 本仓库用 **Git**，每次 `push` 都是一条 **commit（提交）**。

| 能力 | 怎么看 |
|------|--------|
| 历史列表 | 打开仓库 → **Commits**（提交记录） |
| 某次改了什么 | 点进某条 commit → 看 **绿色增行 / 红色删行**（diff） |
| 对比两个版本 | 任意两个 commit 可 diff；或看文件历史 **History** / **Blame** |
| 回退 | 可 checkout 旧 commit、revert 某次提交，或在网页看旧文件内容后恢复 |

例如主配置的提交页（仓库 Commits 里点开即可）：

```text
https://github.com/Veitkwok/Personal-config/commits/main/vps-routing.conf
```

整仓提交历史：

```text
https://github.com/Veitkwok/Personal-config/commits/main
```

本地也可用：

```bash
git log --oneline -- vps-routing.conf
git show HEAD:vps-routing.conf          # 某版本全文
git diff HEAD~1 HEAD -- vps-routing.conf  # 最近一次相对上一次的增减
```

**注意：** 只有 **push 进 GitHub 的改动** 才有云端记录；只改手机本地、未推送的，仓库里看不到。

---

## 使用与更新注意

1. 必须用 **URL 添加** conf，才会有「更新配置」。  
2. **更新会覆盖**该 conf 内本机手改 → 长期修改请改 GitHub 再更新。  
3. **模块 / 证书** 不在 conf 里，更新 conf **不会**自动删证书模块参数。  
4. include 的广告库随 Johnshall **每日构建**；主 conf 逻辑仍以本仓库为准。  

---

## 许可与免责

个人/朋友自用分流模板。第三方规则版权归原作者。请遵守当地法律。
