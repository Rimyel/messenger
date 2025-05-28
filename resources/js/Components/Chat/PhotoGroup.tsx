import React, { useState } from 'react';
import PhotoViewer from '@/Components/Chat/PhotoViewer';

interface Photo {
  url: string;
  id: number;
}

interface PhotoGroupProps {
  photos: Photo[];
}

const PhotoGroup: React.FC<PhotoGroupProps> = ({ photos }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  if (!photos.length) return null;

  // Ограничиваем количество отображаемых фотографий до 10
  const displayPhotos = photos.slice(0, 10);

  // Функция для определения количества строк и столбцов
  const getGridLayout = (count: number) => {
    if (count === 1) {
      return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
    } else if (count === 2) {
      return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr 1fr' };
    } else if (count === 3) {
      return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
    } else if (count === 4) {
      return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr' };
    } else if (count <= 7) {
      return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' };
    } else {
      return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr 1fr' };
    }
  };

  // Функция для определения позиции фото в сетке
  const getPhotoPosition = (index: number, total: number) => {
    if (total === 1) {
      return { gridColumn: 1, gridRow: 1, gridColumnEnd: 2, gridRowEnd: 2 };
    } else if (total === 2) {
      if (index === 0) {
        return { gridColumn: 1, gridRow: 1, gridColumnEnd: 2 };
      } else {
        return { gridColumn: 1, gridRow: 2, gridColumnEnd: 2, gridRowEnd: 3 };
      }
    } else if (total === 3) {
      if (index < 2) {
        return { gridColumn: index + 1, gridRow: 1 };
      } else {
        return { gridColumn: 1, gridRow: 2, gridColumnEnd: 3, gridRowEnd: 3 };
      }
    } else if (total === 4) {
      if (index < 3) {
        return { gridColumn: index + 1, gridRow: 1 };
      } else {
        return { gridColumn: 1, gridRow: 2, gridColumnEnd: 4, gridRowEnd: 3 };
      }
    } else if (total <= 7) {
      if (index < 3) {
        return { gridColumn: index + 1, gridRow: 1 };
      } else if (index < 6) {
        return { gridColumn: (index - 2) % 3 + 1, gridRow: 2 };
      } else {
        return { gridColumn: 1, gridRow: 3, gridColumnEnd: 4, gridRowEnd: 4 };
      }
    } else {
      if (index < 3) {
        return { gridColumn: index + 1, gridRow: 1 };
      } else if (index < 6) {
        return { gridColumn: (index - 2) % 3 + 1, gridRow: 2 };
      } else if (index < 9) {
        return { gridColumn: (index - 5) % 3 + 1, gridRow: 3 };
      } else {
        return { gridColumn: 1, gridRow: 4, gridColumnEnd: 4, gridRowEnd: 5 };
      }
    }
  };

  const gridLayout = getGridLayout(displayPhotos.length);

  return (
    <>
      <div
        className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden"
        style={{
          display: 'grid',
          gap: '4px',
          ...gridLayout,
          height: 'auto',
        }}
      >
        {displayPhotos.map((photo, index) => (
          <div
            key={photo.id}
            style={{
              position: 'relative',
              overflow: 'hidden',
              ...getPhotoPosition(index, displayPhotos.length),
            }}
          >
            <img
              src={photo.url}
              alt={`Photo ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
              loading="lazy"
              onClick={() => setSelectedPhotoIndex(index)}
            />
            {index === 9 && photos.length > 10 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                +{photos.length - 10}
              </div>
            )}
          </div>
        ))}
      </div>

      <PhotoViewer
        photos={photos}
        initialPhotoIndex={selectedPhotoIndex ?? 0}
        show={selectedPhotoIndex !== null}
        onClose={() => setSelectedPhotoIndex(null)}
      />
    </>
  );
};

export default PhotoGroup;