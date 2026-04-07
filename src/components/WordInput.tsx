import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";

interface WordInputProps {
  onGenerate: (word: string) => void;
  isLoading: boolean;
}

/** Word input form — user enters an English word to generate vocabulary data */
const WordInput = ({ onGenerate, isLoading }: WordInputProps) => {
  const [word, setWord] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = word.trim();
    if (trimmed) {
      onGenerate(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Add a New Word
        </h2>
        <p className="text-muted-foreground text-sm">
          Enter an English word to generate its vocabulary details
        </p>
      </div>

      <div className="flex gap-3">
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="e.g. serendipity"
          className="flex-1 bg-card border-border focus:ring-primary"
          disabled={isLoading}
          autoFocus
        />
        <Button type="submit" disabled={isLoading || !word.trim()}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin-slow" />
          ) : (
            "Generate"
          )}
        </Button>
      </div>
    </form>
  );
};

export default WordInput;
