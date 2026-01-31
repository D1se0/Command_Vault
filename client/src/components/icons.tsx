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
    HelpCircle,
    Info,
    AlertTriangle,

    // CRUD / Actions
    Plus,
    Save,
    Pencil,
    Edit3,
    Trash2,
    X,
    Check,
    Copy,
    RefreshCcw,

    // Navigation
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,

    // Visibility / State
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Play,
    Pause,
    Square,

    // System / Dev
    Bug,
    Shield,
    Cpu,
    Database,
    Network,
    Globe,
    Wifi,

    // Files / Export
    File,
    FileText,
    Download,
    Upload,

    // Misc
    Star,
    Heart,
    Zap
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
    copy: <Copy {...ICON_PROPS} />,
    refresh: <RefreshCcw {...ICON_PROPS} />,

    /* ===============================
       Navigation / Structure
    =============================== */
    folder: <Folder {...ICON_PROPS} />,
    folderOpen: <FolderOpen {...ICON_PROPS} />,
    sections: <Layers {...ICON_PROPS} />,
    grid: <LayoutGrid {...ICON_PROPS} />,
    back: <ArrowLeft {...ICON_PROPS} />,
    forward: <ArrowRight {...ICON_PROPS} />,
    chevronLeft: <ChevronLeft {...ICON_PROPS} />,
    chevronRight: <ChevronRight {...ICON_PROPS} />,
    chevronUp: <ChevronUp {...ICON_PROPS} />,
    chevronDown: <ChevronDown {...ICON_PROPS} />,

    /* ===============================
       Search / Info
    =============================== */
    search: <Search {...ICON_PROPS} />,
    info: <Info {...ICON_PROPS} />,
    help: <HelpCircle {...ICON_PROPS} />,
    warning: <AlertTriangle {...ICON_PROPS} />,

    /* ===============================
       Visibility / State
    =============================== */
    eye: <Eye {...ICON_PROPS} />,
    eyeOff: <EyeOff {...ICON_PROPS} />,
    lock: <Lock {...ICON_PROPS} />,
    unlock: <Unlock {...ICON_PROPS} />,
    play: <Play {...ICON_PROPS} />,
    pause: <Pause {...ICON_PROPS} />,
    stop: <Square {...ICON_PROPS} />,

    /* ===============================
       System / Pentesting / Dev
    =============================== */
    bug: <Bug {...ICON_PROPS} />,
    shield: <Shield {...ICON_PROPS} />,
    cpu: <Cpu {...ICON_PROPS} />,
    database: <Database {...ICON_PROPS} />,
    network: <Network {...ICON_PROPS} />,
    globe: <Globe {...ICON_PROPS} />,
    wifi: <Wifi {...ICON_PROPS} />,

    /* ===============================
       Files / Import / Export
    =============================== */
    file: <File {...ICON_PROPS} />,
    fileText: <FileText {...ICON_PROPS} />,
    download: <Download {...ICON_PROPS} />,
    upload: <Upload {...ICON_PROPS} />,

    /* ===============================
       Misc
    =============================== */
    star: <Star {...ICON_PROPS} />,
    heart: <Heart {...ICON_PROPS} />,
    zap: <Zap {...ICON_PROPS} />
} as const;
