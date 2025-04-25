"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  saveQuestionnaireProgress,
  saveCompletedQuestionnaire,
  getQuestionnaireProgress,
  autoSaveQuestionnaireProgress,
} from "@/lib/questionnaire-service";
import { getUserData } from "@/lib/auth-service";
import type {
  QuestionnaireAnswers,
  SocialMediaLink,
  TeamMember,
  Service,
  WebsiteEntry,
} from "@/types";
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

  // Track if component is mounted
  const isMountedRef = useRef(true);

  // Set mounted state on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

    // Sort questions by category to ensure logical grouping
    const sortedQuestions = [...filteredQuestions].sort((a, b) => {
      // Define the priority order for categories
      const categoryOrder = [
        "basics",
        "businessType",
        "domain",
        "websiteInfo",
        "businessHours",
        "designPreferences",
        "brandAssets",
        "teamInfo",
        "serviceInfo",
        "socialMediaAndMultimedia",
        "contentStrategy",
        "additionalInfo",
      ];

      const aIndex = categoryOrder.indexOf(a.category || "");
      const bIndex = categoryOrder.indexOf(b.category || "");

      // If both have categories in our order list, sort by that order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only one has a category in our order list, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // Otherwise, maintain original order
      return 0;
    });

    setQuestions(sortedQuestions);
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

  // Load user data and questionnaire progress
  useEffect(() => {
    async function loadUserQuestionnaireData() {
      if (user) {
        try {
          console.log("Loading user questionnaire data...");
          setIsVerifyingPayment(true);

          // Get the latest user data directly from Firestore
          const latestUserData = await getUserData(user.uid);
          console.log("Latest user data:", latestUserData);

          if (latestUserData?.hasPaid) {
            console.log("User has paid according to Firestore");
            setHasPaid(true);

            // Get questionnaire progress
            const progress = await getQuestionnaireProgress(user.uid);

            if (progress) {
              console.log("Found existing questionnaire progress:", progress);
              // Load saved answers
              setAnswers(progress.answers);

              // If there's a saved question index, use it
              if (
                progress.currentQuestionIndex !== null &&
                progress.currentQuestionIndex !== undefined
              ) {
                setCurrentQuestionIndex(progress.currentQuestionIndex);
              }
            } else {
              console.log("No existing questionnaire progress found");
            }
          } else {
            console.log("User has not paid according to Firestore");
          }
        } catch (error) {
          console.error("Error loading questionnaire data:", error);
        } finally {
          if (isMountedRef.current) {
            setIsVerifyingPayment(false);
          }
        }
      } else if (!loading) {
        if (isMountedRef.current) {
          setIsVerifyingPayment(false);
        }
      }
    }

    if (!loading) {
      loadUserQuestionnaireData();
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

  // Auto-save function with debouncing
  const autoSave = async () => {
    if (!user || Object.keys(answers).length === 0) return;

    setAutoSaving(true);

    try {
      await autoSaveQuestionnaireProgress(
        user.uid,
        answers,
        currentQuestionIndex
      );
      console.log("Auto-saved questionnaire progress");
    } catch (error) {
      console.error("Error auto-saving answers:", error);
    } finally {
      if (isMountedRef.current) {
        setAutoSaving(false);
      }
    }
  };

  // Auto-save whenever answers change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (Object.keys(answers).length > 0 && user && !isVerifyingPayment) {
        autoSave();
      }
    }, 2000);

    return () => clearTimeout(debounceTimer);
  }, [answers, user, isVerifyingPayment]);

  // Current question data
  const currentQuestion = questions[currentQuestionIndex] || questionsData[0];

  // Handle single answer updates
  const handleAnswerChange = (value: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: value,
    }));
  };

  // Handle checkbox/multiselect updates
  const handleMultiSelectChange = (option: string) => {
    const currentSelections = (answers[currentQuestion.id] as string[]) || [];
    const updatedSelections = currentSelections.includes(option)
      ? currentSelections.filter((item: string) => item !== option)
      : [...currentSelections, option];

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: updatedSelections,
    }));
  };

  // Add custom option to multiselect
  const handleAddCustomOption = () => {
    if (!customPageOption.trim()) return;

    // Get current selections (initialize as empty array if undefined)
    const currentSelections = (answers[currentQuestion.id] as string[]) || [];

    // Check if option already exists in the selections to avoid duplicates
    if (!currentSelections.includes(customPageOption)) {
      // Add to answers - make sure to create a new array reference to trigger state updates
      setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [currentQuestion.id]: [...currentSelections, customPageOption],
      }));
    }

    // Update the questions state to include the new option
    const updatedQuestions = [...questions];
    const questionIndex = updatedQuestions.findIndex(
      (q) => q.id === currentQuestion.id
    );

    if (questionIndex !== -1 && updatedQuestions[questionIndex].options) {
      // Only add if the option doesn't already exist
      if (
        !updatedQuestions[questionIndex].options?.includes(customPageOption)
      ) {
        updatedQuestions[questionIndex] = {
          ...updatedQuestions[questionIndex],
          options: [
            ...(updatedQuestions[questionIndex].options || []),
            customPageOption,
          ],
        };
        setQuestions(updatedQuestions);
      }
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

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentColors,
    }));
  };

  // Add new color input
  const addColorInput = () => {
    const currentColors = [
      ...((answers[currentQuestion.id] as string[]) || []),
    ];
    currentColors.push("#000000");

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentColors,
    }));
  };

  // Remove color input
  const removeColorInput = (index: number) => {
    const currentColors = [
      ...((answers[currentQuestion.id] as string[]) || []),
    ];
    currentColors.splice(index, 1);

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentColors,
    }));
  };

  // Handle website list
  const handleWebsiteListChange = (
    index: number,
    field: "name" | "url",
    value: string
  ) => {
    const currentList = [
      ...((answers[currentQuestion.id] as WebsiteEntry[]) || []),
    ];

    if (!currentList[index]) {
      currentList[index] = { name: "", url: "" };
    }

    currentList[index][field] = value;

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentList,
    }));
  };

  // Add new website entry
  const addWebsiteEntry = () => {
    const currentList = [
      ...((answers[currentQuestion.id] as WebsiteEntry[]) || []),
    ];
    currentList.push({ name: "", url: "" });

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentList,
    }));
  };

  // Remove website entry
  const removeWebsiteEntry = (index: number) => {
    const currentList = [
      ...((answers[currentQuestion.id] as WebsiteEntry[]) || []),
    ];
    currentList.splice(index, 1);

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentList,
    }));
  };

  // Handle social media links
  const handleSocialMediaChange = (
    index: number,
    field: "platform" | "url",
    value: string
  ) => {
    const currentLinks = [
      ...((answers[currentQuestion.id] as SocialMediaLink[]) || []),
    ];

    if (!currentLinks[index]) {
      currentLinks[index] = { platform: "", url: "" };
    }

    currentLinks[index][field] = value;

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentLinks,
    }));
  };

  // Add new social media link
  const addSocialMediaLink = () => {
    const currentLinks = [
      ...((answers[currentQuestion.id] as SocialMediaLink[]) || []),
    ];
    currentLinks.push({ platform: "", url: "" });

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentLinks,
    }));
  };

  // Remove social media link
  const removeSocialMediaLink = (index: number) => {
    const currentLinks = [
      ...((answers[currentQuestion.id] as SocialMediaLink[]) || []),
    ];
    currentLinks.splice(index, 1);

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentLinks,
    }));
  };

  // Handle team members
  const handleTeamMemberChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const currentTeam = [
      ...((answers[currentQuestion.id] as TeamMember[]) || []),
    ];

    if (!currentTeam[index]) {
      currentTeam[index] = {
        name: "",
        position: "",
        description: "",
        socialMedia: [],
      };
    }

    // Use type assertion to tell TypeScript that this is a valid field
    (currentTeam[index] as any)[field] = value;

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentTeam,
    }));
  };

  // Handle team member social media
  const handleTeamMemberSocialChange = (
    teamIndex: number,
    socialIndex: number,
    field: "platform" | "url",
    value: string
  ) => {
    const currentTeam = [
      ...((answers[currentQuestion.id] as TeamMember[]) || []),
    ];

    if (!currentTeam[teamIndex]) {
      currentTeam[teamIndex] = {
        name: "",
        position: "",
        description: "",
        socialMedia: [],
      };
    }

    if (!currentTeam[teamIndex].socialMedia) {
      currentTeam[teamIndex].socialMedia = [];
    }

    if (!currentTeam[teamIndex].socialMedia![socialIndex]) {
      currentTeam[teamIndex].socialMedia![socialIndex] = {
        platform: "",
        url: "",
      };
    }

    currentTeam[teamIndex].socialMedia![socialIndex][field] = value;

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentTeam,
    }));
  };

  // Add new team member
  const addTeamMember = () => {
    const currentTeam = [
      ...((answers[currentQuestion.id] as TeamMember[]) || []),
    ];
    currentTeam.push({
      name: "",
      position: "",
      description: "",
      socialMedia: [],
    });

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentTeam,
    }));
  };

  // Remove team member
  const removeTeamMember = (index: number) => {
    const currentTeam = [
      ...((answers[currentQuestion.id] as TeamMember[]) || []),
    ];
    currentTeam.splice(index, 1);

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentTeam,
    }));
  };

  // Add team member social media link
  const addTeamMemberSocial = (teamIndex: number) => {
    const currentTeam = [
      ...((answers[currentQuestion.id] as TeamMember[]) || []),
    ];

    if (!currentTeam[teamIndex].socialMedia) {
      currentTeam[teamIndex].socialMedia = [];
    }

    currentTeam[teamIndex].socialMedia!.push({ platform: "", url: "" });

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentTeam,
    }));
  };

  // Remove team member social media link
  const removeTeamMemberSocial = (teamIndex: number, socialIndex: number) => {
    const currentTeam = [
      ...((answers[currentQuestion.id] as TeamMember[]) || []),
    ];

    if (currentTeam[teamIndex].socialMedia) {
      currentTeam[teamIndex].socialMedia!.splice(socialIndex, 1);
    }

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentTeam,
    }));
  };

  // Handle services
  const handleServiceChange = (index: number, field: string, value: string) => {
    const currentServices = [
      ...((answers[currentQuestion.id] as Service[]) || []),
    ];

    if (!currentServices[index]) {
      currentServices[index] = {
        name: "",
        description: "",
        price: "",
      };
    }

    // Use type assertion to tell TypeScript that this is a valid field
    (currentServices[index] as any)[field] = value;

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentServices,
    }));
  };

  // Add new service
  const addService = () => {
    const currentServices = [
      ...((answers[currentQuestion.id] as Service[]) || []),
    ];

    // Limit to max 3 services
    if (currentServices.length < 3) {
      currentServices.push({ name: "", description: "", price: "" });

      setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [currentQuestion.id]: currentServices,
      }));
    }
  };

  // Remove service
  const removeService = (index: number) => {
    const currentServices = [
      ...((answers[currentQuestion.id] as Service[]) || []),
    ];
    currentServices.splice(index, 1);

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: currentServices,
    }));
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
            setAnswers((prevAnswers) => ({
              ...prevAnswers,
              [currentQuestion.id]: fileUpload,
            }));

            console.log(`File uploaded successfully: ${fileName}`);
          } catch (error) {
            console.error("Error getting download URL:", error);
            setError("Upload completed but couldn't retrieve file URL.");
          } finally {
            if (isMountedRef.current) {
              setIsUploading(false);
              setActiveUploadTask(null);
            }
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

  const handleTeamMemberImageUpload = async (index: number, file: File) => {
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

      // Only allow image files
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        setIsUploading(false);
        return;
      }

      // Generate a unique file path in Firebase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `teamMember_${index}_${Date.now()}.${fileExt}`;
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

            // Create the file upload object
            const fileUpload: FileUpload = {
              name: file.name,
              url: downloadURL,
              type: file.type,
              size: file.size,
            };

            // Update the team member's image
            const currentTeam = [
              ...((answers[currentQuestion.id] as TeamMember[]) || []),
            ];

            if (currentTeam[index]) {
              currentTeam[index].image = fileUpload;

              setAnswers((prevAnswers) => ({
                ...prevAnswers,
                [currentQuestion.id]: currentTeam,
              }));
            }

            console.log(`Team member image uploaded successfully: ${fileName}`);
          } catch (error) {
            console.error("Error getting download URL:", error);
            setError("Upload completed but couldn't retrieve file URL.");
          } finally {
            if (isMountedRef.current) {
              setIsUploading(false);
              setActiveUploadTask(null);
            }
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

  const handleServiceImageUpload = async (index: number, file: File) => {
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

      // Only allow image files
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        setIsUploading(false);
        return;
      }

      // Generate a unique file path in Firebase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `service_${index}_${Date.now()}.${fileExt}`;
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

            // Create the file upload object
            const fileUpload: FileUpload = {
              name: file.name,
              url: downloadURL,
              type: file.type,
              size: file.size,
            };

            // Update the service's image
            const currentServices = [
              ...((answers[currentQuestion.id] as Service[]) || []),
            ];

            if (currentServices[index]) {
              currentServices[index].image = fileUpload;

              setAnswers((prevAnswers) => ({
                ...prevAnswers,
                [currentQuestion.id]: currentServices,
              }));
            }

            console.log(`Service image uploaded successfully: ${fileName}`);
          } catch (error) {
            console.error("Error getting download URL:", error);
            setError("Upload completed but couldn't retrieve file URL.");
          } finally {
            if (isMountedRef.current) {
              setIsUploading(false);
              setActiveUploadTask(null);
            }
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

      // Check file count limit (10 photos)
      if (
        currentQuestion.id === "teamPhotos" &&
        existingFiles.length + files.length > 10
      ) {
        setError(
          `You can upload a maximum of 10 photos. You already have ${existingFiles.length} photos.`
        );
        setIsUploading(false);
        return;
      }
      // Calculate size of existing files
      const existingFilesSize = existingFiles.reduce(
        (total, file) => total + file.size,
        0
      );

      // Calculate size of new files
      const newFilesSize = Array.from(files).reduce(
        (total, file) => total + file.size,
        0
      );

      // Check total size limit (50MB)
      const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB in bytes
      if (
        currentQuestion.id === "teamPhotos" &&
        existingFilesSize + newFilesSize > MAX_TOTAL_SIZE
      ) {
        setError(
          `Total size cannot exceed 50MB. Current size: ${formatFileSize(
            existingFilesSize
          )}, New files: ${formatFileSize(newFilesSize)}`
        );
        setIsUploading(false);
        return;
      }

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
        setAnswers((prevAnswers) => ({
          ...prevAnswers,
          [currentQuestion.id]: [...existingFiles, ...newFiles],
        }));
        console.log(`${newFiles.length} files uploaded successfully`);
      } else {
        setError("No files were uploaded successfully.");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      setError("Failed to upload files. Please try again.");
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
        setActiveUploadTask(null);
      }
    }
  };

  // Helper function to format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleRemoveFile = async () => {
    if (!user) return;

    try {
      const fileUpload = answers[currentQuestion.id] as FileUpload | undefined;

      if (fileUpload && fileUpload.url) {
        // Extract the file path from the download URL
        const fileRef = ref(storage, fileUpload.url);

        // Delete the file from storage
        await deleteObject(fileRef);

        // Remove from answers
        setAnswers((prevAnswers) => {
          const updatedAnswers = { ...prevAnswers };
          delete updatedAnswers[currentQuestion.id];
          return updatedAnswers;
        });

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

        setAnswers((prevAnswers) => ({
          ...prevAnswers,
          [currentQuestion.id]: updatedFiles,
        }));

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

      case "socialMedia":
        if (!Array.isArray(currentAnswer) || currentAnswer.length === 0) {
          setError(
            currentQuestion.validationMessage ||
              "Please add at least one social media platform before continuing"
          );
          return false;
        }

        // Validate that each social media entry has both platform and URL
        const socialLinks = currentAnswer as SocialMediaLink[];
        const invalidSocial = socialLinks.find(
          (social) => !social.platform || !social.url
        );
        if (invalidSocial) {
          setError(
            "Please provide both platform and URL for all social media entries"
          );
          return false;
        }
        break;

      case "teamMembers":
        if (!Array.isArray(currentAnswer) || currentAnswer.length === 0) {
          setError(
            currentQuestion.validationMessage ||
              "Please add at least one team member before continuing"
          );
          return false;
        }

        // Validate that each team member has required fields
        const teamMembers = currentAnswer as TeamMember[];
        const invalidMember = teamMembers.find(
          (member) => !member.name || !member.position || !member.description
        );
        if (invalidMember) {
          setError(
            "Please provide name, position, and description for all team members"
          );
          return false;
        }
        break;

      case "services":
        if (!Array.isArray(currentAnswer) || currentAnswer.length === 0) {
          setError(
            currentQuestion.validationMessage ||
              "Please add at least one service before continuing"
          );
          return false;
        }

        // Validate that each service has required fields
        const services = currentAnswer as Service[];
        const invalidService = services.find(
          (service) => !service.name || !service.description
        );
        if (invalidService) {
          setError("Please provide name and description for all services");
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

      case "domainSearch":
        if (typeof currentAnswer !== "string" || currentAnswer.trim() === "") {
          setError(
            currentQuestion.validationMessage ||
              "Please select a domain before continuing"
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
  const handleNext = async () => {
    // Validate the current answer
    if (!validateCurrentAnswer()) return;

    setError("");
    setShowSuccess(true);

    // Save progress with the current question index
    if (user) {
      try {
        await saveQuestionnaireProgress(
          user.uid,
          answers,
          currentQuestionIndex + 1
        );
      } catch (error) {
        console.error("Error saving progress:", error);
      }
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
  const handlePrevious = async () => {
    if (currentQuestionIndex > 0) {
      // Save progress with the previous question index
      if (user) {
        try {
          await saveQuestionnaireProgress(
            user.uid,
            answers,
            currentQuestionIndex - 1
          );
        } catch (error) {
          console.error("Error saving progress:", error);
        }
      }

      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Submit all answers
  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Save as completed questionnaire
      const success = await saveCompletedQuestionnaire(user.uid, answers);

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
    if (answers[question.id] === undefined) {
      switch (question.type) {
        case "color":
          setAnswers((prevAnswers) => ({
            ...prevAnswers,
            [question.id]: ["#000000"],
          }));
          break;

        case "websiteList":
          setAnswers((prevAnswers) => ({
            ...prevAnswers,
            [question.id]: [{ name: "", url: "" }],
          }));
          break;

        case "socialMedia":
          setAnswers((prevAnswers) => ({
            ...prevAnswers,
            [question.id]: [{ platform: "", url: "" }],
          }));
          break;

        case "teamMembers":
          setAnswers((prevAnswers) => ({
            ...prevAnswers,
            [question.id]: [],
          }));
          break;

        case "services":
          setAnswers((prevAnswers) => ({
            ...prevAnswers,
            [question.id]: [],
          }));
          break;

        case "fileUpload":
          if (question.fileType === "multiple-images") {
            setAnswers((prevAnswers) => ({
              ...prevAnswers,
              [question.id]: [],
            }));
          }
          break;
      }
    }
  }, [currentQuestionIndex, questions, answers]);

  // Animation variants for page transitions
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: "easeInOut" },
  };

  if (loading || isVerifyingPayment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
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
    subtext: currentQuestion.subtext,
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
    handleSocialMediaChange,
    addSocialMediaLink,
    removeSocialMediaLink,
    handleTeamMemberChange,
    handleTeamMemberSocialChange,
    handleTeamMemberImageUpload,
    addTeamMember,
    removeTeamMember,
    addTeamMemberSocial,
    removeTeamMemberSocial,
    handleServiceChange,
    handleServiceImageUpload,
    addService,
    removeService,
    isUploading,
    uploadProgress,
    fileType: currentQuestion.fileType,
    acceptedFileTypes: currentQuestion.acceptedFileTypes,
    showUploadInline: currentQuestion.showUploadInline,
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Progress bar at top */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-[#0d0d0d]">
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
              className="mb-8 px-6 py-4 border-l-4 border-red-500 bg-[#0d0d0d]"
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
      <p className="flex flex-row justify-center text-neutral-500 pb-8">
        You can leave this page and come back whenever...
      </p>
    </div>
  );
}
