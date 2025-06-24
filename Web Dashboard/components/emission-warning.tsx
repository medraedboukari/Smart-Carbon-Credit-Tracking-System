import { AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EmissionWarningProps {
  emission: number
  threshold: number
}

export function EmissionWarning({ emission, threshold }: EmissionWarningProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning: High Gas Emission</AlertTitle>
        <AlertDescription>
          Current emission ({emission.toFixed(1)} ppm) exceeds the safe threshold of {threshold} ppm.
        </AlertDescription>
      </Alert>
    </motion.div>
  )
}

