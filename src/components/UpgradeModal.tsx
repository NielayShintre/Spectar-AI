// src/components/UpgradeModal.tsx
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles } from 'lucide-react';

type UpgradeModalProps = {
  isOpen: boolean; 
  onClose: () => void;
  onUpgrade: () => void;
};

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const handleUpgradeClick = () => {
    onClose(); // Close the modal
    onUpgrade(); // Then call the upgrade function
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription className="text-base">
            Unlock unlimited document uploads and more!
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
          <AlertCircle className="h-8 w-8 text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-700">
            You've reached the limit of 3 documents upload with the free plan. Upgrade to premium for unlimited uploads and enhanced features.
          </p>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button variant="default" onClick={handleUpgradeClick}>
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;