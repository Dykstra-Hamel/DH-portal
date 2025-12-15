import Image from 'next/image';
import styles from '../Auth.module.scss';

interface BrandingPanelProps {
  brandingImages: string[] | undefined;
  companyLogo?: string | null;
  companyName?: string;
  slogans?: {
    line1: string;
    line2: string;
    line3: string;
  };
}

export function BrandingPanel({
  brandingImages,
  companyLogo,
  companyName,
  slogans,
}: BrandingPanelProps) {
  return (
    <div className={styles.authRightPanel}>
      <div className={styles.brandingOverlay} />
      <div className={styles.brandingImages}>
        {brandingImages &&
          brandingImages.map((image, index) => (
            <Image
              src={image}
              alt=""
              fill
              className={styles.brandingImageItem}
              id={`image${index + 1}`}
              key={`image${index + 1}`}
              quality={80}
              style={{ objectFit: 'cover' }}
            />
          ))}
      </div>
      <div className={styles.brandingContent}>
        {/* Company Logo */}
        {companyLogo && (
          <Image
            src={companyLogo}
            alt={`${companyName} logo`}
            width={0}
            height={0}
            sizes="100vw"
            className={styles.brandingCompanyLogo}
          />
        )}

        {/* Company Slogans */}
        {slogans && (slogans.line1 || slogans.line2 || slogans.line3) && (
          <div className={styles.brandingSlogans}>
            {slogans.line1 && (
              <div className={styles.sloganText}>{slogans.line1}</div>
            )}
            {slogans.line2 && (
              <div className={styles.sloganText}>{slogans.line2}</div>
            )}
            {slogans.line3 && (
              <div className={styles.sloganText}>{slogans.line3}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
