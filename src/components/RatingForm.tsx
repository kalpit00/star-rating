"use client";

import { useState } from "react";

interface RatingFormProps {
  id?: string;
  title?: string;
  // External state props
  externalRating?: number | null;
  isExternallySubmitted?: boolean;
  onRatingChange?: (id: string, rating: number | null) => void;
  onSubmit?: (id: string, rating: number) => void;
  onReset?: (id: string) => void;
}

export default function RatingForm({
  id = "default",
  title,
  externalRating,
  isExternallySubmitted,
  onRatingChange,
  onSubmit,
  onReset
}: RatingFormProps) {
  // Use local state only if external state is not provided
  const [localRating, setLocalRating] = useState<number | null>(null);
  const [localIsSubmitted, setLocalIsSubmitted] = useState(false);
  
  // Use either external or local state
  const rating = externalRating !== undefined ? externalRating : localRating;
  const isSubmitted = isExternallySubmitted !== undefined ? isExternallySubmitted : localIsSubmitted;

  const handleStarClick = (selectedRating: number) => {
    if (!isSubmitted) {
      if (onRatingChange) {
        onRatingChange(id, selectedRating);
      } else {
        setLocalRating(selectedRating);
      }
    }
  };

  const handleSubmit = () => {
    if (rating !== null && !isSubmitted) {
      // In a real application, you would submit the rating to an API
      console.log(`Submitted rating: ${rating} for item: ${id}`);
      
      if (onSubmit) {
        onSubmit(id, rating);
      } else {
        setLocalIsSubmitted(true);
      }
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset(id);
    } else {
      setLocalRating(null);
      setLocalIsSubmitted(false);
    }
  };

  return (
    <div className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-md">
      {title && <h3 className="text-base font-semibold mb-2">{title}</h3>}

      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              disabled={isSubmitted}
              className={`text-2xl focus:outline-none transition-colors ${
                isSubmitted ? "cursor-not-allowed" : ""
              }`}
              aria-label={`Rate ${star} stars`}
            >
              {star <= (rating || 0) ? (
                <span className="text-yellow-400">★</span>
              ) : (
                <span className="text-gray-300 dark:text-gray-600">☆</span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={rating === null || isSubmitted}
          className={`ml-2 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            isSubmitted
              ? "bg-green-500 text-white cursor-not-allowed"
              : rating === null
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {isSubmitted ? "Submitted" : "Submit"}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="ml-1 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Reset rating"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
