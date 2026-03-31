const QUEUE_KEY = 'shikshatrack_offline_queue';

export function enqueue(payload) {
  const queue = getQueue();
  queue.push({ ...payload, _queuedAt: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function flushQueue(axiosInstance) {
  if (!navigator.onLine) return;
  const queue = getQueue();
  if (!queue.length) return;

  const failed = [];
  for (const item of queue) {
    try {
      await axiosInstance.post('/api/assessments', item);
    } catch {
      failed.push(item);
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
}
