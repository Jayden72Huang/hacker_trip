export type Organizer = {
  name: string;
  logo?: string;
};

export type Sponsor = {
  name: string;
  logo?: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
};

// 可展开的信息卡片
export type InfoCard = {
  icon: "trophy" | "users" | "globe" | "mapPin" | "clock" | "ticket" | "gift";
  label: string;
  value: string;
  expandedContent?: string; // 展开后显示的详细内容
};

export type Hackathon = {
  id: string;
  name: string;
  shortName: string;
  city: string;
  country: string;
  venue: string;
  dateRange: string;
  isPast: boolean;
  status: "upcoming" | "live" | "closed";
  summary: string;
  prizePool: string;
  teams: string;
  format: "offline" | "online" | "hybrid";
  theme: string;
  website: string;
  brief: string;
  tracks: { title: string; description: string }[];
  agenda: { title: string; time: string; detail: string }[];
  organizers?: Organizer[];
  sponsors?: Sponsor[];
  // 主办方（显示在地址旁边）
  hostOrganizer?: string;
  // 可自定义的信息卡片（默认4个：奖金池、团队数、主题、举办地点）
  infoCards?: InfoCard[];
};

export const hackathons: Hackathon[] = [
  {
    id: "beijing-ai",
    name: "中关村AI创新黑客松",
    shortName: "中关村AI",
    city: "北京",
    country: "中国",
    venue: "中关村软件园国际会议中心",
    dateRange: "Jan 18–19",
    isPast: true,
    status: "closed",
    summary:
      "48 小时聚焦 AI + 智慧城市的线下黑客松，聚集国内顶尖开发者共同探索人工智能的前沿应用。",
    prizePool: "¥500,000",
    teams: "80 组 / 400+ 黑客",
    format: "offline",
    theme: "AI赋能智慧城市",
    website: "https://example.com/zhongguancun-ai",
    brief: "https://example.com/zhongguancun-ai/brief.pdf",
    hostOrganizer: "北京市科技创新委员会",
    infoCards: [
      {
        icon: "trophy",
        label: "奖金池",
        value: "¥500,000",
        expandedContent: "一等奖 ¥200,000 × 1名\n二等奖 ¥100,000 × 2名\n三等奖 ¥50,000 × 4名\n优秀奖 ¥10,000 × 8名"
      },
      {
        icon: "users",
        label: "团队数",
        value: "80 组 · 400+ 黑客",
        expandedContent: "每队3-5人\n本科及以上学历\n接受跨校/跨企业组队\n提供现场组队区"
      },
      {
        icon: "globe",
        label: "主题",
        value: "AI赋能智慧城市",
        expandedContent: "聚焦智慧交通、智慧安防、智慧医疗三大方向，结合北京城市副中心建设需求，打造可落地的AI解决方案。"
      },
      {
        icon: "mapPin",
        label: "举办地点",
        value: "中关村软件园",
        expandedContent: "中关村软件园国际会议中心\n地址：北京市海淀区东北旺西路8号\n地铁：16号线西北旺站B口\n提供免费班车接驳"
      }
    ],
    tracks: [
      { title: "智慧交通", description: "实时车流预测、路线优化、低延迟告警系统。" },
      { title: "智慧安防", description: "摄像头/音频事件检测，保护隐私的联邦学习。" },
      { title: "智慧医疗", description: "AI辅助诊断、健康管理、医疗数据可视化。" },
    ],
    agenda: [
      { title: "签到组队", time: "周六 09:00", detail: "现场组队，快速问题抛光。" },
      { title: "导师答疑", time: "周六 14:00", detail: "云原生、数据、设计三大导师桌。" },
      { title: "通宵开发", time: "周六 22:00", detail: "场地通宵开放，提供睡袋 & 夜宵。" },
      { title: "作品提交", time: "周日 13:00", detail: "GitHub 提交 + 5 min 录屏 demo。" },
      { title: "决赛路演", time: "周日 16:00", detail: "Top 8 现场路演，评委现场打分。" },
    ],
    organizers: [
      { name: "百度", logo: "/logos/baidu.svg" },
      { name: "阿里云", logo: "/logos/aliyun.svg" },
    ],
    sponsors: [
      { name: "字节跳动", logo: "/logos/bytedance.svg", tier: "gold" },
      { name: "腾讯", logo: "/logos/tencent.svg", tier: "gold" },
      { name: "华为", logo: "/logos/huawei.svg", tier: "silver" },
      { name: "小米", logo: "/logos/xiaomi.svg", tier: "silver" },
    ],
  },
  {
    id: "shanghai-fintech",
    name: "陆家嘴AI金融黑客松",
    shortName: "陆家嘴AI金融",
    city: "上海",
    country: "中国",
    venue: "上海中心大厦",
    dateRange: "Feb 22–23",
    isPast: false,
    status: "upcoming",
    summary:
      "聚焦金融科技创新，探索AI在风控、量化、智能投顾等领域的前沿应用，配套GPU算力和真实数据沙箱。",
    prizePool: "¥800,000",
    teams: "100 组 · 线下+远程",
    format: "hybrid",
    theme: "AI驱动金融创新",
    website: "https://example.com/lujiazui-fintech",
    brief: "https://example.com/lujiazui-fintech/brief.pdf",
    hostOrganizer: "上海市金融服务办公室",
    infoCards: [
      {
        icon: "trophy",
        label: "奖金池",
        value: "¥800,000",
        expandedContent: "一等奖 ¥300,000 × 1名\n二等奖 ¥150,000 × 2名\n三等奖 ¥80,000 × 3名\n最佳创意奖 ¥50,000 × 1名"
      },
      {
        icon: "users",
        label: "团队数",
        value: "100 组 · 线下+远程",
        expandedContent: "线下60组 / 远程40组\n每队2-6人\n需至少1名金融或技术背景成员\n支持远程参赛和线上答辩"
      },
      {
        icon: "globe",
        label: "主题",
        value: "AI驱动金融创新",
        expandedContent: "重点探索智能风控、量化交易、智能投顾、供应链金融四大赛道，提供脱敏真实数据和算力支持。"
      },
      {
        icon: "mapPin",
        label: "举办地点",
        value: "上海中心大厦",
        expandedContent: "上海中心大厦37层·金融科技中心\n地址：上海市浦东新区银城中路501号\n地铁：2/14号线陆家嘴站\n提供免费停车位"
      }
    ],
    tracks: [
      { title: "智能风控", description: "观察性、评估、成本优化，让 agent 真正可运维。" },
      { title: "量化交易", description: "多模态前端、语音/手势交互，提升可解释性。" },
      { title: "智能投顾", description: "金融合规、跨境电商、医疗科研三大场景加速器。" },
    ],
    agenda: [
      { title: "开幕式", time: "周六 10:00", detail: "题目 & 评分标准解读。" },
      { title: "技术答疑", time: "周六 15:00", detail: "GPU quota 分配、性能调优问诊。" },
      { title: "中期检查", time: "周日 09:00", detail: "录屏 90 秒，评委即时反馈。" },
      { title: "决赛路演", time: "周日 16:30", detail: "Top 10 Demo Day + 现场 Q&A。" },
    ],
    organizers: [
      { name: "蚂蚁集团", logo: "/logos/ant.svg" },
      { name: "微众银行", logo: "/logos/webank.svg" },
    ],
    sponsors: [
      { name: "浦发银行", logo: "/logos/spdb.svg", tier: "platinum" },
      { name: "平安科技", logo: "/logos/pingan.svg", tier: "gold" },
      { name: "京东科技", logo: "/logos/jdtech.svg", tier: "silver" },
    ],
  },
  {
    id: "shenzhen-hardware",
    name: "深圳湾AI硬件黑客松",
    shortName: "深圳湾AI硬件",
    city: "深圳",
    country: "中国",
    venue: "深圳湾科技生态园",
    dateRange: "Mar 28–29",
    isPast: false,
    status: "upcoming",
    summary:
      "聚焦AI+智能硬件与边缘计算创新，提供完整的AI开发套件、传感器和生产制造资源对接。",
    prizePool: "¥600,000",
    teams: "60 组",
    format: "offline",
    theme: "智能硬件+AIoT",
    website: "https://example.com/shenzhen-hardware",
    brief: "https://example.com/shenzhen-hardware/brief.pdf",
    hostOrganizer: "深圳市南山区科技创新局",
    infoCards: [
      {
        icon: "trophy",
        label: "奖金池",
        value: "¥600,000",
        expandedContent: "一等奖 ¥200,000 × 1名\n二等奖 ¥120,000 × 2名\n三等奖 ¥60,000 × 4名\n最具商业价值奖 ¥50,000"
      },
      {
        icon: "users",
        label: "团队数",
        value: "60 组",
        expandedContent: "每队3-6人\n需包含硬件或嵌入式开发背景成员\n提供硬件套件和制造资源\n华强北供应链对接"
      },
      {
        icon: "globe",
        label: "主题",
        value: "智能硬件+AIoT",
        expandedContent: "围绕智能家居、可穿戴设备、工业物联网三大方向，提供从原型到量产的全链路支持。"
      },
      {
        icon: "mapPin",
        label: "举办地点",
        value: "深圳湾科技生态园",
        expandedContent: "深圳湾科技生态园9栋会议中心\n地址：深圳市南山区科苑南路3099号\n地铁：2号线科苑站A口\n周边配套齐全"
      }
    ],
    tracks: [
      { title: "智能家居", description: "AIoT场景创新、智能交互、能源管理。" },
      { title: "可穿戴", description: "健康监测、运动追踪、人机交互。" },
      { title: "工业IoT", description: "设备监控、预测维护、数字孪生。" },
    ],
    agenda: [
      { title: "硬件分发", time: "周五 12:00", detail: "开发套件 & 传感器模块领取。" },
      { title: "技术辅导", time: "周五 20:00", detail: "导师桌指导，技术栈评估。" },
      { title: "原型调试", time: "周六 10:00", detail: "3D打印、PCB快板现场支持。" },
      { title: "作品展示", time: "周六 17:00", detail: "Top 6 上台，评委现场质询。" },
    ],
  },
  {
    id: "hangzhou-ecommerce",
    name: "西湖AI电商黑客松",
    shortName: "西湖AI电商",
    city: "杭州",
    country: "中国",
    venue: "阿里巴巴西溪园区",
    dateRange: "May 9–10",
    isPast: false,
    status: "upcoming",
    summary:
      "聚焦AI驱动的电商新零售创新，探索AI直播电商、智能客服、供应链AI优化等前沿应用。",
    prizePool: "¥700,000",
    teams: "70 组",
    format: "offline",
    theme: "新零售+AI电商",
    website: "https://example.com/xihu-ecommerce",
    brief: "https://example.com/xihu-ecommerce/brief.pdf",
    hostOrganizer: "杭州市余杭区商务局",
    infoCards: [
      {
        icon: "trophy",
        label: "奖金池",
        value: "¥700,000",
        expandedContent: "一等奖 ¥250,000 × 1名\n二等奖 ¥130,000 × 2名\n三等奖 ¥70,000 × 3名\n最佳创新奖 ¥60,000"
      },
      {
        icon: "users",
        label: "团队数",
        value: "70 组",
        expandedContent: "每队3-5人\n优先具有电商/零售背景团队\n提供真实电商数据沙箱\n优秀项目可获投资对接"
      },
      {
        icon: "globe",
        label: "主题",
        value: "新零售+AI电商",
        expandedContent: "聚焦直播电商、智能客服、智能选品、供应链优化四大赛道，提供电商平台API和脱敏数据。"
      },
      {
        icon: "mapPin",
        label: "举办地点",
        value: "阿里西溪园区",
        expandedContent: "阿里巴巴西溪园区·访客中心\n地址：杭州市余杭区文一西路969号\n地铁：5号线五常站B口\n提供免费班车"
      }
    ],
    tracks: [
      { title: "直播电商", description: "智能主播、实时推荐、互动玩法。" },
      { title: "智能客服", description: "多轮对话、情感分析、智能调度。" },
      { title: "供应链", description: "库存优化、物流预测、智能采购。" },
    ],
    agenda: [
      { title: "开幕式", time: "周五 18:30", detail: "题目发布、规则说明。" },
      { title: "通宵开发", time: "周六 00:00", detail: "黑客通宵，场地全天开放。" },
      { title: "中期汇报", time: "周六 10:00", detail: "3分钟快速展示，获取反馈。" },
      { title: "决赛路演", time: "周六 17:30", detail: "Top 8 Demo + 评委点评。" },
    ],
  },
  {
    id: "chengdu-gaming",
    name: "天府AIGC游戏黑客松",
    shortName: "天府AIGC游戏",
    city: "成都",
    country: "中国",
    venue: "腾讯成都大厦",
    dateRange: "Jun 20–21",
    isPast: false,
    status: "upcoming",
    summary:
      "聚焦游戏创意与AI技术融合，探索AIGC在游戏开发中的创新应用。",
    prizePool: "¥500,000",
    teams: "50 组",
    format: "offline",
    theme: "AIGC游戏创新",
    website: "https://example.com/tianfu-gaming",
    brief: "https://example.com/tianfu-gaming/brief.pdf",
    hostOrganizer: "成都市高新区科技创新局",
    infoCards: [
      {
        icon: "trophy",
        label: "奖金池",
        value: "¥500,000",
        expandedContent: "一等奖 ¥180,000 × 1名\n二等奖 ¥100,000 × 2名\n三等奖 ¥50,000 × 4名\n最佳视觉奖 ¥30,000"
      },
      {
        icon: "users",
        label: "团队数",
        value: "50 组",
        expandedContent: "每队2-5人\n建议包含美术/策划/程序角色\n提供Unity/Unreal开发环境\n游戏引擎专家驻场"
      },
      {
        icon: "globe",
        label: "主题",
        value: "AIGC游戏创新",
        expandedContent: "重点探索AI生成内容、智能NPC、程序化生成、玩家行为分析四大方向。"
      },
      {
        icon: "mapPin",
        label: "举办地点",
        value: "腾讯成都大厦",
        expandedContent: "腾讯成都大厦·游戏创新中心\n地址：成都市高新区天府四街199号\n地铁：1号线天府五街站A口\n配套完善"
      }
    ],
    tracks: [
      { title: "AI内容生成", description: "美术资产、关卡设计、剧情生成。" },
      { title: "智能NPC", description: "对话系统、行为树、情感交互。" },
      { title: "玩家分析", description: "行为预测、个性推荐、反作弊。" },
    ],
    agenda: [
      { title: "签到注册", time: "周五 09:00", detail: "领取徽章与开发资源包。" },
      { title: "组队破冰", time: "周五 12:00", detail: "团队与导师撮合，咖啡聊天区。" },
      { title: "作品展示", time: "周六 11:00", detail: "Top 15 上台闪电演讲。" },
      { title: "颁奖典礼", time: "周六 17:00", detail: "展位路演 + 评委巡展。" },
    ],
  },
  {
    id: "guangzhou-biotech",
    name: "广州AI生物医药黑客松",
    shortName: "广州AI生医",
    city: "广州",
    country: "中国",
    venue: "广州国际生物岛",
    dateRange: "Aug 15–16",
    isPast: false,
    status: "upcoming",
    summary:
      "聚焦AI+生物医药创新，提供分子模拟、基因组学分析、药物研发等专业工具和数据。",
    prizePool: "¥900,000",
    teams: "45 组",
    format: "offline",
    theme: "AI+生物医药",
    website: "https://example.com/gz-biotech",
    brief: "https://example.com/gz-biotech/brief.pdf",
    hostOrganizer: "广州市黄埔区科技创新局",
    infoCards: [
      {
        icon: "trophy",
        label: "奖金池",
        value: "¥900,000",
        expandedContent: "一等奖 ¥350,000 × 1名\n二等奖 ¥180,000 × 2名\n三等奖 ¥90,000 × 3名\n最具转化潜力奖 ¥100,000"
      },
      {
        icon: "users",
        label: "团队数",
        value: "45 组",
        expandedContent: "每队3-6人\n需包含生物/医药/AI背景成员\n提供高性能计算资源\n可对接临床合作机构"
      },
      {
        icon: "globe",
        label: "主题",
        value: "AI+生物医药",
        expandedContent: "围绕药物发现、基因组学、医学影像、临床决策四大方向，推动AI在生命科学领域的落地。"
      },
      {
        icon: "mapPin",
        label: "举办地点",
        value: "广州国际生物岛",
        expandedContent: "广州国际生物岛·创新中心\n地址：广州市黄埔区螺旋四路19号\n地铁：4号线官洲站B口\n配套生物实验室"
      }
    ],
    tracks: [
      { title: "药物发现", description: "分子对接、虚拟筛选、ADMET预测。" },
      { title: "基因组学", description: "变异检测、功能注释、表达分析。" },
      { title: "医学影像", description: "病灶检测、分割标注、辅助诊断。" },
    ],
    agenda: [
      { title: "设备调试", time: "周五 13:00", detail: "计算资源配置与安全检查。" },
      { title: "数据导入", time: "周五 19:00", detail: "专业数据集分发与使用指导。" },
      { title: "算法验证", time: "周六 10:30", detail: "分组验证，专家现场指导。" },
      { title: "成果展示", time: "周六 16:00", detail: "Top 5 项目路演决赛。" },
    ],
  },
];
