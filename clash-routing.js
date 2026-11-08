// Clash Verge Rev 全局扩展脚本 —— 2026-11-08 版（clash-routing-1107）
// 贴到「订阅 → 全局扩展脚本」后生效。先备份旧脚本，再整体替换。
//
// 与前一版 clash-routing 的差异：
//   1) 默认出口改为 US：MATCH → 漏网之鱼 → US。HK 只负责速度类业务（网盘/开发/微软/电报/App Store）
//   2) 新增 US / HK-TCP / HK-UDP 三个池。注意：节点名本身就叫 HK，
//      组名若也叫 HK 会与节点自引用冲突，故用 HK-TCP
//   3) 新增 Social / Mail；组名统一为 Google / Dev / Microsoft / Telegram
//   4) sniffer 开 HTTP+TLS（QUIC 先注释）；fake-ip 补 orb.local 等
//   5) 广告规则(RULE-SET,reject)前移到 GEOSITE,CN 之前
//   6) UDP 443 拒绝从中间挪到 GEOIP,CN 之后，作为"送不走才拒绝"的兜底
//   7) udp 按协议设置：Hysteria2 / TUIC = true，VLESS+Vision = false
//   8) 修复 onedrive 规则集（jsdelivr 对 classical 路径间歇 403，改用 domain 版）
//   9) 删除无效的 GEOIP,LAN；删除 tld-not-cn（默认已 US，它只剩误伤）
//
// 不写 tun:（由 Verge 界面管）；不含节点密钥、不含私有地址。

const domesticNameservers = [
  "https://223.5.5.5/dns-query", // 阿里 DoH
  "https://doh.pub/dns-query" // 腾讯 DoH
];

const foreignNameservers = [
  "https://1.1.1.1/dns-query", // Cloudflare
  "https://8.8.8.8/dns-query" // Google
];

const dnsConfig = {
  "enable": true,
  "listen": "127.0.0.1:1053",
  "ipv6": false,
  "prefer-h3": false,
  "respect-rules": true,
  "use-system-hosts": false,
  "cache-algorithm": "arc",
  "enhanced-mode": "fake-ip",
  "fake-ip-range": "198.18.0.1/16",
  "fake-ip-filter": [
    "+.lan",
    "+.local",
    // OrbStack / Docker Desktop 本机域名，不该被 fake-ip
    "+.orb.local",
    "+.orb.internal",
    "host.orb.internal",
    "host.docker.internal",
    // Tailscale
    "+.ts.net",
    "+.tailscale.com",
    "+.tailscale.io",
    // 远程软件
    "+.rustdesk.com",
    // Windows 网络探测
    "+.msftconnecttest.com",
    "+.msftncsi.com",
    // QQ / 微信 快速登录检测
    "localhost.ptlogin2.qq.com",
    "localhost.sec.qq.com",
    "localhost.work.weixin.qq.com",
    // 反查与时间
    "+.in-addr.arpa",
    "+.ip6.arpa",
    "time.*.com",
    "time.*.gov",
    "pool.ntp.org"
  ],
  "default-nameserver": ["223.5.5.5", "119.29.29.29"],
  "nameserver": [...foreignNameservers],
  "proxy-server-nameserver": [...domesticNameservers],
  "direct-nameserver": [...domesticNameservers],
  "nameserver-policy": {
    "geosite:private,cn": domesticNameservers,
    "+.deepseek.com": domesticNameservers
  }
};

// 只嗅探 HTTP / TLS。QUIC 需要时再打开（见文件末尾说明）
const snifferConfig = {
  "enable": true,
  "force-dns-mapping": true,
  "parse-pure-ip": true,
  "override-destination": false,
  "sniff": {
    "HTTP": { "ports": [80, 8080, 8880] },
    "TLS": { "ports": [443, 8443] }
    // "QUIC": { "ports": [443, 8443] }
  }
};

const ruleProviderCommon = {
  "type": "http",
  "format": "yaml",
  "interval": 86400
};

const ruleProviders = {
  "reject": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
    "path": "./ruleset/clash-routing/reject.yaml"
  },
  "icloud": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt",
    "path": "./ruleset/clash-routing/icloud.yaml"
  },
  "apple": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt",
    "path": "./ruleset/clash-routing/apple.yaml"
  },
  "google": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt",
    "path": "./ruleset/clash-routing/google.yaml"
  },
  "proxy": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt",
    "path": "./ruleset/clash-routing/proxy.yaml"
  },
  "direct": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
    "path": "./ruleset/clash-routing/direct.yaml"
  },
  "private": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
    "path": "./ruleset/clash-routing/private.yaml"
  },
  "gfw": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
    "path": "./ruleset/clash-routing/gfw.yaml"
  },
  "telegramcidr": {
    ...ruleProviderCommon,
    "behavior": "ipcidr",
    "url": "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt",
    "path": "./ruleset/clash-routing/telegramcidr.yaml"
  },
  "cncidr": {
    ...ruleProviderCommon,
    "behavior": "ipcidr",
    "url": "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
    "path": "./ruleset/clash-routing/cncidr.yaml"
  },
  "lancidr": {
    ...ruleProviderCommon,
    "behavior": "ipcidr",
    "url": "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt",
    "path": "./ruleset/clash-routing/lancidr.yaml"
  },
  "applications": {
    ...ruleProviderCommon,
    "behavior": "classical",
    "url": "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
    "path": "./ruleset/clash-routing/applications.yaml"
  },
  "YouTube": {
    ...ruleProviderCommon,
    "behavior": "classical",
    "url": "https://fastly.jsdelivr.net/gh/xiaolin-007/clash@main/rule/YouTube.txt",
    "path": "./ruleset/clash-routing/YouTube.yaml"
  },
  "Spotify": {
    ...ruleProviderCommon,
    "behavior": "classical",
    "url": "https://fastly.jsdelivr.net/gh/xiaolin-007/clash@main/rule/Spotify.txt",
    "path": "./ruleset/clash-routing/Spotify.yaml"
  },
  "BilibiliHMT": {
    ...ruleProviderCommon,
    "behavior": "classical",
    "url": "https://fastly.jsdelivr.net/gh/xiaolin-007/clash@main/rule/BilibiliHMT.txt",
    "path": "./ruleset/clash-routing/BilibiliHMT.yaml"
  },
  "TikTok": {
    ...ruleProviderCommon,
    "behavior": "classical",
    "url": "https://fastly.jsdelivr.net/gh/xiaolin-007/clash@main/rule/TikTok.txt",
    "path": "./ruleset/clash-routing/TikTok.yaml"
  },
  "openai": {
    ...ruleProviderCommon,
    "behavior": "classical",
    "url": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/classical/openai.yaml",
    "path": "./ruleset/clash-routing/openai.yaml"
  },
  "xai": {
    ...ruleProviderCommon,
    "behavior": "classical",
    "url": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/classical/xai.yaml",
    "path": "./ruleset/clash-routing/xai.yaml"
  },
  "google-gemini": {
    ...ruleProviderCommon,
    "behavior": "classical",
    "url": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/classical/google-gemini.yaml",
    "path": "./ruleset/clash-routing/google-gemini.yaml"
  },
  "github": {
    ...ruleProviderCommon,
    "behavior": "classical",
    "url": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/classical/github.yaml",
    "path": "./ruleset/clash-routing/github.yaml"
  },
  "microsoft": {
    ...ruleProviderCommon,
    "behavior": "classical",
    "url": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/classical/microsoft.yaml",
    "path": "./ruleset/clash-routing/microsoft.yaml"
  },
  // OneDrive：jsdelivr 的 classical 路径间歇 403，改用 domain 版
  "onedrive": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/onedrive.yaml",
    "path": "./ruleset/clash-routing/onedrive.yaml"
  },
  // 社交：domain 版，体积比 classical 小很多
  "twitter": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/twitter.yaml",
    "path": "./ruleset/clash-routing/twitter.yaml"
  },
  "instagram": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/instagram.yaml",
    "path": "./ruleset/clash-routing/instagram.yaml"
  },
  "reddit": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/reddit.yaml",
    "path": "./ruleset/clash-routing/reddit.yaml"
  },
  "discord": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/discord.yaml",
    "path": "./ruleset/clash-routing/discord.yaml"
  },
  "facebook": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/facebook.yaml",
    "path": "./ruleset/clash-routing/facebook.yaml"
  },
  "linkedin": {
    ...ruleProviderCommon,
    "behavior": "domain",
    "url": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/linkedin.yaml",
    "path": "./ruleset/clash-routing/linkedin.yaml"
  }
};

const rules = [
  // ===== 1. 进程与网段：必须最前，保证直连不被抢走 =====
  "PROCESS-NAME,RustDesk,全局直连",
  "PROCESS-NAME,RustDesk.exe,全局直连",
  "PROCESS-NAME,UURemote,全局直连",
  "PROCESS-NAME,Tailscale,全局直连",
  "PROCESS-NAME,tailscaled,全局直连",
  "PROCESS-NAME,tailscale.exe,全局直连",
  "PROCESS-NAME,tailscaled.exe,全局直连",

  "IP-CIDR,100.64.0.0/10,全局直连,no-resolve",
  "IP-CIDR6,fd7a:115c:a1e0::/48,全局直连,no-resolve",

  // ===== 2. 显式直连：抢在国内名单之前 =====
  "DOMAIN-SUFFIX,deepseek.com,全局直连",
  "DOMAIN-SUFFIX,sharepoint.cn,全局直连",

  // ===== 3. 在国内名单里，但仍必须走代理 =====
  "DOMAIN-SUFFIX,googleapis.cn,Google",
  "DOMAIN-SUFFIX,gstatic.com,Google",
  "DOMAIN-SUFFIX,xn--ngstr-lra8j.com,Google",
  "DOMAIN-SUFFIX,github.io,节点选择",

  // ===== 4. 局域网 / 私有 / 广告 =====
  "RULE-SET,applications,全局直连",
  "RULE-SET,private,全局直连",
  "RULE-SET,reject,广告过滤",
  "RULE-SET,lancidr,全局直连,no-resolve",
  "GEOSITE,CN,全局直连",
  "RULE-SET,direct,全局直连",

  // ===== 5. 网盘：必须早于 Google / Microsoft 大名单 =====
  "RULE-SET,onedrive,Storage",
  "DOMAIN-SUFFIX,docs.google.com,Storage",
  "DOMAIN-SUFFIX,drive.google.com,Storage",
  "DOMAIN-SUFFIX,drive.usercontent.google.com,Storage",

  // ===== 6. 开发：npm 等必须早于 github 名单（后者含 npmjs.org） =====
  "DOMAIN-SUFFIX,npmjs.org,Dev",
  "DOMAIN-SUFFIX,npmjs.com,Dev",
  "DOMAIN-SUFFIX,yarnpkg.com,Dev",
  "DOMAIN-SUFFIX,pypi.org,Dev",
  "DOMAIN-SUFFIX,pythonhosted.org,Dev",
  "DOMAIN-SUFFIX,docker.io,Dev",
  "DOMAIN-SUFFIX,docker.com,Dev",
  "DOMAIN-SUFFIX,nodejs.org,Dev",
  "DOMAIN-SUFFIX,bun.sh,Dev",
  "DOMAIN-SUFFIX,bun.com,Dev",
  "DOMAIN-SUFFIX,astral.sh,Dev",
  "RULE-SET,github,节点选择",

  // ===== 7. AI：固定美国 =====
  "RULE-SET,openai,AI",
  "RULE-SET,xai,AI",
  "RULE-SET,google-gemini,AI",
  "DOMAIN-SUFFIX,muse.ai,AI",

  // ===== 8. 流媒体 / 通讯 =====
  "RULE-SET,YouTube,YouTube",
  "RULE-SET,Spotify,Spotify",
  "RULE-SET,TikTok,TikTok",
  "RULE-SET,BilibiliHMT,哔哩哔哩港澳台",
  "RULE-SET,telegramcidr,Telegram,no-resolve",

  // ===== 9. 苹果：App Store 短名单 → iCloud → 其余直连 =====
  "DOMAIN-SUFFIX,apps.apple.com,App Store",
  "DOMAIN-SUFFIX,itunes.apple.com,App Store",
  "DOMAIN-SUFFIX,mzstatic.com,App Store",
  "RULE-SET,icloud,iCloud",
  "RULE-SET,apple,全局直连",

  // ===== 10. 邮件：必须早于 Google / Microsoft 大名单 =====
  "DOMAIN-SUFFIX,gmail.com,Mail",
  "DOMAIN-SUFFIX,googlemail.com,Mail",
  "DOMAIN,mail.google.com,Mail",
  "DOMAIN,inbox.google.com,Mail",
  "DOMAIN,imap.gmail.com,Mail",
  "DOMAIN,smtp.gmail.com,Mail",
  "DOMAIN,pop.gmail.com,Mail",
  "DOMAIN,smtp-relay.gmail.com,Mail",
  "DOMAIN-SUFFIX,gmailusercontent.com,Mail",
  "DOMAIN,oauthaccountmanager.googleapis.com,Mail",
  "DOMAIN,oauth2.googleapis.com,Mail",
  "DOMAIN,www.googleapis.com,Mail",
  "DOMAIN,account.google.com,Mail",
  "DOMAIN,accounts.google.com,Mail",
  "DOMAIN-SUFFIX,outlook.com,Mail",
  "DOMAIN-SUFFIX,outlook.office.com,Mail",
  "DOMAIN-SUFFIX,outlook.office365.com,Mail",
  "DOMAIN-SUFFIX,office365.com,Mail",
  "DOMAIN-SUFFIX,hotmail.com,Mail",
  "DOMAIN-SUFFIX,live.com,Mail",
  "DOMAIN-SUFFIX,msn.com,Mail",
  "DOMAIN-SUFFIX,microsoftonline.com,Mail",
  "DOMAIN-SUFFIX,office.com,Mail",
  "DOMAIN-SUFFIX,protection.outlook.com,Mail",
  "DOMAIN-SUFFIX,outlookmobile.com,Mail",
  "DOMAIN-SUFFIX,office.net,Mail",

  // ===== 11. 社交：固定美国 =====
  "RULE-SET,twitter,Social",
  "RULE-SET,instagram,Social",
  "RULE-SET,reddit,Social",
  "RULE-SET,discord,Social",
  "RULE-SET,facebook,Social",
  "RULE-SET,linkedin,Social",

  // ===== 12. 大名单 =====
  "RULE-SET,google,Google",
  "RULE-SET,microsoft,Microsoft",

  // ===== 13. 兜底代理名单 =====
  "RULE-SET,proxy,节点选择",
  "RULE-SET,gfw,节点选择",

  // ===== 14. 国内 IP 兜底 =====
  "RULE-SET,cncidr,全局直连,no-resolve",
  "GEOIP,CN,全局直连,no-resolve",

  // ===== 15. QUIC 兜底：走到这里说明这条路径送不走 UDP，拒绝让 App 回 TCP =====
  "AND,((NETWORK,UDP),(DST-PORT,443)),REJECT",

  // ===== 16. 默认：美国 =====
  "MATCH,漏网之鱼"
];

const groupBaseOption = {
  "interval": 300,
  "timeout": 3000,
  "url": "https://www.google.com/generate_204",
  "lazy": true,
  "max-failed-times": 3,
  "hidden": false
};

const iconBase = "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons";
const nodeFilter = "^(?!.*(官网|套餐|流量|异常|剩余)).*$";

function main(config) {
  const proxyCount = config?.proxies?.length ?? 0;
  const proxyProviderCount =
    typeof config?.["proxy-providers"] === "object" ? Object.keys(config["proxy-providers"]).length : 0;
  if (proxyCount === 0 && proxyProviderCount === 0) {
    throw new Error("配置文件中未找到任何代理");
  }

  config["ipv6"] = false;
  config["unified-delay"] = true;
  config["tcp-concurrent"] = true;
  config["find-process-mode"] = "always";
  config["dns"] = dnsConfig;
  config["sniffer"] = snifferConfig;
  config["rule-providers"] = ruleProviders;
  config["rules"] = rules;

  config["proxy-groups"] = [
    {
      ...groupBaseOption,
      "name": "节点选择",
      "type": "select",
      "include-all": true,
      "filter": nodeFilter,
      "icon": iconBase + "/adjust.svg"
    },
    {
      ...groupBaseOption,
      "name": "US",
      "type": "select",
      "proxies": ["US-Veit", "Screens"],
      "icon": iconBase + "/link.svg"
    },
    {
      ...groupBaseOption,
      "name": "HK-TCP",
      "type": "select",
      "proxies": ["HK"],
      "icon": iconBase + "/link.svg"
    },
    {
      ...groupBaseOption,
      "name": "HK-UDP",
      "type": "url-test",
      "proxies": ["HK-Hy2", "HK-TUIC"],
      "icon": iconBase + "/link.svg"
    },
    {
      ...groupBaseOption,
      "name": "AI",
      "type": "select",
      "proxies": ["US-Veit", "Screens"],
      "icon": iconBase + "/chatgpt.svg"
    },
    {
      ...groupBaseOption,
      "name": "Social",
      "type": "select",
      "proxies": ["US", "节点选择"],
      "icon": iconBase + "/link.svg"
    },
    {
      ...groupBaseOption,
      "name": "Mail",
      "type": "select",
      "proxies": ["US", "节点选择"],
      "icon": iconBase + "/link.svg"
    },
    {
      ...groupBaseOption,
      "name": "YouTube",
      "type": "select",
      "proxies": ["US", "节点选择", "全局直连"],
      "icon": iconBase + "/youtube.svg"
    },
    {
      ...groupBaseOption,
      "name": "Google",
      "type": "select",
      "proxies": ["US", "节点选择"],
      "icon": iconBase + "/google.svg"
    },
    {
      ...groupBaseOption,
      "name": "Spotify",
      "type": "select",
      "proxies": ["US", "HK-TCP", "节点选择"],
      "icon": "https://fastly.jsdelivr.net/gh/xiaolin-007/clash@main/icon/spotify.svg"
    },
    {
      ...groupBaseOption,
      "name": "TikTok",
      "type": "select",
      "proxies": ["US", "节点选择"],
      "icon": "https://fastly.jsdelivr.net/gh/xiaolin-007/clash@main/icon/tiktok.svg"
    },
    {
      ...groupBaseOption,
      "name": "Storage",
      "type": "select",
      "proxies": ["HK-TCP", "US", "节点选择"],
      "icon": iconBase + "/link.svg"
    },
    {
      ...groupBaseOption,
      "name": "Dev",
      "type": "select",
      "proxies": ["HK-TCP", "US", "节点选择"],
      "icon": iconBase + "/link.svg"
    },
    {
      ...groupBaseOption,
      "name": "Microsoft",
      "type": "select",
      "proxies": ["HK-TCP", "US", "节点选择"],
      "icon": iconBase + "/microsoft.svg"
    },
    {
      ...groupBaseOption,
      "name": "Telegram",
      "type": "select",
      "proxies": ["HK-TCP", "节点选择", "全局直连"],
      "icon": iconBase + "/telegram.svg"
    },
    {
      ...groupBaseOption,
      "name": "App Store",
      "type": "select",
      "proxies": ["HK-TCP", "US", "节点选择"],
      "icon": iconBase + "/apple.svg"
    },
    {
      ...groupBaseOption,
      "name": "iCloud",
      "type": "select",
      "proxies": ["DIRECT", "HK-TCP", "US"],
      "icon": iconBase + "/apple.svg"
    },
    {
      ...groupBaseOption,
      "name": "哔哩哔哩港澳台",
      "type": "select",
      "proxies": ["HK-TCP", "节点选择"],
      "icon": "https://fastly.jsdelivr.net/gh/xiaolin-007/clash@main/icon/bilibili.svg"
    },
    {
      ...groupBaseOption,
      "name": "广告过滤",
      "type": "select",
      "proxies": ["REJECT", "DIRECT"],
      "icon": iconBase + "/bug.svg"
    },
    {
      ...groupBaseOption,
      "name": "全局直连",
      "type": "select",
      "proxies": ["DIRECT", "节点选择"],
      "icon": iconBase + "/link.svg"
    },
    {
      ...groupBaseOption,
      "name": "全局拦截",
      "type": "select",
      "proxies": ["REJECT", "DIRECT"],
      "icon": iconBase + "/block.svg"
    },
    {
      ...groupBaseOption,
      "name": "漏网之鱼",
      "type": "select",
      "proxies": ["US", "节点选择", "全局直连"],
      "icon": iconBase + "/fish.svg"
    }
  ];

  if (Array.isArray(config["proxies"])) {
    config["proxies"].forEach((proxy) => {
      const type = String(proxy.type || "").toLowerCase();
      if (type === "hysteria2" || type === "tuic") {
        // 真·UDP 传输
        proxy.udp = true;
      } else if (type === "vless" && proxy.flow) {
        // VLESS + xtls-rprx-vision 只走 TCP；写 udp:true 会让 UDP 静默黑洞
        proxy.udp = false;
        proxy.xudp = false;
      }
    });
  }

  return config;
}

// 【QUIC 嗅探开关】
// 想让 YouTube 等站点真正走 HTTP/3：把 snifferConfig.sniff 里的
//   "QUIC": { "ports": [443, 8443] }
// 取消注释，并把对应业务组切到 HK-UDP（Reality 节点运不了 UDP）。
