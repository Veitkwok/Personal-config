# Personal-config · Shadowrocket 个人分流配置

面向 **iOS / macOS Shadowrocket** 的自用配置仓库。  
当前**主配置**为 **`vps-routing.conf`**（英文策略组 + 远程 RULE-SET + 国内优先 DNS）。

> 本仓库**不含**节点订阅、密码、MITM 证书私钥。节点请在 App 首页订阅添加；HTTPS 解密请用本机「证书模块」。

---

## 目录

- [快速开始](#快速开始)
- [为什么做这一套（思路演进）](#为什么做这一套思路演进)
- [仓库文件说明](#仓库文件说明)
- [主配置 vps-routing 设计](#主配置-vps-routing-设计)
- [策略组一览（全英文）](#策略组一览全英文)
- [规则匹配顺序](#规则匹配顺序)
- [去广告如何集成](#去广告如何集成)
- [MITM / 证书模块（iOS）](#mitm--证书模块ios)
- [APNs 境外推送模块](#apns-境外推送模块)
- [Tailscale](#tailscale)
- [CarPlay 与隧道设置](#carplay-与隧道设置)
- [日常更新流程](#日常更新流程)
- [已知取舍与注意事项](#已知取舍与注意事项)
- [许可与免责](#许可与免责)

---

## 快速开始

### 1. 添加远程配置

在 Shadowrocket：

1. **配置** → 右上角 **+**
2. URL 填写（`main` 分支 raw）：

```text
https://raw.githubusercontent.com/Veitkwok/Personal-config/main/vps-routing.conf
```

3. 下载并勾选使用  
4. 首页 **全局路由** 选 **配置**  
5. **设置 → 延迟测试方法** 建议 **CONNECT**

### 2. 节点

- 首页添加你的订阅（节点名建议含 `HK`/`香港`、`US`/`美国`、`Screens` 等，以便自动进组）
- 本 conf **不写**服务器地址与密码

### 3. 建议一并启用的本机项（不在本仓库）

| 项目 | 平台 | 作用 |
|------|------|------|
| **证书模块**（LOWERTOP CA 等） | iOS 需要解密时 | 换/更新 conf 不用重装系统 CA |
| **Apns.module** | iOS 国内收境外 App 推送 | 强制推送相关流量走代理 |
| **Johnshall `sr_ad_only`**（可选） | 两端 | UI「包含配置」叠加更全广告库 |

---

## 为什么做这一套（思路演进）

下面按「踩过的坑 → 对策」说明，也是本配置存在的原因。

### 1）国内 App 慢（B 站 / 小红书 / 支付宝等）

- **根因**：规则虽是 DIRECT，但 DNS 全走 `Cloudflare DoH #proxy`，解析到海外 CDN 再直连 → 极慢。  
- **对策**：主 DNS **国内优先**（阿里 / 腾讯 DoH + `223.5.5.5` 等），`dns-direct-system = true`；海外 DoH 仅作 **fallback 且 `#proxy`**。  
- **取舍**：直连域名解析可能被运营商/国内 DoH 看到，**不保证** DNS 泄漏检测全绿；旧方案「全 CF#proxy」更藏解析、国内更卡。

### 2）LinkedIn 等「国际 App 被 GEOIP,CN 误直连」

- **根因**：国内 DNS 把域名解析到 Azure 中国等 CN IP → 命中 `GEOIP,CN,DIRECT`，内容刷不出。  
- **对策**：在 `GEOIP,CN` **之前**用 RULE-SET / 域名把 LinkedIn、主要社媒等送进 **Social**（代理侧）。  
- **延伸**：Instagram、Discord、Reddit、TikTok、Facebook、X 等同理预置，减少同类事故。

### 3）iOS 邮件 Inactive / 反复登录

- **根因倾向**：Gmail 与 Outlook 出口不固定，或 MITM 解密邮件域。  
- **对策**：  
  - 策略组 **Mail**（默认 US），Gmail + Outlook **同一出口**；  
  - 邮件相关域名写在 **Google / Microsoft 大表之前**；  
  - iOS 用证书模块 **排除** gmail/outlook/microsoftonline 等主机名解密；  
  - conf **不写** `ca-p12`。

### 4）配置云端更新 vs MITM 证书

- MITM CA 挂在 conf 上时，远程「更新配置」容易弄丢/换证 → 反复装描述文件。  
- **对策**：证书进 **模块（编辑参数）**；GitHub 只放分流 conf。模块优先级高于 conf。

### 5）RULE-SET 优先，而不是手写几百行 DOMAIN

- 旧 `VPS-optimized` / 大表风格难维护。  
- **对策**：业务尽量 `blackmatrix7` 等 **远程 RULE-SET**；只保留必须抢在大表前的少量 DOMAIN（Mail、Grok、Perplexity 等）。

### 6）港 / 美 / 自建备用 VPS + 漏网兜底

- 地区池：**HK**、**US**、**Screens**（节点名含 Screens 的备用美区 VPS）。  
- **Proxy**：手动在三区之间选。  
- **Failsafe**（原「漏网之鱼」）：`FINAL` 指向可选手动组（Proxy / 某区 / DIRECT），避免未匹配流量写死无法改。

### 7）去广告双层

- **主 conf 内**：`Advertising.list → REJECT`（随 conf 更新）。  
- **可选加强**：Johnshall **仅广告** `sr_ad_only` 用「包含配置」叠上（不替代主分流，避免 `sr_cnip_ad` 整包抢 FINAL）。

### 8）iOS / macOS 同一份 conf

- iOS：Shadowrocket + 证书模块 +（可选）APNs 模块 + 内置 Tailscale。  
- macOS：可不解密；重度 TUN+TS 远程仍可用 Clash Verge TUN；**禁止** `tun-excluded` 写 `100.64/10`。

### 9）CarPlay 有线黑屏

- 多与 **隧道把车机链路卷进 VPN** 有关，不是加 DOMAIN 能根治。  
- 实车优先：关「包括所有网络 / 包括本地网络」；仍不稳则 **开车关 VPN**（可用快捷指令自动化）。

---

## 仓库文件说明

| 文件 | 状态 | 说明 |
|------|------|------|
| **`vps-routing.conf`** | **主用** | 当前推荐；英文组名；RULE-SET；无 MITM |
| `VPS-HK-US.conf` | 历史 | 早期港美分组草稿，可忽略 |
| `VPS.conf` | 历史 | 更旧大表/DNS 方案，**不建议**新设备再用 |
| `README.md` | 文档 | 本说明（中文） |

远程主配置地址：

```text
https://raw.githubusercontent.com/Veitkwok/Personal-config/main/vps-routing.conf
```

---

## 主配置 vps-routing 设计

### General（摘要）

- **DNS**：国内主 DNS + 海外 fallback`#proxy`  
- **dns-direct-system**：true（DIRECT 用系统/国内解析）  
- **tun-excluded-routes**：**不含** `100.64.0.0/10`（避免 Mac 上 TS/Termius 被错误静态路由坑）  
- **无 `[MITM]`**、无节点  
- **include**：默认注释；广告加强建议用 UI「包含配置」

### 英文命名对照（相对旧中文组）

| 旧习惯 | 现组名 |
|--------|--------|
| 香港 | **HK** |
| 美国 | **US** |
| 代理 | **Proxy** |
| 漏网之鱼 | **Failsafe** |
| 邮件 | **Mail** |
| 谷歌/苹果/微软服务 | **Google** / **Apple** / **Microsoft** |
| （新增）社媒 | **Social** |
| （新增）国内应用 | **China**（默认 DIRECT，可临时改代理） |
| （新增）备用 VPS 池 | **Screens** |
| 模块常用大写 PROXY | **PROXY**（别名 → Proxy，兼容 Apns 等模块） |

---

## 策略组一览（全英文）

| 组名 | 类型 | 默认倾向 | 用途 |
|------|------|----------|------|
| **HK** | url-test | 测速 | 节点名匹配港/HK… |
| **US** | url-test | 测速 | 节点名匹配美/US… |
| **Screens** | url-test | 测速 | 节点名匹配 Screens（自建备用美区） |
| **Proxy** | select | HK→… | 手动选区 |
| **PROXY** | select | → Proxy | 兼容模块写死的 `PROXY` |
| **Failsafe** | select | Proxy | **FINAL** 兜底，可改 DIRECT |
| **AI** | select | US | Grok/xAI、OpenAI、Claude、Gemini、Perplexity/Comet |
| **Social** | select | US | X、IG、Reddit、Discord、LinkedIn、FB、TikTok |
| **Mail** | select | US | Gmail + Outlook 统一出口 |
| **Google** | select | HK | 谷歌大表（邮件域名已先被 Mail 抢走） |
| **Apple** | select | DIRECT | 苹果服务 |
| **Microsoft** | select | DIRECT | 微软 + Teams 补强 |
| **China** | select | DIRECT | 国内常用 App RULE-SET |
| YouTube / Telegram / Netflix / Spotify / PayPal | select | 见 conf | 垂直业务 |

节点名不含关键词时：改 `policy-regex-filter`，或给节点备注加上 `HK` / `US` / `Screens`。

---

## 规则匹配顺序

**先匹配先生效**（简化）：

1. Tailscale（`100.64/10`、`ts.net`）+ 局域网 → DIRECT  
2. **广告** blackmatrix7 `Advertising` → REJECT  
3. **Mail** 域名（在 Google/Microsoft 大表前）  
4. **AI**（含 x.ai / grok / perplexity）  
5. **Social**（含 LinkedIn 防 GEOIP 误伤）  
6. YouTube / Telegram / Google / GitHub / 流媒体等  
7. Apple / Microsoft（+ Teams 域名）  
8. **China** 国内 RULE-SET + 少量补强域名  
9. 银行等敏感 → 强制 DIRECT  
10. Apple 中国辅助 / gdmf 等  
11. China 大表 + `cn` + **GEOIP,CN**  
12. **FINAL,Failsafe**

---

## 去广告如何集成

### A. 已写入主配置（随 conf 更新）

```text
RULE-SET,…/Advertising/Advertising.list,REJECT
```

- 策略 **REJECT**，不改变你的港美/FINAL 逻辑。  
- 列表含少量 URL-REGEX，手册写「建议 MITM」；**无解密时域名类仍生效**，URL 级广告可能弱一些。  
- 误杀时可改 `AdvertisingLite` 或暂时注释该行（需改仓库后更新）。

### B. 可选：Johnshall 仅广告（你本地 UI 包含）

**推荐文件（只做广告，配合其他规则）：**

```text
https://raw.githubusercontent.com/Johnshall/Shadowrocket-ADBlock-Rules-Forever/release/sr_ad_only.conf
```

或：

```text
https://johnshall.github.io/Shadowrocket-ADBlock-Rules-Forever/sr_ad_only.conf
```

操作：**配置 → 当前 conf 的 ⓘ → 通用 → 包含配置**，添加上述 URL。

| Johnshall 类型 | 是否适合当「附加 include」 |
|----------------|----------------------------|
| **`sr_ad_only`** | **适合**（仅 REJECT 广告） |
| `sr_cnip_ad` / 黑白名单整包 | **不适合** 叠在本主配置上（自带国内外 + FINAL，和 Failsafe/Mail 抢逻辑） |

主配置优先级 **高于** 被包含配置（Shadowrocket 语义），因此业务分流仍以 `vps-routing` 为准。

### C. 不使用「去广告模块」

广告走 **远程规则日更**（blackmatrix7 + 可选 Johnshall），不依赖脚本模块；与证书模块分离。

---

## MITM / 证书模块（iOS）

1. 用 LOWERTOP 等 **证书模块**，在 **编辑参数** 填入本机已信任 CA 的 `ca-p12` 与密码。  
2. 邮件相关 hostname 用 **排除**（`-*.gmail.com` 等），减轻 Mail 重登。  
3. **切勿**把 `ca-p12` 提交到本仓库（public）。  
4. macOS 若不需要解密，可不装证书模块。

---

## APNs 境外推送模块

国内网络下，境外 App 推送常需走代理。使用类似：

- 模块：`Apns.module`（规则里策略名为 **`PROXY`**）  
- 主配置已提供 **`PROXY` → Proxy** 别名，避免策略名对不上。

模块规则优先级高于 conf，可压过「Apple 默认 DIRECT / 17/8 DIRECT」对推送的影响。

装完后按模块说明：**开关飞行模式** 等；隧道「包括 APNs」可开可关，以实机推送为准。

---

## Tailscale

| 做法 | 说明 |
|------|------|
| conf 规则 | `100.64.0.0/10` + `*.ts.net` → **TAILSCALE**（iOS 内置 TS 出口，勿用 DIRECT） |
| 自建 DERP | `derp-cn.klaasje.dpdns.org` + `tailscale.com` → **DIRECT**（底层中继勿走 VLESS） |
| **禁止** | `tun-excluded-routes` 写入 `100.64.0.0/10`（Mac 上易导致 100.64 指到家宽网关） |
| iOS | Shadowrocket 内置 Tailscale + 上表规则；出门 SSH mini 依赖 magicsock/DERP 900 |
| macOS | 官方 TS 客户端；远程 SSH 可用 Clash TUN 或 `ProxyCommand tailscale nc` |

**排障（iOS Termius → mini 失败时）**：PacketTunnel 若大量  
`wireguard packet could not be sent on magicsock path`，说明 **TS 底层发不出包**（不是 SSH 密码问题）。  
检查：DERP 900 存活、`OmitDefaultRegions` 时 derp 可达、conf 已更新并重连 VPN、Mac mini 在线且同 tailnet。

---

## CarPlay 与隧道设置

有线 CarPlay 黑屏、关 VPN 就好 → 多为 **隧道吸走手机↔车机本地链路**，不是再加几条 DOMAIN 能根治。

**Shadowrocket → 设置 → 隧道** 建议（保 CarPlay 时）：

| 选项 | 建议 |
|------|------|
| 强制路由 | 关 |
| 包括本地网络 | **关**（手册写明影响 CarPlay） |
| 包括所有网络 | **关**（过宽时仍易黑屏；你若只开此项仍可能挂） |
| 包括 APNs | 按需；推送可主要靠 Apns.module |
| 包括蜂窝服务 | 关 |

**和 APNs 的关系（简述）：**

- CarPlay = 本地车机链路；推送 = 出网到 Apple。  
- **不是**「开了 APNs 模块就不能 CarPlay」。  
- **「包括所有网络」** 更容易伤 CarPlay；与「要不要 Apns.module」不是同一件事。  
- 开车以稳定为准：**关 VPN**（或快捷指令：连上 CarPlay 关 VPN）完全可接受。

conf 头部有更长英文注释备查。

---

## 日常更新流程

1. 本仓库改 `vps-routing.conf` → `git push` 到 `main`  
2. 手机/Mac Shadowrocket：配置 → 该远程 conf → **更新配置**  
3. 前提：配置是用 **URL 添加** 的；纯本地粘贴导入则没有云端更新可点  

**更新会覆盖**该 conf 内本机改动 → 长期定制请改 GitHub 再更新，或用模块/包含配置承载「本机专用」项。

模块、包含配置、证书参数：**各自**更新，不随 conf 一次清掉（证书请放模块参数，不要放 conf）。

---

## 已知取舍与注意事项

1. **DNS 隐私 vs 国内速度**：已选国内优先 DNS。  
2. **Advertising 误杀**：观察日志 REJECT，必要时改 Lite 或注释。  
3. **Mail 里部分 `googleapis`/`accounts.google.com`**：为稳 Gmail 偏激进；若拖累其它 Google 功能可再收紧。  
4. **Screens 组为空**：检查节点备注是否含 `Screens`。  
5. **public 仓库**：禁止提交订阅 token、节点密码、`ca-p12`。  
6. **遵守当地法律**；配置仅供网络分流与学习研究。

---

## 许可与免责

个人自用配置备份。第三方 RULE-SET / 广告规则版权归原作者（blackmatrix7、Johnshall、LOWERTOP 文档等）。  
使用本仓库配置的一切后果由使用者自行承担。

---

## 变更摘要（相对早期 VPS.conf / 手写大表）

- [x] 国内优先 DNS + DIRECT 系统 DNS  
- [x] 港美 + Screens 分组；Proxy / Failsafe / PROXY 别名  
- [x] 全英文策略组与规则引用一致  
- [x] RULE-SET 为主（广告、社媒、AI、国内 App…）  
- [x] Mail 统一出口 + 抢先规则  
- [x] LinkedIn 等防 GEOIP 误直连  
- [x] Tailscale 友好（不 exclude 100.64）  
- [x] 无 MITM 进库；证书模块方案  
- [x] 双层去广告（主 conf + 可选 sr_ad_only include）  
- [x] APNs 模块兼容 PROXY  
- [x] CarPlay / 隧道说明写入 conf 头与本文  

有问题可在使用日志（策略名 / MITM / REJECT）对照本 README 排查。
