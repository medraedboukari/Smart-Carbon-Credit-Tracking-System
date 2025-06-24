import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AnimatedCardProps {
  title: string;
  icon: React.ReactNode;
  value: number | string;
  unit: string;
  timestamp: string;
}

export function AnimatedCard({ title, icon, value, unit, timestamp }: AnimatedCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <motion.div
            key={value}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold"
          >
            {value} {unit}
          </motion.div>
          <p className="text-xs text-muted-foreground">Last updated: {timestamp}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

