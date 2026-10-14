import {
  Sprout,
  Milk,
  Egg,
  Fish,
  Beef,
  Flame,
  Tractor,
  Package,
  ShieldCheck,
  TrendingUp,
  HeartHandshake,
  CheckCircle2,
  IdCard,
  Boxes,
  Store,
  FileCheck2,
  Mic,
  ScrollText,
  Truck,
  Building2,
  UserCheck,
  Scale,
} from "lucide-react";
import {
  FarmingCategory,
  HowItWorksStep,
  NavLink,
  PlatformFeature,
  TrustItem,
  UserRoleOption,
  WhyFarmlyPoint,
} from "@/types";

export const APP_CONFIG = {
  name: "Farmly",
  tagline: "The Digital Infrastructure for Modern Farming",
  coreMessage: "One Digital Platform for Every Farm.",
  supportEmail: "support@farmly.ag",
};

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/#top" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Ecosystem", href: "/#ecosystem" },
  { label: "About", href: "/#about" },
];

export const TRUST_ITEMS: TrustItem[] = [
  {
    id: "farmer-first",
    title: "Farmer First",
    description: "Built thoughtfully for growers with simple, intuitive touch-friendly interfaces.",
    icon: HeartHandshake,
  },
  {
    id: "secure-by-design",
    title: "Secure by Design",
    description: "Protected digital records with verifiable audit trails and private ownership.",
    icon: ShieldCheck,
  },
  {
    id: "built-for-scale",
    title: "Built for Scale",
    description: "Architecture structured to connect single-acre plots to national agricultural chains.",
    icon: TrendingUp,
  },
  {
    id: "simple-to-use",
    title: "Simple to Use",
    description: "No tech expertise required. Plain language, familiar icons, and voice readiness.",
    icon: CheckCircle2,
  },
];

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: "01",
    title: "Create Your Farm Profile",
    description: "Build a digital identity for your farming activities.",
    detail:
      "Register your farm holding, operational domains, and location in just two minutes. One profile unifies your presence across all agricultural services.",
    icon: IdCard,
  },
  {
    step: "02",
    title: "Manage Agricultural Assets",
    description: "Organize crops, livestock, dairy, poultry and other agricultural assets.",
    detail:
      "Catalog harvest cycles, yields, cattle herds, equipment hours, and input stock with effortless record-keeping.",
    icon: Boxes,
  },
  {
    step: "03",
    title: "Connect With Buyers & Services",
    description: "Discover buyers, marketplaces and agricultural services.",
    detail:
      "Directly connect with certified bulk buyers, processing mills, logistics coordinators, and soil advisory services without middlemen.",
    icon: Store,
  },
  {
    step: "04",
    title: "Track Your Farm Journey",
    description: "Keep important records and transactions organized in one place.",
    detail:
      "Gain full visibility into sales receipts, input expenses, historical yields, and verifiable supply-chain credentials.",
    icon: ScrollText,
  },
];

export const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    id: "unified-identity",
    title: "Unified Farmer Identity",
    description:
      "One sovereign digital identity covering all farming domains, landholdings, and creditworthiness.",
    badge: "Core Platform",
    icon: UserCheck,
  },
  {
    id: "asset-tracking",
    title: "Agricultural Asset Tracking",
    description:
      "Full digital lifecycle management for crops, livestock, dairy yields, poultry batches, and equipment.",
    badge: "Asset Registry",
    icon: Boxes,
  },
  {
    id: "marketplace-connectivity",
    title: "Marketplace Connectivity",
    description:
      "Direct bridge between growers, verified food companies, commodity brokers, and input suppliers.",
    badge: "Marketplace",
    icon: Store,
  },
  {
    id: "transparent-transactions",
    title: "Transparent Transactions",
    description:
      "Clear, tamper-evident digital receipts and transaction logs ensuring fair compensation.",
    badge: "Verification",
    icon: FileCheck2,
  },
  {
    id: "evidence-records",
    title: "Evidence-Based Records",
    description:
      "Structured documentation for organic certification, harvest origin, and institutional credit access.",
    badge: "Traceability",
    icon: ShieldCheck,
  },
  {
    id: "voice-experience",
    title: "Voice-Friendly Experience",
    description:
      "Designed from the ground up to support regional dialects, vernacular speech, and simple audio prompts.",
    badge: "Accessibility",
    icon: Mic,
  },
];

export const FARMING_CATEGORIES: FarmingCategory[] = [
  {
    id: "crops",
    name: "Crops",
    emoji: "🌾",
    description: "Grains, pulses, cash crops, horticulture, and seasonal field harvests.",
    tag: "Field Production",
    icon: Sprout,
  },
  {
    id: "dairy",
    name: "Dairy",
    emoji: "🐄",
    description: "Milk yields, chilling logs, herd health, and dairy cooperative linkages.",
    tag: "Animal Husbandry",
    icon: Milk,
  },
  {
    id: "poultry",
    name: "Poultry",
    emoji: "🐔",
    description: "Broiler & layer batches, feed conversion, and poultry market supplies.",
    tag: "Livestock",
    icon: Egg,
  },
  {
    id: "fisheries",
    name: "Fisheries",
    emoji: "🐟",
    description: "Aquaculture ponds, fingerling batches, water parameters, and cold chain dispatch.",
    tag: "Aquaculture",
    icon: Fish,
  },
  {
    id: "livestock",
    name: "Livestock",
    emoji: "🐐",
    description: "Goat, sheep, and cattle breeding, vaccination schedules, and live animal trade.",
    tag: "Breeding & Rearing",
    icon: Beef,
  },
  {
    id: "beekeeping",
    name: "Beekeeping",
    emoji: "🐝",
    description: "Apiary locations, honey extraction cycles, and pollination ecosystem records.",
    tag: "Allied Farming",
    icon: Flame,
  },
  {
    id: "equipment",
    name: "Equipment",
    emoji: "🚜",
    description: "Tractor sharing, harvesters, drone services, and maintenance scheduling.",
    tag: "Mechanization",
    icon: Tractor,
  },
  {
    id: "inputs",
    name: "Agricultural Inputs",
    emoji: "🌱",
    description: "Certified seeds, bio-fertilizers, solar irrigation units, and micro-nutrients.",
    tag: "Supply & Seeds",
    icon: Package,
  },
];

export const WHY_FARMLY_POINTS: WhyFarmlyPoint[] = [
  {
    id: "one-identity",
    title: "One Digital Identity for Farming Activities",
    description:
      "Replace paper books and fragmented logs with a single verified profile that validates your farming credentials across agencies.",
    icon: UserCheck,
  },
  {
    id: "multi-domain",
    title: "Multiple Farming Domains Under One Platform",
    description:
      "Whether you manage 5 acres of wheat, 10 dairy cattle, or a commercial poultry shed, your operations live together seamlessly.",
    icon: Boxes,
  },
  {
    id: "less-disconnected",
    title: "Less Dependence on Disconnected Systems",
    description:
      "Eliminate confusion caused by incompatible apps, middlemen records, and isolated ledgers with unified digital connectivity.",
    icon: FileCheck2,
  },
  {
    id: "easy-access",
    title: "Easier Access to Buyers and Services",
    description:
      "Get discovered by verified buyers, input vendors, and agricultural financing institutions seeking verified farm records.",
    icon: Store,
  },
  {
    id: "farmer-centric",
    title: "Designed Around Farmers",
    description:
      "Every flow is engineered for rapid entry, high readability in outdoor sunlight, and zero technical friction.",
    icon: HeartHandshake,
  },
  {
    id: "built-to-scale",
    title: "Built to Scale as Farmly Grows",
    description:
      "Modern cloud architecture prepared to integrate regional languages, voice interfaces, and ecosystem marketplaces.",
    icon: TrendingUp,
  },
];



export const USER_ROLES: UserRoleOption[] = [
  {
    id: "farmer",
    label: "Farmer",
    description: "Register crop lots, upload certificates, and sell your produce.",
    icon: Sprout,
  },
  {
    id: "helper",
    label: "Field Helper",
    description: "Register and assist farmers with records and crop lots.",
    icon: HeartHandshake,
  },
  {
    id: "distributor",
    label: "Distributor",
    description: "Inspect certified lots and buy produce from farmers.",
    icon: Truck,
  },
  {
    id: "retailer",
    label: "Retailer",
    description: "Buy from distributors and verify product traceability.",
    icon: Building2,
  },
];

export const FOOTER_SECTIONS = [
  {
    title: "Platform",
    links: [
      { label: "Overview", href: "/#top" },
      { label: "Features", href: "/#features" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Ecosystem", href: "/#ecosystem" },
    ],
  },
  {
    title: "Access",
    links: [
      { label: "Login", href: "/login" },
      { label: "Sign Up", href: "/signup" },
      { label: "Farmer Portal (Upcoming)", href: "#" },
      { label: "Buyer Network (Upcoming)", href: "#" },
    ],
  },
  {
    title: "Company & Trust",
    links: [
      { label: "About Farmly", href: "/#about" },
      { label: "Security & Privacy", href: "#privacy" },
      { label: "Terms of Service", href: "#terms" },
      { label: "Support & Contact", href: "mailto:support@farmly.ag" },
    ],
  },
];
