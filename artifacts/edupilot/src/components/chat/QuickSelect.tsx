import { motion } from 'framer-motion';

interface QuickSelectProps {
  options: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export function QuickSelect({ options, onSelect, disabled }: QuickSelectProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 max-w-3xl mx-auto px-4 mt-4"
    >
      {options.map((opt, i) => (
        <motion.button
          key={opt}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(opt)}
          disabled={disabled}
          className="
            px-4 py-2 rounded-xl bg-white border border-primary/20 
            text-primary font-medium text-sm shadow-sm
            hover:bg-primary/5 hover:border-primary/40 hover:shadow-md
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {opt}
        </motion.button>
      ))}
    </motion.div>
  );
}
