'use client';

import { Github, Heart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportData } from '@/lib/db';
import { containerClasses } from '@/lib/utils';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <footer className="w-full border-t bg-card flex-shrink-0">
      <div className={`${containerClasses()} py-4`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left side - Copyright */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {currentYear} Timeline Planner</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for productivity
            </span>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Export Data
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://github.com', '_blank')}
              className="text-xs"
            >
              <Github className="h-3 w-3 mr-1" />
              GitHub
            </Button>
          </div>
        </div>

        {/* Bottom row - Additional info */}
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          <p>
            All data is stored locally in your browser using IndexedDB. 
            <Button
              variant="link"
              size="sm"
              onClick={handleExport}
              className="text-xs h-auto p-0 ml-1"
            >
              Export your data
            </Button>
            {' '}to keep a backup.
          </p>
        </div>
      </div>
    </footer>
  );
}
