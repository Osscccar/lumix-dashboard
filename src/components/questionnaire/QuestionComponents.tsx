import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  X,
  Globe,
  Upload,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { type QuestionnaireAnswers } from "@/types";
import { FileUpload } from "@/types";
import { DomainSearchInput } from "./DomainSearchInput";

type QuestionComponentProps = {
  questionId: string;
  type: string;
  placeholder?: string;
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
  isUploading?: boolean;
  uploadProgress?: number; // Add this new property
  fileType?: "image" | "multiple-images";
  acceptedFileTypes?: string;
};

export const TextInput = ({
  questionId,
  placeholder,
  answers,
  handleAnswerChange,
}: QuestionComponentProps) => (
  <div className="relative">
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
}: QuestionComponentProps) => (
  <div className="relative">
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
}: QuestionComponentProps) => (
  <div className="space-y-5 mt-4">
    {options.map((option, index) => (
      <motion.div
        key={option}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + index * 0.05 }}
        className="flex items-start"
      >
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
      </motion.div>
    ))}
  </div>
);

export const MultiselectInput = ({
  questionId,
  options = [],
  answers,
  handleMultiSelectChange = () => {},
  handleAddCustomOption = () => {},
  customPageOption = "",
  setCustomPageOption = () => {},
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

export const ColorInput = ({
  questionId,
  answers,
  handleColorChange = () => {},
  addColorInput = () => {},
  removeColorInput = () => {},
}: QuestionComponentProps) => (
  <div className="space-y-4 mt-4">
    <p className="text-neutral-400 text-sm mb-2">
      Enter hex color codes (e.g., #FF5733) for your brand or website colors
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
  handleWebsiteListChange = () => {},
  addWebsiteEntry = () => {},
  removeWebsiteEntry = () => {},
}: QuestionComponentProps) => (
  <div className="space-y-4 mt-4">
    <p className="text-neutral-400 text-sm mb-2">
      Add websites or keywords, one per entry
    </p>

    {(
      (answers[questionId] as {
        name: string;
        url: string;
      }[]) || []
    ).map((item, index) => (
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
              placeholder="Competitor name or keyword"
              className="w-full bg-[#0d0d0d] rounded border border-neutral-800 px-3 py-2 text-white focus:border-[#F58327] focus:outline-none"
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
      Add Another Entry
    </button>
  </div>
);

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
      const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 10MB in bytes
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

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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
                    alt={`Team photo ${index + 1}`}
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
    default:
      return (
        <div className="text-red-400">Unsupported question type: {type}</div>
      );
  }
}
