import { useEffect, useRef } from 'react';

/**
 * Re-fetches data when a panel (preview/create) transitions from open to closed.
 * This picks up any changes made while the panel was open (status changes, edits, etc.).
 */
export function useRefetchOnPanelClose(
  panelState: unknown | null,
  fetchData: () => void
) {
  const prevRef = useRef(panelState);
  useEffect(() => {
    if (prevRef.current !== null && panelState === null) {
      fetchData();
    }
    prevRef.current = panelState;
  }, [panelState, fetchData]);
}
