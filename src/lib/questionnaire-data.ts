export type QuestionType =
  | "text"
  | "textarea"
  | "radio"
  | "multiselect"
  | "color"
  | "websiteList"
  | "fileUpload"
  | "domainSearch"
  | "socialMedia"
  | "teamMembers"
  | "services"
  | "searchableDropdown"
  | "professionalEmails"; // Added the new type

export interface PlanCondition {
  type: "plan";
  plans: string[]; // Array of plan types where this question should appear
}

// Define the question interface
export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  subtext?: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  validationMessage?: string;
  validateFn?: (value: any) => boolean;
  condition?: {
    questionId: string | string[];
    expectedAnswer: string | string[];
  };
  planCondition?: PlanCondition; // Property for plan-specific conditions
  fileType?: "image" | "multiple-images";
  acceptedFileTypes?: string;
  category?: string; // Added to categorize questions
  showUploadInline?: boolean; // For showing uploads inline with radio option
}

// Business categories
export const businessCategories = [
  "DJ",
  "Florist & Gardening",
  "Advertising",
  "Digital agency",
  "Consulting",
  "Law firm",
  "Dental clinic",
  "Books & Publishers",
  "Travel services",
  "Hospital",
  "Event production",
  "Bar",
  "Accounting",
  "Spa",
  "Cleaning",
  "Real Estate",
  "NGO",
  "Medical & Clinic",
  "Photography",
  "eLearning",
  "Pet & Animal",
  "Health Coach",
  "Landscaping",
  "Electrician",
  "Fashion design",
  "Plumbing",
  "Graphic & Web",
  "Insurance",
  "Artist",
  "Production companies",
  "Home & Decor",
  "Transportation",
  "Gym & Fitness",
  "Technology company",
  "Wine & Winery",
  "Recruitment",
  "Venues",
  "Kindergarten",
  "Hotel & BnB",
  "Catering",
  "Interior",
  "Author & Writer",
  "Portfolio",
  "Courier",
  "Conferences & Meetups",
  "Yoga",
  "Architecture",
  "Dentist & Dental",
  "Makeup & Cosmetic",
  "Food",
  "School",
  "Online trainings",
  "Cafe & Bakery",
  "Podcast",
  "Film studio",
  "Transport",
  "Pub",
  "CBD",
  "Doctor",
  "Religion",
  "Wedding",
  "Club",
  "Restaurants",
  "Coffee shop",
  "Vlog",
  "Startup",
  "Charity & Nonprofit",
  "College",
  "Massage therapy",
  "Salon",
  "Animation studios",
  "Digital marketing agency",
  "Branding",
  "Life Coach",
  "Musician & Singer",
  "University",
  "Construction",
  "Counseling services",
  "Gallery",
  "Blog",
];

// Define the questions for the questionnaire
export const questionsData: Question[] = [
  // --- BUSINESS BASICS ---
  {
    id: "businessName",
    type: "text",
    question: "What's your business name?",
    placeholder: "E.g., Acme Corporation",
    required: true,
    validationMessage: "Business name is required",
    category: "basics",
  },
  {
    id: "businessDescription",
    type: "textarea",
    question: "Briefly describe your business",
    placeholder: "What products or services do you offer? What's your mission?",
    required: true,
    validationMessage: "Business description is required",
    category: "basics",
  },
  {
    id: "businessStory",
    type: "textarea",
    question: "What's your business story?",
    subtext:
      "Share your origin story, expertise, and how long you've been in business",
    placeholder:
      "Tell us how your business started and what makes it special...",
    required: false,
    category: "basics",
  },
  {
    id: "businessUnique",
    type: "textarea",
    question: "What makes your business unique?",
    subtext: "Share your competitive advantages and why customers choose you",
    placeholder:
      "Your unique selling points, special offers, proprietary methods...",
    required: false,
    category: "basics",
  },
  {
    id: "businessEmployeeCount",
    type: "text",
    question: "How many employees does your business have?",
    subtext: "We'll use this to craft appropriate content for your website",
    placeholder: "E.g., 5, 10-20, etc.",
    required: false,
    category: "basics",
  },
  {
    id: "businessCategory",
    type: "searchableDropdown",
    question: "What category best describes your business?",
    options: businessCategories,
    required: true,
    validationMessage: "Please select a business category",
    category: "basics",
  },

  // --- BUSINESS TYPE ---
  {
    id: "websiteType",
    type: "radio",
    question: "What type of website do you need?",
    options: [
      "Ecommerce (product sales)",
      "Online service business (24/7 availability)",
      "Local service business (specific hours of operation)",
      "Portfolio/showcase website",
      "SaaS/web application",
    ],
    required: true,
    validationMessage: "Please select a website type",
    category: "businessType",
  },

  // --- DOMAIN INFORMATION --- (UPDATED SECTION)
  {
    id: "hasDomain",
    type: "radio",
    question: "Do you already have a domain name?",
    options: ["Yes", "No"],
    required: true,
    validationMessage: "Please indicate if you have a domain",
    category: "domain",
  },
  {
    id: "domainName",
    type: "text",
    question: "What's your domain name?",
    placeholder: "yourdomain.com",
    required: true,
    validationMessage: "Please enter your domain name",
    validateFn: (value) => {
      // Simple validation for domain format (without http/https)
      return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(
        value
      );
    },
    condition: {
      questionId: "hasDomain",
      expectedAnswer: "Yes",
    },
    category: "domain",
  },
  {
    id: "domainProvider",
    type: "text",
    question: "Who is your domain provider?",
    placeholder: "e.g., GoDaddy, Namecheap, Google Domains",
    required: false,
    condition: {
      questionId: "hasDomain",
      expectedAnswer: "Yes",
    },
    category: "domain",
  },
  {
    id: "existingDomainChoice",
    type: "radio",
    question: "Domain options",
    subtext: "Your Business/Enterprise plan includes a free custom domain",
    options: ["Keep using my existing domain", "Get a free custom domain"],
    required: true,
    condition: {
      questionId: "hasDomain",
      expectedAnswer: "Yes",
    },
    planCondition: {
      type: "plan",
      plans: ["business", "enterprise"],
    },
    category: "domain",
  },
  {
    id: "wantFreeDomain",
    type: "radio",
    question: "Would you like a free custom domain?",
    subtext: "Your Business/Enterprise plan includes a free domain name",
    options: ["Yes", "No"],
    required: true,
    validationMessage: "Please select an option",
    condition: {
      questionId: "hasDomain",
      expectedAnswer: "No",
    },
    planCondition: {
      type: "plan",
      plans: ["business", "enterprise"],
    },
    category: "domain",
  },
  {
    id: "customDomainName",
    type: "domainSearch",
    question: "Select your free domain",
    placeholder: "Search for a domain (e.g: yourbusiness)",
    required: true,
    condition: {
      questionId: "wantFreeDomain",
      expectedAnswer: "Yes",
    },
    planCondition: {
      type: "plan",
      plans: ["business", "enterprise"],
    },
    category: "domain",
  },
  {
    id: "nonPremiumDomainOption",
    type: "radio",
    question: "Domain options",
    subtext: "Upgrade to business or enterprise plan for a free custom domain",
    options: ["Use my existing domain", "Use mywebsite.lumixdigital.site"],
    required: true,
    condition: {
      questionId: "hasDomain",
      expectedAnswer: "No",
    },
    planCondition: {
      type: "plan",
      plans: ["starter", "basic", "free"],
    },
    category: "domain",
  },
  // --- EMAIL ADDRESSES ---
  {
    id: "professionalEmails",
    type: "professionalEmails",
    question: "Set up your professional email addresses",
    subtext: "Create email addresses for your business that match your domain",
    required: false,
    condition: {
      questionId: "hasDomain",
      expectedAnswer: ["Yes", "No"],
    },
    planCondition: {
      type: "plan",
      plans: ["launch", "business", "enterprise"],
    },
    category: "domain",
  },

  // --- WEBSITE INFORMATION ---
  {
    id: "hasCurrentWebsite",
    type: "radio",
    question: "Do you currently have a website?",
    options: ["Yes", "No"],
    required: true,
    validationMessage: "Please indicate if you have a current website",
    category: "websiteInfo",
  },
  {
    id: "currentWebsiteUrl",
    type: "text",
    question: "What's your current website URL?",
    placeholder: "www.yourbusiness.com",
    required: true,
    validationMessage: "Please enter your current website URL",
    condition: {
      questionId: "hasCurrentWebsite",
      expectedAnswer: "Yes",
    },
    category: "websiteInfo",
  },
  {
    id: "websiteLikes",
    type: "textarea",
    question: "What do you like about your current website?",
    placeholder:
      "Features, design elements, or functionality you want to keep...",
    required: false,
    condition: {
      questionId: "hasCurrentWebsite",
      expectedAnswer: "Yes",
    },
    category: "websiteInfo",
  },
  {
    id: "websiteDislikes",
    type: "textarea",
    question: "What would you like to improve about your current site?",
    placeholder: "Issues, outdated elements, or missing features...",
    required: false,
    condition: {
      questionId: "hasCurrentWebsite",
      expectedAnswer: "Yes",
    },
    category: "websiteInfo",
  },
  {
    id: "currentCms",
    type: "text",
    question: "What platform is your current website built on?",
    placeholder: "E.g., WordPress, Shopify, Wix, etc.",
    required: false,
    condition: {
      questionId: "hasCurrentWebsite",
      expectedAnswer: "Yes",
    },
    category: "websiteInfo",
  },
  {
    id: "usingEcommerce",
    type: "radio",
    question: "Are you using an ecommerce platform for your products?",
    options: ["Yes", "No"],
    required: true,
    condition: {
      questionId: "websiteType",
      expectedAnswer: "Ecommerce (product sales)",
    },
    category: "websiteInfo",
  },
  {
    id: "ecommerceUrl",
    type: "text",
    question: "What's the URL of your ecommerce platform?",
    placeholder: "E.g., yourstore.shopify.com",
    required: true,
    condition: {
      questionId: "usingEcommerce",
      expectedAnswer: "Yes",
    },
    category: "websiteInfo",
  },
  {
    id: "usingBookingPlatform",
    type: "radio",
    question: "Are you taking bookings/orders on any existing platform?",
    subtext:
      "Such as Etsy, Amazon, Booking.com, etc. (Select 'Yes' only if you have a link)",
    options: ["Yes", "No"],
    required: true,
    condition: {
      questionId: "websiteType",
      expectedAnswer: [
        "Online service business (24/7 availability)",
        "Local service business (specific hours of operation)",
      ],
    },
    category: "websiteInfo",
  },
  {
    id: "bookingPlatformUrl",
    type: "text",
    question: "What's the URL of your booking/ordering platform?",
    placeholder: "E.g., yourshop.etsy.com",
    required: true,
    condition: {
      questionId: "usingBookingPlatform",
      expectedAnswer: "Yes",
    },
    category: "websiteInfo",
  },

  // --- BUSINESS HOURS (Only for Local Business) ---
  {
    id: "wantBusinessHours",
    type: "radio",
    question: "Business hours",
    options: [
      "I'll provide my business hours",
      "I don't need hours on my website",
    ],
    required: true,
    condition: {
      questionId: "websiteType",
      expectedAnswer: "Local service business (specific hours of operation)",
    },
    category: "businessHours",
  },
  {
    id: "businessHours",
    type: "textarea",
    question: "What are your business hours?",
    subtext: "Example: Mon-Fri 9:00am-6:00pm, Sat 9:30am-5:30pm",
    placeholder: "List your hours of operation by day",
    required: true,
    condition: {
      questionId: "wantBusinessHours",
      expectedAnswer: "I'll provide my business hours",
    },
    category: "businessHours",
  },

  // --- DESIGN AND CONTENT PREFERENCES ---
  {
    id: "websitePages",
    type: "multiselect",
    question: "What pages do you want on your website?",
    options: [
      "Home",
      "About",
      "Services",
      "Products",
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
    category: "designPreferences",
  },
  {
    id: "websiteStyle",
    type: "multiselect",
    question: "What style describes your ideal website?",
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
    category: "designPreferences",
  },
  {
    id: "colorPreferences",
    type: "color",
    question: "What colors would you like for your website?",
    placeholder: "Add hex codes for your preferred colors (e.g., #FF5733)",
    required: false,
    category: "designPreferences",
  },
  {
    id: "favoriteWebsites",
    type: "websiteList",
    question: "Any websites you admire for inspiration?",
    placeholder: "Website name - www.example.com",
    required: false,
    category: "designPreferences",
  },
  {
    id: "ctaOptions",
    type: "text",
    question: "What call-to-action (CTA) buttons do you want?",
    subtext:
      "Examples: Book Now, Register, Sign In, Donate, Buy, Subscribe, Contact Us",
    placeholder: "Enter your desired CTA text",
    required: true,
    category: "designPreferences",
  },
  {
    id: "heroImageOption",
    type: "radio",
    question: "Hero image for your website",
    options: ["I'll upload my own image", "Please choose one for me"],
    required: true,
    showUploadInline: true,
    category: "designPreferences",
  },
  {
    id: "heroImageUpload",
    type: "fileUpload",
    question: "Upload your hero image",
    required: true,
    fileType: "image",
    acceptedFileTypes: "image/png,image/jpeg,image/jpg",
    condition: {
      questionId: "heroImageOption",
      expectedAnswer: "I'll upload my own image",
    },
    category: "designPreferences",
  },

  // --- BRAND ASSETS ---
  {
    id: "logoUpload",
    type: "fileUpload",
    question: "Upload your company logo",
    subtext: "Skip if you don't have one yet",
    required: false,
    fileType: "image",
    acceptedFileTypes: "image/png,image/jpeg,image/svg+xml",
    category: "brandAssets",
  },
  {
    id: "faviconUpload",
    type: "fileUpload",
    question: "Upload your favicon (browser tab icon)",
    subtext: "Skip if you don't have one yet",
    required: false,
    fileType: "image",
    acceptedFileTypes:
      "image/png,image/x-icon,image/svg+xml,image/jpg,image/jpeg",
    category: "brandAssets",
  },

  // --- TEAM INFORMATION ---
  {
    id: "wantTeamDisplay",
    type: "radio",
    question: "Do you want to showcase your team on your website?",
    options: ["Yes", "No"],
    required: true,
    category: "teamInfo",
  },
  {
    id: "teamMembers",
    type: "teamMembers",
    question: "Add your team members",
    subtext: "Add up to 8 team members with their details and photos",
    required: true,
    condition: {
      questionId: "wantTeamDisplay",
      expectedAnswer: "Yes",
    },
    category: "teamInfo",
  },

  // --- SERVICE INFORMATION (Only for Business Websites) ---
  {
    id: "services",
    type: "services",
    question: "What services do you offer?",
    subtext: "Add up to 3 key services (you can add more later in the editor)",
    required: true,
    condition: {
      questionId: "websiteType",
      expectedAnswer: [
        "Online service business (24/7 availability)",
        "Local service business (specific hours of operation)",
      ],
    },
    category: "serviceInfo",
  },

  // --- SOCIAL MEDIA AND MULTIMEDIA ---
  {
    id: "hasSocialMedia",
    type: "radio",
    question: "Is your business on social media?",
    options: ["Yes", "No"],
    required: true,
    category: "socialMediaAndMultimedia",
  },
  {
    id: "socialMediaLinks",
    type: "socialMedia",
    question: "Add your social media profiles",
    subtext: "Link your business social media accounts",
    required: true,
    condition: {
      questionId: "hasSocialMedia",
      expectedAnswer: "Yes",
    },
    category: "socialMediaAndMultimedia",
  },
  {
    id: "hasVideos",
    type: "radio",
    question: "Do you have videos to showcase on your website?",
    subtext: "YouTube or Vimeo links that highlight your business",
    options: ["Yes", "No"],
    required: true,
    category: "socialMediaAndMultimedia",
  },
  {
    id: "videoLinks",
    type: "websiteList",
    question: "Add your video links",
    placeholder: "Video title - https://youtube.com/...",
    required: true,
    condition: {
      questionId: "hasVideos",
      expectedAnswer: "Yes",
    },
    category: "socialMediaAndMultimedia",
  },
  {
    id: "teamPhotos",
    type: "fileUpload",
    question: "Upload additional photos for your website",
    subtext: "Product, team, or workspace photos (max 10 images, 50MB total)",
    required: false,
    fileType: "multiple-images",
    acceptedFileTypes: "image/png,image/jpeg,image/jpg",
    category: "socialMediaAndMultimedia",
  },

  // --- CONTENT STRATEGY ---
  {
    id: "contentReady",
    type: "radio",
    question: "Website content",
    options: [
      "I'd like professional copywriting assistance",
      "I'll add my own content later",
    ],
    required: true,
    validationMessage: "Please select a content option",
    category: "contentStrategy",
  },

  // --- ADDITIONAL INFORMATION ---
  {
    id: "additionalInfo",
    type: "textarea",
    question: "Any additional information we should know?",
    subtext: "Share any other important details about your website needs",
    placeholder: "Special requirements, technical needs, or other requests...",
    required: false,
    category: "additionalInfo",
  },
];
