import React, { useState } from 'react';
import { Package } from 'lucide-react';
import avatarFarmerImg from '../../assets/images/user_profile_avatar_1793663943185.jpg';
import avatarManagerImg from '../../assets/images/avatar_loan_manager_1793675765849.jpg';
import avatarAdminImg from '../../assets/images/avatar_system_admin_1793675767324.jpg';
import headphonesImg from '../../assets/images/paylater_audio_headphones_1793663943739.jpg';
import smartwatchImg from '../../assets/images/paylater_smartwatch_pro_1793663945708.jpg';
import gimbalImg from '../../assets/images/paylater_camera_gimbal_1793663946099.jpg';

const BUNDLED_IMAGE_MAP: Record<string, string> = {
  '/frontend/loan/assets/images/user_profile_avatar_1793663943185.jpg': avatarFarmerImg,
  '/frontend/loan/assets/images/avatar_loan_manager_1793675765849.jpg': avatarManagerImg,
  '/frontend/loan/assets/images/avatar_system_admin_1793675767324.jpg': avatarAdminImg,
  '/frontend/loan/assets/images/paylater_audio_headphones_1793663943739.jpg': headphonesImg,
  '/frontend/loan/assets/images/paylater_smartwatch_pro_1793663945708.jpg': smartwatchImg,
  '/frontend/loan/assets/images/paylater_camera_gimbal_1793663946099.jpg': gimbalImg,
  '/frontend/src/assets/images/user_profile_avatar_1793663943185.jpg': avatarFarmerImg,
  '/frontend/src/assets/images/avatar_loan_manager_1793675765849.jpg': avatarManagerImg,
  '/frontend/src/assets/images/avatar_system_admin_1793675767324.jpg': avatarAdminImg,
  '/frontend/src/assets/images/paylater_audio_headphones_1793663943739.jpg': headphonesImg,
  '/frontend/src/assets/images/paylater_smartwatch_pro_1793663945708.jpg': smartwatchImg,
  '/frontend/src/assets/images/paylater_camera_gimbal_1793663946099.jpg': gimbalImg,
  '/frontend/assets/images/user_profile_avatar_1793663943185.jpg': avatarFarmerImg,
  '/frontend/assets/images/avatar_loan_manager_1793675765849.jpg': avatarManagerImg,
  '/frontend/assets/images/avatar_system_admin_1793675767324.jpg': avatarAdminImg,
  '/frontend/assets/images/paylater_audio_headphones_1793663943739.jpg': headphonesImg,
  '/frontend/assets/images/paylater_smartwatch_pro_1793663945708.jpg': smartwatchImg,
  '/frontend/assets/images/paylater_camera_gimbal_1793663946099.jpg': gimbalImg,
  '/src/assets/images/user_profile_avatar_1793663943185.jpg': avatarFarmerImg,
  '/src/assets/images/avatar_loan_manager_1793675765849.jpg': avatarManagerImg,
  '/src/assets/images/avatar_system_admin_1793675767324.jpg': avatarAdminImg,
  '/src/assets/images/paylater_audio_headphones_1793663943739.jpg': headphonesImg,
  '/src/assets/images/paylater_smartwatch_pro_1793663945708.jpg': smartwatchImg,
  '/src/assets/images/paylater_camera_gimbal_1793663946099.jpg': gimbalImg,
};

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText,
}) => {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = BUNDLED_IMAGE_MAP[src] || src;

  if (hasError || !resolvedSrc) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-subtle text-ink-secondary select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        {fallbackText ? (
          <span className="font-display font-bold text-xs sm:text-sm tracking-tight text-ink">
            {fallbackText}
          </span>
        ) : (
          <Package className="w-6 h-6 text-ink-muted" />
        )}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
