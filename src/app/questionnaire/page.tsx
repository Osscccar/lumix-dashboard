"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  saveQuestionnaireAnswers,
  savePartialQuestionnaireAnswers,
  getUserData,
} from "@/lib/auth-service";
import type { QuestionnaireAnswers } from "@/types";
import { useFirebase } from "@/components/firebase-provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  X,
  Globe,
  Trash2,
} from "lucide-react";

// Define the question types
type QuestionType =
  | "text"
  | "textarea"
  | "radio"
  | "multiselect"
  | "color"
  | "websiteList";

// Define the question interface
interface Question {
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
}

// Define the questions for the questionnaire
const allQuestions: Question[] = [
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
  // File upload questions removed
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

export default function QuestionnairePage() {
  const router = useRouter();
  const { user, userData, loading } = useFirebase();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customPageOption, setCustomPageOption] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [autoSaving, setAutoSaving] = useState(false);

  // Filter questions based on conditional logic
  useEffect(() => {
    // Filter questions based on conditions
    const filteredQuestions = allQuestions.filter((question) => {
      // If question has no condition, always include it
      if (!question.condition) return true;

      // Get the answer to the condition question
      const conditionAnswer = answers[question.condition.questionId];

      // If the condition answer doesn't exist, don't include the question
      if (conditionAnswer === undefined || conditionAnswer === null)
        return false;

      // Check if answer matches expected answer
      if (Array.isArray(question.condition.expectedAnswer)) {
        return question.condition.expectedAnswer.includes(
          conditionAnswer as string
        );
      } else {
        return conditionAnswer === question.condition.expectedAnswer;
      }
    });

    setQuestions(filteredQuestions);
  }, [answers]);

  // First, verify payment status directly from Firestore
  useEffect(() => {
    async function verifyPaymentStatus() {
      if (user) {
        try {
          console.log("Verifying payment status from Firestore...");

          // Get the latest user data directly from Firestore
          const latestUserData = await getUserData(user.uid);
          console.log("Latest user data:", latestUserData);

          if (latestUserData?.hasPaid) {
            console.log("User has paid according to Firestore");
            setHasPaid(true);

            // If they already have answers, load them
            if (latestUserData.questionnaireAnswers) {
              setAnswers(latestUserData.questionnaireAnswers);

              // Find the last answered question to resume from there
              let lastAnsweredIndex = 0;
              const questionIds = allQuestions.map((q) => q.id);

              for (let i = questionIds.length - 1; i >= 0; i--) {
                if (
                  latestUserData.questionnaireAnswers[questionIds[i]] !==
                  undefined
                ) {
                  // Found the last answered question
                  lastAnsweredIndex = i;
                  break;
                }
              }

              // Set the current question to the next unanswered one
              setCurrentQuestionIndex(
                Math.min(lastAnsweredIndex + 1, allQuestions.length - 1)
              );
            }
          } else {
            console.log("User has not paid according to Firestore");
          }
        } catch (error) {
          console.error("Error verifying payment status:", error);
        } finally {
          setIsVerifyingPayment(false);
        }
      } else if (!loading) {
        setIsVerifyingPayment(false);
      }
    }

    if (!loading) {
      verifyPaymentStatus();
    }
  }, [user, loading]);

  // Redirect logic based on verified payment status
  useEffect(() => {
    if (!loading && !isVerifyingPayment) {
      if (!user) {
        // No user is logged in, redirect to sign in
        console.log("No user, redirecting to sign in");
        router.push("/");
      } else if (!hasPaid) {
        // User hasn't paid yet - use our verified payment status
        console.log("User hasn't paid, redirecting to sign in for payment");
        router.push("/"); // Redirect to homepage for payment process
      } else if (userData?.completedQuestionnaire) {
        // User has already completed the questionnaire
        console.log("User completed questionnaire, redirecting to dashboard");
        router.push("/dashboard");
      } else {
        console.log("User can proceed with questionnaire");
      }
    }
  }, [loading, user, userData, router, isVerifyingPayment, hasPaid]);
  // Auto-save function
  const autoSave = async () => {
    if (!user || Object.keys(answers).length === 0) return;

    setAutoSaving(true);

    try {
      await savePartialQuestionnaireAnswers(user.uid, answers);
      console.log("Auto-saved answers successfully");
    } catch (error) {
      console.error("Error auto-saving answers:", error);
    } finally {
      setAutoSaving(false);
    }
  };

  // Auto-save whenever answers change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (Object.keys(answers).length > 0) {
        autoSave();
      }
    }, 2000);

    return () => clearTimeout(debounceTimer);
  }, [answers]);

  // Current question data
  const currentQuestion = questions[currentQuestionIndex] || allQuestions[0];

  // Handle single answer updates
  const handleAnswerChange = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    });
  };

  // Handle checkbox/multiselect updates
  const handleMultiSelectChange = (option: string) => {
    const currentSelections = (answers[currentQuestion.id] as string[]) || [];
    const updatedSelections = currentSelections.includes(option)
      ? currentSelections.filter((item: string) => item !== option)
      : [...currentSelections, option];

    setAnswers({
      ...answers,
      [currentQuestion.id]: updatedSelections,
    });
  };

  // Add custom option to multiselect
  const handleAddCustomOption = () => {
    if (!customPageOption.trim()) return;

    const currentSelections = (answers[currentQuestion.id] as string[]) || [];

    // Add to answers
    setAnswers({
      ...answers,
      [currentQuestion.id]: [...currentSelections, customPageOption],
    });

    // Add to options
    const updatedQuestions = [...questions];
    const questionIndex = updatedQuestions.findIndex(
      (q) => q.id === currentQuestion.id
    );

    if (questionIndex !== -1 && updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        options: [
          ...(updatedQuestions[questionIndex].options || []),
          customPageOption,
        ],
      };
      setQuestions(updatedQuestions);
    }

    // Clear the input
    setCustomPageOption("");
  };

  // Handle color inputs
  const handleColorChange = (index: number, color: string) => {
    const currentColors = [
      ...((answers[currentQuestion.id] as string[]) || []),
    ];
    currentColors[index] = color;

    setAnswers({
      ...answers,
      [currentQuestion.id]: currentColors,
    });
  };

  // Add new color input
  const addColorInput = () => {
    const currentColors = [
      ...((answers[currentQuestion.id] as string[]) || []),
    ];
    currentColors.push("#000000");

    setAnswers({
      ...answers,
      [currentQuestion.id]: currentColors,
    });
  };

  // Remove color input
  const removeColorInput = (index: number) => {
    const currentColors = [
      ...((answers[currentQuestion.id] as string[]) || []),
    ];
    currentColors.splice(index, 1);

    setAnswers({
      ...answers,
      [currentQuestion.id]: currentColors,
    });
  };

  // Handle website list
  const handleWebsiteListChange = (
    index: number,
    field: "name" | "url",
    value: string
  ) => {
    const currentList = [
      ...((answers[currentQuestion.id] as { name: string; url: string }[]) ||
        []),
    ];

    if (!currentList[index]) {
      currentList[index] = { name: "", url: "" };
    }

    currentList[index][field] = value;

    setAnswers({
      ...answers,
      [currentQuestion.id]: currentList,
    });
  };

  // Add new website entry
  const addWebsiteEntry = () => {
    const currentList = [
      ...((answers[currentQuestion.id] as { name: string; url: string }[]) ||
        []),
    ];
    currentList.push({ name: "", url: "" });

    setAnswers({
      ...answers,
      [currentQuestion.id]: currentList,
    });
  };

  // Remove website entry
  const removeWebsiteEntry = (index: number) => {
    const currentList = [
      ...((answers[currentQuestion.id] as { name: string; url: string }[]) ||
        []),
    ];
    currentList.splice(index, 1);

    setAnswers({
      ...answers,
      [currentQuestion.id]: currentList,
    });
  };

  // File upload handlers removed

  // Validate the current answer
  const validateCurrentAnswer = () => {
    // Skip validation if the question is not required
    if (!currentQuestion.required) return true;

    const currentAnswer = answers[currentQuestion.id];

    // Check if the answer exists and is not empty
    if (currentAnswer === undefined || currentAnswer === null) {
      setError(
        currentQuestion.validationMessage ||
          "Please provide an answer before continuing"
      );
      return false;
    }

    // Type-specific validation
    switch (currentQuestion.type) {
      case "text":
      case "textarea":
        if (typeof currentAnswer !== "string" || currentAnswer.trim() === "") {
          setError(
            currentQuestion.validationMessage ||
              "Please provide an answer before continuing"
          );
          return false;
        }
        break;

      case "radio":
        if (
          typeof currentAnswer !== "string" ||
          !currentQuestion.options?.includes(currentAnswer)
        ) {
          setError(
            currentQuestion.validationMessage ||
              "Please select an option before continuing"
          );
          return false;
        }
        break;

      case "multiselect":
        if (!Array.isArray(currentAnswer) || currentAnswer.length === 0) {
          setError(
            currentQuestion.validationMessage ||
              "Please select at least one option before continuing"
          );
          return false;
        }
        break;

      case "color":
        if (!Array.isArray(currentAnswer) || currentAnswer.length === 0) {
          setError(
            currentQuestion.validationMessage ||
              "Please add at least one color before continuing"
          );
          return false;
        }

        // Validate each color is a valid hex code
        const colorArray = currentAnswer as string[];
        const invalidColor = colorArray.find(
          (color) => !/^#[0-9A-F]{6}$/i.test(color)
        );
        if (invalidColor) {
          setError(
            `"${invalidColor}" is not a valid hex color code. Please use format #RRGGBB`
          );
          return false;
        }
        break;

      case "websiteList":
        if (!Array.isArray(currentAnswer) || currentAnswer.length === 0) {
          setError(
            currentQuestion.validationMessage ||
              "Please add at least one entry before continuing"
          );
          return false;
        }
        break;
    }

    // Run custom validation function if provided
    if (
      currentQuestion.validateFn &&
      !currentQuestion.validateFn(currentAnswer)
    ) {
      setError(
        currentQuestion.validationMessage ||
          "Please provide a valid answer before continuing"
      );
      return false;
    }

    return true;
  };

  // Handle skipping a question
  const handleSkip = () => {
    setError("");

    // Save progress
    if (user) {
      autoSave();
    }

    // Move to the next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  // Go to next question
  const handleNext = () => {
    // Validate the current answer
    if (!validateCurrentAnswer()) return;

    setError("");
    setShowSuccess(true);

    // Save progress
    if (user) {
      autoSave();
    }

    setTimeout(() => {
      setShowSuccess(false);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        handleSubmit();
      }
    }, 800);
  };

  // Go to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Submit all answers
  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    setError("");

    try {
      const success = await saveQuestionnaireAnswers(user.uid, answers);

      if (success) {
        router.push("/dashboard");
      } else {
        throw new Error("Failed to save questionnaire answers");
      }
    } catch (error) {
      console.error("Error saving questionnaire:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while saving your answers"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize answers for certain question types
  useEffect(() => {
    if (!questions.length) return;

    const question = questions[currentQuestionIndex];
    if (!question) return;

    // If there's no answer for this question yet, initialize based on question type
    if (!answers[question.id]) {
      switch (question.type) {
        case "color":
          setAnswers({
            ...answers,
            [question.id]: ["#000000"],
          });
          break;

        case "websiteList":
          setAnswers({
            ...answers,
            [question.id]: [{ name: "", url: "" }],
          });
          break;
      }
    }
  }, [currentQuestionIndex, questions]);

  // Animation variants for page transitions
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: "easeInOut" },
  };

  if (loading || isVerifyingPayment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative mb-6">
            <div className="h-1 w-24 bg-neutral-800 rounded-full overflow-hidden">
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
          <p className="text-white text-lg">
            {isVerifyingPayment
              ? "Verifying your payment status..."
              : "Loading..."}
          </p>
        </motion.div>
      </div>
    );
  }

  // Render different input components based on question type
  const renderQuestionInput = () => {
    switch (currentQuestion.type) {
      case "text":
        return (
          <div className="relative">
            <input
              type="text"
              value={(answers[currentQuestion.id] as string) || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={currentQuestion.placeholder}
              className="w-full bg-transparent text-white text-xl md:text-2xl py-4 border-b-2 border-neutral-800 focus:border-[#F58327] focus:outline-none transition-all duration-200 placeholder-neutral-600"
            />
          </div>
        );

      case "textarea":
        return (
          <div className="relative">
            <textarea
              value={(answers[currentQuestion.id] as string) || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={currentQuestion.placeholder}
              rows={5}
              className="w-full bg-transparent text-white text-xl md:text-2xl py-4 border-b-2 border-neutral-800 focus:border-[#F58327] focus:outline-none transition-all duration-200 placeholder-neutral-600 resize-none"
            />
          </div>
        );

      case "radio":
        return (
          <div className="space-y-5 mt-4">
            {currentQuestion.options?.map((option, index) => (
              <motion.div
                key={option}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-start"
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 mt-1 rounded-full border-2 cursor-pointer mr-4 transition-colors duration-200 ${
                    answers[currentQuestion.id] === option
                      ? "border-[#F58327] bg-black"
                      : "border-neutral-600 bg-black"
                  }`}
                  onClick={() => handleAnswerChange(option)}
                >
                  {answers[currentQuestion.id] === option && (
                    <div className="w-2 h-2 rounded-full bg-[#F58327]"></div>
                  )}
                </div>
                <label
                  className="text-xl cursor-pointer"
                  onClick={() => handleAnswerChange(option)}
                >
                  {option}
                </label>
              </motion.div>
            ))}
          </div>
        );

      case "multiselect":
        return (
          <div className="space-y-5 mt-4">
            {currentQuestion.options?.map((option, index) => (
              <motion.div
                key={option}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-start"
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 mt-1 rounded-sm border-2 cursor-pointer mr-4 transition-colors duration-200 ${
                    ((answers[currentQuestion.id] as string[]) || []).includes(
                      option
                    )
                      ? "border-[#F58327] bg-black"
                      : "border-neutral-600 bg-black"
                  }`}
                  onClick={() => handleMultiSelectChange(option)}
                >
                  {((answers[currentQuestion.id] as string[]) || []).includes(
                    option
                  ) && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#F58327"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <label
                  className="text-xl cursor-pointer"
                  onClick={() => handleMultiSelectChange(option)}
                >
                  {option}
                </label>
              </motion.div>
            ))}

            {/* Add custom option for website pages */}
            {currentQuestion.id === "websitePages" && (
              <div className="mt-8 pt-4 border-t border-neutral-800">
                <p className="text-neutral-400 mb-3">Add a custom page type:</p>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={customPageOption}
                    onChange={(e) => setCustomPageOption(e.target.value)}
                    placeholder="Enter custom page name"
                    className="flex-1 bg-transparent border border-neutral-700 rounded-l-lg px-4 py-2 text-white focus:border-[#F58327] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomOption}
                    disabled={!customPageOption.trim()}
                    className="cursor-pointer bg-[#F58327] text-white rounded-r-lg px-4 py-2 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case "color":
        return (
          <div className="space-y-4 mt-4">
            <p className="text-neutral-400 text-sm mb-2">
              Enter hex color codes (e.g., #FF5733) for your brand or website
              colors
            </p>

            {((answers[currentQuestion.id] as string[]) || []).map(
              (color, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="w-12 h-12 rounded-md cursor-pointer border-2 border-neutral-700"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => {
                      // Validate hex code format
                      const value = e.target.value;
                      if (/^#[0-9A-F]{0,6}$/i.test(value) || value === "#") {
                        handleColorChange(index, value);
                      }
                    }}
                    placeholder="#000000"
                    className="bg-transparent border-b-2 border-neutral-700 px-2 py-1 text-white focus:border-[#F58327] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeColorInput(index)}
                    className="cursor-pointer text-red-500 hover:text-red-400"
                    aria-label="Remove color"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )
            )}

            <button
              type="button"
              onClick={addColorInput}
              className="cursor-pointer flex items-center text-[#F58327] hover:text-[#e67016] transition-colors mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Color
            </button>
          </div>
        );

      case "websiteList":
        return (
          <div className="space-y-4 mt-4">
            <p className="text-neutral-400 text-sm mb-2">
              Add websites or keywords, one per entry
            </p>

            {(
              (answers[currentQuestion.id] as {
                name: string;
                url: string;
              }[]) || []
            ).map((item, index) => (
              <div
                key={index}
                className="space-y-2 p-4 bg-neutral-900 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-white text-sm font-medium">
                    Entry {index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeWebsiteEntry(index)}
                    className="cursor-pointer text-red-500 hover:text-red-400"
                    aria-label="Remove entry"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-neutral-500 mb-1">
                      Name/Description
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleWebsiteListChange(index, "name", e.target.value)
                      }
                      placeholder="Competitor name or keyword"
                      className="w-full bg-black rounded border border-neutral-800 px-3 py-2 text-white focus:border-[#F58327] focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-neutral-500 mb-1">
                      URL (optional)
                    </label>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-neutral-600 mr-2" />
                      <input
                        type="text"
                        value={item.url}
                        onChange={(e) =>
                          handleWebsiteListChange(index, "url", e.target.value)
                        }
                        placeholder="www.example.com"
                        className="w-full bg-black border-b border-neutral-800 px-1 py-2 text-white focus:border-[#F58327] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addWebsiteEntry}
              className="cursor-pointer flex items-center text-[#F58327] hover:text-[#e67016] transition-colors mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Entry
            </button>
          </div>
        );

      default:
        return (
          <div className="text-red-400">
            Unsupported question type: {currentQuestion.type}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Progress bar at top */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <span className="text-sm text-neutral-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <div className="flex items-center">
            {autoSaving && (
              <span className="text-xs text-[#F58327] mr-3 flex items-center">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </span>
            )}
            <span className="text-sm text-neutral-400">
              {Math.round(
                ((currentQuestionIndex + 1) / questions.length) * 100
              )}
              % completed
            </span>
          </div>
        </div>
        <div className="h-1 w-full bg-neutral-800">
          <motion.div
            className="h-full bg-[#F58327]"
            initial={{
              width: `${(currentQuestionIndex / questions.length) * 100}%`,
            }}
            animate={{
              width: `${
                ((currentQuestionIndex + 1) / questions.length) * 100
              }%`,
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          ></motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="mb-8 px-6 py-4 border-l-4 border-red-500 bg-black"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-red-400">{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeInUp}
            className="mb-16"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-16">
              <div className="md:w-1/3 mb-6 md:mb-0">
                <span className="text-[#F58327] text-xl md:text-2xl font-light">
                  {currentQuestionIndex + 1}→
                </span>
                <h2 className="text-2xl md:text-4xl font-medium mt-2 md:mt-4 leading-tight">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.required && (
                  <p className="text-[#F58327] text-sm mt-2">* Required</p>
                )}
              </div>

              <div className="md:w-2/3">{renderQuestionInput()}</div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="cursor-pointer flex items-center text-white text-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 hover:text-[#F58327]"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Previous
            </button>

            {!currentQuestion.required && (
              <button
                type="button"
                onClick={handleSkip}
                className="cursor-pointer ml-6 text-neutral-500 hover:text-white text-sm underline"
              >
                Skip for now
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="cursor-pointer relative flex items-center justify-center bg-[#F58327] text-white text-lg rounded-full px-8 py-3 min-w-[160px] h-[54px] disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 hover:bg-[#e67016]"
          >
            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-full"
                >
                  <Check className="h-6 w-6 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="button-content"
                  className="flex items-center justify-center w-full"
                >
                  {currentQuestionIndex === questions.length - 1 ? (
                    isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Submitting
                      </>
                    ) : (
                      "Submit"
                    )
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
      <p className="flex flex-row justify-center text-neutral-500">
        You can leave this page and come back whenever...
      </p>
    </div>
  );
}
