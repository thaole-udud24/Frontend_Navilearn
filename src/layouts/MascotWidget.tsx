import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Bot, Send } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PATHS } from '@/routes/paths';
import { askAi } from '@/services/ai-assist';

/** Floating mascot (bounces in place) on every student page except the AI page itself — one click
 * jumps to the full AI Trợ lý page, or ask a quick question right here without leaving the page. */
export function MascotWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);

  const askMutation = useMutation({
    mutationFn: () => askAi({ question }),
    onSuccess: (res) => setAnswer(res.answer),
  });

  if (location.pathname === PATHS.student.aiAssist) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button
          type="button"
          aria-label="Trợ lý AI"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-500 text-primary-foreground shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Bot className="h-7 w-7" />
        </motion.button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="tw-scope w-80">
        <p className="mb-2 text-sm font-semibold text-foreground">Hỏi nhanh AI Trợ lý</p>
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Nhập câu hỏi…"
            onKeyDown={(e) => e.key === 'Enter' && question && askMutation.mutate()}
          />
          <Button
            type="button"
            size="icon"
            disabled={!question || askMutation.isPending}
            onClick={() => askMutation.mutate()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {answer && <p className="mt-2 rounded-control bg-muted p-2 text-xs text-foreground">{answer}</p>}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => {
            setOpen(false);
            navigate(PATHS.student.aiAssist);
          }}
        >
          Mở Trợ lý AI đầy đủ
        </Button>
      </PopoverContent>
    </Popover>
  );
}
