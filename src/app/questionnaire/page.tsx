"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  saveQuestionnaireAnswers,
  savePartialQuestionnaireAnswers,
  getUserData,
} from "@/lib/auth-service";
import type { QuestionnaireAnswers } from "@/types";
import type { FileUpload } from "@/types";
import { useFirebase } from "@/components/firebase-provider";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getQuestionComponent } from "@/components/questionnaire/QuestionComponents";
import { questionsData } from "@/lib/questionnaire-data";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

// Import validation functions
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const validateFileSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE;
};

const validateFileType = (file: File, acceptedTypes: string): boolean => {
  if (!acceptedTypes) return true;

  const acceptedTypesArray = acceptedTypes.split(",");
  return acceptedTypesArray.some((type) => {
    // Handle wildcard types like image/*
    if (type.endsWith("/*")) {
      const category = type.split("/")[0];
      return file.type.startsWith(`${category}/`);
    }
    return file.type === type;
  });
};

// Import Question type from our data file
import type { Question } from "@/lib/questionnaire-data";

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeUploadTask, setActiveUploadTask] = useState<any>(null);
  const userPlanType = userData?.planType?.toLowerCase() || "";

  // Filter questions based on conditional logic
  useEffect(() => {
    // Filter questions based on conditions and plan type
    const filteredQuestions = questionsData.filter((question) => {
      // First check plan-specific condition if it exists
      if (question.planCondition) {
        if (question.planCondition.type === "plan") {
          // If this question has plan restrictions, check if user's plan is allowed
          const allowedPlans = question.planCondition.plans;
          if (!allowedPlans.includes(userPlanType)) {
            return false; // User's plan doesn't have access to this question
          }
        }
      }

      // If question has no condition, always include it (subject to plan restrictions above)
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
  }, [answers, userPlanType]);

  // Cleanup active uploads when component unmounts
  useEffect(() => {
    return () => {
      // Cancel any ongoing uploads when component unmounts
      if (activeUploadTask) {
        try {
          activeUploadTask.cancel();
          console.log("Upload task canceled due to component unmount");
        } catch (error) {
          console.error("Error canceling upload task:", error);
        }
      }
    };
  }, [activeUploadTask]);

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
              const questionIds = questionsData.map((q) => q.id);

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
                Math.min(lastAnsweredIndex + 1, questionsData.length - 1)
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
  const currentQuestion = questions[currentQuestionIndex] || questionsData[0];

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

  // File upload handlers
  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      setIsUploading(true);
      setError("");
      setUploadProgress(0);

      // Validate file size
      if (!validateFileSize(file)) {
        setError(
          "File size exceeds the 5MB limit. Please upload a smaller file."
        );
        setIsUploading(false);
        return;
      }

      // Validate file type
      if (
        currentQuestion.acceptedFileTypes &&
        !validateFileType(file, currentQuestion.acceptedFileTypes)
      ) {
        setError(
          `Invalid file type. Accepted types: ${currentQuestion.acceptedFileTypes
            .replace(/image\//g, "")
            .replace(/,/g, ", ")}`
        );
        setIsUploading(false);
        return;
      }

      // Generate a unique file path in Firebase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentQuestion.id}_${Date.now()}.${fileExt}`;
      const filePath = `users/${user.uid}/${fileName}`;

      // Create a reference to the storage location
      const storageRef = ref(storage, filePath);

      // Create the upload task with progress monitoring
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Track this as the active upload task
      setActiveUploadTask(uploadTask);

      // Set up progress monitoring
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Track upload progress
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
        },
        (error) => {
          // Handle errors
          console.error("Upload error:", error);
          setError("Upload failed. Please try again.");
          setIsUploading(false);
          setActiveUploadTask(null);
        },
        async () => {
          // Upload completed successfully
          try {
            // Get the download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Create the file upload object to save in the questionnaire answers
            const fileUpload: FileUpload = {
              name: file.name,
              url: downloadURL,
              type: file.type,
              size: file.size,
            };

            // Update answers state
            setAnswers({
              ...answers,
              [currentQuestion.id]: fileUpload,
            });

            console.log(`File uploaded successfully: ${fileName}`);
          } catch (error) {
            console.error("Error getting download URL:", error);
            setError("Upload completed but couldn't retrieve file URL.");
          } finally {
            setIsUploading(false);
            setActiveUploadTask(null);
          }
        }
      );
    } catch (error) {
      console.error("Error starting upload:", error);
      setError("Failed to upload file. Please try again.");
      setIsUploading(false);
      setActiveUploadTask(null);
    }
  };

  const handleMultipleFileUpload = async (files: FileList) => {
    if (!user) return;

    try {
      setIsUploading(true);
      setError("");
      setUploadProgress(0);

      // Get existing files (if any)
      const existingFiles = (answers[currentQuestion.id] as FileUpload[]) || [];
      const newFiles: FileUpload[] = [];
      let totalFiles = files.length;
      let completedFiles = 0;

      // Process each file in the list
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file size
        if (!validateFileSize(file)) {
          setError(`File ${file.name} exceeds the 5MB limit and was skipped.`);
          totalFiles--;
          continue;
        }

        // Validate file type
        if (
          currentQuestion.acceptedFileTypes &&
          !validateFileType(file, currentQuestion.acceptedFileTypes)
        ) {
          setError(`File ${file.name} has an invalid type and was skipped.`);
          totalFiles--;
          continue;
        }

        // Generate a unique file path in Firebase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${currentQuestion.id}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `users/${user.uid}/${fileName}`;

        // Create a reference to the storage location
        const storageRef = ref(storage, filePath);

        // Create the upload task
        const uploadTask = uploadBytesResumable(storageRef, file);
        setActiveUploadTask(uploadTask);

        // Set up progress monitoring and handle completion
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              // Calculate overall progress (completed files + current file progress)
              const fileProgress =
                snapshot.bytesTransferred / snapshot.totalBytes;
              const overallProgress =
                ((completedFiles + fileProgress) / totalFiles) * 100;
              setUploadProgress(overallProgress);
            },
            (error) => {
              console.error(`Error uploading ${file.name}:`, error);
              resolve(); // Continue with next file even if this one fails
            },
            async () => {
              try {
                // Get download URL
                const downloadURL = await getDownloadURL(
                  uploadTask.snapshot.ref
                );

                // Create file upload object
                newFiles.push({
                  name: file.name,
                  url: downloadURL,
                  type: file.type,
                  size: file.size,
                });

                completedFiles++;
                resolve();
              } catch (error) {
                console.error("Error getting download URL:", error);
                resolve(); // Continue with next file
              }
            }
          );
        });
      }

      // Update answers state with both existing and new files
      if (newFiles.length > 0) {
        setAnswers({
          ...answers,
          [currentQuestion.id]: [...existingFiles, ...newFiles],
        });
        console.log(`${newFiles.length} files uploaded successfully`);
      } else {
        setError("No files were uploaded successfully.");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      setError("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
      setActiveUploadTask(null);
    }
  };

  const handleRemoveFile = async () => {
    if (!user) return;

    try {
      const fileUpload = answers[currentQuestion.id] as FileUpload;

      if (fileUpload && fileUpload.url) {
        // Extract the file path from the download URL
        const fileRef = ref(storage, fileUpload.url);

        // Delete the file from storage
        await deleteObject(fileRef);

        // Remove from answers
        const updatedAnswers = { ...answers };
        delete updatedAnswers[currentQuestion.id];
        setAnswers(updatedAnswers);

        console.log("File deleted successfully");
      }
    } catch (error) {
      console.error("Error removing file:", error);
      setError("Failed to remove file. Please try again.");
    }
  };

  const handleRemoveFileAtIndex = async (index: number) => {
    if (!user) return;

    try {
      const files = (answers[currentQuestion.id] as FileUpload[]) || [];

      if (files[index] && files[index].url) {
        // Extract the file path from the download URL
        const fileRef = ref(storage, files[index].url);

        // Delete the file from storage
        await deleteObject(fileRef);

        // Remove from answers
        const updatedFiles = [...files];
        updatedFiles.splice(index, 1);

        setAnswers({
          ...answers,
          [currentQuestion.id]: updatedFiles,
        });

        console.log(`File at index ${index} deleted successfully`);
      }
    } catch (error) {
      console.error("Error removing file:", error);
      setError("Failed to remove file. Please try again.");
    }
  };

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

      case "fileUpload":
        // File uploads are optional by default, so we don't validate them
        // unless explicitly required
        if (currentQuestion.required) {
          if (
            currentQuestion.fileType === "image" &&
            (!currentAnswer || Object.keys(currentAnswer).length === 0)
          ) {
            setError("Please upload a file before continuing");
            return false;
          } else if (
            currentQuestion.fileType === "multiple-images" &&
            (!Array.isArray(currentAnswer) || currentAnswer.length === 0)
          ) {
            setError("Please upload at least one file before continuing");
            return false;
          }
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

        case "fileUpload":
          if (question.fileType === "multiple-images") {
            setAnswers({
              ...answers,
              [question.id]: [],
            });
          }
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

  // Create props for question component
  const questionComponentProps = {
    questionId: currentQuestion.id,
    type: currentQuestion.type,
    placeholder: currentQuestion.placeholder,
    options: currentQuestion.options,
    answers,
    handleAnswerChange,
    handleMultiSelectChange,
    handleColorChange,
    addColorInput,
    removeColorInput,
    handleWebsiteListChange,
    addWebsiteEntry,
    removeWebsiteEntry,
    handleAddCustomOption,
    customPageOption,
    setCustomPageOption,
    handleFileUpload,
    handleMultipleFileUpload,
    handleRemoveFile,
    handleRemoveFileAtIndex,
    isUploading,
    uploadProgress,
    fileType: currentQuestion.fileType,
    acceptedFileTypes: currentQuestion.acceptedFileTypes,
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

              <div className="md:w-2/3">
                {getQuestionComponent(
                  currentQuestion.type,
                  questionComponentProps
                )}
              </div>
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
