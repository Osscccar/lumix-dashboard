const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const validateFileSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE;
};

export const validateFileType = (
  file: File,
  acceptedTypes: string
): boolean => {
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

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};
