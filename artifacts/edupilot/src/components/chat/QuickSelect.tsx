import { motion } from 'framer-motion';

interface QuickSelectProps {
  options: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

export function QuickSelect({ options, onSelect, disabled, label }: QuickSelectProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4"
    >
      {label && (
        <p className="text-xs text-muted-foreground font-medium mb-2">{label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => (
          <motion.button
            key={opt}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(opt)}
            disabled={disabled}
            className="px-4 py-2 rounded-xl bg-white border border-primary/20
              text-primary font-medium text-sm shadow-sm
              hover:bg-primary/5 hover:border-primary/40 hover:shadow-md
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200"
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
