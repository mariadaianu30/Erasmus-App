'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, X, Copy, Check, MessageCircle, Mail, Facebook, Twitter, Linkedin } from 'lucide-react'

interface ShareOpportunityProps {
  title: string
  url: string
  type: 'event' | 'project'
}

export default function ShareOpportunity({ title, url, type }: ShareOpportunityProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url
  const shareText = `Check out this ${type === 'event' ? 'event' : 'project'}: ${title}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`, '_blank')
        setIsOpen(false)
      }
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`
        setIsOpen(false)
      }
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank')
        setIsOpen(false)
      }
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      action: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`, '_blank')
        setIsOpen(false)
      }
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      action: () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`, '_blank')
        setIsOpen(false)
      }
    }
  ]

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: fullUrl,
        })
        setIsOpen(false)
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback: open dropdown if native share not available
      setIsOpen(true)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        aria-label="Share opportunity"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Share Opportunity</span>
        <span className="sm:hidden">Share</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in slide-in-from-top-2 max-w-[calc(100vw-2rem)]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Share Opportunity</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-2">
              {/* Copy Link */}
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Link copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Copy link</span>
                  </>
                )}
              </button>

              {/* Share Options */}
              <div className="mt-2 space-y-1">
                {shareOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.name}
                      onClick={option.action}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${option.color} text-white transition-colors`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{option.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

