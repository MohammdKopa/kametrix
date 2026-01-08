import * as React from "react"
import Image, { ImageProps } from "next/image"
import { cn } from "@/lib/utils"

/**
 * ResponsiveImage - A mobile-optimized image component
 *
 * Features:
 * - Automatic responsive sizing with srcset
 * - Lazy loading by default
 * - Proper aspect ratio handling to prevent layout shifts
 * - Optimized for mobile devices with appropriate sizes attribute
 */

interface ResponsiveImageProps extends Omit<ImageProps, "sizes"> {
  /** Custom sizes attribute for responsive images */
  sizes?: string
  /** Aspect ratio class (e.g., "aspect-video", "aspect-square") */
  aspectRatio?: "video" | "square" | "4/3" | "3/2" | "16/9" | "auto"
  /** Container class name */
  containerClassName?: string
}

/**
 * Default sizes attribute optimized for common layouts:
 * - Mobile (< 640px): Full width
 * - Tablet (< 1024px): Half width
 * - Desktop: One third width
 */
const defaultSizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"

const aspectRatioClasses = {
  video: "aspect-video",
  square: "aspect-square",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "16/9": "aspect-[16/9]",
  auto: "",
}

function ResponsiveImage({
  className,
  containerClassName,
  sizes = defaultSizes,
  aspectRatio = "auto",
  alt,
  ...props
}: ResponsiveImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        aspectRatio !== "auto" && aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      <Image
        className={cn(
          "object-cover",
          aspectRatio !== "auto" && "absolute inset-0 h-full w-full",
          className
        )}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        {...props}
      />
    </div>
  )
}

/**
 * HeroImage - Full-width hero image optimized for above-the-fold content
 *
 * Features:
 * - Priority loading for LCP optimization
 * - Full viewport width sizing
 * - Eager loading
 */
interface HeroImageProps extends Omit<ImageProps, "sizes" | "priority" | "loading"> {
  /** Container class name */
  containerClassName?: string
}

function HeroImage({
  className,
  containerClassName,
  alt,
  ...props
}: HeroImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden w-full",
        containerClassName
      )}
    >
      <Image
        className={cn("object-cover w-full h-full", className)}
        sizes="100vw"
        priority
        loading="eager"
        alt={alt}
        {...props}
      />
    </div>
  )
}

/**
 * AvatarImage - Optimized for small circular/square profile images
 *
 * Features:
 * - Small fixed sizes for avatars
 * - Proper rounded styling
 */
interface AvatarImageProps extends Omit<ImageProps, "sizes" | "width" | "height"> {
  /** Size of the avatar in pixels */
  size?: 24 | 32 | 40 | 48 | 64 | 96 | 128
}

const avatarSizeClasses = {
  24: "w-6 h-6",
  32: "w-8 h-8",
  40: "w-10 h-10",
  48: "w-12 h-12",
  64: "w-16 h-16",
  96: "w-24 h-24",
  128: "w-32 h-32",
}

function AvatarImage({
  className,
  size = 40,
  alt,
  ...props
}: AvatarImageProps) {
  return (
    <Image
      className={cn(
        "rounded-full object-cover",
        avatarSizeClasses[size],
        className
      )}
      width={size}
      height={size}
      sizes={`${size}px`}
      alt={alt}
      {...props}
    />
  )
}

export { ResponsiveImage, HeroImage, AvatarImage }
export type { ResponsiveImageProps, HeroImageProps, AvatarImageProps }
