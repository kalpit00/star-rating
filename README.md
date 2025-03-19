# Star Rating System

A modern, responsive web application built with Next.js and React that demonstrates several advanced frontend techniques. This project showcases a virtualized list of rating components with infinite scrolling capabilities.

## Live Demo

**View Live : [star-rating-omega-three.vercel.app/](https://star-rating-omega-three.vercel.app/)** - Hosted on Vercel

### Demo Video

<video src="vid-1.mp4" controls width="100%"></video>

## Features

This project demonstrates solutions to several core frontend challenges:

1. **Star Rating Functionality**
2. **List Virtualization**
3. **Infinite Scrolling**
4. **Progress Tracking**
5. **Responsive Design**

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) with App Router
- **UI**: [Tailwind CSS](https://tailwindcss.com/) for styling
- **Virtualization**: [react-window](https://github.com/bvaughn/react-window) for efficient list rendering
- **Infinite Loading**: [react-window-infinite-loader](https://github.com/bvaughn/react-window-infinite-loader)
- **Progress Visualization**: [react-circular-progressbar](https://github.com/kevinsqi/react-circular-progressbar)

## Implementation Details

### 1. Star Rating Component

The star rating system allows users to rate items on a scale of 1-5 stars, with the ability to submit and reset ratings.

```tsx
// RatingForm.tsx (excerpt)
export default function RatingForm({
  id = "default",
  title,
  externalRating,
  isExternallySubmitted,
  onRatingChange,
  onSubmit,
  onReset,
}: RatingFormProps) {
  // Use local state only if external state is not provided
  const [localRating, setLocalRating] = useState<number | null>(null);
  const [localIsSubmitted, setLocalIsSubmitted] = useState(false);

  // Use either external or local state
  const rating = externalRating !== undefined ? externalRating : localRating;
  const isSubmitted =
    isExternallySubmitted !== undefined
      ? isExternallySubmitted
      : localIsSubmitted;

  const handleStarClick = (selectedRating: number) => {
    if (!isSubmitted) {
      if (onRatingChange) {
        onRatingChange(id, selectedRating);
      } else {
        setLocalRating(selectedRating);
      }
    }
  };

  // Rendering stars
  return (
    <div className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-md">
      {title && <h3 className="text-base font-semibold mb-2">{title}</h3>}
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarClick(star)}
              disabled={isSubmitted}
              className={`text-2xl focus:outline-none ${
                isSubmitted ? "cursor-not-allowed" : ""
              }`}
            >
              {star <= (rating || 0) ? (
                <span className="text-yellow-400">★</span>
              ) : (
                <span className="text-gray-300 dark:text-gray-600">☆</span>
              )}
            </button>
          ))}
        </div>
        {/* Submit and Reset buttons */}
      </div>
    </div>
  );
}
```

### 2. List Virtualization with react-window

To efficiently render large lists of rating forms, we use react-window for virtualization, which only renders the items currently visible in the viewport.

```tsx
// VirtualizedRatingList.tsx (excerpt)
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";

export default function VirtualizedRatingList({
  itemWidth = 300,
  itemHeight = 150,
  onRatingStateChange,
}: VirtualizedRatingListProps) {
  // State for list dimensions
  const [listWidth, setListWidth] = useState(800);
  const [listHeight, setListHeight] = useState(500);

  // Row renderer function
  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const startItemIndex = index * ITEMS_PER_ROW;
    const itemsInRow = Math.min(ITEMS_PER_ROW, TOTAL_ITEMS - startItemIndex);

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

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={TOTAL_ROWS}
      loadMoreItems={loadMoreItems}
    >
      {({ onItemsRendered, ref }) => (
        <List
          height={listHeight}
          width={listWidth}
          itemCount={TOTAL_ROWS}
          itemSize={itemHeight}
          onItemsRendered={onItemsRendered}
          ref={ref}
        >
          {Row}
        </List>
      )}
    </InfiniteLoader>
  );
}
```

### 3. Infinite Scrolling with react-window-infinite-loader

The application implements infinite scrolling to load more rating forms as the user scrolls down the list.

```tsx
// VirtualizedRatingList.tsx (excerpt)
const loadMoreItems = (startIndex: number, stopIndex: number) => {
  // Convert row indices to item indices (accounting for items per row)
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
```

### 4. Progress Tracking with react-circular-progressbar

The application includes a circular progress bar that visually represents the percentage of submitted ratings.

```tsx
// RatingListContainer.tsx (excerpt)
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function RatingListContainer() {
  const [ratingsState, setRatingsState] = useState<
    Record<
      string,
      {
        rating: number | null;
        isSubmitted: boolean;
      }
    >
  >({});

  // Calculate current progress percentage
  const calculateProgress = () => {
    const totalItems = 100; // Total number of possible ratings
    const submittedCount = Object.values(ratingsState).filter(
      (item) => item.isSubmitted
    ).length;
    return Math.round((submittedCount / totalItems) * 100);
  };

  const progressPercentage = calculateProgress();

  return (
    <div className="w-full">
      <div className="mb-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-1">
          <div className="flex-1"></div>
          <h2 className="flex-2 text-lg text-center font-semibold text-gray-800 dark:text-white">
            Virtualized Rating List
          </h2>

          {/* Progress bar and reset button */}
          <div className="flex-1 flex justify-end items-center gap-3">
            <div className="w-12 h-12">
              <CircularProgressbar
                value={progressPercentage}
                text={`${progressPercentage}%`}
                styles={buildStyles({
                  textSize: "24px",
                  pathColor: `rgba(62, 152, 199, ${progressPercentage / 100})`,
                  textColor: "#3e98c7",
                  trailColor: "#d6d6d6",
                  backgroundColor: "#3e98c7",
                })}
              />
            </div>
            {/* Reset button */}
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
```

### 5. State Management Between Parent and Child Components

The application demonstrates effective state management between parent and child components using props and state lifting.

```tsx
// Parent component manages state for all rating forms
const handleRatingStateChange = (
  newState: Record<
    string,
    {
      rating: number | null;
      isSubmitted: boolean;
    }
  >
) => {
  setRatingsState(newState);
};

// Child component receives state and callbacks from parent
<RatingForm
  id={`item-${itemIndex}`}
  title={`Item ${itemIndex + 1}`}
  externalRating={ratingsState[`item-${itemIndex}`]?.rating ?? null}
  isExternallySubmitted={
    ratingsState[`item-${itemIndex}`]?.isSubmitted ?? false
  }
  onRatingChange={handleRatingChange}
  onSubmit={handleRatingSubmit}
  onReset={handleRatingReset}
/>;
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [react-window Documentation](https://github.com/bvaughn/react-window)
- [react-circular-progressbar Documentation](https://github.com/kevinsqi/react-circular-progressbar)
