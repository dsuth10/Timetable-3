import React, { useState, useEffect } from 'react';
import { TooltipData, ID } from '../../types';
import { assignmentsApi } from '../../services/assignmentsApi';

interface TooltipDataFetcherProps {
  assignmentId: ID;
  children: (props: {
    loading: boolean;
    error: Error | null;
    data: TooltipData | null;
  }) => React.ReactElement;
}

/**
 * Helper component to lazy-load tooltip data for an assignment.
 */
export const TooltipDataFetcher: React.FC<TooltipDataFetcherProps> = ({ assignmentId, children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TooltipData | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    
    assignmentsApi.getTooltip(assignmentId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(`Failed to fetch tooltip data for assignment ${assignmentId}:`, err);
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [assignmentId]);

  return children({ loading, error, data });
};

