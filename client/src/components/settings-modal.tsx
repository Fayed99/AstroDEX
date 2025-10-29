import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slippage: string;
  setSlippage: (value: string) => void;
  deadline: string;
  setDeadline: (value: string) => void;
}

export function SettingsModal({ open, onOpenChange, slippage, setSlippage, deadline, setDeadline }: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="modal-settings" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Transaction Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Slippage Tolerance</Label>
            <div className="flex gap-2 flex-wrap">
              {['0.1', '0.5', '1.0'].map(val => (
                <Button
                  key={val}
                  data-testid={`button-slippage-${val}`}
                  variant={slippage === val ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSlippage(val)}
                  className="flex-1 min-w-[70px]"
                >
                  {val}%
                </Button>
              ))}
              <Input
                data-testid="input-custom-slippage"
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                placeholder="Custom"
                className="w-24"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your transaction will revert if the price changes unfavorably by more than this percentage.
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Transaction Deadline</Label>
            <div className="flex items-center gap-3">
              <Input
                data-testid="input-deadline"
                type="number"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your transaction will revert if it is pending for more than this long.
            </p>
          </div>

          <Button
            data-testid="button-save-settings"
            onClick={() => onOpenChange(false)}
            size="lg"
            className="w-full font-bold"
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
