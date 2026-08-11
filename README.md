# Shadowrocket Config Tuning

本地工作区：最终产品 + 历史归档 + 进度交接。  
远程分发：GitHub `Veitkwok/Personal-config`。

---

## 目录结构

```text
shadowrocket-config-tuning/
├── README.md                 ← 本文件（新会话先读）
├── vps-routing.conf          ← 最终产品（与 GitHub main 同步）
└── archive/                  ← 旧 conf / 旧交接 / 模块副本（只读参考）
```

| 路径 | 角色 |
|------|------|
| **`vps-routing.conf`** | **唯一主配置**；改规则只动这个（或先改本地再 push） |
| `archive/` | 历史实验，勿当现用配置 |
| GitHub | https://github.com/Veitkwok/Personal-config |
| raw 安装 URL | `https://raw.githubusercontent.com/Veitkwok/Personal-config/main/vps-routing.conf` |

**约定**：改 conf 尽量说明增删哪几行；公开仓勿写节点密码、MITM `ca-p12`、私人 DERP IP。

---

## 当前产品状态（vps-routing，约 2026-08-07）

### 已具备

- 英文策略组：`HK` / `US` / `Screens` / `Proxy` / `PROXY` / `Failsafe` / `AI` / `Social` / `Mail` / `Google` / `Apple` / `Microsoft` / `China` / YouTube 等  
- 国内优先 DNS + fallback DoH`#proxy`（修国内 App 慢）  
- `include` Johnshall **`sr_ad_only`**（广告，主 conf 优先于 include）  
- Mail 抢先规则（Gmail/Outlook 统一 `Mail`，默认 US）  
- LinkedIn / Social 防 GEOIP,CN 误直连  
- **无** `[MITM]`、**无**私人 DERP/Host 钉 IP、**无** `TAILSCALE` 策略  
- `100.64/10` + `tailscale.com`/`ts.net` → **DIRECT**（给**官方** Tailscale 腾路）  
- `tun-excluded` **不含** `100.64`（保护 Mac）  
- `PROXY` 别名：兼容 Apns 等模块  

### 设备用法（已定）

| 设备 | 代理 | Tailscale |
|------|------|-----------|
| **iPhone** | Shadowrocket + 本 conf | **关** SR 内置 TS；要 SSH 用**官方 TS App**（与 SR 二选一） |
| **Air / mini** | SR 或 Clash Verge TUN | **官方 Tailscale 客户端**；私人 DERP 在 TS 控制台 derpMap（建议节点写 `IPv4`） |

### 隧道 UI 备忘

- CarPlay：`包括本地网络` / `包括所有网络` 建议关  
- APNs：靠本机 **Apns.module**（`archive/Apns.module` 有副本），策略名 `PROXY`  

---

## 已踩坑（新会话不要重蹈）

1. **DNS 全 CF#proxy** → 国内 App 慢；已改为国内优先。  
2. **LinkedIn** → 国内 DNS + GEOIP,CN 误直连；需在 GEOIP 前强制代理。  
3. **Mail 反复登录** → 出口不统一 / MITM 解密邮件域；Mail 组 + 证书模块排除。  
4. **MITM 与云更新** → 证书放**证书模块**，勿进 conf。  
5. **iPhone SR 内置 Tailscale** → 跨网 magicsock 失败、曾拖垮 X；**已放弃**该路径。  
6. **Fake-IP `198.18.x`** → Clash/SR 都会劫持 `derp` 域名；私人 DERP 应 **derpMap 写 IPv4**，勿依赖 conf Host。  
7. **Mac `tun-excluded` 含 100.64** → 易生成错误静态路由；conf **禁止**。  
8. **大 include / 模块 MITM YouTube** → 可能影响启动与 YT；X/Grok 日志曾见 **UDP/QUIC port unreachable**。  

---

## 未解决 / 待调优（优先级）

> **用户明确：X、Grok、YouTube 必须稳定、优先于其它花活。**

| 优先级 | 项 | 状态 / 线索 |
|--------|-----|-------------|
| **P0** | **X / Grok / YouTube 体验** | 2026-08-07 log：TCP→US-Veit 能连，但 Grok **UDP 443 relay → ICMP port unreachable**（QUIC 可能被掐）；MITM 名单含 youtube/googlevideo；部分 Google 附属流量走 Screens |
| P1 | 广告 include 体积/编译 | `sr_ad_only` 很大；首次更新可能慢；是否与稳定性冲突待观察 |
| P1 | 策略组 UI 出口统一 | 确认 AI/Social/YouTube/US/Failsafe 实际选中节点（log 里 grok/twitter 显示 US，与组名 Social/AI 可能不一致） |
| P2 | 节点 UDP 转发 | Reality/VLESS 是否开 UDP，影响 QUIC |
| P2 | 私人 DERP | 控制台 derpMap + `IPv4`；与 conf 脱钩 |
| — | iPhone SSH mini | **已放弃**（非刚需） |

### 下次动 conf 前建议

1. 再抓一份「只开 X 或 Grok 刷不出」时的 PacketTunnel log。  
2. 临时关掉 YouTube/MITM 相关模块做二分。  
3. 确认节点 UDP；必要时对 X/Grok/YT 做**显式靠前规则 + 固定 US 出口**（RULE-SET 或 DOMAIN 均可，以稳为准）。  

**改规则约定**：只说明增删行，勿整文件覆盖（保留本机 MITM 模块与本地习惯）。

---

## 新会话开场（可复制）

```text
继续 Shadowrocket 配置调优。
工作区：/Users/veitkwok/Documents/00_Projects/shadowrocket-config-tuning
主配置：vps-routing.conf（GitHub Personal-config 同步）
先读：本目录 README.md
重点：X / Grok / YouTube 必须稳定；iPhone 不用 SR 内置 TS；改 conf 只给 diff、勿整文件覆盖 MITM。
```

---

## archive 里有什么（简表）

| 文件 | 用途 |
|------|------|
| `VPS-HK-US_*.conf` / `VPS_old` / `VPS-optimized` / `default.conf` | 历史 conf |
| `SESSION-Shadowrocket-配置.md` / `SESSION-Tailscale-DERP.md` | 更早交接（部分过时，以本 README 为准） |
| `Apns.module` | APNs 模块副本 |

---

## Git 溯源

```text
https://github.com/Veitkwok/Personal-config/commits/main/vps-routing.conf
```

每次 push 可看增删行；回退用 commit history。
