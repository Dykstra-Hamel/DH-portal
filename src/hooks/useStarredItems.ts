import { useState, useEffect, useCallback } from 'react';
import { StarredItem, StarredItemType } from '@/types/starred';

export function useStarredItems() {
  const [starredItems, setStarredItems] = useState<StarredItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch starred items
  const fetchStarredItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/starred-items');

      if (!response.ok) {
        throw new Error('Failed to fetch starred items');
      }

      const data: StarredItem[] = await response.json();
      setStarredItems(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching starred items:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStarredItems();
  }, [fetchStarredItems]);

  // Check if an item is starred
  const isStarred = useCallback(
    (itemType: StarredItemType, itemId: string): boolean => {
      return starredItems.some(
        (item) => item.item_type === itemType && item.item_id === itemId
      );
    },
    [starredItems]
  );

  // Toggle star status
  const toggleStar = useCallback(
    async (itemType: StarredItemType, itemId: string): Promise<boolean> => {
      const starred = isStarred(itemType, itemId);

      try {
        if (starred) {
          // Unstar the item
          const response = await fetch('/api/admin/starred-items', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_type: itemType, item_id: itemId }),
          });

          if (!response.ok) {
            throw new Error('Failed to unstar item');
          }

          // Optimistically update state
          setStarredItems((prev) =>
            prev.filter(
              (item) =>
                !(item.item_type === itemType && item.item_id === itemId)
            )
          );

          return false; // Now unstarred
        } else {
          // Star the item
          const response = await fetch('/api/admin/starred-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_type: itemType, item_id: itemId }),
          });

          if (!response.ok) {
            // Handle duplicate star (409 Conflict)
            if (response.status === 409) {
              await fetchStarredItems(); // Refresh to sync state
              return true;
            }
            throw new Error('Failed to star item');
          }

          const newStarredItem: StarredItem = await response.json();

          // Optimistically update state
          setStarredItems((prev) => [newStarredItem, ...prev]);

          return true; // Now starred
        }
      } catch (err) {
        console.error('Error toggling star:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Refresh to ensure consistency
        await fetchStarredItems();
        return starred; // Return original state on error
      }
    },
    [isStarred, fetchStarredItems]
  );

  return {
    starredItems,
    isLoading,
    error,
    isStarred,
    toggleStar,
    refetch: fetchStarredItems,
  };
}
