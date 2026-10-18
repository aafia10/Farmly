export type UserRole =
  | "farmer"
  | "helper"
  | "distributor"
  | "retailer"
  | "fpo"
  | "collection_center"
  | "quality_assessor"
  | "admin";

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

export interface Farmer {
  id: string;
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
  id: string;
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
  id: string;
  farmerId: string;
  farmerName: string;
  crop: string;
  variety: string;
  quantity: number;
  unit: string;
  currentOwner: string;
  status: "Draft" | "Active" | "Under Offer" | "Sold" | "Split" | "In Transit" | "Delivered";
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
  id: string;
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
  fileUrl?: string;
}

export interface Offer {
  id: string;
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
  id: string;
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
  id: string;
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
  blockchainHash?: string;
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

export interface CollectionArrival {
  id: string;
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
  id: string;
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
  id: string;
  farmerId: string;
  name: string;
  village: string;
  crops: string[];
  shareHolding: number;
  totalContributedKg: number;
  status: "Active" | "Pending";
  joinedDate: string;
}

export interface AdminAuditAlert {
  id: string;
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

export interface MixedLotItem {
  id: string;
  name: string;
  outputQuantity: number;
  loss: number;
  components: MixedLotComponent[];
}
