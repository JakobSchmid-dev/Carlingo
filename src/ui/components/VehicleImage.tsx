/** Vehicle image with a fixed aspect ratio (nothing jumps while loading) and lazy loading. */
export function VehicleImage({
  src,
  alt,
  locked = false,
  className = '',
  eager = false,
}: {
  src: string;
  alt: string;
  locked?: boolean;
  className?: string;
  eager?: boolean;
}) {
  return (
    <div
      className={`relative aspect-(--image-ratio) w-full overflow-hidden bg-surface-muted ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={`size-full object-cover ${locked ? 'scale-110 blur-locked grayscale' : ''}`}
      />
    </div>
  );
}
