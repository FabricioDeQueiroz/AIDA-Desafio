type Listener = (activeRequests: number) => void;

let activeRequests = 0;
const listeners = new Set<Listener>();

const notify = () => {
  listeners.forEach((listener) => listener(activeRequests));
};

export const requestTracker = {
  start() {
    activeRequests += 1;
    notify();
  },
  end() {
    activeRequests = Math.max(0, activeRequests - 1);
    notify();
  },
  getCount() {
    return activeRequests;
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(activeRequests);

    return () => {
      listeners.delete(listener);
    };
  },
};
