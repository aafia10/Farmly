import { type LucideIcon } from "lucide-react";

export type UserRole =
  | "farmer"
  | "helper"
  | "distributor"
  | "retailer"
  | "fpo"
  | "collection_center"
  | "quality_assessor"
  | "admin";

export interface UserRoleOption {
  id: UserRole;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface TrustItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
}

export interface PlatformFeature {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
}

export interface FarmingCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tag: string;
  icon: LucideIcon;
}

export interface WhyFarmlyPoint {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  role: UserRole;
  state?: string;
  district?: string;
  preferredLanguage?: string;
  organization?: string;
}

// ----------------------------------------------------
// Domain Models for Farmly Workflows
// ----------------------------------------------------

export interface Farmer {
  id: string; // e.g. "FM-10294"
  profileId?: string;
  name: string;
  mobile: string;
  village: string;
  taluka?: string;
  district: string;
  state: string;
  language: string;
  farmingCategory: string;
  fpo?: string;
  consent: boolean;
  verificationLevel: "Basic" | "Field Verified" | "Identity Confirmed";
  status: "Active" | "Pending" | "Needs Review";
  lastActivity: string;
  assistedByHelperId?: string;
  assistedBy?: {
    helperName: string;
    date: string;
  };
}

export interface CropAvailability {
  id: string; // "CA-401"
  farmerId: string;
  farmerName: string;
  crop: string;
  variety: string;
  estimatedQuantity: number;
  unit: string;
  expectedHarvestDate: string;
  location: string;
  notes?: string;
  status: "Draft" | "Available" | "Under Review" | "Converted to Lot" | "Sold";
  createdAt: string;
}

export interface Lot {
  id: string; // "LT-20391"
  farmerId: string;
  farmerName: string;
  crop: string;
  variety: string;
  quantity: number;
  unit: string;
  currentOwner: string;
  status: "Active" | "Under Offer" | "Sold" | "Split" | "In Transit" | "Delivered";
  qualityGrade: "Grade A" | "Grade B" | "Standard";
  createdDate: string;
  location: string;
  assistedBy?: string;
  parentLotId?: string;
  childLots?: string[];
  weighmentScaleId?: string;
  certificateRef?: string;
  blockchainHash?: string;
  ipfsHash?: string;
}

export interface EvidenceItem {
  id: string; // "EV-901"
  lotId: string;
  farmerId: string;
  farmerName: string;
  type: "Weighment" | "Moisture Test" | "Quality Certificate" | "Field Photo" | "Scale Receipt";
  category: "Farmer Declared" | "Evidence Backed" | "Externally Verified";
  title: string;
  value: string;
  source: string;
  timestamp: string;
  status: "Pending" | "Reviewed" | "Verified" | "Needs Review";
  issuer?: string;
  documentRef?: string;
}

export interface Offer {
  id: string; // "OF-1032"
  lotId: string;
  crop: string;
  buyerName: string;
  buyerType: string;
  offeredQuantity: number;
  unit: string;
  pricePerKg: number;
  grossValue: number;
  deductions: {
    transport: number;
    loading: number;
    commission: number;
    platformFee: number;
    other: number;
  };
  totalDeductions: number;
  expectedNet: number;
  offerDeadline: string;
  status: "Pending" | "Accepted" | "Rejected" | "Expired";
  createdAt: string;
}

export type PaymentStage =
  | "Offer Accepted"
  | "Goods Handed Over"
  | "Payment Due"
  | "Payment Initiated"
  | "Reference Submitted"
  | "Farmer Confirmation"
  | "Closed";

export type PaymentStatus =
  | "Pending"
  | "Due"
  | "Initiated"
  | "Reference Submitted"
  | "Received"
  | "Overdue"
  | "Dispute"
  | "Resolved"
  | "Closed";

export interface PaymentTimelineStep {
  stage: PaymentStage;
  timestamp: string;
  completed: boolean;
  note?: string;
}

export interface Payment {
  id: string; // "PY-8831"
  offerId: string;
  lotId: string;
  payerName: string;
  payeeName: string;
  amount: number;
  currentStage: PaymentStage;
  status: PaymentStatus;
  timeline: PaymentTimelineStep[];
  transactionRef?: string;
  createdAt: string;
}

export interface DisputeTimelineEntry {
  date: string;
  actor: string;
  action: string;
}

export interface Dispute {
  id: string; // "DP-401"
  lotId: string;
  farmerName: string;
  buyerName: string;
  category: "Weight Mismatch" | "Quality Grade" | "Payment Delay" | "Delivery Dispute";
  description: string;
  evidence: string[];
  status: "Open" | "Under Review" | "Waiting for Evidence" | "Resolved" | "Closed";
  createdDate: string;
  resolutionTimeline: DisputeTimelineEntry[];
}

export interface TransactionRecord {
  id: string;
  type: "Sale" | "Purchase" | "Transfer" | "Settlement" | "Fee";
  lotId: string;
  crop: string;
  quantity: number;
  counterparty: string;
  amount: number;
  status: "Completed" | "Pending" | "In Escrow";
  date: string;
}

export interface NotificationItem {
  id: string;
  category: "Offer" | "Payment" | "Lot" | "Evidence" | "Dispute" | "Farmer activity" | "System";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link: string;
}

export interface HelperActivity {
  id: string;
  timestamp: string;
  action: string;
  category: "Registration" | "Crop Availability" | "Lot Creation" | "Evidence" | "Offer" | "Profile";
  details: string;
  badgeStatus: "Assisted" | "Pending" | "Completed" | "Needs Review";
}

export type InformationSource =
  | "Farmer-declared"
  | "Helper-entered"
  | "Scale-measured"
  | "Meter-measured"
  | "Assessor-recorded"
  | "Lab-certified"
  | "Certificate-verified"
  | "Externally sourced";

export interface SourceTaggedField<T> {
  value: T;
  source: InformationSource;
  timestamp?: string;
  verifiedBy?: string;
}

export interface CollectionArrival {
  id: string; // e.g. "ARR-881"
  farmerId: string;
  farmerName: string;
  crop: string;
  variety: string;
  declaredQuantity: number;
  measuredQuantity: number;
  unit: string;
  scaleId: string;
  scalePhotoUrl?: string;
  moisturePercent: number;
  qualityGrade: "Grade A" | "Grade B" | "Standard";
  status: "Checked In" | "Weighed" | "Lot Created" | "Handed Over";
  timestamp: string;
  recordedBy: string;
}

export interface QualityAssessment {
  id: string; // e.g. "QA-109"
  lotId: string;
  crop: string;
  moisturePercent: number;
  foreignMatterPercent: number;
  visibleSpoilage: "None" | "Low" | "Moderate" | "High";
  assignedGrade: "Grade A" | "Grade B" | "Standard";
  method: string;
  assessedBy: string;
  reportNotes: string;
  status: "Pending" | "Certified" | "Rejected";
  timestamp: string;
}

export interface FPOMember {
  id: string; // "MEM-201"
  farmerId: string;
  name: string;
  village: string;
  crops: string[];
  shareHolding: number; // in shares
  totalContributedKg: number;
  status: "Active" | "Pending";
  joinedDate: string;
}

export interface AdminAuditAlert {
  id: string; // "ALT-701"
  severity: "High" | "Medium" | "Low";
  category: "QR Anomaly" | "Duplicate Lot" | "Payment Delay" | "Deduction Discrepancy" | "Scale Miscalibration";
  description: string;
  relatedEntityId: string;
  timestamp: string;
  status: "Investigating" | "Resolved" | "Ignored";
}

export interface MixedLotComponent {
  sourceLotId: string;
  sourceFarmer: string;
  quantity: number;
  percentage: number;
}
