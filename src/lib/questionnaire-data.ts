// Define the question types
export type QuestionType =
  | "text"
  | "textarea"
  | "radio"
  | "multiselect"
  | "color"
  | "websiteList"
  | "fileUpload"; // Added file upload type

// Define the question interface
export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  validationMessage?: string;
  validateFn?: (value: any) => boolean;
  condition?: {
    questionId: string;
    expectedAnswer: string | string[];
  };
  fileType?: "image" | "multiple-images"; // Added for file upload questions
  acceptedFileTypes?: string; // e.g., "image/png,image/jpeg"
}

// Define the questions for the questionnaire
export const questionsData: Question[] = [
  {
    id: "businessName",
    type: "text",
    question: "What is the name of your business?",
    placeholder: "E.g., Acme Corporation",
    required: true,
    validationMessage: "Business name is required",
  },
  {
    id: "businessDescription",
    type: "textarea",
    question: "Briefly describe what your business does.",
    placeholder: "Describe your products, services, and mission...",
    required: true,
    validationMessage: "Business description is required",
  },
  {
    id: "servicesProducts",
    type: "textarea",
    question: "What services or products do you offer?",
    placeholder: "List your main services or products...",
    required: true,
    validationMessage: "Services or products information is required",
  },
  {
    id: "competitors",
    type: "websiteList",
    question:
      "Who are your main competitors (please list websites if possible)?",
    placeholder: "E.g., Competitor Name - www.competitor.com",
    required: false,
  },
  {
    id: "targetAudience",
    type: "textarea",
    question: "Who is your target audience?",
    placeholder: "E.g., age, gender, industry, location, pain points...",
    required: true,
    validationMessage: "Target audience information is required",
  },
  {
    id: "hasCurrentWebsite",
    type: "radio",
    question: "Do you currently have a website?",
    options: ["Yes", "No"],
    required: true,
    validationMessage: "Please indicate if you have a current website",
  },
  {
    id: "currentWebsiteUrl",
    type: "text",
    question: "What is the URL of your current website?",
    placeholder: "E.g., www.yourbusiness.com",
    required: false,
    condition: {
      questionId: "hasCurrentWebsite",
      expectedAnswer: "Yes",
    },
  },
  {
    id: "websiteLikes",
    type: "textarea",
    question: "What do you like about your current website?",
    placeholder:
      "List features, design elements, or functionality you'd like to keep...",
    required: false,
    condition: {
      questionId: "hasCurrentWebsite",
      expectedAnswer: "Yes",
    },
  },
  {
    id: "websiteDislikes",
    type: "textarea",
    question:
      "What do you dislike or want to change about your current website?",
    placeholder: "List issues, outdated elements, or missing features...",
    required: false,
    condition: {
      questionId: "hasCurrentWebsite",
      expectedAnswer: "Yes",
    },
  },
  {
    id: "currentCms",
    type: "text",
    question: "What CMS or platform is your current website built on?",
    placeholder: "E.g., WordPress, Shopify, Wix, etc.",
    required: false,
    condition: {
      questionId: "hasCurrentWebsite",
      expectedAnswer: "Yes",
    },
  },
  {
    id: "desiredVisitorActions",
    type: "multiselect",
    question:
      "What specific actions do you want visitors to take on your site?",
    options: [
      "Book a call/consultation",
      "Fill out a contact form",
      "Buy a product/service",
      "Subscribe to newsletter",
      "Download resources",
      "Request a quote",
      "Follow on social media",
    ],
    required: true,
    validationMessage: "Please select at least one desired visitor action",
  },
  {
    id: "websitePages",
    type: "multiselect",
    question: "What pages do you want on your website?",
    options: [
      "Home",
      "About",
      "Services",
      "Contact",
      "Blog",
      "FAQ",
      "Testimonials",
      "Portfolio",
      "Pricing",
      "Team",
    ],
    required: true,
    validationMessage: "Please select at least one page for your website",
  },
  {
    id: "colorPreferences",
    type: "color",
    question: "Do you have a specific color palette you'd like us to use?",
    placeholder:
      "Please add hex codes for your preferred colors (e.g., #FF5733)",
    required: false,
  },
  {
    id: "websiteStyle",
    type: "multiselect",
    question: "What style or tone do you want the website to have?",
    options: [
      "Modern",
      "Corporate",
      "Playful",
      "Minimalist",
      "Luxurious",
      "Bold",
      "Conservative",
      "Creative",
      "Technical",
    ],
    required: true,
    validationMessage: "Please select at least one style for your website",
  },
  // File upload questions added back
  {
    id: "logoUpload",
    type: "fileUpload",
    question: "Please upload your company logo if you have one",
    required: false,
    fileType: "image",
    acceptedFileTypes: "image/png,image/jpeg,image/svg+xml",
  },
  {
    id: "faviconUpload",
    type: "fileUpload",
    question: "Please upload your favicon (site icon) if you have one",
    required: false,
    fileType: "image",
    acceptedFileTypes: "image/png,image/x-icon,image/svg+xml",
  },
  {
    id: "teamPhotos",
    type: "fileUpload",
    question: "Please upload any team photos you want to include (optional)",
    required: false,
    fileType: "multiple-images",
    acceptedFileTypes: "image/png,image/jpeg",
  },
  {
    id: "videoContent",
    type: "text",
    question: "Do you have video content you want embedded on the site?",
    placeholder: "Please describe or provide links to videos",
    required: false,
  },
  {
    id: "contentReady",
    type: "radio",
    question:
      "Would you like us to provide free copywriting, or will you use your own?",
    options: ["We will write all your copy", "Add your own copy later"],
    required: true,
    validationMessage: "Please answer the question",
  },
  {
    id: "domainName",
    type: "text",
    question: "Do you already have a domain name? If so, what is it?",
    placeholder: "E.g., yourbusiness.com",
    required: false,
  },
  {
    id: "domainProvider",
    type: "text",
    question: "Who is your current domain provider?",
    placeholder: "E.g., GoDaddy, Namecheap, Google Domains...",
    required: false,
  },
];
