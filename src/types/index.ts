// src/types/index.ts

// Tab type definition to be used across components
export type TabType =
  | "overview"
  | "domain"
  | "website"
  | "questionnaire"
  | "phases"
  | "feedback"
  | "notes"
  | "analytics";

// Project Phase types
export interface ProjectPhase {
  name: string;
  status: "completed" | "active" | "pending";
  tasks: {
    name: string;
    completed: boolean;
  }[];
}

// User-related types
export interface UserData {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  hasPaid?: boolean;
  stripeCustomerId?: string;
  subscriptionStatus?: "active" | "canceled" | "pending" | "suspended";
  paymentMethod?: string;
  completedQuestionnaire?: boolean;
  questionnaireAnswers?: QuestionnaireAnswers;
  createdAt?: string;
  updatedAt?: string;
  planType?: string;
  billingCycle?: string;
  projectPhases?: ProjectPhase[]; // Added project phases to the user data type
  websiteUrl?: string; // Live URL for the customer's website
  websitePreviewUrl?: string; // URL for website preview image
  feedbackMessages?: FeedbackMessage[];
  editorUrl?: string;
  revisionsUrl?: string;
  notes?: string; // Added notes field for client notes feature
  // Reminder questionnaire stuff
  questionnairePostponed?: boolean;
  questionnaireReminderStatus?: string;
  firstReminderTime?: string;
  secondReminderTime?: string;
  websitePublishedDate?: string; // Date when the website was published (used in analytics)
  authProvider?: string; // Added authProvider field for OAuth login tracking
}

export interface FeedbackMessage {
  text: string;
  timestamp: string;
  isFromClient: boolean;
  isRead: boolean;
  userId: string;
  userEmail?: string;
  userName?: string;
  adminName?: string;
}

// For file uploads
export interface FileUpload {
  name: string;
  url: string;
  type: string;
  size: number;
}

// For website list entries
export interface WebsiteEntry {
  name: string;
  url: string;
}

// For social media links
export interface SocialMediaLink {
  platform: string;
  url: string;
}

// For team members
export interface TeamMember {
  name: string;
  position: string;
  description: string;
  socialMedia?: SocialMediaLink[];
  image?: FileUpload;
}

// For services
export interface Service {
  name: string;
  description: string;
  price?: string;
  image?: FileUpload;
}

// Adding domain information type
export interface DomainInfo {
  name: string;
  isCustom: boolean;
  provider?: string;
  registrationDate?: string;
  expiryDate?: string;
}

// Questionnaire answers can have different types depending on the question
export interface QuestionnaireAnswers {
  [key: string]:
    | string
    | string[]
    | WebsiteEntry[]
    | SocialMediaLink[]
    | TeamMember[]
    | Service[]
    | FileUpload
    | FileUpload[]
    | DomainInfo
    | null
    | undefined;

  // Business Information
  businessName?: string;
  businessTagline?: string;
  businessDescription?: string;
  businessGoals?: string;
  businessUnique?: string;
  businessStory?: string;
  businessEmployeeCount?: string;
  businessCategory?: string;

  // Website Type
  websiteType?: string;

  // Services and Products
  servicesProducts?: string;
  services?: Service[];

  // Business Hours
  wantBusinessHours?: string;
  businessHours?: string;

  // Team Information
  wantTeamDisplay?: string;
  teamMembers?: TeamMember[];

  // Competitors and Market
  competitors?: WebsiteEntry[];
  targetAudience?: string;
  businessProblemSolving?: string;

  // Current Website
  hasCurrentWebsite?: string;
  currentWebsiteUrl?: string;
  websiteLikes?: string;
  websiteDislikes?: string;
  currentCms?: string;
  usingEcommerce?: string;
  ecommerceUrl?: string;
  usingBookingPlatform?: string;
  bookingPlatformUrl?: string;

  // Project Goals
  primaryWebsiteGoal?: string;
  desiredVisitorActions?: string[];
  ctaOptions?: string;

  // Website Structure
  websitePages?: string[];
  ecommerceNeeded?: string;
  blogNeeded?: string;

  // Design Preferences
  colorPreferences?: string[];
  websiteStyle?: string[];
  favoriteWebsites?: WebsiteEntry[];
  heroImageOption?: string;
  heroImageUpload?: FileUpload;

  // Content & Media
  logoUpload?: FileUpload;
  faviconUpload?: FileUpload;
  teamPhotos?: FileUpload[];
  contentReady?: string;
  hasSocialMedia?: string;
  socialMediaLinks?: SocialMediaLink[];
  hasVideos?: string;
  videoLinks?: WebsiteEntry[];

  // Technical & Admin
  hasDomain?: string;
  domainName?: string;
  domainOption?: string;
  customDomainName?: string; // For custom domain input
  nonPremiumDomainOption?: string;

  // Additional Info
  additionalInfo?: string;
}
