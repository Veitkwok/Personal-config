# vps-routing — Shadowrocket 分流配置说明

可分发的 Shadowrocket **规则模板**（不含节点密码、不含 MITM 证书、不含私人 DERP）。  
节点请用自己的订阅；本文件只负责 **DNS / 策略组 / 分流规则 / 广告 include**。

| 项 | 链接 |
|----|------|
| GitHub 仓库 | https://github.com/Veitkwok/Personal-config |
| **远程安装 URL（raw）** | https://raw.githubusercontent.com/Veitkwok/Personal-config/main/vps-routing.conf |
| 主配置文件 | [`vps-routing.conf`](./vps-routing.conf) |
| 提交历史（看增删） | https://github.com/Veitkwok/Personal-config/commits/main/vps-routing.conf |

> 调优进度、设备拓扑、踩坑结论等 **工作交接** 见本地 `SESSION-HANDOFF.md`（不入库）。

---

## 1. 安装与更新

### 1.1 通过 URL 添加（推荐）

1. Shadowrocket → **配置** → 右上角 **+** → **下载**（或「类型：URL」）。  
2. 粘贴：

```text
https://raw.githubusercontent.com/Veitkwok/Personal-config/main/vps-routing.conf
```

3. 下载完成后，点该配置右侧 **ⓘ** 或列表中选中 → **使用配置**。  
4. 首页打开 VPN；**全局路由** 选 **配置**（不要长期用「代理」全局，否则规则不生效）。  
5. 延迟测试建议用 **CONNECT**（与节点类型匹配即可）。

### 1.2 远程更新

- 仅当配置是 **通过 URL 添加** 时，才能用配置页的 **更新** 拉取 GitHub 最新版。  
- 本地手动导入的 conf **不会** 自动对应 raw 地址。

### 1.3 节点

- 本 conf 的 `[Proxy]` **为空**；请用 **首页订阅 / 自己的节点** 导入。  
- 策略组用 **节点名称正则** 归入 `HK` / `US` 池，请尽量让节点名带 `港`/`HK` 或 `美`/`US` 等关键字（见下文）。

### 1.4 与模块的关系

- **模块优先级高于本 conf**。  
- 本 conf **不含** `[MITM]`；HTTPS 解密请用本机 **证书模块**（见第 6 节）。  
- 更新远程 conf **不会** 清掉已安装的模块与系统信任证书。

---

## 2. 设计要点（读配置前）

| 主题 | 说明 |
|------|------|
| DNS | **国内优先**（系统 / 阿里 / DNSPod 等）；海外 DoH 仅作 **fallback 且 `#proxy`**，减轻国内 App 慢 |
| 广告 | `include` [Johnshall `sr_ad_only`](https://github.com/Johnshall/Shadowrocket-ADBlock-Rules-Forever)（见第 4 节） |
| 规则集 | 大量域名列表来自 [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script)（见第 5 节） |
| 区域池 | 仅 **HK**、**US** 两个 url-test 池（原 Screens 类美区节点名并入 US） |
| Apple | **AppStore**（默认港）/ **iCloud**（默认直连）/ **Apple**（其它，默认直连）拆分 |
| 邮件 | Gmail / Outlook 等 **抢在** Google、Microsoft 大规则集之前 → `Mail` |
| Tailscale | `100.64/10`、`ts.net`、`tailscale.com` 等 → **DIRECT**；`tun-excluded` **不含** `100.64`（避免 Mac 上搞坏官方 TS） |
| 兜底 | 未命中规则 → `Failsafe`（可选代理或直连） |
| 安全 | 公开仓禁止写入：节点密码、订阅 token、`ca-p12`、私人 DERP IP/域名 |

---

## 3. 策略组一览

### 3.1 区域池（自动测速）

| 组名 | 类型 | 节点名匹配（摘要） |
|------|------|-------------------|
| **HK** | url-test | `🇭🇰` `HK` `Hong` `香港` `港` … |
| **US** | url-test | `🇺🇸` `US` `美国` `美` … 以及 `Screens`/`Screen`（美区备用节点并入 US） |

测速 URL：`http://www.gstatic.com/generate_204`，间隔约 600s。

### 3.2 总控与兼容

| 组名 | 默认顺序 | 说明 |
|------|----------|------|
| **Proxy** | HK → US | 手动总代理（在港/美池中选） |
| **PROXY** | Proxy → HK → US | **全大写别名**，供模块写死策略名 `PROXY` 时使用（如 APNs 模块） |
| **Failsafe** | Proxy → HK → US → DIRECT | 最终兜底 |

### 3.3 业务策略组

| 组名 | 默认顺序（前项优先） | 典型流量 |
|------|----------------------|----------|
| **AI** | US → HK → Proxy | ChatGPT / Claude / Gemini / Grok / Perplexity 等 |
| **YouTube** | US → HK → Proxy | YouTube |
| **Telegram** | HK → US → Proxy | Telegram |
| **Social** | US → HK → Proxy | X/Twitter、LinkedIn、Instagram、Reddit、Discord、Facebook、**TikTok** 等 |
| **Google** | HK → US → Proxy | 其它 Google（邮件相关已尽量拆到 Mail） |
| **AppStore** | **HK** → US → Proxy | App Store 前台 + 装包 CDN（`mzstatic` / `cdn-apple`）+ TestFlight |
| **iCloud** | **DIRECT** → HK → US | iCloud / 家庭共享云盘等 |
| **Apple** | **DIRECT** → HK → US | 其它 Apple 服务兜底 |
| **Microsoft** | DIRECT → HK → US | Microsoft 系（部分邮件域已进 Mail） |
| **Spotify** | US → HK → DIRECT → Proxy | Spotify |
| **PayPal** | HK → US → DIRECT → Proxy | PayPal |
| **Netflix** | US → HK → Proxy | Netflix |
| **Mail** | US → HK → Proxy | Gmail / Outlook 等 |
| **China** | **DIRECT** → HK → US → Proxy | 国内 App / 小米 IoT 等 |

> 手机上可在 UI 里改组内选项（如 YouTube 固定某 US 节点）；仓库 conf 是 **模板默认顺序**，组内偏好可保留在本机。

### 3.4 `Proxy` 与 `PROXY`

Shadowrocket **区分大小写**。  
规则/模块写 `PROXY` 时，必须存在名为 **`PROXY`** 的组；本 conf 用它指向 `Proxy`，避免 APNs 等模块失效。日常手动切换出口改 **Proxy** 即可。

---

## 4. 去广告：Johnshall `sr_ad_only`

本 conf 通过 **include** 自动拉取（无需再单独加 Advertising 大规则集）：

```text
https://raw.githubusercontent.com/Johnshall/Shadowrocket-ADBlock-Rules-Forever/release/sr_ad_only.conf
```

| 项 | 说明 |
|----|------|
| 项目 | [Johnshall/Shadowrocket-ADBlock-Rules-Forever](https://github.com/Johnshall/Shadowrocket-ADBlock-Rules-Forever) |
| 内容 | **仅广告** 相关规则（`sr_ad_only`） |
| 优先级 | **主 conf 规则优先于 include** |
| 注意 | 体积较大，**首次编译/更新可能较慢**；留意 Shadowrocket 内存占用 |

YouTube 客户端去广告若还要用 **独立模块**，见第 6 节（与 include 广告规则互补，不是替代关系）。

---

## 5. 规则集来源（blackmatrix7 等）

### 5.1 主来源

- 仓库：[blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script)  
- 路径惯例：`rule/Shadowrocket/<Name>/<Name>.list`  
- 微信等个别列表使用 QuantumultX 路径下的兼容 list。

### 5.2 本 conf 引用的 RULE-SET（按用途）

| 策略 | 规则集（名称） |
|------|----------------|
| DIRECT | Lan |
| AI | OpenAI、Claude、Gemini（另有 iab0x00 `AI.txt` 与部分自建 DOMAIN） |
| Social | LinkedIn、Twitter、Instagram、Reddit、Discord、Facebook、**TikTok** |
| YouTube | YouTube |
| Telegram | Telegram |
| Google | Google |
| Proxy | GitHub、Twitch、Amazon |
| Spotify / PayPal / Netflix | 同名 list |
| AppStore | AppStore（并手写 `mzstatic.com`、`cdn-apple.com`、`testflight.apple.com`） |
| iCloud | iCloud |
| Apple | Apple |
| Microsoft | Microsoft |
| China | BiliBili、XiaoHongShu、DouYin、WeChat、**XiaoMi**、Baidu、Zhihu、NetEaseMusic、AliPay、China 等 |

Mail 段以 **手写 DOMAIN** 为主（Gmail/Outlook/OAuth 相关），保证排在 Google/Microsoft 大表之前。

完整 URL 以 [`vps-routing.conf`](./vps-routing.conf) 内 `RULE-SET,` 行为准。

---

## 6. 推荐本机模块（不写进 conf）

以下模块由作者 **自行在 Shadowrocket 安装**，**不会** 随 raw conf 自动下发。  
模块优先级 **高于** `vps-routing.conf`。

| 用途 | 说明 | 链接 |
|------|------|------|
| **证书模块** | HTTPS 解密（MITM）证书与主机范围；**私钥/证书勿写入公开 conf** | [LOWERTOP/Shadowrocket-First · 证书模块](https://github.com/LOWERTOP/Shadowrocket-First#%E8%AF%81%E4%B9%A6%E6%A8%A1%E5%9D%97) |
| **YouTube 去广告** | 客户端广告相关模块（`.sgmodule`） | https://yfamilys.com/module/YouTubeAd.sgmodule |
| **苹果 APNs 推送** | 国内收境外 App 推送；策略名需 **`PROXY`**（本 conf 已提供别名组） | [Apns.module](https://github.com/ttyyss2233/Tool/blob/main/shadowrocket/mokuai/Apns.module) · raw：`https://raw.githubusercontent.com/ttyyss2233/Tool/main/shadowrocket/mokuai/Apns.module` |
| **Apple WLOC 定位修改** | 定位 / WLOC 相关 | [Yu9191/wloc](https://github.com/Yu9191/wloc) |

### 6.1 安装提示

1. 配置 → **模块** → 添加 URL 或本地文件。  
2. APNs：安装后按模块说明操作（常见需开关飞行模式）；确认策略能匹配到 **`PROXY`**。  
3. 证书模块：按 LOWERTOP 说明安装并在系统中 **信任证书**；邮件等敏感域建议在模块中排除 MITM（避免反复登录）。  
4. YouTube 去广告模块若含 MITM/改写，与播放异常时可 **单独关闭** 做二分排查。

### 6.2 本仓库副本

`archive/Apns.module` 可能存有 APNs 模块副本，**以作者 GitHub/raw 为准**。

---

## 7. 使用建议（简表）

| 场景 | 建议 |
|------|------|
| 港区 App Store 更新慢 | 确认 **AppStore** 组走 **HK**（或优质港节点） |
| 国区 iCloud / 家庭云盘 | **iCloud** 保持 **DIRECT** 优先 |
| 米家远程卡顿 | **China** 保持 DIRECT；已含 XiaoMi 规则集 |
| 邮件偶发重登 | **Mail** 可改为固定单一 US 节点，避免 url-test 整池换 IP |
| iPhone + Tailscale | 建议 **官方 Tailscale App**；少用 SR 内置 TS 与代理长期同开 |
| CarPlay | 隧道「包括本地网络 / 包括所有网络」建议关 |
| 分享给朋友 | 只分享 raw conf；模块与证书各自安装，勿分享 `ca-p12` |

---

## 8. 仓库文件说明

```text
.
├── README.md              ← 本说明（安装与配置教程）
├── vps-routing.conf       ← 主配置（与 GitHub main 同步）
├── SESSION-HANDOFF.md     ← 本地工作交接（勿 push）
└── archive/               ← 旧 conf / 旧笔记 / 模块副本（参考用）
```

---

## 9. 免责声明

本配置仅供学习与个人网络调试。请遵守当地法律法规与各服务条款；节点与订阅由使用者自行准备与承担风险。
