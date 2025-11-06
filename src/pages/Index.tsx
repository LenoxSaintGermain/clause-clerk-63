import { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { ContractViewer } from '@/components/ContractViewer';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { GemSelector } from '@/components/GemSelector';
import { ExportMenu } from '@/components/ExportMenu';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';
import { Button } from '@/components/ui/button';
import { ParsedDocument } from '@/types/document.types';
import { Finding } from '@/types/finding.types';
import { geminiService, GemPreset } from '@/services/gemini.service';
import { documentService } from '@/services/document.service';
import { downloadFile, exportToPdf } from '@/utils/export.utils';
import { toast } from 'sonner';
import { Sparkles, Scale } from 'lucide-react';

const Index = () => {
  const [document, setDocument] = useState<ParsedDocument | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');
  const [selectedGem, setSelectedGem] = useState<GemPreset>('balanced');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(!geminiService.isInitialized());

  const handleApiKeySubmit = (apiKey: string) => {
    geminiService.initialize(apiKey);
    setShowApiKeyDialog(false);
    toast.success('API key configured successfully');
  };

  const handleAnalyze = async () => {
    if (!document) return;

    if (!geminiService.isInitialized()) {
      setShowApiKeyDialog(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      const instructions = selectedGem ? geminiService.getGemInstructions(selectedGem) : undefined;
      const results = await geminiService.analyzeContract(document.text, instructions);
      setFindings(results);
      toast.success(`Found ${results.length} potential issues`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcceptFinding = (id: string, redline: string) => {
    setFindings(prev =>
      prev.map(f => {
        if (f.id === id) {
          // Update document text
          if (document) {
            const updatedText = document.text.replace(f.originalText, redline);
            setDocument({ ...document, text: updatedText });
          }
          return { ...f, status: 'accepted' as const, suggestedRedline: redline };
        }
        return f;
      })
    );
    toast.success('Redline applied to contract');
  };

  const handleDismissFinding = (id: string) => {
    setFindings(prev =>
      prev.map(f => f.id === id ? { ...f, status: 'dismissed' as const } : f)
    );
  };

  const handleAcceptAll = () => {
    const pendingFindings = findings.filter(f => f.status === 'pending');
    pendingFindings.forEach(finding => {
      handleAcceptFinding(finding.id, finding.suggestedRedline);
    });
  };

  const handleExport = async (format: 'docx' | 'pdf' | 'txt') => {
    if (!document) return;

    const acceptedFindings = findings
      .filter(f => f.status === 'accepted')
      .map(f => ({
        original: f.originalText,
        replacement: f.suggestedRedline
      }));

    try {
      if (format === 'docx') {
        const blob = await documentService.exportToDocx(document.text, acceptedFindings);
        downloadFile(blob, `${document.fileName.replace(/\.[^/.]+$/, '')}_redlined.docx`);
      } else if (format === 'txt') {
        const text = await documentService.exportToText(document.text, acceptedFindings);
        downloadFile(text, `${document.fileName.replace(/\.[^/.]+$/, '')}_redlined.txt`);
      } else if (format === 'pdf') {
        let text = document.text;
        acceptedFindings.forEach(({ original, replacement }) => {
          text = text.replace(original, replacement);
        });
        await exportToPdf(text, `${document.fileName.replace(/\.[^/.]+$/, '')}_redlined.pdf`);
      }
      toast.success('Document exported successfully');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-8 h-8 text-accent" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Contract Redliner</h1>
                <p className="text-sm text-muted-foreground">AI-powered legal review</p>
              </div>
            </div>

            {document && (
              <div className="flex items-center gap-3">
                <GemSelector
                  selectedGem={selectedGem}
                  onSelect={setSelectedGem}
                  disabled={isAnalyzing}
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-accent hover:bg-accent/90"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Contract'}
                </Button>
                <ExportMenu
                  onExport={handleExport}
                  disabled={findings.filter(f => f.status === 'accepted').length === 0}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {!document ? (
          <div className="max-w-2xl mx-auto">
            <FileUploader
              onFileLoaded={setDocument}
              isProcessing={isAnalyzing}
            />
          </div>
        ) : (
          <div className="grid lg:grid-cols-[40%_1fr] gap-6 h-[calc(100vh-180px)]">
            <ContractViewer
              text={document.text}
              fileName={document.fileName}
              highlightedText={highlightedText}
            />
            <AnalysisPanel
              findings={findings}
              onAccept={handleAcceptFinding}
              onDismiss={handleDismissFinding}
              onAcceptAll={handleAcceptAll}
              onHighlight={setHighlightedText}
            />
          </div>
        )}
      </main>

      <ApiKeyDialog open={showApiKeyDialog} onSubmit={handleApiKeySubmit} />
    </div>
  );
};

export default Index;
