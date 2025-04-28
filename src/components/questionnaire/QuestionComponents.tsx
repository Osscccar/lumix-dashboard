import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  X,
  Globe,
  Upload,
  Loader2,
  Image as ImageIcon,
  Search,
  User,
  Briefcase,
  Edit,
  Package,
  DollarSign,
  ChevronDown,
  Camera,
} from "lucide-react";
import {
  type QuestionnaireAnswers,
  type SocialMediaLink,
  type TeamMember,
  type Service,
} from "@/types";
import { FileUpload, WebsiteEntry } from "@/types";
import { DomainSearchInput } from "./DomainSearchInput";
import { useFirebase } from "../firebase-provider";

// Social media icons
const FacebookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
  >
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
  </svg>
);

const InstagramIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
  >
    <path d="M12 2c-2.716 0-3.056.012-4.123.06-1.064.049-1.791.218-2.427.465a4.901 4.901 0 00-1.772 1.153A4.902 4.902 0 002.525 5.45c-.247.636-.416 1.363-.465 2.427C2.012 8.944 2 9.284 2 12s.012 3.056.06 4.123c.049 1.064.218 1.791.465 2.427a4.902 4.902 0 001.153 1.772 4.901 4.901 0 001.772 1.153c.636.247 1.363.416 2.427.465 1.067.048 1.407.06 4.123.06s3.056-.012 4.123-.06c1.064-.049 1.791-.218 2.427-.465a4.901 4.901 0 001.772-1.153 4.902 4.902 0 001.153-1.772c.247-.636.416-1.363.465-2.427.048-1.067.06-1.407.06-4.123s-.012-3.056-.06-4.123c-.049-1.064-.218-1.791-.465-2.427a4.902 4.902 0 00-1.153-1.772 4.901 4.901 0 00-1.772-1.153c-.636-.247-1.363-.416-2.427-.465C15.056 2.012 14.716 2 12 2zm0 1.802c2.67 0 2.986.01 4.04.058.976.045 1.505.207 1.858.344.466.181.8.398 1.15.748.35.35.566.684.748 1.15.137.353.3.882.344 1.857.048 1.055.058 1.37.058 4.041 0 2.67-.01 2.986-.058 4.04-.045.976-.207 1.505-.344 1.858a3.1 3.1 0 01-.748 1.15c-.35.35-.684.566-1.15.748-.353.137-.882.3-1.857.344-1.054.048-1.37.058-4.041.058-2.67 0-2.987-.01-4.04-.058-.976-.045-1.505-.207-1.858-.344a3.098 3.098 0 01-1.15-.748 3.098 3.098 0 01-.748-1.15c-.137-.353-.3-.882-.344-1.857-.048-1.055-.058-1.37-.058-4.041 0-2.67.01-2.986.058-4.04.045-.976.207-1.505.344-1.858.181-.466.398-.8.748-1.15.35-.35.684-.566 1.15-.748.353-.137.882-.3 1.857-.344 1.055-.048 1.37-.058 4.041-.058zm0 11.393a3.195 3.195 0 110-6.39 3.195 3.195 0 010 6.39zm0-8.121a4.926 4.926 0 100 9.852 4.926 4.926 0 000-9.852zm6.276-.063a1.152 1.152 0 11-2.303 0 1.152 1.152 0 012.303 0z" />
  </svg>
);

const TwitterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
  >
    <path d="M22.162 5.656a8.384 8.384 0 01-2.402.658A4.196 4.196 0 0021.6 4c-.82.488-1.719.83-2.656 1.015a4.182 4.182 0 00-7.126 3.814 11.874 11.874 0 01-8.62-4.37 4.168 4.168 0 00-.566 2.103c0 1.45.738 2.731 1.86 3.481a4.168 4.168 0 01-1.894-.523v.052a4.185 4.185 0 003.355 4.101 4.21 4.21 0 01-1.89.072A4.185 4.185 0 007.97 16.65a8.394 8.394 0 01-6.191 1.732 11.83 11.83 0 006.41 1.88c7.693 0 11.9-6.373 11.9-11.9 0-.18-.005-.362-.013-.54a8.496 8.496 0 002.087-2.165z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
  >
    <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
  >
    <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zm-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79zM6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68zm1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const TiktokIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
  >
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64c.34 0 .68.06 1 .17V7.59c-.33-.06-.66-.1-.99-.1a6.07 6.07 0 00-5.7 8.2 6.07 6.07 0 0010.91-3.67l.01-6.78a7.91 7.91 0 004.89 1.68h.01V2.04a4.79 4.79 0 01-1.02.16z" />
  </svg>
);

const PinterestIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
  >
    <path d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0010-10A10 10 0 0012 2 10 10 0 002 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.98.52 1.84 1.52 1.84 1.78 0 3.16-1.9 3.16-4.58 0-2.4-1.72-4.04-4.19-4.04-2.82 0-4.48 2.1-4.48 4.31 0 .86.28 1.73.74 2.3.09.06.09.14.06.29l-.29 1.09c0 .17-.11.23-.28.11-1.28-.56-2.02-2.38-2.02-3.85 0-3.16 2.24-6.03 6.56-6.03 3.44 0 6.12 2.47 6.12 5.75 0 3.44-2.13 6.2-5.18 6.2-.97 0-1.92-.52-2.26-1.13l-.67 2.37c-.23.86-.86 2.01-1.29 2.7v-.03z" />
  </svg>
);

// Helper function to format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

type QuestionComponentProps = {
  questionId: string;
  type: string;
  placeholder?: string;
  subtext?: string;
  options?: string[];
  answers: QuestionnaireAnswers;
  handleAnswerChange: (value: string) => void;
  handleMultiSelectChange?: (option: string) => void;
  handleColorChange?: (index: number, color: string) => void;
  addColorInput?: () => void;
  removeColorInput?: (index: number) => void;
  handleWebsiteListChange?: (
    index: number,
    field: "name" | "url",
    value: string
  ) => void;
  addWebsiteEntry?: () => void;
  removeWebsiteEntry?: (index: number) => void;
  handleAddCustomOption?: () => void;
  customPageOption?: string;
  setCustomPageOption?: (value: string) => void;
  handleFileUpload?: (file: File) => Promise<void>;
  handleMultipleFileUpload?: (files: FileList) => Promise<void>;
  handleRemoveFile?: () => void;
  handleRemoveFileAtIndex?: (index: number) => void;
  handleSocialMediaChange?: (
    index: number,
    field: "platform" | "url",
    value: string
  ) => void;
  addSocialMediaLink?: () => void;
  removeSocialMediaLink?: (index: number) => void;
  handleTeamMemberChange?: (
    index: number,
    field: string,
    value: string
  ) => void;

  handleTeamMemberSocialChange?: (
    index: number,
    socialIndex: number,
    field: "platform" | "url", // Change from string to literal types
    value: string
  ) => void;

  handleTeamMemberImageUpload?: (index: number, file: File) => Promise<void>;

  addTeamMember?: () => void;
  removeTeamMember?: (index: number) => void;
  addTeamMemberSocial?: (index: number) => void;
  removeTeamMemberSocial?: (index: number, socialIndex: number) => void;
  handleServiceChange?: (index: number, field: string, value: string) => void;
  handleServiceImageUpload?: (index: number, file: File) => Promise<void>;
  addService?: () => void;
  removeService?: (index: number) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  fileType?: "image" | "multiple-images";
  acceptedFileTypes?: string;
  showUploadInline?: boolean;
};

export const TextInput = ({
  questionId,
  placeholder,
  answers,
  handleAnswerChange,
  subtext,
}: QuestionComponentProps) => (
  <div className="relative">
    {subtext && <p className="text-neutral-400 text-sm mb-4">{subtext}</p>}
    <input
      type="text"
      value={(answers[questionId] as string) || ""}
      onChange={(e) => handleAnswerChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-white text-xl md:text-2xl py-4 border-b-2 border-neutral-800 focus:border-[#F58327] focus:outline-none transition-all duration-200 placeholder-neutral-600"
    />
  </div>
);

export const TextareaInput = ({
  questionId,
  placeholder,
  answers,
  handleAnswerChange,
  subtext,
}: QuestionComponentProps) => (
  <div className="relative">
    {subtext && <p className="text-neutral-400 text-sm mb-4">{subtext}</p>}
    <textarea
      value={(answers[questionId] as string) || ""}
      onChange={(e) => handleAnswerChange(e.target.value)}
      placeholder={placeholder}
      rows={5}
      className="w-full bg-transparent text-white text-xl md:text-2xl py-4 border-b-2 border-neutral-800 focus:border-[#F58327] focus:outline-none transition-all duration-200 placeholder-neutral-600 resize-none"
    />
  </div>
);

export const RadioInput = ({
  questionId,
  options = [],
  answers,
  handleAnswerChange,
  handleFileUpload,
  handleRemoveFile,
  isUploading,
  uploadProgress,
  subtext,
  showUploadInline,
}: QuestionComponentProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events for file upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event for file upload
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError("");

    if (
      e.dataTransfer.files &&
      e.dataTransfer.files.length > 0 &&
      handleFileUpload
    ) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError("");

    if (e.target.files && e.target.files.length > 0 && handleFileUpload) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Format accepted file types for display
  const formatAcceptedTypes = (types: string = "") => {
    return types
      .split(",")
      .map((type) => type.replace("image/", "."))
      .join(", ");
  };

  const selectedOption = answers[questionId] as string;
  // Check for hero image upload separately if we're inline
  const fileUpload =
    showUploadInline && questionId === "heroImageOption"
      ? (answers["heroImageUpload"] as FileUpload)
      : undefined;

  return (
    <div className="space-y-5 mt-4">
      {subtext && <p className="text-neutral-400 text-sm mb-4">{subtext}</p>}

      {options.map((option, index) => (
        <motion.div
          key={option}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + index * 0.05 }}
          className="flex flex-col"
        >
          <div className="flex items-start">
            <div
              className={`flex items-center justify-center w-6 h-6 mt-1 rounded-full border-2 cursor-pointer mr-4 transition-colors duration-200 ${
                answers[questionId] === option
                  ? "border-[#F58327] bg-[#0d0d0d]"
                  : "border-neutral-600 bg-[#0d0d0d]"
              }`}
              onClick={() => handleAnswerChange(option)}
            >
              {answers[questionId] === option && (
                <div className="w-2 h-2 rounded-full bg-[#F58326]"></div>
              )}
            </div>
            <label
              className="text-xl cursor-pointer"
              onClick={() => handleAnswerChange(option)}
            >
              {option}
            </label>
          </div>

          {/* Show upload inline when option is selected and it's the upload option */}
          {showUploadInline &&
            option.includes("upload") &&
            selectedOption === option && (
              <div className="ml-10 mt-4">
                {fileUpload ? (
                  <div className="bg-neutral-900 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-white text-sm font-medium">
                        Uploaded Image
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof handleRemoveFile === "function") {
                            handleRemoveFile();
                          }
                        }}
                        className="cursor-pointer text-red-500 hover:text-red-400"
                        aria-label="Remove file"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex items-center">
                      <div className="w-20 h-20 bg-neutral-800 rounded-md overflow-hidden mr-4 flex items-center justify-center">
                        <img
                          src={fileUpload.url}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">
                          {fileUpload.name}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {formatFileSize(fileUpload.size)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed ${
                      dragActive ? "border-[#F58327]" : "border-neutral-600"
                    } rounded-lg p-4 text-center transition-colors duration-200`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {isUploading ? (
                      <div className="py-3 flex flex-col items-center">
                        <Loader2 className="h-6 w-6 text-[#F58327] animate-spin mb-2" />
                        <p className="text-neutral-300 text-sm">Uploading...</p>
                        <div className="w-full max-w-xs bg-neutral-800 rounded-full h-2 mt-2 mb-1 overflow-hidden">
                          <div
                            className="bg-[#F58327] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Camera className="h-5 w-5 text-neutral-400" />
                        </div>
                        <p className="text-neutral-300 text-sm mb-2">
                          Drag and drop or browse to upload
                        </p>
                        <div className="relative">
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleChange}
                            accept="image/*"
                          />
                          <button
                            type="button"
                            className="cursor-pointer px-3 py-1.5 bg-[#F58327] text-white text-sm rounded-lg hover:bg-[#e67016] transition-colors"
                          >
                            Choose File
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
        </motion.div>
      ))}
    </div>
  );
};

export const MultiselectInput = ({
  questionId,
  options = [],
  answers,
  handleMultiSelectChange = () => {},
  handleAddCustomOption = () => {},
  customPageOption = "",
  setCustomPageOption = () => {},
  subtext,
}: QuestionComponentProps) => {
  // Create a comprehensive list of options, including those in the answers that might not be in the original options
  // This ensures custom options that were previously added are shown
  const currentSelections = (answers[questionId] as string[]) || [];
  const allOptions = [...new Set([...options, ...currentSelections])];

  // Function to handle adding custom option and automatically selecting it
  const handleAddAndSelectCustomOption = () => {
    if (!customPageOption.trim()) return;

    // First add the custom option
    handleAddCustomOption();

    // Then, manually select it by calling handleMultiSelectChange
    // We need to use setTimeout to ensure this happens after the option is added
    setTimeout(() => {
      handleMultiSelectChange(customPageOption);
    }, 0);
  };

  return (
    <div className="space-y-5 mt-4">
      {subtext && <p className="text-neutral-400 text-sm mb-4">{subtext}</p>}
      {allOptions.map((option, index) => (
        <motion.div
          key={option}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + index * 0.05 }}
          className="flex items-start"
        >
          <div
            className={`flex items-center justify-center w-6 h-6 mt-1 rounded-sm border-2 cursor-pointer mr-4 transition-colors duration-200 ${
              ((answers[questionId] as string[]) || []).includes(option)
                ? "border-[#F58327] bg-[#0d0d0d]"
                : "border-neutral-600 bg-[#0d0d0d]"
            }`}
            onClick={() => handleMultiSelectChange(option)}
          >
            {((answers[questionId] as string[]) || []).includes(option) && (
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
      {questionId === "websitePages" && (
        <div className="mt-8 pt-4 border-t border-neutral-800">
          <p className="text-neutral-400 mb-3">Add a custom page:</p>
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
              onClick={handleAddAndSelectCustomOption}
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
};

export const SearchableDropdown = ({
  questionId,
  options = [],
  answers,
  handleAnswerChange,
  subtext,
}: QuestionComponentProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search query
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative mt-4">
      {subtext && <p className="text-neutral-400 text-sm mb-4">{subtext}</p>}

      <div
        className="flex items-center border-b-2 border-neutral-800 focus-within:border-[#F58327] transition-colors duration-200"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <input
          type="text"
          value={searchQuery || (answers[questionId] as string) || ""}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          placeholder="Search or select a category"
          className="w-full bg-transparent text-white text-xl md:text-2xl py-4 focus:outline-none placeholder-neutral-600"
        />
        <ChevronDown
          className={`h-5 w-5 text-neutral-400 transition-transform duration-200 ${
            showDropdown ? "rotate-180" : ""
          }`}
        />
      </div>

      {answers[questionId] && !searchQuery && (
        <div className="mt-3 px-4 py-2 bg-[#F58327]/10 border border-[#F58327]/20 rounded-md">
          <p className="text-white">
            Selected: {answers[questionId] as string}
          </p>
        </div>
      )}

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-md shadow-lg"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option}
                className={`px-4 py-2 cursor-pointer hover:bg-neutral-800 ${
                  answers[questionId] === option
                    ? "bg-[#F58327]/20 text-[#F58327]"
                    : "text-white"
                }`}
                onClick={() => {
                  handleAnswerChange(option);
                  setSearchQuery("");
                  setShowDropdown(false);
                }}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-neutral-400">No matches found</div>
          )}
        </div>
      )}
    </div>
  );
};

export const ColorInput = ({
  questionId,
  answers,
  handleColorChange = () => {},
  addColorInput = () => {},
  removeColorInput = () => {},
  subtext,
}: QuestionComponentProps) => (
  <div className="space-y-4 mt-4">
    {subtext && <p className="text-neutral-400 text-sm mb-4">{subtext}</p>}

    <p className="text-neutral-400 text-sm mb-2">
      Add your brand or website colors using hex codes (e.g., #FF5733)
    </p>

    {((answers[questionId] as string[]) || []).map((color, index) => (
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
    ))}

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

export const WebsiteListInput = ({
  questionId,
  answers,
  placeholder,
  handleWebsiteListChange = () => {},
  addWebsiteEntry = () => {},
  removeWebsiteEntry = () => {},
  subtext,
}: QuestionComponentProps) => (
  <div className="space-y-4 mt-4">
    {subtext && <p className="text-neutral-400 text-sm mb-4">{subtext}</p>}

    <p className="text-neutral-400 text-sm mb-2">Add websites one at a time</p>

    {((answers[questionId] as WebsiteEntry[]) || []).map((item, index) => (
      <div key={index} className="space-y-2 p-4 bg-neutral-900 rounded-lg">
        <div className="flex justify-between items-center">
          <h4 className="text-white text-sm font-medium">Entry {index + 1}</h4>
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
              placeholder={placeholder || "Website name or description"}
              className="w-full bg-[#0d0d0d] rounded border border-neutral-800 px-3 py-2 text-white focus:border-[#F58327] focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-neutral-500 mb-1">URL</label>
            <div className="flex items-center">
              <Globe className="h-4 w-4 text-neutral-600 mr-2" />
              <input
                type="text"
                value={item.url}
                onChange={(e) =>
                  handleWebsiteListChange(index, "url", e.target.value)
                }
                placeholder="www.example.com"
                className="w-full bg-[#0d0d0d] border-b border-neutral-800 px-1 py-2 text-white focus:border-[#F58327] focus:outline-none"
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
      Add Website
    </button>
  </div>
);

export const SocialMediaInput = ({
  questionId,
  answers,
  handleSocialMediaChange = () => {},
  addSocialMediaLink = () => {},
  removeSocialMediaLink = () => {},
  subtext,
}: QuestionComponentProps) => {
  const platformIcons: { [key: string]: React.ReactNode } = {
    Facebook: <FacebookIcon />,
    Instagram: <InstagramIcon />,
    Twitter: <TwitterIcon />,
    YouTube: <YoutubeIcon />,
    LinkedIn: <LinkedinIcon />,
    TikTok: <TiktokIcon />,
    Pinterest: <PinterestIcon />,
    Other: <Globe />,
  };

  const platformOptions = Object.keys(platformIcons);

  return (
    <div className="space-y-4 mt-4">
      {subtext && <p className="text-neutral-400 text-sm mb-4">{subtext}</p>}

      {((answers[questionId] as SocialMediaLink[]) || []).map((item, index) => (
        <div key={index} className="space-y-2 p-4 bg-neutral-900 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {item.platform && platformIcons[item.platform] && (
                <span className="mr-2 text-[#F58327]">
                  {platformIcons[item.platform]}
                </span>
              )}
              <h4 className="text-white text-sm font-medium">
                {item.platform || "Social Media"}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => removeSocialMediaLink(index)}
              className="cursor-pointer text-red-500 hover:text-red-400"
              aria-label="Remove entry"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs text-neutral-500 mb-1">
                Platform
              </label>
              <div className="relative">
                <select
                  value={item.platform}
                  onChange={(e) =>
                    handleSocialMediaChange(index, "platform", e.target.value)
                  }
                  className="w-full appearance-none bg-[#0d0d0d] rounded border border-neutral-800 px-3 py-2 text-white focus:border-[#F58327] focus:outline-none"
                >
                  <option value="" disabled>
                    Select a platform
                  </option>
                  {platformOptions.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-neutral-500 mb-1">
                Profile URL
              </label>
              <div className="flex items-center">
                {item.platform && platformIcons[item.platform] ? (
                  <span className="text-neutral-600 mr-2 opacity-50">
                    {platformIcons[item.platform]}
                  </span>
                ) : (
                  <Globe className="h-4 w-4 text-neutral-600 mr-2 opacity-50" />
                )}
                <input
                  type="text"
                  value={item.url}
                  onChange={(e) =>
                    handleSocialMediaChange(index, "url", e.target.value)
                  }
                  placeholder="https://www.example.com/profile"
                  className="w-full bg-[#0d0d0d] border-b border-neutral-800 px-1 py-2 text-white focus:border-[#F58327] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addSocialMediaLink}
        className="cursor-pointer flex items-center justify-center w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Social Media
      </button>
    </div>
  );
};

export const ProfessionalEmailsInput = ({
  questionId,
  answers,
  handleAnswerChange,
  subtext,
}: QuestionComponentProps) => {
  // Reference to track if we've initialized
  const initializedRef = useRef(false);
  // Reference to track previous emails for comparison
  const prevEmailsRef = useRef<string[]>([]);
  // State for emails
  const [emails, setEmails] = useState<string[]>([]);

  // Get user plan type from Firebase context
  const { userData } = useFirebase();

  // Get plan type and determine email allowance
  const userPlanType = userData?.planType?.toLowerCase() || "";
  const emailAllowance =
    userPlanType === "launch"
      ? 1
      : userPlanType === "business" || userPlanType === "enterprise"
      ? 3
      : 0;

  // Determine domain to use for email addresses
  const domain = useMemo(() => {
    // Case 1: Using custom domain from domain search
    if (
      answers["customDomainName"] &&
      typeof answers["customDomainName"] === "string" &&
      !answers["customDomainName"].startsWith("customDomain:")
    ) {
      return answers["customDomainName"];
    }

    // Case 2: Using their own domain
    if (
      answers["hasDomain"] === "Yes" &&
      answers["domainName"] &&
      typeof answers["domainName"] === "string"
    ) {
      return answers["domainName"];
    }

    // Case 3: Using our lumixdigital.site domain
    if (
      answers["nonPremiumDomainOption"] === "Use mywebsite.lumixdigital.site"
    ) {
      return "yourbusiness.lumixdigital.site";
    }

    // Default case: no domain yet
    return "yourdomain.com";
  }, [answers]);

  const hasDomain = domain !== "yourdomain.com";

  // Debug logs
  useEffect(() => {
    console.log("Professional Email Component - User plan type:", userPlanType);
    console.log(
      "Professional Email Component - Email allowance:",
      emailAllowance
    );
  }, [userPlanType, emailAllowance]);

  // Initialize from existing answers or create defaults - only runs once on mount
  useEffect(() => {
    // Skip if already initialized
    if (initializedRef.current) return;

    console.log("Initializing professional emails component");

    // Set initialization flag
    initializedRef.current = true;

    let initialEmails: string[];

    // Check if we have existing answers
    if (answers[questionId] && typeof answers[questionId] === "string") {
      try {
        // Try to parse JSON string
        const parsed = JSON.parse(answers[questionId] as string);
        if (Array.isArray(parsed)) {
          initialEmails = parsed;
          prevEmailsRef.current = [...parsed];
          setEmails(parsed);
          return; // Exit early, we've set the emails
        }
      } catch (e) {
        console.error("Error parsing emails JSON:", e);
      }
    }

    // Default initialization if no valid existing answers
    initialEmails = [];
    if (emailAllowance > 0) {
      initialEmails.push("info");
      if (emailAllowance > 1) {
        initialEmails.push("contact");
        if (emailAllowance > 2) {
          initialEmails.push("support");
        }
      }
    }

    prevEmailsRef.current = [...initialEmails];
    setEmails(initialEmails);

    // Only save to answers if we don't have existing data
    if (!answers[questionId]) {
      handleAnswerChange(JSON.stringify(initialEmails));
    }
  }, [answers, emailAllowance, handleAnswerChange, questionId]);

  // Reinitialize when plan type changes
  useEffect(() => {
    if (!initializedRef.current || !userPlanType) return;

    // Check if we need to adjust email count based on plan change
    const currentEmails = [...emails];
    let needsUpdate = false;

    // Add default emails if needed
    if (currentEmails.length < emailAllowance) {
      const defaultEmails = ["info", "contact", "support"];
      while (
        currentEmails.length < emailAllowance &&
        currentEmails.length < defaultEmails.length
      ) {
        currentEmails.push(defaultEmails[currentEmails.length]);
        needsUpdate = true;
      }
    }
    // Remove excess emails if plan downgraded
    else if (currentEmails.length > emailAllowance && emailAllowance > 0) {
      currentEmails.splice(emailAllowance);
      needsUpdate = true;
    }

    if (needsUpdate) {
      setEmails(currentEmails);
      handleAnswerChange(JSON.stringify(currentEmails));
      prevEmailsRef.current = currentEmails;
    }
  }, [userPlanType, emailAllowance, emails, handleAnswerChange]);

  // Handle changes to individual email addresses
  const handleEmailChange = (index: number, value: string) => {
    // Remove special characters and spaces
    value = value.replace(/[^\w.-]/g, "").toLowerCase();

    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);

    // Save changes to answers
    handleAnswerChange(JSON.stringify(newEmails));
    prevEmailsRef.current = newEmails;
  };

  // Add a new email slot if allowed
  const addEmailSlot = () => {
    if (emails.length < emailAllowance) {
      const newEmails = [...emails, ""];
      setEmails(newEmails);
      handleAnswerChange(JSON.stringify(newEmails));
      prevEmailsRef.current = newEmails;
    }
  };

  // Remove an email slot
  const removeEmailSlot = (index: number) => {
    const newEmails = [...emails];
    newEmails.splice(index, 1);
    setEmails(newEmails);
    handleAnswerChange(JSON.stringify(newEmails));
    prevEmailsRef.current = newEmails;
  };

  // Check if an email prefix is valid
  const isValidEmailPrefix = (prefix: string): boolean => {
    if (!prefix) return false;
    // Basic validation for email prefix
    const regex = /^[a-zA-Z0-9]([a-zA-Z0-9.-]){0,63}$/;
    return regex.test(prefix);
  };

  return (
    <div className="space-y-4 mt-4">
      {subtext && <p className="text-neutral-400 text-sm mb-4">{subtext}</p>}

      {!hasDomain && userPlanType === "launch" && (
        <div className="bg-blue-900/30 border border-blue-800 p-4 rounded-lg mb-4">
          <h4 className="text-blue-300 font-medium mb-1">
            Set up your domain first
          </h4>
          <p className="text-blue-200 text-sm">
            You can set up your free professional email later once you have a
            domain.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {emails.map((email, index) => (
          <div key={`email-${index}`} className="flex items-center space-x-1">
            <div className="flex-1 flex items-center">
              <input
                type="text"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                placeholder={`email${index + 1}`}
                className={`bg-neutral-800 rounded-l px-3 py-2 text-white border focus:outline-none flex-1 ${
                  isValidEmailPrefix(email)
                    ? "border-neutral-700 focus:border-[#F58327]"
                    : "border-red-500"
                }`}
                disabled={!hasDomain && userPlanType === "launch"}
              />
              <div className="bg-neutral-700 rounded-r px-3 py-2 text-neutral-300">
                @{domain}
              </div>
            </div>

            {emails.length > 1 && (
              <button
                type="button"
                onClick={() => removeEmailSlot(index)}
                className="p-2 text-red-500 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {emails.length < emailAllowance && hasDomain && (
        <button
          type="button"
          onClick={addEmailSlot}
          className="mt-2 flex items-center text-[#F58327] hover:text-[#e67016] transition-colors"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Email Address ({emails.length}/{emailAllowance})
        </button>
      )}

      <div className="mt-4 text-sm text-neutral-400">
        {userPlanType === "launch" ? (
          <p>Your Launch plan includes 1 professional email address.</p>
        ) : userPlanType === "business" || userPlanType === "enterprise" ? (
          <p>
            Your {userPlanType.charAt(0).toUpperCase() + userPlanType.slice(1)}{" "}
            plan includes 3 professional email addresses.
          </p>
        ) : (
          <p>
            Upgrade to Launch plan or higher to get professional email
            addresses.
          </p>
        )}
      </div>
    </div>
  );
};

export const TeamMembersInput = ({
  questionId,
  answers,
  handleTeamMemberChange = () => {},
  handleTeamMemberSocialChange = () => {},
  handleTeamMemberImageUpload = async (
    index: number,
    file: File
  ): Promise<void> => {},
  addTeamMember = () => {},
  removeTeamMember = () => {},
  addTeamMemberSocial = () => {},
  removeTeamMemberSocial = () => {},
  subtext,
  isUploading = false,
}: QuestionComponentProps) => {
  const [activeTeamIndex, setActiveTeamIndex] = useState<number | null>(null);
  const [uploadingMemberIndex, setUploadingMemberIndex] = useState<
    number | null
  >(null);
  const fileInputExistingRef = useRef<HTMLInputElement>(null);

  const platformIcons: { [key: string]: React.ReactNode } = {
    Facebook: <FacebookIcon />,
    Instagram: <InstagramIcon />,
    Twitter: <TwitterIcon />,
    YouTube: <YoutubeIcon />,
    LinkedIn: <LinkedinIcon />,
    TikTok: <TiktokIcon />,
    Pinterest: <PinterestIcon />,
    Other: <Globe />,
  };

  const platformOptions = Object.keys(platformIcons);
  const teamMembers = (answers[questionId] as TeamMember[]) || [];
  const maxTeamMembers = 8;

  // Add a new empty team member and immediately open the edit form
  const addNewTeamMember = () => {
    addTeamMember();

    // Set a timeout to ensure the team member is added before setting it as active
    setTimeout(() => {
      const newIndex = teamMembers.length;
      setActiveTeamIndex(newIndex);
    }, 50);
  };

  const handleExistingImageClick = (index: number) => {
    if (fileInputExistingRef.current) {
      fileInputExistingRef.current.dataset.index = index.toString();
      fileInputExistingRef.current.click();
    }
  };

  const handleExistingImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      e.target.files &&
      e.target.files[0] &&
      fileInputExistingRef.current &&
      fileInputExistingRef.current.dataset.index
    ) {
      const index = parseInt(fileInputExistingRef.current.dataset.index);
      if (handleTeamMemberImageUpload) {
        setUploadingMemberIndex(index);
        await handleTeamMemberImageUpload(index, e.target.files[0]);
        setUploadingMemberIndex(null);
      }
    }
  };

  return (
    <div className="space-y-6 mt-4">
      {subtext && <p className="text-neutral-400 text-sm mb-4">{subtext}</p>}

      {/* List of existing team members */}
      {teamMembers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className={`p-4 bg-neutral-900 rounded-lg transition-all duration-200 ${
                activeTeamIndex === index ? "ring-2 ring-[#F58327]" : ""
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-white font-medium">
                  {member.name || `Team Member ${index + 1}`}
                </h4>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTeamIndex(
                        activeTeamIndex === index ? null : index
                      )
                    }
                    className="p-1 rounded hover:bg-neutral-800 transition-colors"
                    title={
                      activeTeamIndex === index
                        ? "Close details"
                        : "Edit details"
                    }
                  >
                    <Edit className="h-4 w-4 text-neutral-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTeamMember(index)}
                    className="p-1 text-red-500 rounded hover:bg-neutral-800 transition-colors"
                    title="Remove team member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Team member image */}
                <div
                  className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center cursor-pointer overflow-hidden relative"
                  onClick={() => handleExistingImageClick(index)}
                >
                  {uploadingMemberIndex === index ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  ) : member.image ? (
                    <img
                      src={member.image.url}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <User className="h-6 w-6 text-neutral-500" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    {member.name || "Name not set"}
                  </p>
                  <p className="text-neutral-400 text-xs">
                    {member.position || "Position not set"}
                  </p>
                </div>
              </div>

              {/* Expanded details when active */}
              {activeTeamIndex === index && (
                <div className="mt-4 space-y-4 pt-4 border-t border-neutral-700">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">
                      Name*
                    </label>
                    <input
                      type="text"
                      value={member.name || ""}
                      onChange={(e) =>
                        handleTeamMemberChange(index, "name", e.target.value)
                      }
                      placeholder="Full name"
                      className="w-full bg-[#0d0d0d] rounded border border-neutral-800 px-3 py-2 text-white focus:border-[#F58327] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">
                      Position*
                    </label>
                    <input
                      type="text"
                      value={member.position || ""}
                      onChange={(e) =>
                        handleTeamMemberChange(
                          index,
                          "position",
                          e.target.value
                        )
                      }
                      placeholder="Job title"
                      className="w-full bg-[#0d0d0d] rounded border border-neutral-800 px-3 py-2 text-white focus:border-[#F58327] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">
                      Description*
                    </label>
                    <textarea
                      value={member.description || ""}
                      onChange={(e) =>
                        handleTeamMemberChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Brief bio or description"
                      rows={3}
                      className="w-full bg-[#0d0d0d] rounded border border-neutral-800 px-3 py-2 text-white focus:border-[#F58327] focus:outline-none resize-none"
                    />
                  </div>

                  {/* Social media links */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs text-neutral-500">
                        Social Media (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => addTeamMemberSocial(index)}
                        className="text-xs text-[#F58327] hover:text-[#e67016]"
                      >
                        + Add Link
                      </button>
                    </div>

                    {member.socialMedia && member.socialMedia.length > 0 ? (
                      <div className="space-y-2">
                        {member.socialMedia.map((social, socialIndex) => (
                          <div
                            key={socialIndex}
                            className="flex items-center space-x-2"
                          >
                            <div className="relative flex-shrink-0 w-24">
                              <select
                                value={social.platform}
                                onChange={(e) =>
                                  handleTeamMemberSocialChange(
                                    index,
                                    socialIndex,
                                    "platform",
                                    e.target.value
                                  )
                                }
                                className="w-full appearance-none bg-[#0d0d0d] rounded-l border border-neutral-800 px-2 py-1 text-white text-xs focus:border-[#F58327] focus:outline-none"
                              >
                                <option value="" disabled>
                                  Platform
                                </option>
                                {platformOptions.map((platform) => (
                                  <option key={platform} value={platform}>
                                    {platform}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-neutral-500">
                                <ChevronDown className="h-3 w-3" />
                              </div>
                            </div>
                            <input
                              type="text"
                              value={social.url}
                              onChange={(e) =>
                                handleTeamMemberSocialChange(
                                  index,
                                  socialIndex,
                                  "url",
                                  e.target.value
                                )
                              }
                              placeholder="URL"
                              className="flex-1 bg-[#0d0d0d] border border-neutral-800 rounded-r px-2 py-1 text-white text-xs focus:border-[#F58327] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeTeamMemberSocial(index, socialIndex)
                              }
                              className="p-1 text-red-500 rounded hover:bg-neutral-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 italic">
                        No social media links added
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hidden input for existing member image upload */}
      <input
        type="file"
        className="hidden"
        onChange={handleExistingImageChange}
        accept="image/*"
        ref={fileInputExistingRef}
      />

      {/* Add team member button */}
      {teamMembers.length < maxTeamMembers ? (
        <button
          type="button"
          onClick={addNewTeamMember}
          disabled={isUploading}
          className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member ({teamMembers.length}/{maxTeamMembers})
            </>
          )}
        </button>
      ) : (
        <p className="text-center text-neutral-500 text-sm">
          Maximum of {maxTeamMembers} team members reached
        </p>
      )}
    </div>
  );
};

export const ServicesInput = ({
  questionId,
  answers,
  handleServiceChange = () => {},
  handleServiceImageUpload = async (
    _index: number,
    _file: File
  ): Promise<void> => {
    return Promise.resolve();
  },
  addService = () => {},
  removeService = () => {},
  subtext,
  isUploading = false,
}: QuestionComponentProps) => {
  const [activeServiceIndex, setActiveServiceIndex] = useState<number | null>(
    null
  );
  const [uploadingServiceIndex, setUploadingServiceIndex] = useState<
    number | null
  >(null);
  const fileInputExistingRef = useRef<HTMLInputElement>(null);

  const services = (answers[questionId] as Service[]) || [];
  const maxServices = 3;

  // Add a new service and immediately set all required fields
  const handleAddService = () => {
    // Call addService to create an entry
    addService();

    // Set a timeout to ensure the service is added before updating fields
    setTimeout(() => {
      // Get the index of the new service
      const newIndex = services.length;

      // Initialize with empty but valid values
      handleServiceChange(newIndex, "name", "New Service");
      handleServiceChange(newIndex, "description", "Service description");
      handleServiceChange(newIndex, "price", "");

      // Open the new service for editing
      setActiveServiceIndex(newIndex);
    }, 100);
  };

  const handleExistingImageClick = (index: number) => {
    if (fileInputExistingRef.current) {
      fileInputExistingRef.current.dataset.index = index.toString();
      fileInputExistingRef.current.click();
    }
  };

  const handleExistingImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      e.target.files &&
      e.target.files[0] &&
      fileInputExistingRef.current &&
      fileInputExistingRef.current.dataset.index
    ) {
      const index = parseInt(fileInputExistingRef.current.dataset.index);
      if (handleServiceImageUpload) {
        setUploadingServiceIndex(index);
        await handleServiceImageUpload(index, e.target.files[0]);
        setUploadingServiceIndex(null);
      }
    }
  };

  // Ensure we immediately expand a service if it's the only one and has empty fields
  useEffect(() => {
    if (
      services.length === 1 &&
      (!services[0].name || !services[0].description)
    ) {
      setActiveServiceIndex(0);
    }
  }, [services]);

  return (
    <div className="space-y-6 mt-4">
      {subtext && <p className="text-neutral-400 text-sm mb-4">{subtext}</p>}

      {/* List of existing services */}
      {services.length > 0 && (
        <div className="space-y-4">
          {services.map((service, index) => (
            <div
              key={index}
              className={`p-4 bg-neutral-900 rounded-lg transition-all duration-200 ${
                activeServiceIndex === index ? "ring-2 ring-[#F58327]" : ""
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-white font-medium">
                  {service.name || `Service ${index + 1}`}
                </h4>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveServiceIndex(
                        activeServiceIndex === index ? null : index
                      )
                    }
                    className="p-1 rounded hover:bg-neutral-800 transition-colors"
                    title={
                      activeServiceIndex === index
                        ? "Close details"
                        : "Edit details"
                    }
                  >
                    <Edit className="h-4 w-4 text-neutral-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="p-1 text-red-500 rounded hover:bg-neutral-800 transition-colors"
                    title="Remove service"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Service image */}
                <div
                  className="w-16 h-16 bg-neutral-800 rounded-md flex items-center justify-center cursor-pointer overflow-hidden relative"
                  onClick={() => handleExistingImageClick(index)}
                >
                  {uploadingServiceIndex === index ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  ) : service.image ? (
                    <img
                      src={service.image.url}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <Package className="h-8 w-8 text-neutral-500" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    {service.name || "Service not named"}
                  </p>
                  {service.price && (
                    <p className="text-[#F58327] text-xs">{service.price}</p>
                  )}
                </div>
              </div>

              {/* Expanded details when active */}
              {activeServiceIndex === index && (
                <div className="mt-4 space-y-4 pt-4 border-t border-neutral-700">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">
                      Service Name*
                    </label>
                    <input
                      type="text"
                      value={service.name || ""}
                      onChange={(e) =>
                        handleServiceChange(index, "name", e.target.value)
                      }
                      placeholder="Service name"
                      className="w-full bg-[#0d0d0d] rounded border border-neutral-800 px-3 py-2 text-white focus:border-[#F58327] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">
                      Description*
                    </label>
                    <textarea
                      value={service.description || ""}
                      onChange={(e) =>
                        handleServiceChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="What makes it unique in terms of quality, pricing, or other factors?"
                      rows={3}
                      className="w-full bg-[#0d0d0d] rounded border border-neutral-800 px-3 py-2 text-white focus:border-[#F58327] focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">
                      Price (Optional)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                      <input
                        type="text"
                        value={service.price || ""}
                        onChange={(e) =>
                          handleServiceChange(index, "price", e.target.value)
                        }
                        placeholder="e.g., $99, $50-$200, Starting at $149"
                        className="w-full bg-[#0d0d0d] rounded border border-neutral-800 pl-10 pr-3 py-2 text-white focus:border-[#F58327] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hidden input for existing service image upload */}
      <input
        type="file"
        className="hidden"
        onChange={handleExistingImageChange}
        accept="image/*"
        ref={fileInputExistingRef}
      />

      {/* Add service button */}
      {services.length < maxServices ? (
        <button
          type="button"
          onClick={handleAddService}
          disabled={isUploading}
          className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Service ({services.length}/{maxServices})
            </>
          )}
        </button>
      ) : (
        <p className="text-center text-neutral-500 text-sm">
          Maximum of {maxServices} services reached
        </p>
      )}
    </div>
  );
};

export const FileUploadInput = ({
  questionId,
  answers,
  handleFileUpload = async () => {},
  handleMultipleFileUpload = async () => {},
  handleRemoveFile = () => {},
  handleRemoveFileAtIndex = () => {},
  isUploading = false,
  uploadProgress = 0,
  fileType = "image",
  acceptedFileTypes = "image/png,image/jpeg",
  subtext,
}: QuestionComponentProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  // Calculate total file size for multiple uploads
  const calculateTotalSize = (files: FileUpload[]): number => {
    return files.reduce((total, file) => total + file.size, 0);
  };

  // Check if we've reached the file limit for the "teamPhotos" question
  const isAtFileLimit = () => {
    if (questionId === "teamPhotos") {
      const MAX_FILES = 10;
      const files = (answers[questionId] as FileUpload[]) || [];
      return files.length >= MAX_FILES;
    }
    return false;
  };

  // Check if adding new files would exceed size limit
  const wouldExceedSizeLimit = (newFilesSize: number): boolean => {
    if (questionId === "teamPhotos") {
      const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB in bytes
      const existingFiles = (answers[questionId] as FileUpload[]) || [];
      const currentTotalSize = calculateTotalSize(existingFiles);
      return currentTotalSize + newFilesSize > MAX_TOTAL_SIZE;
    }
    return false;
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError("");

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (fileType === "multiple-images") {
        // Check if we've reached the file limit
        const existingFiles = (answers[questionId] as FileUpload[]) || [];
        const newFileCount = e.dataTransfer.files.length;

        if (existingFiles.length + newFileCount > 10) {
          setError(
            `You can upload a maximum of 10 photos. You already have ${existingFiles.length} photos.`
          );
          return;
        }

        // Check total size
        const newFilesSize = Array.from(e.dataTransfer.files).reduce(
          (size, file) => size + file.size,
          0
        );

        if (wouldExceedSizeLimit(newFilesSize)) {
          setError("The total size of all photos cannot exceed 50MB.");
          return;
        }

        handleMultipleFileUpload(e.dataTransfer.files);
      } else if (fileType === "image") {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    }
  };

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError("");

    if (e.target.files && e.target.files.length > 0) {
      if (fileType === "multiple-images") {
        // Check if we've reached the file limit
        const existingFiles = (answers[questionId] as FileUpload[]) || [];
        const newFileCount = e.target.files.length;

        if (existingFiles.length + newFileCount > 10) {
          setError(
            `You can upload a maximum of 10 photos. You already have ${existingFiles.length} photos.`
          );
          return;
        }

        // Check total size
        const newFilesSize = Array.from(e.target.files).reduce(
          (size, file) => size + file.size,
          0
        );

        if (wouldExceedSizeLimit(newFilesSize)) {
          setError("The total size of all photos cannot exceed 50MB.");
          return;
        }

        handleMultipleFileUpload(e.target.files);
      } else if (fileType === "image") {
        handleFileUpload(e.target.files[0]);
      }
    }
  };

  // Format accepted file types for display
  const formatAcceptedTypes = (types: string) => {
    return types
      .split(",")
      .map((type) => type.replace("image/", "."))
      .join(", ");
  };

  // Display for single file upload (logo, favicon)
  if (fileType === "image") {
    const uploadedFile = answers[questionId] as FileUpload | undefined;

    return (
      <div className="mt-4">
        {subtext && <p className="text-neutral-400 text-sm mb-4">{subtext}</p>}

        {uploadedFile ? (
          <div className="bg-neutral-900 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-white text-sm font-medium">Uploaded File</h4>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="cursor-pointer text-red-500 hover:text-red-400"
                aria-label="Remove file"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center">
              <div className="w-20 h-20 bg-neutral-800 rounded-md overflow-hidden mr-4 flex items-center justify-center">
                {uploadedFile.type.startsWith("image/") ? (
                  <img
                    src={uploadedFile.url}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-neutral-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-white font-medium">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed ${
              dragActive ? "border-[#F58327]" : "border-neutral-600"
            } rounded-lg p-6 text-center transition-colors duration-200`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="py-4 flex flex-col items-center">
                <Loader2 className="h-8 w-8 text-[#F58327] animate-spin mb-3" />
                <p className="text-neutral-300 mb-2">Uploading...</p>
                <div className="w-full max-w-xs bg-neutral-800 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div
                    className="bg-[#F58327] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-neutral-500">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-neutral-400" />
                </div>
                <p className="text-neutral-300 mb-2">
                  Drag and drop your file here, or
                </p>
                <div className="relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleChange}
                    accept={acceptedFileTypes}
                  />
                  <button
                    type="button"
                    className="cursor-pointer px-4 py-2 bg-[#F58327] text-white rounded-lg hover:bg-[#e67016] transition-colors"
                  >
                    Browse Files
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-4">
                  Accepted file types: {formatAcceptedTypes(acceptedFileTypes)}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Maximum file size: 5MB
                </p>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Display for multiple file upload (team photos)
  if (fileType === "multiple-images") {
    const uploadedFiles =
      (answers[questionId] as FileUpload[] | undefined) || [];
    const totalSize = calculateTotalSize(uploadedFiles);
    const fileCount = uploadedFiles.length;

    return (
      <div className="mt-4 space-y-4">
        {subtext && <p className="text-neutral-400 text-sm mb-4">{subtext}</p>}

        {/* Stats display for team photos */}
        {questionId === "teamPhotos" && uploadedFiles.length > 0 && (
          <div className="flex justify-between items-center bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div>
              <span className="text-sm text-white">
                {fileCount} of 10 photos uploaded
              </span>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                <div
                  className="bg-[#F58327] h-1.5 rounded-full"
                  style={{ width: `${(fileCount / 10) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <span className="text-sm text-white">
                {formatFileSize(totalSize)} of 50MB used
              </span>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                <div
                  className="bg-[#F58327] h-1.5 rounded-full"
                  style={{
                    width: `${(totalSize / (50 * 1024 * 1024)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Error message display */}
        {error && (
          <div className="bg-red-900/30 border border-red-800 p-3 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="bg-neutral-900 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-white text-xs font-medium truncate max-w-[80%]">
                  {file.name}
                </h4>
                <button
                  type="button"
                  onClick={() => handleRemoveFileAtIndex(index)}
                  className="cursor-pointer text-red-500 hover:text-red-400"
                  aria-label="Remove file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="w-full h-32 bg-neutral-800 rounded-md overflow-hidden flex items-center justify-center">
                {file.type.startsWith("image/") ? (
                  <img
                    src={file.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-neutral-500" />
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-1 text-right">
                {formatFileSize(file.size)}
              </p>
            </div>
          ))}
        </div>

        {!isAtFileLimit() ? (
          <div
            className={`border-2 border-dashed ${
              dragActive ? "border-[#F58327]" : "border-neutral-600"
            } rounded-lg p-6 text-center transition-colors duration-200`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="py-4 flex flex-col items-center">
                <Loader2 className="h-8 w-8 text-[#F58327] animate-spin mb-3" />
                <p className="text-neutral-300 mb-2">Uploading...</p>
                <div className="w-full max-w-xs bg-neutral-800 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div
                    className="bg-[#F58327] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-neutral-500">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-neutral-400" />
                </div>
                <p className="text-neutral-300 mb-2">
                  Drag and drop your files here, or
                </p>
                <div className="relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleChange}
                    accept={acceptedFileTypes}
                    multiple={true}
                  />
                  <button
                    type="button"
                    className="cursor-pointer px-4 py-2 bg-[#F58327] text-white rounded-lg hover:bg-[#e67016] transition-colors"
                  >
                    Browse Files
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-4">
                  Accepted file types: {formatAcceptedTypes(acceptedFileTypes)}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Maximum: 10 photos (50MB total)
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
            <p className="text-gray-300">
              Maximum number of photos reached (10)
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Remove some photos to upload more
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export function getQuestionComponent(
  type: string,
  props: QuestionComponentProps
) {
  switch (type) {
    case "text":
      return <TextInput {...props} />;
    case "textarea":
      return <TextareaInput {...props} />;
    case "radio":
      return <RadioInput {...props} />;
    case "multiselect":
      return <MultiselectInput {...props} />;
    case "color":
      return <ColorInput {...props} />;
    case "websiteList":
      return <WebsiteListInput {...props} />;
    case "fileUpload":
      return <FileUploadInput {...props} />;
    case "domainSearch":
      return (
        <DomainSearchInput
          questionId={props.questionId}
          placeholder={props.placeholder}
          value={(props.answers[props.questionId] as string) || ""}
          onChange={(value: string) => props.handleAnswerChange(value)}
        />
      );
    case "socialMedia":
      return <SocialMediaInput {...props} />;
    case "teamMembers":
      return <TeamMembersInput {...props} />;
    case "services":
      return <ServicesInput {...props} />;
    case "searchableDropdown":
      return <SearchableDropdown {...props} />;
    case "professionalEmails":
      return <ProfessionalEmailsInput {...props} />;
    default:
      return (
        <div className="text-red-400">Unsupported question type: {type}</div>
      );
  }
}
