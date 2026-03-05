import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { requestTracker } from "../../services/requestTracker";

export const GlobalRequestIndicator = () => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [activeRequests, setActiveRequests] = useState(requestTracker.getCount());

  useEffect(() => requestTracker.subscribe(setActiveRequests), []);

  const visible = isFetching > 0 || isMutating > 0 || activeRequests > 0;

  if (!visible) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-100">
      <div className="h-1 w-full animate-pulse bg-destaque" />
    </div>
  );
};
