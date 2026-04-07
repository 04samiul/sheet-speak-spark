import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Loader2 } from "lucide-react";
import type { VocabData } from "@/lib/gemini";

interface PreviewCardProps {
  data: VocabData;
  onConfirm: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

/** Preview card — shows AI-generated vocabulary before saving to Google Sheets */
const PreviewCard = ({ data, onConfirm, onCancel, isSaving }: PreviewCardProps) => {
  return (
    <Card className="w-full max-w-lg mx-auto animate-fade-in border-primary/20 bg-card shadow-lg">
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <h3 className="font-display text-3xl font-bold text-foreground">
            {data.word}
          </h3>
          <p className="text-muted-foreground text-xs mt-1">Preview — confirm to save</p>
        </div>

        <div className="grid gap-3">
          <DetailRow label="বাংলা অর্থ" value={data.banglaMeaning} />
          <DetailRow label="Sentence" value={data.sentence} />
          <DetailRow label="Synonym" value={data.synonym} />
          <DetailRow label="Antonym" value={data.antonym} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={onConfirm}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin-slow" />
            ) : (
              <Check className="w-4 h-4 mr-1" />
            )}
            {isSaving ? "Saving…" : "Save to Sheet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/** Single detail row inside the preview card */
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-muted/50 rounded-md p-3">
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </span>
    <p className="text-foreground mt-0.5">{value}</p>
  </div>
);

export default PreviewCard;
