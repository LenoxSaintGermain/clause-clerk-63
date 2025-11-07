import { useState, useEffect, useCallback } from 'react';
import { ContractProvider, useContract } from '@/contexts/ContractContext';
import { FileUploader } from '@/components/FileUploader';
import { ContractViewer } from '@/components/ContractViewer';
import { ComparisonView } from '@/components/ComparisonView';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { GemSelector } from '@/components/GemSelector';
import { ExportMenu } from '@/components/ExportMenu';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { geminiService, GemPreset } from '@/services/gemini.service';
import { documentService } from '@/services/document.service';
import { downloadFile, exportToPdf } from '@/utils/export.utils';
import { toast } from 'sonner';
import { Sparkles, Scale, GitCompare, FileText } from 'lucide-react';

const IndexContent = () => {
  const {
    state,
    setDocument,
    setFindings,
    setAnalyzing,
    setHighlightedText,
    setSelectedFinding,
    acceptFinding,
    dismissFinding,
    acceptAllFindings,
    undoAcceptAll,
    updateFindingRedline,
    setViewMode,
    resetState,
  } = useContract();

  const [selectedGem, setSelectedGem] = useState<GemPreset>('balanced');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(!geminiService.isInitialized());

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + A: Accept selected finding
      if (modKey && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        const selectedFinding = state.findings.find(
          f => f.id === state.selectedFindingId && f.status === 'pending'
        );
        if (selectedFinding) {
          acceptFinding(selectedFinding.id, selectedFinding.suggestedRedline);
          toast.success('Redline accepted');
        }
      }

      // Cmd/Ctrl + Shift + A: Accept all
      if (modKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        const pendingCount = state.findings.filter(f => f.status === 'pending').length;
        if (pendingCount > 0) {
          acceptAllFindings();
          toast.success(`Applied ${pendingCount} redlines`);
        }
      }

      // Escape: Clear highlight and selection
      if (e.key === 'Escape') {
        setHighlightedText('');
        setSelectedFinding(null);
      }

      // Arrow Up: Select previous finding
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const pendingFindings = state.findings.filter(f => f.status === 'pending');
        if (pendingFindings.length === 0) return;

        const currentIndex = state.selectedFindingId
          ? pendingFindings.findIndex(f => f.id === state.selectedFindingId)
          : -1;
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : pendingFindings.length - 1;
        const prevFinding = pendingFindings[prevIndex];
        
        setSelectedFinding(prevFinding.id);
        setHighlightedText(prevFinding.originalText);
      }

      // Arrow Down: Select next finding
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const pendingFindings = state.findings.filter(f => f.status === 'pending');
        if (pendingFindings.length === 0) return;

        const currentIndex = state.selectedFindingId
          ? pendingFindings.findIndex(f => f.id === state.selectedFindingId)
          : -1;
        const nextIndex = currentIndex < pendingFindings.length - 1 ? currentIndex + 1 : 0;
        const nextFinding = pendingFindings[nextIndex];
        
        setSelectedFinding(nextFinding.id);
        setHighlightedText(nextFinding.originalText);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    state.findings,
    state.selectedFindingId,
    acceptFinding,
    acceptAllFindings,
    setHighlightedText,
    setSelectedFinding,
  ]);

  const handleApiKeySubmit = (apiKey: string) => {
    geminiService.initialize(apiKey);
    setShowApiKeyDialog(false);
    toast.success('API key configured successfully');
  };

  const handleAnalyze = async () => {
    if (!state.document) return;

    if (!geminiService.isInitialized()) {
      setShowApiKeyDialog(true);
      return;
    }

    setAnalyzing(true);
    try {
      const instructions = selectedGem ? geminiService.getGemInstructions(selectedGem) : undefined;
      const results = await geminiService.analyzeContract(state.document.text, instructions);
      setFindings(results);
      toast.success(`Found ${results.length} potential issues`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcceptFinding = useCallback((id: string, redline: string) => {
    acceptFinding(id, redline);
    toast.success('Redline applied to contract');
  }, [acceptFinding]);

  const handleAcceptAll = useCallback(() => {
    const pendingCount = state.findings.filter(f => f.status === 'pending').length;
    acceptAllFindings();
    toast.success(`Applied ${pendingCount} redline${pendingCount !== 1 ? 's' : ''} to contract`, {
      action: state.previousState ? {
        label: 'Undo',
        onClick: () => {
          undoAcceptAll();
          toast.success('Changes reverted');
        }
      } : undefined
    });
  }, [state.findings, state.previousState, acceptAllFindings, undoAcceptAll]);

  const handleExport = async (format: 'docx' | 'pdf' | 'txt') => {
    if (!state.document) return;

    const acceptedFindings = state.findings
      .filter(f => f.status === 'accepted')
      .map(f => ({
        original: f.originalText,
        replacement: f.suggestedRedline
      }));

    try {
      if (format === 'docx') {
        const blob = await documentService.exportToDocx(
          state.originalContract,
          acceptedFindings
        );
        downloadFile(blob, `${state.document.fileName.replace(/\.[^/.]+$/, '')}_redlined.docx`);
      } else if (format === 'txt') {
        const text = await documentService.exportToText(
          state.originalContract,
          acceptedFindings
        );
        downloadFile(text, `${state.document.fileName.replace(/\.[^/.]+$/, '')}_redlined.txt`);
      } else if (format === 'pdf') {
        await exportToPdf(
          state.currentContract,
          `${state.document.fileName.replace(/\.[^/.]+$/, '')}_redlined.pdf`
        );
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

            {state.document && (
              <div className="flex items-center gap-3">
                {state.findings.length > 0 && (
                  <Tabs value={state.viewMode} onValueChange={(v) => setViewMode(v as 'analysis' | 'comparison')}>
                    <TabsList>
                      <TabsTrigger value="analysis" disabled={state.isAnalyzing}>
                        <FileText className="w-4 h-4 mr-2" />
                        Analysis
                      </TabsTrigger>
                      <TabsTrigger value="comparison" disabled={state.isAnalyzing}>
                        <GitCompare className="w-4 h-4 mr-2" />
                        Comparison
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
                <GemSelector
                  selectedGem={selectedGem}
                  onSelect={setSelectedGem}
                  disabled={state.isAnalyzing}
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={state.isAnalyzing}
                  className="bg-accent hover:bg-accent/90"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {state.isAnalyzing ? 'Analyzing...' : 'Analyze Contract'}
                </Button>
                <ExportMenu
                  onExport={handleExport}
                  disabled={state.findings.filter(f => f.status === 'accepted').length === 0}
                />
                <Button
                  variant="outline"
                  onClick={resetState}
                >
                  New Contract
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {!state.document ? (
          <div className="max-w-2xl mx-auto">
            <FileUploader
              onFileLoaded={setDocument}
              isProcessing={state.isAnalyzing}
            />
          </div>
        ) : state.viewMode === 'analysis' ? (
          <div className="grid lg:grid-cols-[40%_1fr] gap-6 h-[calc(100vh-180px)]">
            <ContractViewer
              text={state.currentContract}
              fileName={state.document.fileName}
              highlightedText={state.highlightedText}
            />
            <AnalysisPanel
              findings={state.findings}
              onAccept={handleAcceptFinding}
              onDismiss={dismissFinding}
              onAcceptAll={handleAcceptAll}
              onHighlight={setHighlightedText}
              onUpdateRedline={updateFindingRedline}
              selectedFindingId={state.selectedFindingId}
              canUndo={state.previousState !== null}
              onUndo={undoAcceptAll}
            />
          </div>
        ) : (
          <ComparisonView
            originalContract={state.originalContract}
            currentContract={state.currentContract}
            fileName={state.document.fileName}
          />
        )}
      </main>

      <ApiKeyDialog open={showApiKeyDialog} onSubmit={handleApiKeySubmit} />
    </div>
  );
};

const Index = () => {
  return (
    <ContractProvider>
      <IndexContent />
    </ContractProvider>
  );
};

export default Index;
