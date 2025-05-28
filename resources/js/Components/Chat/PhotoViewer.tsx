import React, { useState, useEffect, useCallback, TouchEvent } from 'react';
import Modal from '@/Components/Modal';
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Photo {
    url: string;
    id: number;
}

interface PhotoViewerProps {
    photos: Photo[];
    initialPhotoIndex: number;
    show: boolean;
    onClose: () => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({
    photos,
    initialPhotoIndex,
    show,
    onClose,
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialPhotoIndex);
    const [scale, setScale] = useState(1);

    const isMobile = useIsMobile();
    const [touchStart, setTouchStart] = useState<number | null>(null);

    useEffect(() => {
        setCurrentIndex(initialPhotoIndex);
    }, [initialPhotoIndex]);

    useEffect(() => {
        if (!show) {
            setScale(1);
        }
    }, [show]);

    const handleNext = useCallback(() => {
        if (currentIndex < photos.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setScale(1);
        }
    }, [currentIndex, photos.length]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            setScale(1);
        }
    }, [currentIndex]);

    const handleTouchStart = (e: TouchEvent) => {
        setTouchStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (touchStart === null) return;

        const currentX = e.touches[0].clientX;
        const diff = touchStart - currentX;

        // Минимальное расстояние свайпа - 50px
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                // Свайп влево
                handleNext();
            } else {
                // Свайп вправо
                handlePrev();
            }
            setTouchStart(null);
        }
    };

    const handleTouchEnd = () => {
        setTouchStart(null);
    };

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!show) return;

            switch (event.key) {
                case 'ArrowRight':
                    handleNext();
                    break;
                case 'ArrowLeft':
                    handlePrev();
                    break;
                case 'Escape':
                    onClose();
                    break;
            }
        },
        [show, handleNext, handlePrev, onClose]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleDownload = async () => {
        const currentPhoto = photos[currentIndex];
        try {
            const response = await fetch(currentPhoto.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `photo-${currentPhoto.id}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading photo:', error);
        }
    };

    const zoomIn = () => setScale((prev) => Math.min(prev + 0.5, 3));
    const zoomOut = () => setScale((prev) => Math.max(prev - 0.5, 0.5));

    return (
        <Modal
            show={show}
            onClose={onClose}
            maxWidth={isMobile ? undefined : "2xl"}
        >
            <div
                className="relative bg-black w-full h-screen"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <button
                    className="absolute top-2 right-2 text-white hover:text-gray-300 z-50 p-2"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>

                {currentIndex > 0 && (
                    <button
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-50"
                        onClick={handlePrev}
                    >
                        <ChevronLeft size={36} />
                    </button>
                )}

                {currentIndex < photos.length - 1 && (
                    <button
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-50"
                        onClick={handleNext}
                    >
                        <ChevronRight size={36} />
                    </button>
                )}

                <div
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center z-50 bg-black/50 rounded-full px-4 py-2"
                    style={{ gap: '16px' }}
                >
                    <button
                        className="text-white hover:text-gray-300"
                        onClick={zoomOut}
                    >
                        <ZoomOut size={24} />
                    </button>
                    <button
                        className="text-white hover:text-gray-300"
                        onClick={zoomIn}
                    >
                        <ZoomIn size={24} />
                    </button>
                    <button
                        className="text-white hover:text-gray-300"
                        onClick={handleDownload}
                    >
                        <Download size={24} />
                    </button>
                </div>

                <div
                    className="absolute inset-0 flex items-center justify-center overflow-hidden"
                    style={{ margin: isMobile ? '32px 8px' : '48px' }}
                >
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={photos[currentIndex].url}
                            alt={`Photo ${currentIndex + 1}`}
                            className="max-h-full max-w-full transition-transform duration-200"
                            style={{
                                transform: `scale(${scale})`,
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PhotoViewer;