import { useState, useRef, useEffect } from 'react';
import { Finding } from '@/types/finding.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Edit3, Sparkles, AlertTriangle, Locate } from 'lucide-react';
import { toast } from 'sonner';
import { geminiService } from '@/services/gemini.service';
import { scrollToText } from '@/utils/highlighter';

interface FindingCardProps {
  finding: Finding;
  onAccept: (id: string, redline: string) => void;
  onDismiss: (id: string) => void;
  onHighlight: (text: string) => void;
  onUpdateRedline: (id: string, redline: string) => void;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

export const FindingCard = ({ 
  finding, 
  onAccept, 
  onDismiss, 
  onHighlight, 
  onUpdateRedline,
  onSelect,
  isSelected 
}: FindingCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRedline, setEditedRedline] = useState(finding.suggestedRedline);
  const [isRefining, setIsRefining] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setEditedRedline(finding.suggestedRedline);
  }, [finding.suggestedRedline]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleEditChange = (value: string) => {
    setEditedRedline(value);
    
    // Debounce the update callback
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (value.trim() && value !== finding.suggestedRedline) {
        onUpdateRedline(finding.id, value);
      }
    }, 500);
  };

  const handleRefine = async () => {
    const instruction = window.prompt(
      'How would you like to refine this redline?\n\nPlease provide specific instructions (minimum 5 characters):'
    );
    
    if (!instruction || instruction.trim().length < 5) {
      if (instruction !== null) {
        toast.error('Please provide more detailed instructions (at least 5 characters)');
      }
      return;
    }

    setIsRefining(true);
    try {
      const refined = await geminiService.refineRedline(
        finding.originalText,
        editedRedline,
        instruction.trim()
      );
      setEditedRedline(refined);
      const newCount = (finding.refinementCount || 0) + 1;
      onUpdateRedline(finding.id, refined);
      toast.success('Redline refined successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refine');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editedRedline.trim()) {
      toast.error('Redline cannot be empty');
      return;
    }
    onUpdateRedline(finding.id, editedRedline);
    setIsEditing(false);
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    // Scroll to text in viewer
    scrollToText(finding.originalText, 'contract-viewer');
    
    // Small delay for visual feedback
    setTimeout(() => {
      onAccept(finding.id, editedRedline);
      setIsAccepting(false);
    }, 250);
  };

  const handleMouseEnter = () => {
    onHighlight(finding.originalText);
  };

  const handleSelect = () => {
    onSelect?.(finding.id);
    onHighlight(finding.originalText);
    scrollToText(finding.originalText, 'contract-viewer');
  };

  if (finding.status === 'dismissed') return null;

  return (
    <Card 
      ref={cardRef}
      className={`border-border transition-all duration-250 cursor-pointer ${
        isAccepting ? 'animate-scale-out opacity-50' : 'animate-fade-in'
      } ${
        isSelected ? 'border-accent ring-2 ring-accent/20' : 'hover:border-accent/50'
      } ${
        finding.status === 'accepted' ? 'opacity-75' : 'hover:shadow-md'
      }`}
      onClick={handleSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => onHighlight('')}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <Badge variant="secondary" className="font-normal">
              Risk Identified
            </Badge>
            {finding.refinementCount && finding.refinementCount > 0 && (
              <Badge variant="outline" className="text-xs">
                Refined {finding.refinementCount}x
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-accent text-accent hover:bg-accent hover:text-white transition-all hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect();
              }}
            >
              <Locate className="w-3.5 h-3.5 mr-1.5" />
              Jump to Clause
            </Button>
            {finding.status === 'accepted' && (
              <Badge className="bg-success text-white">
                <Check className="w-3 h-3 mr-1" />
                Accepted
              </Badge>
            )}
          </div>
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
            <>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  Editing...
                </Badge>
              </div>
              <Textarea
                ref={textareaRef}
                value={editedRedline}
                onChange={(e) => handleEditChange(e.target.value)}
                className="min-h-[100px] text-sm border-accent focus:ring-accent"
              />
            </>
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
                onClick={handleAccept}
                disabled={isAccepting}
                className="bg-accent hover:bg-accent/90"
              >
                <Check className="w-4 h-4 mr-1" />
                {isAccepting ? 'Accepting...' : 'Accept'}
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
