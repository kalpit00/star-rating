"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

// Extend the Window interface to include our API
declare global {
  interface Window {
    VirtualizedRatingListAPI?: {
      resetAllRatings?: () => void;
    };
  }
}

// Use dynamic import for the virtualized list component
// This is necessary because react-window uses browser APIs
const VirtualizedRatingList = dynamic(() => import("./VirtualizedRatingList"), {
  ssr: false,
});

// Define the interface for rating state
interface RatingState {
  rating: number | null;
  isSubmitted: boolean;
}

export default function RatingListContainer() {
  // State to track submitted ratings
  const [ratingsState, setRatingsState] = useState<Record<string, RatingState>>(
    {}
  );

  // Calculate the percentage of submitted ratings
  const calculateProgress = useCallback(() => {
    const totalItems = 100; // Total number of rating forms
    const submittedCount = Object.values(ratingsState).filter(
      (item) => item.isSubmitted
    ).length;
    return Math.round((submittedCount / totalItems) * 100);
  }, [ratingsState]);

  // Handle rating state changes from the VirtualizedRatingList
  const handleRatingStateChange = useCallback(
    (newState: Record<string, RatingState>) => {
      setRatingsState(newState);
    },
    []
  );

  // Handle global reset
  const handleGlobalReset = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to reset all ratings? This action cannot be undone."
      )
    ) {
      // Reset all ratings using the exposed API
      if (window.VirtualizedRatingListAPI?.resetAllRatings) {
        window.VirtualizedRatingListAPI.resetAllRatings();
      }
    }
  }, []);

  // Calculate current progress percentage
  const progressPercentage = calculateProgress();

  return (
    <div className="w-full">
      <div className="mb-1 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-md">
        {/* Header section with title and controls */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-1">
          {/* Title - centered on mobile, left-aligned on larger screens */}
          <h2 className="text-center sm:text-left text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-2 sm:mb-0">
            Virtualized Rating List
          </h2>
          
          {/* Progress bar and reset button - centered on mobile */}
          <div className="flex justify-center sm:justify-end items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12">
              <CircularProgressbar
                value={progressPercentage}
                text={`${progressPercentage}%`}
                styles={buildStyles({
                  textSize: "24px",
                  // Use a solid color for better visibility
                  pathColor: "#3e98c7",
                  textColor: "#3e98c7",
                  trailColor: "#d6d6d6",
                  // Ensure rotation is set to start from the top
                  rotation: 0,
                  // Make sure path transition is enabled
                  pathTransition: "stroke-dashoffset 0.5s ease 0s",
                  // Ensure the path is visible
                  strokeLinecap: "round",
                })}
              />
            </div>

            <button
              onClick={handleGlobalReset}
              className="p-1.5 sm:p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
              aria-label="Reset all ratings"
              title="Reset all ratings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="sm:w-6 sm:h-6"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>
        </div>

        {/* The virtualized list of rating forms */}
        <div className="mt-2">
          <VirtualizedRatingList
            itemHeight={150}
            onRatingStateChange={handleRatingStateChange}
          />
        </div>
      </div>
    </div>
  );
}
