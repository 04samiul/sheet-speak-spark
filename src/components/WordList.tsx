import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllWords, type SheetRow } from "@/lib/sheets";

/** Word list page — displays all vocabulary from Google Sheets with search */
const WordList = () => {
  const [words, setWords] = useState<SheetRow[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllWords();
      setWords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load words");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWords();
  }, []);

  // Real-time search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return words;
    const q = search.toLowerCase();
    return words.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.banglaMeaning.toLowerCase().includes(q) ||
        w.synonym.toLowerCase().includes(q) ||
        w.antonym.toLowerCase().includes(q)
    );
  }, [words, search]);

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search words, meanings, synonyms…"
            className="pl-10 bg-card"
          />
        </div>
        <Button variant="outline" size="icon" onClick={loadWords} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin-slow" : ""}`} />
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin-slow" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {words.length === 0
              ? "No words yet. Add your first word!"
              : "No results for your search."}
          </p>
        </div>
      )}

      {/* Word cards grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((row) => (
            <Card key={row.serial} className="animate-fade-in bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {row.word}
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    #{row.serial}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">বাংলা:</span>{" "}
                  {row.banglaMeaning}
                </p>
                <p className="text-sm italic text-muted-foreground">
                  "{row.sentence}"
                </p>
                <div className="flex gap-4 text-xs">
                  <span>
                    <span className="text-accent font-medium">Syn:</span>{" "}
                    {row.synonym}
                  </span>
                  <span>
                    <span className="text-destructive font-medium">Ant:</span>{" "}
                    {row.antonym}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Word count */}
      {!isLoading && words.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {filtered.length} of {words.length} words
        </p>
      )}
    </div>
  );
};

export default WordList;
