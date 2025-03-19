"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import RatingForm from "./RatingForm";

// Extend the Window interface to include our API
declare global {
  interface Window {
    VirtualizedRatingListAPI?: {
      resetAllRatings?: () => void;
    };
  }
}

// Total number of items
const TOTAL_ITEMS = 100; // 50 rows x 2 columns
const ITEMS_PER_ROW = 2; // 2 columns
const TOTAL_ROWS = Math.ceil(TOTAL_ITEMS / ITEMS_PER_ROW); // 50 rows

interface VirtualizedRatingListProps {
  itemWidth?: number;
  itemHeight?: number;
  onRatingStateChange?: (
    state: Record<string, { rating: number | null; isSubmitted: boolean }>
  ) => void;
}

export default function VirtualizedRatingList({
  itemWidth = 400,
  itemHeight = 200,
  onRatingStateChange,
}: VirtualizedRatingListProps) {
  // Keep track of which items have been loaded
  const [loadedItems, setLoadedItems] = useState<Record<number, boolean>>({});
  // Keep track of the number of items loaded
  const [numItemsLoaded, setNumItemsLoaded] = useState(0);
  // Reference to the list container for measuring
  const listContainerRef = useRef<HTMLDivElement>(null);
  // Reference to the list component
  const listRef = useRef<List>(null);
  // State for list width
  const [listWidth, setListWidth] = useState(800);
  // State for list height
  const [listHeight, setListHeight] = useState(500);

  // State to store ratings for all forms
  const [ratingsState, setRatingsState] = useState<
    Record<
      string,
      {
        rating: number | null;
        isSubmitted: boolean;
      }
    >
  >({});

  // State to track if we're at the top of the list
  const [isAtTop, setIsAtTop] = useState(true);
  // State to track if we're at the bottom of the list
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Load more items as the user scrolls
  const loadMoreItems = (startIndex: number, stopIndex: number) => {
    // Convert row indices to item indices (accounting for 2 items per row)
    const startItemIndex = startIndex * ITEMS_PER_ROW;
    const stopItemIndex = Math.min(
      stopIndex * ITEMS_PER_ROW + (ITEMS_PER_ROW - 1),
      TOTAL_ITEMS - 1
    );

    // This would be an async operation in a real app (e.g., API call)
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newLoadedItems = { ...loadedItems };

        for (let i = startItemIndex; i <= stopItemIndex; i++) {
          newLoadedItems[i] = true;
        }

        setLoadedItems(newLoadedItems);
        setNumItemsLoaded(Object.keys(newLoadedItems).length);
        resolve();
      }, 500); // Simulate network delay
    });
  };

  // Check if an item at a given index is loaded
  const isItemLoaded = (index: number) => {
    // Convert row index to item indices
    const startItemIndex = index * ITEMS_PER_ROW;
    const itemsInRow = Math.min(ITEMS_PER_ROW, TOTAL_ITEMS - startItemIndex);

    // Check if all items in this row are loaded
    for (let i = 0; i < itemsInRow; i++) {
      if (!loadedItems[startItemIndex + i]) {
        return false;
      }
    }

    return true;
  };

  // Render a row of items
  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const startItemIndex = index * ITEMS_PER_ROW;
    const itemsInRow = Math.min(ITEMS_PER_ROW, TOTAL_ITEMS - startItemIndex);

    // If the row is not loaded, show loading placeholders
    if (!isItemLoaded(index)) {
      return (
        <div style={style} className="flex gap-4 justify-center">
          {Array.from({ length: itemsInRow }).map((_, i) => (
            <div
              key={i}
              className="flex-1 p-6 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md animate-pulse"
              style={{ height: itemHeight - 20, maxWidth: itemWidth }}
            />
          ))}
        </div>
      );
    }

    // Otherwise, render the actual items
    return (
      <div style={style} className="flex gap-4 justify-center">
        {Array.from({ length: itemsInRow }).map((_, i) => {
          const itemIndex = startItemIndex + i;
          return (
            <div
              key={itemIndex}
              className="flex-1"
              style={{ maxWidth: itemWidth }}
            >
              <RatingForm
                id={`item-${itemIndex}`}
                title={`Item ${itemIndex + 1}`}
                externalRating={
                  ratingsState[`item-${itemIndex}`]?.rating ?? null
                }
                isExternallySubmitted={
                  ratingsState[`item-${itemIndex}`]?.isSubmitted ?? false
                }
                onRatingChange={handleRatingChange}
                onSubmit={handleRatingSubmit}
                onReset={handleRatingReset}
              />
            </div>
          );
        })}
      </div>
    );
  };

  // Update list dimensions when window resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (listContainerRef.current) {
        const { width } = listContainerRef.current.getBoundingClientRect();
        setListWidth(width);
        // Set height to show 3 rows
        setListHeight(itemHeight * 3);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, [itemHeight]);

  // Scroll to the top of the list (first row, items 0-1)
  const scrollToTop = () => {
    if (listRef.current) {
      // Scroll to the very first row (offset 0)
      listRef.current.scrollTo(0);
      setIsAtTop(true);
      setIsAtBottom(false);
    }
  };

  // Scroll to the bottom of the list (last row, items 98-99)
  const scrollToBottom = () => {
    if (listRef.current) {
      // First ensure all items are loaded
      loadMoreItems(0, TOTAL_ROWS - 1).then(() => {
        // Calculate the maximum scroll offset (total height - visible height)
        const maxScrollOffset = TOTAL_ROWS * itemHeight - listHeight;
        // Then scroll to the maximum offset
        listRef.current?.scrollTo(maxScrollOffset);
        setIsAtTop(false);
        setIsAtBottom(true);
      });
    }
  };

  // Handle scroll events to update the isAtTop and isAtBottom states
  const handleScroll = ({ scrollOffset }: { scrollOffset: number }) => {
    // Check if we're at the top
    setIsAtTop(scrollOffset <= 1); // Using a small threshold to account for rounding errors

    // Check if we're at the bottom (approximately)
    // Calculate the maximum scroll offset (total height - visible height)
    const maxScrollOffset = TOTAL_ROWS * itemHeight - listHeight;
    // Compare current offset to max offset with a small threshold
    const isBottom = scrollOffset >= maxScrollOffset - 5;
    setIsAtBottom(isBottom);
  };

  // Handle rating change
  const handleRatingChange = (id: string, rating: number | null) => {
    setRatingsState((prevState) => {
      const newState = {
        ...prevState,
        [id]: {
          rating,
          isSubmitted: prevState[id]?.isSubmitted ?? false,
        },
      };

      // Notify parent component of state change
      if (onRatingStateChange) {
        onRatingStateChange(newState);
      }

      return newState;
    });
  };

  // Handle rating submission
  const handleRatingSubmit = (id: string, rating: number) => {
    setRatingsState((prevState) => {
      const newState = {
        ...prevState,
        [id]: {
          rating,
          isSubmitted: true,
        },
      };

      // Notify parent component of state change
      if (onRatingStateChange) {
        onRatingStateChange(newState);
      }

      return newState;
    });
    console.log(
      `Submitted rating: ${rating} for item: ${id} (managed by parent)`
    );
  };

  // Handle rating reset
  const handleRatingReset = (id: string) => {
    setRatingsState((prevState) => {
      const newState = { ...prevState };
      delete newState[id]; // Remove the rating entry completely

      // Notify parent component of state change
      if (onRatingStateChange) {
        onRatingStateChange(newState);
      }

      return newState;
    });
  };

  // Reset all ratings with useCallback to avoid dependency issues
  const resetAllRatings = useCallback(() => {
    setRatingsState({});

    // Notify parent component of state change
    if (onRatingStateChange) {
      onRatingStateChange({});
    }
  }, [onRatingStateChange]);

  // Expose resetAllRatings function to parent via ref
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialize the API object if it doesn't exist
      if (!window.VirtualizedRatingListAPI) {
        window.VirtualizedRatingListAPI = {};
      }
      // Set the resetAllRatings function
      window.VirtualizedRatingListAPI.resetAllRatings = resetAllRatings;
    }

    return () => {
      // Clean up when component unmounts
      if (typeof window !== "undefined" && window.VirtualizedRatingListAPI) {
        // TypeScript-safe way to remove the property
        if (window.VirtualizedRatingListAPI.resetAllRatings) {
          window.VirtualizedRatingListAPI.resetAllRatings = undefined;
        }
      }
    };
  }, [resetAllRatings]);

  return (
    <div ref={listContainerRef} className="w-full relative">
      {/* Top scroll indicator - shows when not at the top */}
      {!isAtTop && (
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-700 z-10 pointer-events-none" />
      )}

      {/* Scroll to top button - now at the top */}
      <button
        onClick={scrollToTop}
        className={`absolute top-2 right-2 z-20 p-2.5 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-colors ${
          isAtTop ? "opacity-50 cursor-not-allowed" : "opacity-100"
        }`}
        aria-label="Scroll to top"
        disabled={isAtTop}
        title="Scroll to first items"
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
        >
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </svg>
      </button>

      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={TOTAL_ROWS}
        loadMoreItems={loadMoreItems}
        threshold={5}
      >
        {({ onItemsRendered, ref }) => (
          <List
            className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
            height={listHeight}
            width={listWidth}
            itemCount={TOTAL_ROWS}
            itemSize={itemHeight}
            onItemsRendered={onItemsRendered}
            onScroll={handleScroll}
            ref={(listInstance) => {
              // Save a reference to the list
              if (listInstance) {
                listRef.current = listInstance;
              }
              // Forward the ref to the InfiniteLoader
              if (typeof ref === "function") {
                ref(listInstance);
              }
            }}
          >
            {Row}
          </List>
        )}
      </InfiniteLoader>

      {/* Scroll to bottom button - now at the bottom */}
      <button
        onClick={scrollToBottom}
        className={`absolute bottom-10 right-2 z-20 p-2.5 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-colors ${
          isAtBottom ? "opacity-50 cursor-not-allowed" : "opacity-100"
        }`}
        aria-label="Scroll to bottom"
        disabled={isAtBottom}
        title="Scroll to last items"
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
        >
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </svg>
      </button>

      {/* Bottom scroll indicator - shows when not at the bottom */}
      {!isAtBottom && (
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-200 to-transparent dark:from-gray-700 z-10 pointer-events-none" />
      )}

      <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
        {numItemsLoaded} of {TOTAL_ITEMS} items loaded
      </div>
    </div>
  );
}
