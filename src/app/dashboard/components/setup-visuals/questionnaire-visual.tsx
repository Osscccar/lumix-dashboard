"use client"

import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"




interface QuestionnaireVisualProps {
  className?: string
}

export function QuestionnaireVisual({ className }: QuestionnaireVisualProps) {
  return (
    <div className={`relative h-28 w-full overflow-hidden rounded-lg ${className}`}>
      {/* Main card */}
      <div className="absolute inset-0 rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
        <div className="h-full w-full">

        </div>
      </div>

      {/* Completion indicator */}
      <motion.div
        className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#D1FAE5]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <CheckCircle className="h-3 w-3 text-[#10B981]" />
      </motion.div>
    </div>
  )
}
