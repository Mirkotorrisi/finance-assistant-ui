import { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { uploadService, type UploadStatementResponse, type GenerateNarrativesResponse } from '@/services';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: (result: UploadStatementResponse) => void;
}

const ACCEPTED_FILE_TYPES = [
  'text/csv',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ACCEPTED_EXTENSIONS = ['.csv', '.pdf', '.xls', '.xlsx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUploadDialog({ open, onOpenChange, onUploadSuccess }: FileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadStatementResponse | null>(null);
  const [isGeneratingNarratives, setIsGeneratingNarratives] = useState(false);
  const [narrativeResult, setNarrativeResult] = useState<GenerateNarrativesResponse | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      return `Invalid file type. Please upload a CSV, PDF, XLS, or XLSX file.`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is 10MB.`;
    }

    // Check MIME type if available
    if (file.type && !ACCEPTED_FILE_TYPES.includes(file.type)) {
      return `Invalid file type. Please upload a CSV, PDF, XLS, or XLSX file.`;
    }

    return null;
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    setUploadResult(null);
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadService.uploadStatement(selectedFile);
      
      setUploadResult(result);
      
      // After successful upload, generate narratives for the current year
      if (result.success && result.transactions_added > 0) {
        setIsGeneratingNarratives(true);
        setNarrativeResult(null); // Reset narrative result before new generation
        try {
          const currentYear = new Date().getFullYear();
          const narratives = await uploadService.generateNarratives(currentYear);
          setNarrativeResult(narratives);
        } catch (narrativeError) {
          // Non-critical error - log but don't fail the upload
          console.warn('Failed to generate narratives:', narrativeError);
        } finally {
          setIsGeneratingNarratives(false);
        }
      }
      
      // Call the onUploadSuccess callback if provided
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
      
      // Clear the selected file after successful upload
      setSelectedFile(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file. Please try again.';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    setUploadResult(null);
    setNarrativeResult(null);
  };

  const handleClose = () => {
    if (!isUploading && !isGeneratingNarratives) {
      setSelectedFile(null);
      setError(null);
      setUploadResult(null);
      setNarrativeResult(null);
      onOpenChange(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getUploadButtonText = (): string => {
    if (isUploading) return 'Uploading...';
    if (isGeneratingNarratives) return 'Generating summaries...';
    return 'Upload';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Financial Data</DialogTitle>
          <DialogDescription>
            Upload a CSV, PDF, XLS, or XLSX file containing your financial data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag and Drop Area */}
          {!selectedFile && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8
                transition-colors duration-200 ease-in-out
                cursor-pointer
                ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }
              `}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Drag and drop your file here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  CSV, PDF, XLS, XLSX (Max 10MB)
                </p>
                <input
                  type="file"
                  accept={ACCEPTED_EXTENSIONS.join(',')}
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Selected File Display */}
          {selectedFile && (
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="rounded-md bg-primary/10 p-2 flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="flex-shrink-0 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {uploadResult && (
            <div className="flex items-start space-x-2 rounded-lg border border-green-500/50 bg-green-500/10 p-3">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-600">{uploadResult.message}</p>
                <p className="text-green-600/80 mt-1">
                  Processed: {uploadResult.transactions_processed} |{' '}
                  Added: {uploadResult.transactions_added} |{' '}
                  Skipped: {uploadResult.transactions_skipped}
                </p>
                {isGeneratingNarratives && (
                  <p className="text-green-600/80 mt-1">
                    Generating financial summaries...
                  </p>
                )}
                {narrativeResult && (
                  <p className="text-green-600/80 mt-1">
                    ✓ Generated {narrativeResult.documents_generated} financial summaries
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading || isGeneratingNarratives}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || isGeneratingNarratives}
            >
              {getUploadButtonText()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
