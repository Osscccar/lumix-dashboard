"use client"

import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"



interface SignInVisualProps {
  className?: string
}

export function SignInVisual({ className }: SignInVisualProps) {
  return (
    <div className={`relative h-28 w-full overflow-hidden rounded-lg ${className}`}>
      {/* Main card */}
      <div className="absolute inset-0 rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
        <div className="h-max-fit w-max-fit">

        </div>
      </div>

      {/* Success overlay */}
      <motion.div
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#D1FAE5]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <CheckCircle className="h-4 w-4 text-[#10B981]" />
      </motion.div>
    </div>
  )
}
