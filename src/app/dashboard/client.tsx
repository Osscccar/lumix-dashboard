"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/components/firebase-provider";
import { getUserData } from "@/lib/auth-service";
import type { UserData } from "@/types";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Define the project phase types in case they're not already in the types file
interface ProjectPhase {
  name: string;
  status: "completed" | "active" | "pending";
  tasks: {
    name: string;
    completed: boolean;
  }[];
}

import {
  LogOut,
  User,
  Mail,
  CheckCircle,
  Home,
  Settings,
  MessageSquare,
  AlertCircle,
  X,
  Menu,
  ChevronRight,
  Calendar,
  Clock,
  Palette,
  Code,
  Rocket,
  BarChart3,
  Clipboard,
  Bell,
  Zap,
  Layers,
  PieChart,
  Sparkles,
  Star,
  Lightbulb,
  Bookmark,
  FileText,
  ImageIcon,
  Layout,
  Edit,
  Download,
  ExternalLink,
  HelpCircle,
  Sliders,
  Users,
  FileImage,
  Pencil,
  Eye,
  Copy,
  UploadCloud,
  Trash2,
  Plus,
  RefreshCw,
  Share2,
  Smartphone,
  Monitor,
  Tablet,
  HelpingHand,
  Globe,
  Loader2,
  PenTool,
  Phone,
  Facebook,
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
  Globe2,
  Twitter,
  Linkedin,
  Youtube,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import mainLogo from "./public/images/mainLogo.png";

// Default project phases for fallback when none are set
const DEFAULT_PROJECT_PHASES: ProjectPhase[] = [
  {
    name: "Planning",
    status: "active",
    tasks: [
      { name: "Complete our questionnaire", completed: true },
      { name: "Reviewing your answers", completed: false },
    ],
  },
  {
    name: "Design",
    status: "pending",
    tasks: [
      { name: "Designing your website", completed: false },
      { name: "Finalising your website", completed: false },
    ],
  },
  {
    name: "Revisions",
    status: "pending",
    tasks: [
      { name: "Add your edits/revisions", completed: false },
      { name: "Completing your revisions", completed: false },
    ],
  },
  {
    name: "Launch",
    status: "pending",
    tasks: [
      { name: "Adding your domain", completed: false },
      { name: "Publishing your website", completed: false },
    ],
  },
];

// Function to get appropriate icon for a phase
const getPhaseIcon = (phaseName: string, status: string) => {
  // Default icon for pending phases is the lucide icon that matches the name
  if (status === "pending") {
    switch (phaseName.toLowerCase()) {
      case "planning":
        return <Home className="h-4 w-4 text-[#6B7280]" />;
      case "design":
        return <Palette className="h-4 w-4 text-[#6B7280]" />;
      case "revisions":
        return <Clipboard className="h-4 w-4 text-[#6B7280]" />;
      case "launch":
        return <Rocket className="h-4 w-4 text-[#6B7280]" />;
      default:
        return <Layers className="h-4 w-4 text-[#6B7280]" />;
    }
  }

  // For active phases, use orange variant
  if (status === "active") {
    switch (phaseName.toLowerCase()) {
      case "planning":
        return <Home className="h-4 w-4 text-[#F58327]" />;
      case "design":
        return <Palette className="h-4 w-4 text-[#F58327]" />;
      case "revisions":
        return <Clipboard className="h-4 w-4 text-[#F58327]" />;
      case "launch":
        return <Rocket className="h-4 w-4 text-[#F58327]" />;
      default:
        return <Layers className="h-4 w-4 text-[#F58327]" />;
    }
  }

  // For completed phases, use green checkmark icon
  if (status === "completed") {
    return <CheckCircle className="h-4 w-4 text-[#10B981]" />;
  }

  // Default fallback
  return <Layers className="h-4 w-4 text-[#6B7280]" />;
};

// Dynamic Project Phases Component
const ProjectPhasesSection = ({
  projectPhases,
}: {
  projectPhases?: ProjectPhase[];
}) => {
  // If no project phases are defined, use default ones
  const phases = projectPhases || DEFAULT_PROJECT_PHASES;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-[#F0F1F6]">
        <h2 className="text-base font-semibold text-[#111827]">
          Project Timeline
        </h2>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {phases.map((phase: ProjectPhase, index: number) => (
            <div
              key={index}
              className={`rounded-xl bg-white p-4 border border-[#E5E7EB] hover:shadow-sm transition-shadow ${
                phase.status === "pending" ? "opacity-70" : ""
              }`}
            >
              <div className="flex flex-col">
                {/* Header: icon + title + status badge */}
                <div className="flex items-center mb-3">
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      phase.status === "completed"
                        ? "bg-[#D1FAE5]"
                        : phase.status === "active"
                        ? "bg-[#FFF8F3]"
                        : "bg-[#F3F4F6]"
                    }`}
                  >
                    {getPhaseIcon(phase.name, phase.status)}
                  </div>

                  {/* Phase name */}
                  <p className="text-sm font-medium text-[#111827] mr-auto">
                    {phase.name}
                  </p>

                  {/* Status badge - pushed to the right */}
                  {phase.status === "active" && (
                    <span className="px-2 py-0.5 text-[10px] bg-[#FFF8F3] text-[#F58327] rounded-full border border-[#FFEAD5]">
                      Active
                    </span>
                  )}

                  {phase.status === "completed" && (
                    <span className="px-2 py-0.5 text-[10px] bg-[#D1FAE5] text-[#10B981] rounded-full border border-[#A7F3D0]">
                      Complete
                    </span>
                  )}
                </div>

                {/* Tasks - aligned to the left */}
                <div className="space-y-2 pl-1">
                  {phase.tasks.map((task, taskIndex) => (
                    <div key={taskIndex} className="flex items-center">
                      {task.completed ? (
                        <CheckCircle className="h-3.5 w-3.5 text-[#10B981] mr-2" />
                      ) : phase.status === "active" ? (
                        <div className="h-3.5 w-3.5 rounded-full border border-[#F58327] mr-2 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 bg-[#F58327] rounded-full"></div>
                        </div>
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-[#D1D5DB] mr-2"></div>
                      )}
                      <span
                        className={`text-xs ${
                          phase.status === "pending"
                            ? "text-[#6B7280]"
                            : "text-[#4B5563]"
                        }`}
                      >
                        {task.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { user, userData, loading, logout } = useFirebase();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(true);
  const [verifiedUserData, setVerifiedUserData] = useState<UserData | null>(
    null
  );
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [subscriptionCancelled, setSubscriptionCancelled] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [projectSubTab, setProjectSubTab] = useState("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [previewDevice, setPreviewDevice] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const chatRef = useRef<HTMLDivElement>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const feedbackMessagesRef = useRef<HTMLDivElement>(null);

  // Verify user access from Firestore
  useEffect(() => {
    async function verifyUserAccess() {
      if (user) {
        try {
          console.log("Directly verifying user access from Firestore...");
          const latestUserData = await getUserData(user.uid);
          console.log("Latest user data from Firestore:", latestUserData);

          if (latestUserData) {
            setVerifiedUserData(latestUserData);
            if (latestUserData.subscriptionStatus === "canceled") {
              setSubscriptionCancelled(true);
            }
          }
        } catch (error) {
          console.error("Error verifying user access:", error);
        } finally {
          setIsVerifyingAccess(false);
        }
      } else if (!loading) {
        setIsVerifyingAccess(false);
      }
    }

    if (!loading) {
      verifyUserAccess();
    }
  }, [user, loading]);

  // Protect the dashboard route
  useEffect(() => {
    if (!loading && !isVerifyingAccess && !redirectAttempted) {
      setRedirectAttempted(true);

      if (!user) {
        console.log("No user, redirecting to sign in");
        router.push("/");
      } else if (verifiedUserData) {
        if (!verifiedUserData.hasPaid) {
          console.log("User hasn't paid according to Firestore, redirecting");
          router.push("/");
        } else if (!verifiedUserData.completedQuestionnaire) {
          // Only redirect if they haven't completed the questionnaire AND haven't chosen to postpone it
          console.log("User hasn't completed questionnaire");
          router.push("/questionnaire");
        }
      } else if (userData) {
        if (!userData.hasPaid) {
          router.push("/");
        } else if (
          !userData.completedQuestionnaire &&
          !userData.questionnairePostponed
        ) {
          // Only redirect if they haven't completed the questionnaire AND haven't chosen to postpone it
          router.push("/questionnaire");
        }
      }
    }
  }, [
    loading,
    user,
    userData,
    verifiedUserData,
    isVerifyingAccess,
    redirectAttempted,
    router,
  ]);

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      window.location.href = "/?from=logout";
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim() || !user) return;

    try {
      setIsSendingFeedback(true);

      // Prepare the new feedback message
      const newMessage = {
        text: feedbackMessage.trim(),
        timestamp: new Date().toISOString(),
        isFromClient: true,
        isRead: false,
        userId: user.uid,
        userEmail: user.email || "",
        userName: `${displayData?.firstName || ""} ${
          displayData?.lastName || ""
        }`.trim(),
      };

      // Get a reference to the user's document
      const userDocRef = doc(db, "users", user.uid);

      // Use arrayUnion to add the new message to the feedbackMessages array
      await updateDoc(userDocRef, {
        feedbackMessages: arrayUnion(newMessage),
        updatedAt: new Date().toISOString(),
      });

      // Update local state (append new message to the existing messages)
      if (verifiedUserData) {
        setVerifiedUserData({
          ...verifiedUserData,
          feedbackMessages: [
            ...(verifiedUserData.feedbackMessages || []),
            newMessage,
          ],
        });
      }

      // Clear input and close modal
      setFeedbackMessage("");
      setShowFeedbackModal(false);

      // Scroll to bottom of messages after a short delay (to allow rerender)
      setTimeout(() => {
        if (feedbackMessagesRef.current) {
          feedbackMessagesRef.current.scrollTop =
            feedbackMessagesRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error("Error sending feedback:", error);
      // You could add error handling/notification here
    } finally {
      setIsSendingFeedback(false);
    }
  };

  // Handle subscription management
  const handleManageSubscription = () => {
    window.location.href = `/api/create-portal-session?userId=${user?.uid}`;
  };

  // Handle support
  const handleSupport = () => {
    window.location.href = "https://lumixdigital.com.au/contact";
  };

  // Handle chat submission
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatMessage("");
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);
  };
  // Replace your current renderField function with this safer version
  const renderField = (field: any): string => {
    if (field === undefined || field === null) {
      return "";
    }

    if (typeof field === "string") {
      return field;
    }

    if (Array.isArray(field)) {
      if (field.length === 0) return "";
      return field
        .map((item) => (typeof item === "string" ? item : renderField(item)))
        .join(", ");
    }

    if (typeof field === "object") {
      // Handle common properties we know about
      if ("name" in field) return field.name as string;
      if ("url" in field) return field.url as string;

      // For React elements or components that might cause circular references
      if (field.$$typeof || field._owner || field._store) {
        return "[React Component]";
      }

      // For other complex objects, return a simplified representation
      try {
        // Use a simple object description instead of full JSON conversion
        const keys = Object.keys(field).slice(0, 3); // Just get the first few keys
        if (keys.length === 0) return "{}";

        return `{${keys.map((k) => `${k}: ...`).join(", ")}${
          Object.keys(field).length > 3 ? ", ..." : ""
        }}`;
      } catch (e) {
        return "[Complex Object]";
      }
    }

    return String(field);
  };

  const RenderComplexField = ({ field }: { field: any }) => {
    // Handle null/undefined
    if (field === undefined || field === null) {
      return <span className="text-gray-400">None</span>;
    }

    // Handle arrays
    if (Array.isArray(field)) {
      if (field.length === 0)
        return <span className="text-gray-400">None</span>;

      return (
        <div className="space-y-1">
          {field.map((item, idx) => (
            <div key={idx}>
              {typeof item === "string" ? (
                <span>{item}</span>
              ) : (
                <RenderComplexField field={item} />
              )}
            </div>
          ))}
        </div>
      );
    }

    // Handle objects
    if (typeof field === "object") {
      // Special handling for business hours
      if (field.mondayHours || field.tuesdayHours) {
        const daysOfWeek = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ];

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {daysOfWeek.map((day) => {
              const hoursKey = `${day}Hours`;
              const hours = field[hoursKey];

              return (
                <div
                  key={day}
                  className="flex items-center justify-between py-1 border-b border-gray-200"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </span>
                  <span className="text-sm text-gray-800">
                    {hours === "closed" ? (
                      <span className="text-red-500">Closed</span>
                    ) : hours ? (
                      hours
                    ) : (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        );
      }

      // Emails special handling
      if (field.professionalEmails) {
        try {
          const emailData =
            typeof field.professionalEmails === "string"
              ? JSON.parse(field.professionalEmails)
              : field.professionalEmails;

          const emails = Array.isArray(emailData) ? emailData : [];
          const domain =
            field.domainName || field.customDomainName || "example.com";

          return (
            <div className="space-y-1">
              {emails.length > 0 ? (
                emails.map((email, index) => (
                  <div key={index} className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-800">
                      {email}@{domain}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No email addresses configured
                </p>
              )}
            </div>
          );
        } catch (e) {
          return (
            <p className="text-sm text-gray-500">
              Email configuration not valid
            </p>
          );
        }
      }

      // For other objects with common properties
      if ("name" in field) return <span>{field.name}</span>;
      if ("url" in field) return <span>{field.url}</span>;

      // For React elements or components, don't try to render them as strings
      if (field.$$typeof || field._owner || field._store) {
        return <span className="text-gray-500 font-normal">No data found</span>;
      }

      // For other objects, show a simple representation
      return <span className="text-gray-500">Complex Object</span>;
    }

    // Default: convert to string
    return <span>{String(field)}</span>;
  };

  // Use the verified data if available, otherwise fall back to context data
  const displayData = verifiedUserData || userData;

  // Add this effect to scroll to the bottom of messages when they change
  useEffect(() => {
    if (feedbackMessagesRef.current && displayData?.feedbackMessages?.length) {
      feedbackMessagesRef.current.scrollTop =
        feedbackMessagesRef.current.scrollHeight;
    }
  }, [displayData?.feedbackMessages]);

  if (loading || isVerifyingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFBFF]">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="h-1 w-24 bg-[#F0F1F6] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#F58327]"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                }}
              ></motion.div>
            </div>
          </div>
          <p className="text-[#6B7280] font-satoshi">
            {isVerifyingAccess
              ? "Verifying your account..."
              : "Loading your dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  // If subscription is cancelled, show a different screen
  if (subscriptionCancelled) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center p-4 font-satoshi">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-[#FEE4E2] p-3">
              <AlertCircle className="h-12 w-12 text-[#D92D20]" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#111827] mb-2">
            Subscription Cancelled
          </h1>
          <p className="text-[#6B7280] mb-8">
            Your subscription has been cancelled and all access will be lost.
            Your website will stay online until your subscription ends.
          </p>

          <button
            onClick={handleManageSubscription}
            className="cursor-pointer w-full bg-[#F58327] text-white rounded-full py-3 px-4 font-medium hover:bg-[#E67016] transition-colors shadow-sm"
          >
            Reactivate Subscription
          </button>

          <button
            onClick={handleLogout}
            className="cursor-pointer mt-4 w-full bg-white border border-[#E5E7EB] text-[#4B5563] rounded-full py-3 px-4 font-medium hover:bg-[#F9FAFB] transition-colors shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFF] font-satoshi">
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="cursor-pointer p-2 rounded-full bg-white shadow-sm"
        >
          <Menu className="h-5 w-5 text-[#4B5563]" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="cursor-pointer absolute top-4 right-4 md:hidden"
        >
          <X className="h-5 w-5 text-[#9CA3AF]" />
        </button>

        {/* Logo */}
        <div className="flex items-center px-6 py-5 border-b border-[#F0F1F6]">
          <img src={mainLogo.src} alt="" className="w-25 h-10" />
        </div>

        {/* Navigation */}
        <nav className="px-4 py-5">
          <div className="text-xs font-medium text-[#9CA3AF] px-3 mb-3 uppercase tracking-wider">
            Menu
          </div>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab("home")}
                className={`cursor-pointer flex items-center w-full px-3 py-2.5 text-sm rounded-lg ${
                  activeTab === "home"
                    ? "bg-gradient-to-r from-[#FFF8F3] to-[#FFF1E7] text-[#F58327] font-medium"
                    : "text-[#4B5563] hover:bg-[#F9FAFB]"
                }`}
              >
                <Home
                  className={`mr-3 h-4.5 w-4.5 ${
                    activeTab === "home" ? "text-[#F58327]" : "text-[#9CA3AF]"
                  }`}
                />
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab("project");
                  setProjectSubTab("overview");
                }}
                className={`cursor-pointer flex items-center w-full px-3 py-2.5 text-sm rounded-lg ${
                  activeTab === "project"
                    ? "cursor-pointer bg-gradient-to-r from-[#FFF8F3] to-[#FFF1E7] text-[#F58327] font-medium"
                    : "cursor-pointer text-[#4B5563] hover:bg-[#F9FAFB]"
                }`}
              >
                <Layers
                  className={`mr-3 h-4.5 w-4.5 ${
                    activeTab === "project"
                      ? "text-[#F58327]"
                      : "text-[#9CA3AF]"
                  }`}
                />
                Project
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("account")}
                className={`cursor-pointer flex items-center w-full px-3 py-2.5 text-sm rounded-lg ${
                  activeTab === "account"
                    ? "cursor-pointer bg-gradient-to-r from-[#FFF8F3] to-[#FFF1E7] text-[#F58327] font-medium"
                    : "cursor-pointer text-[#4B5563] hover:bg-[#F9FAFB]"
                }`}
              >
                <User
                  className={`mr-3 h-4.5 w-4.5 ${
                    activeTab === "account"
                      ? "text-[#F58327]"
                      : "text-[#9CA3AF]"
                  }`}
                />
                Account
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("support")}
                className={`cursor-pointer flex items-center w-full px-3 py-2.5 text-sm rounded-lg ${
                  activeTab === "support"
                    ? "cursor-pointer bg-gradient-to-r from-[#FFF8F3] to-[#FFF1E7] text-[#F58327] font-medium"
                    : "cursor-pointer text-[#4B5563] hover:bg-[#F9FAFB]"
                }`}
              >
                <MessageSquare
                  className={`mr-3 h-4.5 w-4.5 ${
                    activeTab === "support"
                      ? "text-[#F58327]"
                      : "text-[#9CA3AF]"
                  }`}
                />
                Support
              </button>
            </li>
          </ul>

          <div className="mt-8 px-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#FFF8F3] to-[#FFF1E7] border border-[#FFEAD5]">
              <div className="flex items-center mb-2">
                <Sparkles className="h-4 w-4 text-[#F58327] mr-2" />
                <h3 className="text-sm font-medium text-[#F58327]">Pro Tips</h3>
              </div>
              <p className="text-xs text-[#6B7280]">
                Check out our knowledge base for tips on optimizing your website
                performance.
              </p>
              <button
                onClick={() =>
                  (window.location.href = "https://lumixdigital.com.au/blog")
                }
                className="cursor-pointer mt-3 text-xs font-medium text-[#F58327] flex items-center"
              >
                Learn more
                <ChevronRight className="h-3 w-3 ml-1" />
              </button>
            </div>
          </div>
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#F0F1F6] px-4 py-4">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#E5E7EB] to-[#F3F4F6] flex items-center justify-center">
              <User className="h-4 w-4 text-[#6B7280]" />
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-[#111827] truncate">
                {displayData?.firstName} {displayData?.lastName}
              </p>
              <p className="text-xs text-[#6B7280] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="cursor-pointer mt-3 flex items-center w-full px-3 py-2 text-xs font-medium text-[#4B5563] rounded-lg hover:bg-[#F9FAFB] transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4 text-[#9CA3AF]" />
            {isLoggingOut ? "Logging out..." : "Sign out"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          {/* Project Tab */}
          {activeTab === "project" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#111827]">
                    Your Project
                  </h1>
                  <p className="text-sm text-[#6B7280] mt-1">
                    Manage your website design and content
                  </p>
                </div>
                {displayData?.websiteUrl ? (
                  <a
                    href={
                      displayData.websiteUrl.startsWith("http")
                        ? displayData.websiteUrl
                        : `https://${displayData.websiteUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-medium bg-[#F58327] text-white rounded-lg shadow-sm hover:bg-[#E67016] transition-colors flex items-center"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    View Your Website
                  </a>
                ) : (
                  <div className="px-4 py-2 text-sm bg-[#F9FAFB] text-[#6B7280] rounded-lg border border-[#E5E7EB] flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Website Coming Soon
                  </div>
                )}
              </div>

              {/* Project sub-navigation with added tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                <div className="border-b border-[#F0F1F6]">
                  <div className="flex overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => setProjectSubTab("overview")}
                      className={`cursor-pointer px-5 py-4 text-sm font-medium whitespace-nowrap ${
                        projectSubTab === "overview"
                          ? "cursor-pointer text-[#F58327] border-b-2 border-[#F58327]"
                          : "cursor-pointer text-[#6B7280] hover:text-[#111827]"
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setProjectSubTab("design")}
                      className={`cursor-pointer px-5 py-4 text-sm font-medium whitespace-nowrap ${
                        projectSubTab === "design"
                          ? "cursor-pointer text-[#F58327] border-b-2 border-[#F58327]"
                          : "cursor-pointer text-[#6B7280] hover:text-[#111827]"
                      }`}
                    >
                      Design
                    </button>
                    <button
                      onClick={() => setProjectSubTab("content")}
                      className={`cursor-pointer px-5 py-4 text-sm font-medium whitespace-nowrap ${
                        projectSubTab === "content"
                          ? "cursor-pointer text-[#F58327] border-b-2 border-[#F58327]"
                          : "cursor-pointer text-[#6B7280] hover:text-[#111827]"
                      }`}
                    >
                      Content
                    </button>
                    <button
                      onClick={() => setProjectSubTab("domain")}
                      className={`cursor-pointer px-5 py-4 text-sm font-medium whitespace-nowrap ${
                        projectSubTab === "domain"
                          ? "cursor-pointer text-[#F58327] border-b-2 border-[#F58327]"
                          : "cursor-pointer text-[#6B7280] hover:text-[#111827]"
                      }`}
                    >
                      Domain & Contact
                    </button>
                  </div>
                </div>

                {/* Overview Tab Content */}
                {projectSubTab === "overview" && (
                  <div className="p-5">
                    {/* Project phases */}
                    <ProjectPhasesSection
                      projectPhases={displayData?.projectPhases}
                    />

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden mb-6">
                      <div className="px-5 py-4 border-b border-[#F0F1F6]">
                        <h2 className="text-base font-semibold text-[#111827]">
                          Quick Actions
                        </h2>
                      </div>

                      <div className="p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          {displayData?.editorUrl ? (
                            <a
                              href={
                                displayData.editorUrl.startsWith("http")
                                  ? displayData.editorUrl
                                  : `https://${displayData.editorUrl}`
                              }
                              className="flex flex-col items-center justify-center p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:border-[#F58327] hover:bg-[#FFF8F3] transition-colors"
                            >
                              <Edit className="h-6 w-6 text-[#F58327] mb-2" />
                              <span className="text-sm font-medium text-[#4B5563]">
                                Open Editor
                              </span>
                            </a>
                          ) : (
                            <div className="relative group">
                              <div className="flex flex-col items-center justify-center p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] opacity-60 cursor-not-allowed">
                                <Edit className="h-6 w-6 text-[#A1A1AA] mb-2" />
                                <span className="text-sm font-medium text-[#A1A1AA]">
                                  Open Editor
                                </span>
                              </div>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                                Your project is still in progress
                              </div>
                            </div>
                          )}

                          {displayData?.revisionsUrl ? (
                            <a
                              href={
                                displayData.revisionsUrl.startsWith("http")
                                  ? displayData.revisionsUrl
                                  : `https://${displayData.revisionsUrl}`
                              }
                              className="flex flex-col items-center justify-center p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:border-[#F58327] hover:bg-[#FFF8F3] transition-colors"
                            >
                              <PenTool className="h-6 w-6 text-[#F58327] mb-2" />
                              <span className="font-medium text-[#4B5563] text-sm">
                                Open Revisions Tool
                              </span>
                            </a>
                          ) : (
                            <div className="relative group">
                              <div className="flex flex-col items-center justify-center p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] opacity-60 cursor-not-allowed">
                                <PenTool className="h-6 w-6 text-[#A1A1AA] mb-2" />
                                <span className="text-sm font-medium text-[#A1A1AA]">
                                  Open Revisions Tool
                                </span>
                              </div>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                                Your project is still in progress
                              </div>
                            </div>
                          )}

                          <button
                            onClick={handleSupport}
                            className="cursor-pointer flex flex-col items-center justify-center p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:border-[#F58327] hover:bg-[#FFF8F3] transition-colors"
                          >
                            <HelpingHand className="h-6 w-6 text-[#F58327] mb-2" />
                            <span className="text-sm font-medium text-[#4B5563]">
                              Support
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Website Type Overview Card */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] mb-6">
                      <div className="flex items-center mb-5">
                        <div className="w-8 h-8 rounded-full bg-[#FFF8F3] flex items-center justify-center mr-3">
                          <Globe className="h-4 w-4 text-[#F58327]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#111827]">
                          Website Overview
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#F9FAFB] rounded-lg p-4">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-2">
                            Website Type
                          </h4>
                          <p className="text-base text-[#111827]">
                            {renderField(
                              displayData?.questionnaireAnswers?.websiteType ||
                                "Not specified"
                            )}
                          </p>
                        </div>

                        <div className="bg-[#F9FAFB] rounded-lg p-4">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-2">
                            Business Industry
                          </h4>
                          <p className="text-base text-[#111827]">
                            {renderField(
                              displayData?.questionnaireAnswers
                                ?.businessIndustry
                            ) || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {projectSubTab === "design" && (
                  <div className="p-5 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {/* Design Style */}
                      <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB]">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 rounded-full bg-[#F0F9FF] flex items-center justify-center mr-3">
                            <Sliders className="h-5 w-5 text-[#0EA5E9]" />
                          </div>
                          <span className="text-base font-semibold text-[#111827]">
                            Design Style
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <span className="text-sm text-[#6B7280] w-24">
                              Style:
                            </span>
                            <span className="text-sm text-[#111827]">
                              {displayData?.questionnaireAnswers?.websiteStyle
                                ? Array.isArray(
                                    displayData.questionnaireAnswers
                                      .websiteStyle
                                  )
                                  ? displayData.questionnaireAnswers.websiteStyle.join(
                                      ", "
                                    )
                                  : displayData.questionnaireAnswers
                                      .websiteStyle
                                : "Modern & Minimalist"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-[#6B7280] w-24">
                              Colors:
                            </span>
                            <div className="flex space-x-1">
                              {displayData?.questionnaireAnswers
                                ?.colorPreferences ? (
                                Array.isArray(
                                  displayData.questionnaireAnswers
                                    .colorPreferences
                                ) ? (
                                  displayData.questionnaireAnswers.colorPreferences.map(
                                    (color, index) => (
                                      <div
                                        key={index}
                                        className="w-5 h-5 rounded-full"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                      ></div>
                                    )
                                  )
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-[#F58327]"></div>
                                )
                              ) : (
                                <>
                                  <div className="w-5 h-5 rounded-full bg-[#F58327]"></div>
                                  <div className="w-5 h-5 rounded-full bg-[#111827]"></div>
                                  <div className="w-5 h-5 rounded-full bg-white border border-[#E5E7EB]"></div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Design Inspiration */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">
                          Website Inspiration
                        </p>
                        <p className="text-sm text-gray-800">
                          {typeof displayData?.questionnaireAnswers
                            ?.websiteInspiration === "string"
                            ? displayData.questionnaireAnswers
                                .websiteInspiration
                            : "No inspiration provided"}
                        </p>

                        {/* If you have website examples */}
                        {displayData?.questionnaireAnswers?.websiteExamples &&
                          Array.isArray(
                            displayData.questionnaireAnswers.websiteExamples
                          ) &&
                          displayData.questionnaireAnswers.websiteExamples
                            .length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">
                                Example Websites
                              </p>
                              <div className="space-y-1">
                                {displayData.questionnaireAnswers.websiteExamples.map(
                                  (site, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center"
                                    >
                                      <Globe className="h-3 w-3 text-gray-400 mr-1" />
                                      <span className="text-sm text-gray-800">
                                        {site.name}
                                      </span>
                                      {site.url && (
                                        <a
                                          href={
                                            site.url.startsWith("http")
                                              ? site.url
                                              : `https://${site.url}`
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="ml-1 text-xs text-blue-500 hover:underline"
                                        >
                                          {site.url}
                                        </a>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Website Pages */}
                      <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB]">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center mr-3">
                            <Layout className="h-5 w-5 text-[#10B981]" />
                          </div>
                          <span className="text-base font-semibold text-[#111827]">
                            Website Pages
                          </span>
                        </div>
                        {displayData?.questionnaireAnswers?.websitePages &&
                        Array.isArray(
                          displayData.questionnaireAnswers.websitePages
                        ) &&
                        displayData.questionnaireAnswers.websitePages.length >
                          0 ? (
                          <div className="flex flex-wrap gap-2">
                            {displayData.questionnaireAnswers.websitePages.map(
                              (page, index) => (
                                <span
                                  key={index}
                                  className="bg-[#ECFDF5] text-[#059669] px-2 py-1 text-xs font-medium rounded-full"
                                >
                                  {page}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-[#6B7280] italic">
                            No pages specified
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Branding Assets */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] mb-6">
                      <div className="flex items-center mb-5">
                        <div className="w-10 h-10 rounded-full bg-[#F0F9FF] flex items-center justify-center mr-3">
                          <ImageIcon className="h-5 w-5 text-[#0EA5E9]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#111827]">
                          Branding Assets
                        </h3>
                      </div>

                      <div className="space-y-6">
                        {/* Logo */}
                        <div>
                          <h4 className="text-sm font-medium text-[#4B5563] mb-3">
                            Logo
                          </h4>
                          {displayData?.questionnaireAnswers?.logoUpload ? (
                            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                              <div className="flex items-center">
                                <img
                                  src={
                                    displayData.questionnaireAnswers.logoUpload
                                      .url
                                  }
                                  alt="Company Logo"
                                  className="max-h-24 object-contain rounded-md"
                                />
                                <div className="ml-4">
                                  <p className="text-sm text-[#111827] font-medium">
                                    {
                                      displayData.questionnaireAnswers
                                        .logoUpload.name
                                    }
                                  </p>
                                  <p className="text-xs text-[#6B7280]">
                                    Uploaded logo file
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] text-center">
                              <p className="text-sm text-[#6B7280]">
                                No logo uploaded
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-[#4B5563] mb-3">
                            Favicon
                          </h4>
                          {displayData?.questionnaireAnswers?.faviconUpload ? (
                            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                              <div className="flex items-center">
                                <img
                                  src={
                                    displayData.questionnaireAnswers
                                      .faviconUpload.url
                                  }
                                  alt="Company Favicon"
                                  className="max-h-24 object-contain rounded-md"
                                />
                                <div className="ml-4">
                                  <p className="text-sm text-[#111827] font-medium">
                                    {
                                      displayData.questionnaireAnswers
                                        .faviconUpload.name
                                    }
                                  </p>
                                  <p className="text-xs text-[#6B7280]">
                                    Uploaded favicon file
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : displayData?.questionnaireAnswers?.logoUpload ? (
                            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                              <div className="flex items-center">
                                <img
                                  src={
                                    displayData.questionnaireAnswers.logoUpload
                                      .url
                                  }
                                  alt="Company Favicon (using logo)"
                                  className="max-h-24 object-contain rounded-md"
                                />
                                <div className="ml-4">
                                  <p className="text-sm text-[#111827] font-medium">
                                    Using logo as favicon
                                  </p>
                                  <p className="text-xs text-[#6B7280]">
                                    {
                                      displayData.questionnaireAnswers
                                        .logoUpload.name
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] text-center">
                              <p className="text-sm text-[#6B7280]">
                                No favicon uploaded
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Team Photos */}
                        <div>
                          <h4 className="text-sm font-medium text-[#4B5563] mb-3">
                            Team Photos
                          </h4>
                          {displayData?.questionnaireAnswers?.teamPhotos &&
                          Array.isArray(
                            displayData.questionnaireAnswers.teamPhotos
                          ) &&
                          displayData.questionnaireAnswers.teamPhotos.length >
                            0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {displayData.questionnaireAnswers.teamPhotos.map(
                                (photo, index) => (
                                  <div
                                    key={index}
                                    className="p-2 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]"
                                  >
                                    <img
                                      src={photo.url}
                                      alt={`Team photo ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-md mb-2"
                                    />
                                    <p className="text-xs text-[#6B7280] truncate">
                                      {photo.name}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] text-center">
                              <p className="text-sm text-[#6B7280]">
                                No team photos uploaded
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Hero Image Option */}
                        <div>
                          <h4 className="text-sm font-medium text-[#4B5563] mb-3">
                            Hero Image
                          </h4>
                          {displayData?.questionnaireAnswers
                            ?.heroImageOption ? (
                            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                              <p className="text-sm text-[#111827] mb-2">
                                <span className="font-medium">Preference:</span>{" "}
                                {
                                  displayData.questionnaireAnswers
                                    .heroImageOption
                                }
                              </p>

                              {displayData?.questionnaireAnswers
                                ?.heroImageUpload && (
                                <div className="mt-3 flex items-start">
                                  <img
                                    src={
                                      displayData.questionnaireAnswers
                                        .heroImageUpload.url
                                    }
                                    alt="Hero Image"
                                    className="w-32 h-20 object-cover rounded-md"
                                  />
                                  <div className="ml-3">
                                    <p className="text-xs text-[#6B7280]">
                                      Uploaded hero image
                                    </p>
                                    <p className="text-xs text-[#6B7280]">
                                      {
                                        displayData.questionnaireAnswers
                                          .heroImageUpload.name
                                      }
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] text-center">
                              <p className="text-sm text-[#6B7280]">
                                No hero image preference specified
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Tab */}
                {projectSubTab === "content" && (
                  <div className="p-5 space-y-6">
                    {/* Business Information */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] mb-6">
                      <div className="flex items-center mb-5">
                        <div className="w-8 h-8 rounded-full bg-[#FFF8F3] flex items-center justify-center mr-3">
                          <Bookmark className="h-4 w-4 text-[#F58327]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#111827]">
                          Business Information
                        </h3>
                      </div>

                      <div className="space-y-5">
                        {/* Business Name */}
                        <div className="border-b border-[#F0F1F6] pb-4">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-1">
                            Business Name
                          </h4>
                          <p className="text-base text-[#111827]">
                            {renderField(
                              displayData?.questionnaireAnswers?.businessName ||
                                "Not provided"
                            )}
                          </p>
                        </div>

                        {/* Business Tagline */}
                        <div className="border-b border-[#F0F1F6] pb-4">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-1">
                            Business Tagline
                          </h4>
                          <p className="text-base text-[#111827]">
                            {displayData?.questionnaireAnswers
                              ?.businessTagline || "Not provided"}
                          </p>
                        </div>

                        {/* Business Description */}
                        <div className="border-b border-[#F0F1F6] pb-4">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-1">
                            Business Description
                          </h4>
                          <p className="text-base text-[#111827]">
                            {displayData?.questionnaireAnswers
                              ?.businessDescription || "Not provided"}
                          </p>
                        </div>

                        {/* Business Goals */}
                        <div className="border-b border-[#F0F1F6] pb-4">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-1">
                            Business Goals
                          </h4>
                          <p className="text-base text-[#111827]">
                            {renderField(
                              displayData?.questionnaireAnswers
                                ?.businessGoals || "Not provided"
                            )}
                          </p>
                        </div>

                        {/* Unique Selling Proposition */}
                        <div className="border-b border-[#F0F1F6] pb-4">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-1">
                            Unique Selling Proposition
                          </h4>
                          <p className="text-base text-[#111827]">
                            {renderField(
                              displayData?.questionnaireAnswers
                                ?.businessUnique || "Not provided"
                            )}
                          </p>
                        </div>

                        {/* Business Industry */}
                        <div className="border-b border-[#F0F1F6] pb-4">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-1">
                            Business Industry
                          </h4>
                          <p className="text-base text-[#111827]">
                            {renderField(
                              displayData?.questionnaireAnswers
                                ?.businessIndustry || "Not provided"
                            )}
                          </p>
                        </div>

                        {/* Years in Business */}
                        <div className="pb-4">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-1">
                            Years in Business
                          </h4>
                          <p className="text-base text-[#111827]">
                            {renderField(
                              displayData?.questionnaireAnswers
                                ?.yearsInBusiness || "Not provided"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Services & Products */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] mb-6">
                      <div className="flex items-center mb-5">
                        <div className="w-8 h-8 rounded-full bg-[#F0F9FF] flex items-center justify-center mr-3">
                          <Layers className="h-4 w-4 text-[#3B82F6]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#111827]">
                          Services & Products
                        </h3>
                      </div>

                      <div className="bg-[#F9FAFB] rounded-lg p-4 mb-4">
                        {displayData?.questionnaireAnswers?.services &&
                        Array.isArray(
                          displayData.questionnaireAnswers.services
                        ) &&
                        displayData.questionnaireAnswers.services.length > 0 ? (
                          <div className="space-y-4">
                            {displayData.questionnaireAnswers.services.map(
                              (service, index) => (
                                <div
                                  key={index}
                                  className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0"
                                >
                                  <div className="flex items-start">
                                    {service.image && (
                                      <div className="mr-3 flex-shrink-0">
                                        <img
                                          src={service.image.url}
                                          alt={service.name}
                                          className="w-12 h-12 object-cover rounded"
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <h4 className="font-medium text-[#111827]">
                                        {service.name}
                                      </h4>
                                      {service.price && (
                                        <p className="text-sm text-[#F58327]">
                                          {service.price}
                                        </p>
                                      )}
                                      <p className="text-sm text-gray-600 mt-1">
                                        {service.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-base text-[#111827]">
                            No services provided
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] mb-6">
                      <div className="flex items-center mb-5">
                        <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center mr-3">
                          <Users className="h-4 w-4 text-[#3B82F6]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#111827]">
                          Team Members
                        </h3>
                      </div>

                      {displayData?.questionnaireAnswers?.teamMembers &&
                      Array.isArray(
                        displayData.questionnaireAnswers.teamMembers
                      ) &&
                      displayData.questionnaireAnswers.teamMembers.length >
                        0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {displayData.questionnaireAnswers.teamMembers.map(
                            (member, index) => (
                              <div
                                key={index}
                                className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]"
                              >
                                <div className="flex items-center mb-3">
                                  {member.image ? (
                                    <img
                                      src={member.image.url}
                                      alt={member.name}
                                      className="w-12 h-12 object-cover rounded-full mr-3"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-[#E5E7EB] rounded-full flex items-center justify-center mr-3">
                                      <User className="h-6 w-6 text-[#9CA3AF]" />
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-medium text-[#111827]">
                                      {member.name}
                                    </h4>
                                    <p className="text-sm text-[#6B7280]">
                                      {member.position}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-sm text-[#4B5563] mb-3">
                                  {member.description}
                                </p>

                                {/* Social Media Links */}
                                {member.socialMedia &&
                                  member.socialMedia.length > 0 && (
                                    <div className="flex gap-2 mt-2">
                                      {member.socialMedia.map(
                                        (social, socialIndex) => (
                                          <a
                                            key={socialIndex}
                                            href={
                                              social.url.startsWith("http")
                                                ? social.url
                                                : `https://${social.url}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#4B5563] hover:text-[#F58327]"
                                            title={`${social.platform}: ${social.url}`}
                                          >
                                            {social.platform === "Facebook" && (
                                              <FacebookIcon className="h-4 w-4" />
                                            )}
                                            {social.platform === "Twitter" && (
                                              <TwitterIcon className="h-4 w-4" />
                                            )}
                                            {social.platform ===
                                              "Instagram" && (
                                              <InstagramIcon className="h-4 w-4" />
                                            )}
                                            {social.platform === "LinkedIn" && (
                                              <LinkedinIcon className="h-4 w-4" />
                                            )}
                                            {social.platform === "YouTube" && (
                                              <YoutubeIcon className="h-4 w-4" />
                                            )}
                                            {social.platform === "TikTok" && (
                                              <div className="text-[#000000] font-bold text-xs">
                                                TT
                                              </div>
                                            )}
                                            {social.platform ===
                                              "Pinterest" && (
                                              <div className="text-[#E60023] font-bold text-xs">
                                                P
                                              </div>
                                            )}
                                            {social.platform === "Other" && (
                                              <Globe2 className="h-4 w-4" />
                                            )}
                                            {![
                                              "Facebook",
                                              "Twitter",
                                              "Instagram",
                                              "LinkedIn",
                                              "YouTube",
                                              "TikTok",
                                              "Pinterest",
                                              "Other",
                                            ].includes(social.platform) && (
                                              <Globe2 className="h-4 w-4" />
                                            )}
                                          </a>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="bg-[#F9FAFB] rounded-lg p-4 text-center">
                          <p className="text-sm text-[#6B7280]">
                            No team members provided
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Target Audience */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] mb-6">
                      <div className="flex items-center mb-5">
                        <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center mr-3">
                          <Users className="h-4 w-4 text-[#3B82F6]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#111827]">
                          Target Audience
                        </h3>
                      </div>

                      <div className="bg-[#F9FAFB] rounded-lg p-4 mb-4">
                        <p className="text-base text-[#111827]">
                          {renderField(
                            displayData?.questionnaireAnswers?.targetAudience ||
                              "Not provided"
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Content Strategy */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] mb-6">
                      <div className="flex items-center mb-5">
                        <div className="w-8 h-8 rounded-full bg-[#FFF7ED] flex items-center justify-center mr-3">
                          <FileText className="h-4 w-4 text-[#F97316]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#111827]">
                          Content Strategy
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Call to Action */}
                        <div className="bg-[#F9FAFB] rounded-lg p-4">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-2">
                            Primary Call to Action
                          </h4>
                          <p className="text-base text-[#111827]">
                            {renderField(
                              displayData?.questionnaireAnswers?.primaryCTA ||
                                "Not specified"
                            )}
                          </p>
                        </div>

                        {/* Content Tone */}
                        <div className="bg-[#F9FAFB] rounded-lg p-4">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-2">
                            Content Tone
                          </h4>
                          <p className="text-base text-[#111827]">
                            {renderField(
                              displayData?.questionnaireAnswers?.contentTone
                                ? Array.isArray(
                                    displayData.questionnaireAnswers.contentTone
                                  )
                                  ? displayData.questionnaireAnswers.contentTone.join(
                                      ", "
                                    )
                                  : displayData.questionnaireAnswers.contentTone
                                : "Not specified"
                            )}
                          </p>
                        </div>

                        {/* Additional Content Information */}
                        {renderField(
                          displayData?.questionnaireAnswers
                            ?.additionalContent && (
                            <div className="bg-[#F9FAFB] rounded-lg p-4 md:col-span-2">
                              <h4 className="text-sm font-medium text-[#6B7280] mb-2">
                                Additional Content Information
                              </h4>
                              <p className="text-base text-[#111827]">
                                {renderField(
                                  displayData.questionnaireAnswers
                                    .additionalContent
                                )}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Social Media Integration */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] mb-6">
                      <div className="flex items-center mb-5">
                        <div className="w-8 h-8 rounded-full bg-[#F0F9FF] flex items-center justify-center mr-3">
                          <Share2 className="h-4 w-4 text-[#0EA5E9]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#111827]">
                          Social Media
                        </h3>
                      </div>

                      {displayData?.questionnaireAnswers?.socialMediaLinks &&
                      Array.isArray(
                        displayData.questionnaireAnswers.socialMediaLinks
                      ) &&
                      displayData.questionnaireAnswers.socialMediaLinks.length >
                        0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {displayData.questionnaireAnswers.socialMediaLinks.map(
                            (social, index) => (
                              <div
                                key={index}
                                className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB] flex items-center"
                              >
                                {/* Platform icon */}
                                <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center mr-3">
                                  {social.platform === "Facebook" && (
                                    <FacebookIcon className="h-4 w-4 text-[#1877F2]" />
                                  )}
                                  {social.platform === "Instagram" && (
                                    <InstagramIcon className="h-4 w-4 text-[#E4405F]" />
                                  )}
                                  {social.platform === "Twitter" && (
                                    <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                                  )}
                                  {social.platform === "LinkedIn" && (
                                    <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                                  )}
                                  {social.platform === "YouTube" && (
                                    <Youtube className="h-4 w-4 text-[#FF0000]" />
                                  )}
                                  {social.platform === "TikTok" && (
                                    <div className="text-[#000000] font-bold text-xs">
                                      TT
                                    </div>
                                  )}
                                  {social.platform === "Pinterest" && (
                                    <div className="text-[#E60023] font-bold text-xs">
                                      P
                                    </div>
                                  )}
                                  {social.platform === "Other" && (
                                    <Globe2 className="h-4 w-4 text-[#6B7280]" />
                                  )}
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-[#111827]">
                                    {social.platform}
                                  </p>
                                  <a
                                    href={
                                      social.url.startsWith("http")
                                        ? social.url
                                        : `https://${social.url}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#3B82F6] hover:underline"
                                  >
                                    {social.url}
                                  </a>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="bg-[#F9FAFB] rounded-lg p-4 text-center">
                          <p className="text-sm text-[#6B7280]">
                            No social media links provided
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Website Pages */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] mb-6">
                      <div className="flex items-center mb-5">
                        <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center mr-3">
                          <Layout className="h-4 w-4 text-[#6B7280]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#111827]">
                          Website Pages
                        </h3>
                      </div>

                      {displayData?.questionnaireAnswers?.websitePages &&
                      Array.isArray(
                        displayData.questionnaireAnswers.websitePages
                      ) &&
                      displayData.questionnaireAnswers.websitePages.length >
                        0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {displayData.questionnaireAnswers.websitePages.map(
                            (page, index) => (
                              <div
                                key={index}
                                className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]"
                              >
                                <p className="text-sm text-[#111827] text-center">
                                  {page}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="bg-[#F9FAFB] rounded-lg p-4 text-center">
                          <p className="text-sm text-[#6B7280]">
                            No website pages specified
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Domain & Contact Tab Content */}
                {projectSubTab === "domain" && (
                  <div className="p-5 space-y-6">
                    {/* Domain Information */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] mb-6">
                      <div className="flex items-center mb-5">
                        <div className="w-8 h-8 rounded-full bg-[#FFF8F3] flex items-center justify-center mr-3">
                          <Globe className="h-4 w-4 text-[#F58327]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#111827]">
                          Domain Information
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {/* Domain Status */}
                        <div className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-2">
                            Domain Status
                          </h4>
                          {displayData?.questionnaireAnswers?.hasDomain ===
                          "Yes" ? (
                            <div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                <p className="text-base text-[#111827]">
                                  Existing Domain
                                </p>
                              </div>
                              <p className="text-sm text-[#6B7280] mt-1">
                                {renderField(
                                  displayData?.questionnaireAnswers
                                    ?.domainName || "Domain name not specified"
                                )}
                              </p>
                            </div>
                          ) : displayData?.questionnaireAnswers
                              ?.customDomainName ? (
                            <div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                <p className="text-base text-[#111827]">
                                  New Domain Selected
                                </p>
                              </div>
                              <p className="text-sm text-[#6B7280] mt-1">
                                {
                                  displayData.questionnaireAnswers
                                    .customDomainName
                                }
                              </p>
                            </div>
                          ) : displayData?.questionnaireAnswers
                              ?.nonPremiumDomainOption ? (
                            <div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                                <p className="text-base text-[#111827]">
                                  Using Free Subdomain
                                </p>
                              </div>
                              <p className="text-sm text-[#6B7280] mt-1">
                                yourbusiness.lumixdigital.site
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                              <p className="text-base text-[#111827]">
                                No domain information provided
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Professional Email */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">
                            Professional Email
                          </p>
                          {(() => {
                            try {
                              // Handle the data directly
                              const emailStr =
                                typeof displayData?.questionnaireAnswers
                                  ?.professionalEmails === "string"
                                  ? displayData?.questionnaireAnswers
                                      ?.professionalEmails
                                  : JSON.stringify(
                                      displayData?.questionnaireAnswers
                                        ?.professionalEmails || "[]"
                                    );

                              const emails = JSON.parse(emailStr);
                              const domain =
                                displayData?.questionnaireAnswers?.domainName ||
                                displayData?.questionnaireAnswers
                                  ?.customDomainName ||
                                "example.com";

                              return (
                                <div className="space-y-2">
                                  {Array.isArray(emails) &&
                                  emails.length > 0 ? (
                                    emails.map((email, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center"
                                      >
                                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                        <p className="text-sm text-gray-800">
                                          {email}@{domain}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-gray-500">
                                      No email addresses configured
                                    </p>
                                  )}
                                </div>
                              );
                            } catch (e) {
                              console.error("Error parsing emails:", e);
                              return (
                                <p className="text-sm text-gray-500">
                                  Email configuration not valid
                                </p>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] mb-6">
                      <div className="flex items-center mb-5">
                        <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center mr-3">
                          <Phone className="h-4 w-4 text-[#3B82F6]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#111827]">
                          Contact Information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Phone Number */}
                        <div className="bg-[#F9FAFB] rounded-lg p-4">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-2">
                            Phone Number
                          </h4>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            <p className="text-base text-[#111827]">
                              {renderField(
                                displayData?.questionnaireAnswers
                                  ?.phoneNumber || "Not provided"
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="bg-[#F9FAFB] rounded-lg p-4">
                          <h4 className="text-sm font-medium text-[#6B7280] mb-2">
                            Email Address
                          </h4>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            <p className="text-base text-[#111827]">
                              {renderField(
                                displayData?.questionnaireAnswers
                                  ?.emailAddress || "Not provided"
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Business Address */}
                        {renderField(
                          displayData?.questionnaireAnswers
                            ?.businessAddress && (
                            <div className="bg-[#F9FAFB] rounded-lg p-4 md:col-span-2">
                              <h4 className="text-sm font-medium text-[#6B7280] mb-2">
                                Business Address
                              </h4>
                              <div className="flex items-start">
                                <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                                <p className="text-base text-[#111827]">
                                  {renderField(
                                    displayData.questionnaireAnswers
                                      .businessAddress
                                  )}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Business Hours */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">
                        Business Hours
                      </p>
                      {(() => {
                        const businessHours =
                          displayData?.questionnaireAnswers?.businessHours;
                        if (!businessHours)
                          return (
                            <p className="text-sm text-gray-500">
                              No business hours provided
                            </p>
                          );

                        const daysOfWeek = [
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                          "Sunday",
                        ];

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {daysOfWeek.map((day) => {
                              const hoursKey = `${day.toLowerCase()}Hours`;
                              const hours = businessHours[hoursKey];

                              return (
                                <div
                                  key={day}
                                  className="flex items-center justify-between py-1 border-b border-gray-200"
                                >
                                  <span className="text-sm font-medium text-gray-700">
                                    {day}
                                  </span>
                                  <span className="text-sm text-gray-800">
                                    {hours === "closed" ? (
                                      <span className="text-red-500">
                                        Closed
                                      </span>
                                    ) : hours ? (
                                      hours
                                    ) : (
                                      <span className="text-gray-400">
                                        Not specified
                                      </span>
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Home Tab */}
          {activeTab === "home" && (
            <div className="space-y-6">
              {/* Welcome section */}
              <div className="bg-gradient-to-r from-[#FFF8F3] to-[#FFF1E7] rounded-xl p-6 shadow-sm border border-[#FFEAD5]">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h1 className="text-2xl font-bold text-[#111827] mb-2">
                      Welcome back, {displayData?.firstName}!
                    </h1>
                    <p className="text-sm text-[#6B7280]">
                      Here's what's happening with your website project.
                    </p>
                  </div>
                  <div className="flex space-x-2 ">
                    {/* Add the Website URL button here */}
                    {displayData?.websiteUrl ? (
                      <a
                        href={
                          displayData.websiteUrl.startsWith("http")
                            ? displayData.websiteUrl
                            : `https://${displayData.websiteUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm font-medium bg-[#F58327] text-white rounded-lg shadow-sm hover:bg-[#E67016] transition-colors flex items-center"
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        View Your Website
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Project Status Summary */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB]">
                <h2 className="text-lg font-semibold text-[#111827] mb-4">
                  Project Timeline
                </h2>
                <div className="overflow-hidden">
                  {displayData?.projectPhases ? (
                    <div className="relative">
                      <div className="absolute top-0 bottom-0 left-5 w-0.5 bg-[#F0F1F6]"></div>
                      <div className="space-y-8 relative">
                        {displayData.projectPhases.map(
                          (phase: ProjectPhase, idx: number) => (
                            <div key={idx} className="pl-12 relative">
                              <div
                                className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                  phase.status === "completed"
                                    ? "bg-[#D1FAE5]"
                                    : phase.status === "active"
                                    ? "bg-[#FFF8F3]"
                                    : "bg-[#F3F4F6]"
                                }`}
                              >
                                {getPhaseIcon(phase.name, phase.status)}
                              </div>
                              <div className="flex justify-between items-center">
                                <h3 className="text-md font-medium text-[#111827]">
                                  {phase.name}
                                </h3>
                                <div>
                                  {phase.status === "completed" && (
                                    <span className="px-2 py-1 text-xs bg-[#D1FAE5] text-[#10B981] rounded-full">
                                      Completed
                                    </span>
                                  )}
                                  {phase.status === "active" && (
                                    <span className="px-2 py-1 text-xs bg-[#FFF8F3] text-[#F58327] rounded-full border border-[#FFEAD5]">
                                      In Progress
                                    </span>
                                  )}
                                  {phase.status === "pending" && (
                                    <span className="px-2 py-1 text-xs bg-[#F3F4F6] text-[#6B7280] rounded-full">
                                      Upcoming
                                    </span>
                                  )}
                                </div>
                              </div>
                              {phase.tasks && phase.tasks.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {phase.tasks.map(
                                    (
                                      task: {
                                        name: string;
                                        completed: boolean;
                                      },
                                      taskIdx: number
                                    ) => (
                                      <li
                                        key={taskIdx}
                                        className="flex items-center"
                                      >
                                        {task.completed ? (
                                          <CheckCircle className="h-3.5 w-3.5 text-[#10B981] mr-2" />
                                        ) : phase.status === "active" ? (
                                          <div className="h-3.5 w-3.5 rounded-full border border-[#F58327] mr-2 flex items-center justify-center">
                                            <div className="h-1.5 w-1.5 bg-[#F58327] rounded-full"></div>
                                          </div>
                                        ) : (
                                          <div className="h-3.5 w-3.5 rounded-full border border-[#D1D5DB] mr-2"></div>
                                        )}
                                        <span
                                          className={`text-sm ${
                                            task.completed
                                              ? "text-[#6B7280]"
                                              : "text-[#4B5563]"
                                          }`}
                                        >
                                          {task.name}
                                        </span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[#6B7280]">
                        Once we get started on your project, this will show its
                        progress.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Next steps */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#111827]">
                    Next Steps
                  </h2>
                  <span className="px-2.5 py-1 text-xs font-medium bg-[#F3F4F6] text-[#4B5563] rounded-full">
                    2 of 2 completed
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex p-4 rounded-lg bg-[#F9FAFB] border-l-4 border-[#10B981]">
                    <CheckCircle className="h-5 w-5 text-[#10B981] mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-[#111827]">
                        Payment Completed
                      </h3>
                      <p className="text-xs text-[#6B7280] mt-1">
                        Your payment has been processed successfully.
                      </p>
                    </div>
                  </div>

                  <div className="flex p-4 rounded-lg bg-[#F9FAFB] border-l-4 border-[#10B981]">
                    <CheckCircle className="h-5 w-5 text-[#10B981] mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-[#111827]">
                        Questionnaire Completed
                      </h3>
                      <p className="text-xs text-[#6B7280] mt-1">
                        You have completed our questionnaire and your website is
                        ready for design.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Website Preview */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB]">
                <h2 className="text-lg font-semibold text-[#111827] mb-4">
                  Website Preview
                </h2>

                {displayData?.websitePreviewUrl ? (
                  <div className="p-3 bg-[#F9FAFB] rounded-lg">
                    {/* Browser mockup */}
                    <div className="browser-mockup shadow-lg transform perspective-800 rotate-y-1 rotate-x-1">
                      {/* Browser top bar */}
                      <div className="bg-gray-100 rounded-t-lg p-2 flex items-center border border-gray-200">
                        <div className="flex space-x-1.5 mr-4">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="flex-1 bg-white rounded-full h-6 flex items-center px-3">
                          <div className="w-4 h-4 mr-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="text-gray-400"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-xs text-gray-400 truncate">
                            yourwebsite.com
                          </span>
                        </div>
                      </div>

                      {/* Browser content */}
                      <div className="relative overflow-hidden rounded-b-lg border-x border-b border-gray-200">
                        <img
                          src={displayData.websitePreviewUrl}
                          alt="Website Preview"
                          className="w-full h-auto"
                          style={{ maxHeight: "400px", objectFit: "cover" }}
                        />
                      </div>
                    </div>

                    <p className="text-center mt-4 text-sm text-gray-500">
                      This preview may not be exactly up to date.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-[#F9FAFB] rounded-lg">
                    {/* Browser mockup placeholder */}
                    <div className="browser-mockup w-full max-w-md mb-6 shadow-md">
                      <div className="bg-gray-100 rounded-t-lg p-2 flex items-center border border-gray-200">
                        <div className="flex space-x-1.5 mr-4">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="flex-1 bg-white rounded-full h-6 flex items-center px-3">
                          <div className="w-4 h-4 mr-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="text-gray-400"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-xs text-gray-400 truncate">
                            yourwebsite.com
                          </span>
                        </div>
                      </div>
                      <div className="h-48 bg-white border-x border-b border-gray-200 rounded-b-lg flex items-center justify-center">
                        <div className="text-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 text-gray-300 mx-auto mb-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-gray-500 font-medium">
                            Website design in progress
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            Your website preview will appear here once ready
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-[#111827]">
                  Account Settings
                </h1>
              </div>

              {/* Account info */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB]">
                <h2 className="text-lg font-semibold text-[#111827] mb-4">
                  Account Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-[#F9FAFB] p-4 rounded-lg">
                    <p className="text-xs font-medium text-[#6B7280] mb-1">
                      Full Name
                    </p>
                    <p className="text-base font-medium text-[#111827]">
                      {displayData?.firstName} {displayData?.lastName}
                    </p>
                  </div>

                  <div className="bg-[#F9FAFB] p-4 rounded-lg">
                    <p className="text-xs font-medium text-[#6B7280] mb-1">
                      Email Address
                    </p>
                    <p className="text-base font-medium text-[#111827]">
                      {user?.email}
                    </p>
                  </div>

                  <div className="bg-[#F9FAFB] p-4 rounded-lg">
                    <p className="text-xs font-medium text-[#6B7280] mb-1">
                      Account Created
                    </p>
                    <p className="text-base font-medium text-[#111827]">
                      {displayData?.createdAt
                        ? new Date(displayData.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </p>
                  </div>

                  {displayData?.phoneNumber && (
                    <div className="bg-[#F9FAFB] p-4 rounded-lg">
                      <p className="text-xs font-medium text-[#6B7280] mb-1">
                        Phone Number
                      </p>
                      <p className="text-base font-medium text-[#111827]">
                        {displayData.phoneNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Subscription info */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-[#111827]">
                    Subscription
                  </h2>
                  <span className="px-2.5 py-1 text-xs font-medium bg-[#D1FAE5] text-[#10B981] rounded-full">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-[#F9FAFB] p-4 rounded-lg">
                    <p className="text-xs font-medium text-[#6B7280] mb-1">
                      Current Plan
                    </p>
                    <p className="text-base font-medium text-[#111827]">
                      {displayData?.planType
                        ? displayData.planType === "launch"
                          ? "Launch"
                          : displayData.planType === "business"
                          ? "Business"
                          : displayData.planType === "enterprise"
                          ? "Enterprise"
                          : "Custom"
                        : "Standard"}{" "}
                      (
                      {displayData?.billingCycle
                        ? displayData.billingCycle === "monthly"
                          ? "Monthly"
                          : displayData.billingCycle === "yearly"
                          ? "Yearly"
                          : displayData.billingCycle
                        : "Monthly"}
                      )
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    onClick={() => handleManageSubscription()}
                    className="cursor-pointer inline-flex items-center px-4 py-2 mx-1 text-sm font-medium text-[#F58327] bg-white border border-[#F58327] rounded-lg hover:bg-[#FFF8F3] transition-colors"
                  >
                    Manage Subscription
                  </button>
                  <button
                    onClick={() => setShowCancelConfirmation(true)}
                    className="cursor-pointer inline-flex items-center px-4 py-2 mx-1 text-sm font-medium text-[#d0312d] bg-white border border-[#d0312d] rounded-lg hover:bg-[#FFF8F3] transition-colors"
                  >
                    Cancel Subscription
                  </button>
                </div>

                {/* Cancellation Confirmation Modal */}
                {showCancelConfirmation && (
                  <div className="fixed inset-0 bg-[#0d0d0d] bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 animate-in fade-in duration-200">
                      <h3 className="text-lg font-semibold text-[#111827] mb-2">
                        Cancelling your subscription
                      </h3>
                      <p className="text-[#6B7280] mb-6">
                        If you cancel your subscription, you will lose access to
                        the dashboard, but your website will stay online until
                        your subscription ends.
                      </p>

                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setShowCancelConfirmation(false)}
                          className="cursor-pointer px-4 py-2 text-sm font-medium text-[#6B7280] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setShowCancelConfirmation(false);
                            handleManageSubscription();
                          }}
                          className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-[#F58327] rounded-lg hover:bg-[#E67016] transition-colors"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Reset */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB]">
                <h2 className="text-lg font-semibold text-[#111827] mb-4">
                  Security
                </h2>

                <div className="bg-[#F9FAFB] p-4 rounded-lg mb-4">
                  <p className="text-sm text-[#6B7280]">
                    For security reasons, if you need your data deleted, or your
                    password reset, email us.
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="cursor-pointer inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#F58327] rounded-lg hover:bg-[#E67016] transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Support Tab */}
          {activeTab === "support" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#111827]">Support</h1>
                  <p className="text-sm text-[#6B7280] mt-1">
                    Get help with your website project
                  </p>
                </div>
                <button
                  onClick={handleSupport}
                  className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-[#F58327] rounded-lg shadow-sm hover:bg-[#E67016] transition-colors flex items-center"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Support
                </button>
              </div>

              {/* Contact options */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB]">
                <h2 className="text-lg font-semibold text-[#111827] mb-4">
                  Contact Us
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-[#F9FAFB] p-5 rounded-lg border border-[#E5E7EB] hover:border-[#F58327] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#FFF8F3] flex items-center justify-center mb-4">
                      <Mail className="h-6 w-6 text-[#F58327]" />
                    </div>
                    <h3 className="text-base font-medium text-[#111827] mb-2">
                      Email Support
                    </h3>
                    <p className="text-sm text-[#6B7280] mb-4">
                      Send us an email and we'll get back to you within 24
                      hours.
                    </p>
                    <button
                      onClick={handleSupport}
                      className="cursor-pointer inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#F58327] rounded-lg hover:bg-[#E67016] transition-colors"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Email Support
                    </button>
                  </div>

                  <div className="bg-[#F9FAFB] p-5 rounded-lg border border-[#E5E7EB] hover:border-[#F58327] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#FFF8F3] flex items-center justify-center mb-4">
                      <MessageSquare className="h-6 w-6 text-[#F58327]" />
                    </div>
                    <h3 className="text-base font-medium text-[#111827] mb-2">
                      Live Chat (Coming soon!)
                    </h3>
                    <p className="text-sm text-[#6B7280] mb-4">
                      Chat with our support team in real-time. May take up to 8
                      hours for response.
                    </p>
                    <button
                      onClick={() => setChatOpen(true)}
                      className="cursor-pointer inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#F58327] rounded-lg hover:bg-[#E67016] transition-colors"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Start Chat
                    </button>
                  </div>
                </div>
              </div>
              {/* FAQ */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB]">
                <h2 className="text-lg font-semibold text-[#111827] mb-4">
                  Frequently Asked Questions
                </h2>

                <div className="space-y-4">
                  <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
                    <div className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-[#FFF8F3] flex items-center justify-center mr-3 mt-0.5">
                        <Lightbulb className="h-3.5 w-3.5 text-[#F58327]" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-[#111827] mb-1">
                          How long does it take to build my website?
                        </h3>
                        <p className="text-sm text-[#6B7280]">
                          Most websites are completed within 5 days after the
                          questionnaire is completed.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
                    <div className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-[#FFF8F3] flex items-center justify-center mr-3 mt-0.5">
                        <Lightbulb className="h-3.5 w-3.5 text-[#F58327]" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-[#111827] mb-1">
                          Can I request changes to my design?
                        </h3>
                        <p className="text-sm text-[#6B7280]">
                          Yes, you'll have the opportunity to make changes
                          through our collaboration tool. (Coming soon)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
                    <div className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-[#FFF8F3] flex items-center justify-center mr-3 mt-0.5">
                        <Lightbulb className="h-3.5 w-3.5 text-[#F58327]" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-[#111827] mb-1">
                          What happens when I cancel my subscription?
                        </h3>
                        <p className="text-sm text-[#6B7280]">
                          Your website will stay up until your subscription
                          ends. Although, the dashboard will be disabled.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
                    <div className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-[#FFF8F3] flex items-center justify-center mr-3 mt-0.5">
                        <Lightbulb className="h-3.5 w-3.5 text-[#F58327]" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-[#111827] mb-1">
                          Will my website be mobile-friendly?
                        </h3>
                        <p className="text-sm text-[#6B7280]">
                          Yes, all websites we build are fully responsive and
                          look great on desktop, tablet, and mobile devices.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Knowledge Base */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#111827]">
                    Knowledge Base
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="https://lumixdigital.com.au/blog/building-a-small-business-website"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:border-[#F58327] transition-colors"
                  >
                    <h3 className="text-base font-medium text-[#111827] mb-2">
                      Website Maintenance Guide
                    </h3>
                    <p className="text-sm text-[#6B7280]">
                      Learn how to keep your website running smoothly after
                      launch.
                    </p>
                  </a>

                  <a
                    href="https://lumixdigital.com.au/blog"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:border-[#F58327] transition-colors"
                  >
                    <h3 className="text-base font-medium text-[#111826] mb-2">
                      SEO Basics for Your Website
                    </h3>
                    <p className="text-sm text-[#6B7280]">
                      Simple tips to improve your search engine visibility.
                    </p>
                  </a>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
