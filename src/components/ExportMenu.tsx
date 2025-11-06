import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, File } from 'lucide-react';

interface ExportMenuProps {
  onExport: (format: 'docx' | 'pdf' | 'txt') => void;
  disabled?: boolean;
}

export const ExportMenu = ({ onExport, disabled }: ExportMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('docx')}>
          <FileText className="w-4 h-4 mr-2" />
          Word Document (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('pdf')}>
          <File className="w-4 h-4 mr-2" />
          PDF Document (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('txt')}>
          <FileText className="w-4 h-4 mr-2" />
          Plain Text (.txt)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
