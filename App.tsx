
import React, { useState, useCallback, useRef } from 'react';
import { generateRoast } from './services/geminiService';
import { FireIcon, UploadIcon, SpinnerIcon } from './components/icons';

// --- Helper Functions ---
const convertFileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [, base64] = result.split(',');
      const mimeType = file.type;
      if (!base64) {
        reject(new Error("Failed to read file as base64."));
        return;
      }
      resolve({ base64, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};


// --- UI Components ---

const AppHeader = () => (
    <header className="text-center p-4 md:p-6 border-b border-zinc-700/50">
        <div className="flex items-center justify-center gap-3">
            <FireIcon className="w-10 h-10 text-orange-500"/>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
                Roazt
            </h1>
        </div>
        <p className="text-zinc-400 mt-2 text-sm md:text-base">The AI comedian that roasts your photos.</p>
    </header>
);

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
    inputRef: React.RefObject<HTMLInputElement>;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, inputRef }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onImageSelect(event.target.files[0]);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            onImageSelect(event.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    return (
        <div
            className="w-full"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            aria-label="Image uploader with drag and drop"
        >
            <input
                type="file"
                ref={inputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                aria-hidden="true"
            />
            <div className="mt-6 flex justify-center rounded-lg border-2 border-dashed border-zinc-600 px-6 py-10 hover:border-orange-500 transition-colors cursor-pointer">
                <div className="text-center">
                    <UploadIcon className="mx-auto h-12 w-12 text-zinc-400" aria-hidden="true" />
                    <div className="mt-4 flex text-sm leading-6 text-zinc-400">
                        <p className="pl-1">
                            <span className="font-semibold text-orange-500">Upload a file</span> or drag and drop
                        </p>
                    </div>
                    <p className="text-xs leading-5 text-zinc-500">PNG, JPG, WEBP up to 10MB</p>
                </div>
            </div>
        </div>
    );
};

interface ResultDisplayProps {
    roast: string | null;
    isLoading: boolean;
    error: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ roast, isLoading, error }) => {
    if (isLoading) {
        return (
            <div className="mt-8 flex flex-col items-center justify-center text-center p-8 bg-zinc-800/50 rounded-lg min-h-[160px]">
                <SpinnerIcon className="w-12 h-12 text-orange-500 animate-spin" />
                <p className="mt-4 text-lg text-zinc-300 font-semibold">Brewing up a fresh roast...</p>
                <p className="text-zinc-400 text-sm">Our AI is sharpening its wit.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-8 text-center p-6 bg-red-900/20 border border-red-500/30 rounded-lg" role="alert">
                <p className="text-red-400 font-semibold">Roast Failed</p>
                <p className="text-red-400/80 mt-1 text-sm">{error}</p>
            </div>
        );
    }

    if (roast) {
        return (
            <div className="mt-8 text-center p-8 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-zinc-800/10 border border-zinc-700 rounded-lg shadow-lg">
                <p className="text-2xl md:text-3xl font-serif italic text-white leading-relaxed">
                    “{roast}”
                </p>
            </div>
        );
    }

    return null;
};

const AppFooter = () => (
    <footer className="text-center p-4 text-zinc-500 text-xs border-t border-zinc-800 mt-auto">
        <p>&copy; {new Date().getFullYear()} Roazt. All rights reserved. Roast responsibly.</p>
    </footer>
);

const App: React.FC = () => {
    const [image, setImage] = useState<{ url: string; file: File } | null>(null);
    const [roast, setRoast] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file (PNG, JPG, WEBP).');
            return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError('File size should not exceed 10MB.');
            return;
        }

        setImage({
            url: URL.createObjectURL(file),
            file: file
        });
        setRoast(null);
        setError(null);
    };

    const handleRoast = useCallback(async () => {
        if (!image) return;

        setIsLoading(true);
        setError(null);
        setRoast(null);

        try {
            const { base64, mimeType } = await convertFileToBase64(image.file);
            const result = await generateRoast(base64, mimeType);
            setRoast(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during the roast.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [image]);

    const handleReset = () => {
        if (image) {
            URL.revokeObjectURL(image.url);
        }
        setImage(null);
        setRoast(null);
        setError(null);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    return (
        <div className="min-h-screen text-white font-sans flex flex-col">
            <AppHeader />
            <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex flex-col items-center">
                <div className="w-full max-w-md">
                    {!image ? (
                        <>
                            <ImageUploader onImageSelect={handleImageSelect} inputRef={inputRef} />
                            {error && (
                               <div className="mt-4 text-center p-3 bg-red-900/20 border border-red-500/30 rounded-lg" role="alert">
                                   <p className="text-red-400 text-sm">{error}</p>
                               </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center">
                            <img
                                src={image.url}
                                alt="Uploaded for roast"
                                className="max-w-full max-h-80 rounded-lg shadow-lg mx-auto border-4 border-zinc-700"
                            />
                            <div className="mt-6 flex justify-center gap-4">
                                <button
                                    onClick={handleRoast}
                                    disabled={isLoading}
                                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <FireIcon className="w-5 h-5" />
                                    {isLoading ? 'Roasting...' : 'Roast Me!'}
                                </button>
                                <button
                                    onClick={handleReset}
                                    disabled={isLoading}
                                    className="px-6 py-3 bg-zinc-700 text-zinc-200 font-semibold rounded-full hover:bg-zinc-600 transition-colors disabled:opacity-50"
                                >
                                    Change Photo
                                </button>
                            </div>
                        </div>
                    )}

                    <ResultDisplay roast={roast} isLoading={isLoading} error={error && !!image ? error : null} />
                </div>
            </main>
            <AppFooter />
        </div>
    );
};

export default App;
