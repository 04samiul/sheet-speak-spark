import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookPlus, Library } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WordInput from "@/components/WordInput";
import PreviewCard from "@/components/PreviewCard";
import WordList from "@/components/WordList";
import { generateVocabData, type VocabData } from "@/lib/gemini";
import { checkDuplicate, appendWord } from "@/lib/sheets";

const Index = () => {
  const [preview, setPreview] = useState<VocabData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  /** Generate vocabulary data using Gemini AI */
  const handleGenerate = async (word: string) => {
    setIsGenerating(true);
    setPreview(null);
    try {
      const data = await generateVocabData(word);
      setPreview(data);
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /** Save word to Google Sheets after duplicate check */
  const handleConfirm = async () => {
    if (!preview) return;
    setIsSaving(true);
    try {
      // Check for duplicates
      const exists = await checkDuplicate(preview.word);
      if (exists) {
        toast({
          title: "Duplicate Word",
          description: `"${preview.word}" already exists in the sheet.`,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Append to sheet
      await appendWord(preview);
      toast({
        title: "Word Saved!",
        description: `"${preview.word}" has been added to your vocabulary sheet.`,
      });
      setPreview(null);
    } catch (err) {
      toast({
        title: "Save Failed",
        description: err instanceof Error ? err.message : "Could not save to Google Sheets",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto py-4 px-4">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-gradient text-center">
            Vocabulary Maker
          </h1>
          <p className="text-center text-muted-foreground text-sm mt-1">
            AI-powered vocabulary builder with Google Sheets
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-3xl mx-auto px-4 py-8">
        <Tabs defaultValue="add" className="space-y-8">
          <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2">
            <TabsTrigger value="add" className="gap-1.5">
              <BookPlus className="w-4 h-4" /> Add Word
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5">
              <Library className="w-4 h-4" /> Word List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-8">
            <WordInput onGenerate={handleGenerate} isLoading={isGenerating} />
            {preview && (
              <PreviewCard
                data={preview}
                onConfirm={handleConfirm}
                onCancel={() => setPreview(null)}
                isSaving={isSaving}
              />
            )}
          </TabsContent>

          <TabsContent value="list">
            <WordList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
