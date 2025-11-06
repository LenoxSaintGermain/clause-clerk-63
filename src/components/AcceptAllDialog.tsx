import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCheck } from 'lucide-react';

interface AcceptAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
}

export const AcceptAllDialog = ({ open, onOpenChange, onConfirm, count }: AcceptAllDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded-full">
              <CheckCheck className="w-5 h-5 text-accent" />
            </div>
            <AlertDialogTitle>Accept All Suggestions?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            This will apply all {count} pending redline{count !== 1 ? 's' : ''} to your contract. 
            The changes will be applied sequentially and you'll have the option to undo if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-accent hover:bg-accent/90"
          >
            Apply All Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
