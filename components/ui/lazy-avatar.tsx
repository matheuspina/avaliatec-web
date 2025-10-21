'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface LazyAvatarProps {
  src?: string | null
  alt: string
  fallback: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  priority?: boolean // Load immediately without lazy loading
}

/**
 * Lazy loading avatar component that only loads images when they come into view
 * Optimizes performance by reducing initial network requests
 */
export function LazyAvatar({ 
  src, 
  alt, 
  fallback, 
  className, 
  size = 'md',
  priority = false 
}: LazyAvatarProps) {
  const [isInView, setIsInView] = useState(priority)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !src) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [priority, src])

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  // Handle image load error
  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
  }

  // Determine if we should show the image
  const shouldShowImage = src && isInView && !imageError

  return (
    <Avatar 
      ref={imgRef}
      className={cn(sizeClasses[size], className)}
    >
      {shouldShowImage && (
        <AvatarImage
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={cn(
            'transition-opacity duration-200',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
      <AvatarFallback 
        className={cn(
          'bg-primary/10 text-primary font-medium transition-opacity duration-200',
          shouldShowImage && imageLoaded ? 'opacity-0' : 'opacity-100'
        )}
      >
        {fallback}
      </AvatarFallback>
    </Avatar>
  )
}

/**
 * Hook for generating avatar fallback text from contact data
 */
export function useAvatarFallback(name?: string | null, phoneNumber?: string) {
  return React.useMemo(() => {
    if (name) {
      return name
        .split(' ')
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join('')
    }
    
    // Use last 2 digits of phone number if no name
    if (phoneNumber) {
      const digits = phoneNumber.replace(/\D/g, '')
      return digits.slice(-2)
    }
    
    return '??'
  }, [name, phoneNumber])
}