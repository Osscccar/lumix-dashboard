// src/components/WebsiteCreationPopup.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Rocket, Palette, Code, Laptop } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface WebsiteCreationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function WebsiteCreationPopup({
  isOpen,
  onClose,
  userId,
}: WebsiteCreationPopupProps) {
  const handleClosePopup = async () => {
    if (userId) {
      try {
        // Mark in Firebase that the user has seen the popup
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          hasSeenWebsiteCreationPopup: true,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error updating popup seen status:", error);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative w-full max-w-5xl bg-white border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.4, type: "spring" }}
          >
            {/* Close button */}
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors z-10"
              aria-label="Close popup"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex flex-col md:flex-row">
              {/* Animation side */}
              <div className="w-full md:w-1/2 p-8 flex items-center justify-center bg-gradient-to-br from-[#FAFBFF] to-[#F9FAFB]">
                <div className="relative h-80 w-full">
                  {/* Website frame */}
                  <motion.div
                    className="absolute inset-0 bg-white rounded-lg border border-[#E5E7EB] overflow-hidden shadow-lg"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    {/* Browser top bar */}
                    <div className="h-8 bg-[#F3F4F6] flex items-center px-3 border-b border-[#E5E7EB]">
                      <div className="flex space-x-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                    </div>

                    {/* Website content being built */}
                    <div className="p-4 h-full">
                      {/* Animated elements representing website building */}
                      <motion.div
                        className="h-6 w-40 bg-[#F3F4F6] rounded-md mb-3"
                        initial={{ width: 0 }}
                        animate={{ width: 160 }}
                        transition={{
                          duration: 1,
                          delay: 0.5,
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                      ></motion.div>

                      <div className="flex space-x-3 mb-4">
                        <motion.div
                          className="h-24 w-24 bg-[#F3F4F6] rounded-md"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.7 }}
                        ></motion.div>
                        <div className="flex-1 space-y-2">
                          <motion.div
                            className="h-4 bg-[#F3F4F6] rounded-md"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 0.8, delay: 0.9 }}
                          ></motion.div>
                          <motion.div
                            className="h-4 bg-[#F3F4F6] rounded-md"
                            initial={{ width: 0 }}
                            animate={{ width: "80%" }}
                            transition={{ duration: 0.8, delay: 1.1 }}
                          ></motion.div>
                          <motion.div
                            className="h-4 bg-[#F3F4F6] rounded-md"
                            initial={{ width: 0 }}
                            animate={{ width: "60%" }}
                            transition={{ duration: 0.8, delay: 1.3 }}
                          ></motion.div>
                        </div>
                      </div>

                      <motion.div
                        className="h-32 w-full bg-[#F3F4F6] rounded-md mb-3"
                        initial={{ height: 0 }}
                        animate={{ height: 128 }}
                        transition={{ duration: 1, delay: 1.5 }}
                      ></motion.div>
                    </div>
                  </motion.div>

                  {/* Designer characters */}
                  <motion.div
                    className="absolute -bottom-8 -left-6 w-20 h-20 bg-[#F58327] rounded-full flex items-center justify-center shadow-lg"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <Palette className="h-10 w-10 text-white" />
                  </motion.div>

                  <motion.div
                    className="absolute -top-5 right-10 w-16 h-16 bg-[#3B82F6] rounded-full flex items-center justify-center shadow-lg"
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, type: "spring" }}
                  >
                    <Code className="h-8 w-8 text-white" />
                  </motion.div>

                  <motion.div
                    className="absolute bottom-20 -right-6 w-18 h-18 bg-[#10B981] rounded-full flex items-center justify-center shadow-lg"
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.9, type: "spring" }}
                    style={{ width: "4.5rem", height: "4.5rem" }}
                  >
                    <Laptop className="h-9 w-9 text-white" />
                  </motion.div>

                  {/* Animated pulse circles */}
                  <motion.div
                    className="absolute inset-0 border-2 border-[#F58327]/30 rounded-lg"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.1, opacity: 1 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  ></motion.div>
                </div>
              </div>

              {/* Content side */}
              <div className="w-full md:w-1/2 p-8 md:p-10 bg-white text-gray-800">
                <div className="h-full flex flex-col justify-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="mb-6 inline-block">
                      <div className="bg-[#FFF8F3] p-3 rounded-full">
                        <Rocket className="h-8 w-8 text-[#F58327]" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.h2
                    className="text-3xl font-bold mb-4 text-gray-900"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Your Website Is Being Created!
                  </motion.h2>

                  <motion.p
                    className="text-gray-600 mb-6 text-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    Thanks for completing your questionnaire! Our team of
                    experts is now working on your beautiful custom website.
                  </motion.p>

                  <motion.div
                    className="space-y-4 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#FFF8F3] flex items-center justify-center mr-3 mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-[#F58327]" />
                      </div>
                      <p className="text-gray-600">
                        <span className="font-medium text-gray-800">
                          Phase 1:
                        </span>{" "}
                        Your website design is now underway
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#FFF8F3] flex items-center justify-center mr-3 mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-[#F58327]" />
                      </div>
                      <p className="text-gray-600">
                        <span className="font-medium text-gray-800">
                          Delivery:
                        </span>{" "}
                        Your website will be ready in less than 5 days
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#FFF8F3] flex items-center justify-center mr-3 mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-[#F58327]" />
                      </div>
                      <p className="text-gray-600">
                        <span className="font-medium text-gray-800">
                          Support:
                        </span>{" "}
                        Our team is available for any questions
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <button
                      onClick={handleClosePopup}
                      className="cursor-pointer px-6 py-3 bg-[#F58327] hover:bg-[#E67016] text-white font-medium rounded-full transition-colors duration-200 shadow-sm"
                    >
                      Got it, thanks!
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
