"use client"




interface AdditionalInfoVisualProps {
  className?: string
}

export function AdditionalInfoVisual({ className }: AdditionalInfoVisualProps) {
  return (
    <div className={`relative h-28 w-full overflow-hidden rounded-lg ${className}`}>
      {/* Main card */}
      <div className="absolute inset-0 rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
        <div className="h-full w-full">

        </div>
      </div>
    </div>
  )
}
