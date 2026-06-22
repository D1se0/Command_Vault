import {
    // App / UI
    Vault,
    Terminal,
    Folder,
    FolderOpen,
    Layers,
    LayoutGrid,
    Search,
    Settings,
    SlidersHorizontal,
    HelpCircle,
    Info,
    AlertTriangle,
    AlertOctagon,
    History,
    Menu,
    Sun,
    Moon,

    // CRUD / Actions
    Plus,
    Save,
    Pencil,
    Edit3,
    Trash2,
    X,
    Check,
    CheckCircle2,
    Copy,
    ClipboardCheck,
    RefreshCcw,
    Pin,
    PinOff,
    Filter,
    FilterX,
    ArrowUpDown,
    GripVertical,

    // Navigation
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    ExternalLink,

    // Visibility / State
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Play,
    Pause,
    Square,
    LogIn,
    LogOut,
    UserCircle2,

    // System / Dev
    Bug,
    Shield,
    ShieldQuestion,
    Cpu,
    Database,
    Network,
    Globe,
    Globe2,
    Wifi,

    // Files / Export
    File,
    FileText,
    FileJson,
    FileSpreadsheet,
    Download,
    Upload,
    FolderInput,
    FolderOutput,
    Archive,

    // Misc
    Star,
    Heart,
    Zap,
    Sparkles,
    Activity,
    BarChart3,
    Clock,
    Calendar,
    Tag,
    Tags,
    Hash,
    Layout,
    PanelLeftClose,
    PanelLeftOpen,
    Command,

    // Hacking / Security
    Skull,
    Radar,
    Target,
    Crosshair,
    Key,
    KeyRound,
    Fingerprint,
    Scan,
    ScanLine,
    Server,
    ServerCog,
    Cloud,
    CloudCog,
    Code,
    Code2,
    Binary,
    Braces,
    TerminalSquare,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    ShieldEllipsis,
    Flame,
    Wrench,
    Plug,
    Usb,
    HardDrive,
    Monitor,
    MonitorSmartphone,
    Laptop,
    Smartphone,
    Router,
    Radio,
    Webhook,
    BugPlay,
    LockKeyhole,
    LockKeyholeOpen,
    Bomb,
    Worm,
    Syringe,
    Crown,
    Boxes,
    Container,
    GitBranch,
    Github,
    Component,
    Telescope,
    Satellite,
    SatelliteDish,
    Waypoints,
    Link2,
    Unlink,
    UserSearch,
    Users,
    Building2,
    Mail,
    AtSign,
    Brain,
    Eraser,
    FlaskConical,
    TestTube2,
    Microscope,
    Hammer,
    Swords,
    ShieldHalf,
    CircleSlash2,
    Ban,
    Siren,
    BadgeAlert,
    BadgeCheck,
    Gauge,
    Timer,
    RotateCcw
} from "lucide-react";

/**
 * Shared icon style.
 * Change size / strokeWidth here to affect all icons globally.
 */
const ICON_PROPS = {
    size: 14,
    strokeWidth: 1.8,
    className: "icon"
};

export const Icons = {
    /* ===============================
       App / Branding
    =============================== */
    vault: <Vault {...ICON_PROPS} />,
    terminal: <Terminal {...ICON_PROPS} />,
    menu: <Menu {...ICON_PROPS} />,
    settings: <Settings {...ICON_PROPS} />,
    sliders: <SlidersHorizontal {...ICON_PROPS} />,
    sun: <Sun {...ICON_PROPS} />,
    moon: <Moon {...ICON_PROPS} />,
    command: <Command {...ICON_PROPS} />,

    /* ===============================
       CRUD / Actions
    =============================== */
    add: <Plus {...ICON_PROPS} />,
    save: <Save {...ICON_PROPS} />,
    edit: <Pencil {...ICON_PROPS} />,
    editAlt: <Edit3 {...ICON_PROPS} />,
    delete: <Trash2 {...ICON_PROPS} />,
    close: <X {...ICON_PROPS} />,
    confirm: <Check {...ICON_PROPS} />,
    confirmCircle: <CheckCircle2 {...ICON_PROPS} />,
    copy: <Copy {...ICON_PROPS} />,
    copyCheck: <ClipboardCheck {...ICON_PROPS} />,
    refresh: <RefreshCcw {...ICON_PROPS} />,
    pin: <Pin {...ICON_PROPS} />,
    unpin: <PinOff {...ICON_PROPS} />,
    filter: <Filter {...ICON_PROPS} />,
    filterOff: <FilterX {...ICON_PROPS} />,
    sort: <ArrowUpDown {...ICON_PROPS} />,
    drag: <GripVertical {...ICON_PROPS} />,
    undo: <RotateCcw {...ICON_PROPS} />,
    eraser: <Eraser {...ICON_PROPS} />,

    /* ===============================
       Navigation / Structure
    =============================== */
    folder: <Folder {...ICON_PROPS} />,
    folderOpen: <FolderOpen {...ICON_PROPS} />,
    sections: <Layers {...ICON_PROPS} />,
    grid: <LayoutGrid {...ICON_PROPS} />,
    layout: <Layout {...ICON_PROPS} />,
    back: <ArrowLeft {...ICON_PROPS} />,
    forward: <ArrowRight {...ICON_PROPS} />,
    externalArrow: <ArrowUpRight {...ICON_PROPS} />,
    chevronLeft: <ChevronLeft {...ICON_PROPS} />,
    chevronRight: <ChevronRight {...ICON_PROPS} />,
    chevronUp: <ChevronUp {...ICON_PROPS} />,
    chevronDown: <ChevronDown {...ICON_PROPS} />,
    externalLink: <ExternalLink {...ICON_PROPS} />,
    panelOpen: <PanelLeftOpen {...ICON_PROPS} />,
    panelClose: <PanelLeftClose {...ICON_PROPS} />,

    /* ===============================
       Search / Info
    =============================== */
    search: <Search {...ICON_PROPS} />,
    info: <Info {...ICON_PROPS} />,
    help: <HelpCircle {...ICON_PROPS} />,
    warning: <AlertTriangle {...ICON_PROPS} />,
    warningOctagon: <AlertOctagon {...ICON_PROPS} />,
    history: <History {...ICON_PROPS} />,
    clock: <Clock {...ICON_PROPS} />,
    calendar: <Calendar {...ICON_PROPS} />,

    /* ===============================
       Visibility / State / Auth
    =============================== */
    eye: <Eye {...ICON_PROPS} />,
    eyeOff: <EyeOff {...ICON_PROPS} />,
    lock: <Lock {...ICON_PROPS} />,
    unlock: <Unlock {...ICON_PROPS} />,
    play: <Play {...ICON_PROPS} />,
    pause: <Pause {...ICON_PROPS} />,
    stop: <Square {...ICON_PROPS} />,
    login: <LogIn {...ICON_PROPS} />,
    logout: <LogOut {...ICON_PROPS} />,
    user: <UserCircle2 {...ICON_PROPS} />,

    /* ===============================
       System / Pentesting / Dev
    =============================== */
    bug: <Bug {...ICON_PROPS} />,
    shield: <Shield {...ICON_PROPS} />,
    shieldQuestion: <ShieldQuestion {...ICON_PROPS} />,
    cpu: <Cpu {...ICON_PROPS} />,
    database: <Database {...ICON_PROPS} />,
    network: <Network {...ICON_PROPS} />,
    globe: <Globe {...ICON_PROPS} />,
    globe2: <Globe2 {...ICON_PROPS} />,
    wifi: <Wifi {...ICON_PROPS} />,

    /* ===============================
       Files / Import / Export
    =============================== */
    file: <File {...ICON_PROPS} />,
    fileText: <FileText {...ICON_PROPS} />,
    fileJson: <FileJson {...ICON_PROPS} />,
    fileSpreadsheet: <FileSpreadsheet {...ICON_PROPS} />,
    download: <Download {...ICON_PROPS} />,
    upload: <Upload {...ICON_PROPS} />,
    importIcon: <FolderInput {...ICON_PROPS} />,
    exportIcon: <FolderOutput {...ICON_PROPS} />,
    archive: <Archive {...ICON_PROPS} />,

    /* ===============================
       Misc
    =============================== */
    star: <Star {...ICON_PROPS} />,
    heart: <Heart {...ICON_PROPS} />,
    zap: <Zap {...ICON_PROPS} />,
    sparkles: <Sparkles {...ICON_PROPS} />,
    activity: <Activity {...ICON_PROPS} />,
    chart: <BarChart3 {...ICON_PROPS} />,
    tag: <Tag {...ICON_PROPS} />,
    tags: <Tags {...ICON_PROPS} />,
    hash: <Hash {...ICON_PROPS} />,
    gauge: <Gauge {...ICON_PROPS} />,
    timer: <Timer {...ICON_PROPS} />,

    /* ===============================
       Hacking / Pentesting
    =============================== */
    skull: <Skull {...ICON_PROPS} />,                 // Exploits / RCE
    radar: <Radar {...ICON_PROPS} />,                 // Recon / Enumeration
    target: <Target {...ICON_PROPS} />,               // Targeting
    crosshair: <Crosshair {...ICON_PROPS} />,         // Precise attacks
    key: <Key {...ICON_PROPS} />,                     // Auth / creds
    keyRound: <KeyRound {...ICON_PROPS} />,           // Credentials
    fingerprint: <Fingerprint {...ICON_PROPS} />,     // Identity / auth
    scan: <Scan {...ICON_PROPS} />,                   // Scanning
    scanLine: <ScanLine {...ICON_PROPS} />,           // Active scanning
    server: <Server {...ICON_PROPS} />,               // Servers
    serverCog: <ServerCog {...ICON_PROPS} />,         // Server administration
    cloud: <Cloud {...ICON_PROPS} />,                 // Cloud pentest
    cloudCog: <CloudCog {...ICON_PROPS} />,           // Cloud configuration
    code: <Code {...ICON_PROPS} />,                   // Code / payloads
    code2: <Code2 {...ICON_PROPS} />,                 // Source code
    binary: <Binary {...ICON_PROPS} />,               // Binary / reversing
    braces: <Braces {...ICON_PROPS} />,               // Web / JSON
    terminalBox: <TerminalSquare {...ICON_PROPS} />,  // CLI tools
    shieldAlert: <ShieldAlert {...ICON_PROPS} />,     // Security issues
    shieldCheck: <ShieldCheck {...ICON_PROPS} />,     // Secure
    shieldOff: <ShieldOff {...ICON_PROPS} />,         // Bypass
    shieldEllipsis: <ShieldEllipsis {...ICON_PROPS} />, // Pending analysis
    shieldHalf: <ShieldHalf {...ICON_PROPS} />,       // Partial defense
    flame: <Flame {...ICON_PROPS} />,                 // PrivEsc
    wrench: <Wrench {...ICON_PROPS} />,               // Tooling
    plug: <Plug {...ICON_PROPS} />,                   // Integration
    usb: <Usb {...ICON_PROPS} />,                     // Physical attacks
    hardDrive: <HardDrive {...ICON_PROPS} />,         // Storage / disks
    monitor: <Monitor {...ICON_PROPS} />,             // Desktop attacks
    monitorMobile: <MonitorSmartphone {...ICON_PROPS} />, // Cross-device
    laptop: <Laptop {...ICON_PROPS} />,               // Laptop targets
    smartphone: <Smartphone {...ICON_PROPS} />,       // Mobile pentest
    mobile: <Smartphone {...ICON_PROPS} />,           // Mobile security (alias)
    router: <Router {...ICON_PROPS} />,               // Network devices
    radio: <Radio {...ICON_PROPS} />,                 // Wireless
    webhook: <Webhook {...ICON_PROPS} />,             // Webhooks / callbacks
    bugPlay: <BugPlay {...ICON_PROPS} />,             // Exploit testing
    lockKeyhole: <LockKeyhole {...ICON_PROPS} />,     // Locks / crypto
    lockOpen: <LockKeyholeOpen {...ICON_PROPS} />,    // Cracked / bypassed
    bomb: <Bomb {...ICON_PROPS} />,                   // Payloads / exploits
    worm: <Worm {...ICON_PROPS} />,                   // Malware
    syringe: <Syringe {...ICON_PROPS} />,             // Injection attacks
    crown: <Crown {...ICON_PROPS} />,                 // Domain Admin / root
    boxes: <Boxes {...ICON_PROPS} />,                 // Containers / infra
    container: <Container {...ICON_PROPS} />,         // Docker / containers
    gitBranch: <GitBranch {...ICON_PROPS} />,         // Versioning
    github: <Github {...ICON_PROPS} />,               // Repos
    component: <Component {...ICON_PROPS} />,         // Modules
    telescope: <Telescope {...ICON_PROPS} />,         // OSINT
    satellite: <Satellite {...ICON_PROPS} />,         // OSINT / recon
    satelliteDish: <SatelliteDish {...ICON_PROPS} />, // Signal interception
    waypoints: <Waypoints {...ICON_PROPS} />,         // Pivoting / lateral movement
    link: <Link2 {...ICON_PROPS} />,                  // Links / relations
    unlink: <Unlink {...ICON_PROPS} />,               // Broken links
    userSearch: <UserSearch {...ICON_PROPS} />,       // OSINT / people search
    users: <Users {...ICON_PROPS} />,                 // Active Directory users
    building: <Building2 {...ICON_PROPS} />,          // Organizations
    mail: <Mail {...ICON_PROPS} />,                   // Phishing / email
    atSign: <AtSign {...ICON_PROPS} />,               // Email enumeration
    brain: <Brain {...ICON_PROPS} />,                 // Social engineering
    flask: <FlaskConical {...ICON_PROPS} />,          // Labs / testing
    testTube: <TestTube2 {...ICON_PROPS} />,          // Experiments
    microscope: <Microscope {...ICON_PROPS} />,       // Forensics analysis
    hammer: <Hammer {...ICON_PROPS} />,               // Brute force
    swords: <Swords {...ICON_PROPS} />,               // Red Team / offensive
    circleSlash: <CircleSlash2 {...ICON_PROPS} />,    // Blocked / denied
    ban: <Ban {...ICON_PROPS} />,                     // Blocked
    siren: <Siren {...ICON_PROPS} />,                 // Alerts / IDS
    badgeAlert: <BadgeAlert {...ICON_PROPS} />,       // High severity
    badgeCheck: <BadgeCheck {...ICON_PROPS} />,       // Verified / safe

    /* ===============================
       OS specific
    =============================== */
    windows: <MonitorSmartphone {...ICON_PROPS} />,   // Windows targets
    linux: <Terminal {...ICON_PROPS} />,              // Linux targets
    exploit: <BugPlay {...ICON_PROPS} />              // Exploitation
} as const;
