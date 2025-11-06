import { useState } from 'react';
import { Finding } from '@/types/finding.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Edit3, Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { geminiService } from '@/services/gemini.service';

interface FindingCardProps {
  finding: Finding;
  onAccept: (id: string, redline: string) => void;
  onDismiss: (id: string) => void;
  onHighlight: (text: string) => void;
}

export const FindingCard = ({ finding, onAccept, onDismiss, onHighlight }: FindingCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRedline, setEditedRedline] = useState(finding.suggestedRedline);
  const [isRefining, setIsRefining] = useState(false);

  const handleRefine = async () => {
    const instruction = prompt('How would you like to refine this redline?');
    if (!instruction) return;

    setIsRefining(true);
    try {
      const refined = await geminiService.refineRedline(
        finding.originalText,
        editedRedline,
        instruction
      );
      setEditedRedline(refined);
      toast.success('Redline refined successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refine');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSaveEdit = () => {
    onAccept(finding.id, editedRedline);
    setIsEditing(false);
  };

  if (finding.status === 'dismissed') return null;

  return (
    <Card 
      className="border-border hover:border-accent/50 transition-all duration-200 hover:shadow-md"
      onMouseEnter={() => onHighlight(finding.originalText)}
      onMouseLeave={() => onHighlight('')}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <Badge variant="secondary" className="font-normal">
              Risk Identified
            </Badge>
          </div>
          {finding.status === 'accepted' && (
            <Badge className="bg-success text-white">
              <Check className="w-3 h-3 mr-1" />
              Accepted
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Original Clause
          </p>
          <p className="text-sm text-foreground/80 italic border-l-2 border-warning pl-3">
            "{finding.originalText}"
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Risk Analysis
          </p>
          <p className="text-sm text-foreground">
            {finding.risk}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Suggested Redline
          </p>
          {isEditing ? (
            <Textarea
              value={editedRedline}
              onChange={(e) => setEditedRedline(e.target.value)}
              className="min-h-[100px] text-sm"
            />
          ) : (
            <p className="text-sm text-foreground border-l-2 border-accent pl-3">
              {editedRedline}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                className="bg-accent hover:bg-accent/90"
              >
                <Check className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedRedline(finding.suggestedRedline);
                }}
              >
                Cancel
              </Button>
            </>
          ) : finding.status === 'accepted' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAccept(finding.id, editedRedline)}
              disabled
            >
              <Check className="w-4 h-4 mr-1" />
              Applied
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => onAccept(finding.id, editedRedline)}
                className="bg-accent hover:bg-accent/90"
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefine}
                disabled={isRefining}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                {isRefining ? 'Refining...' : 'Refine'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDismiss(finding.id)}
              >
                <X className="w-4 h-4 mr-1" />
                Dismiss
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
