type AnalyticsEventName =
  | 'landing_cta_click'
  | 'auth_view'
  | 'signup_start'
  | 'signup_complete'
  | 'first_analysis_view';

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

type AnalyticsEvent = {
  name: AnalyticsEventName;
  timestamp: string;
  path: string;
  payload?: AnalyticsPayload;
};

const STORAGE_KEY = 'af_analytics_events';
const MAX_STORED_EVENTS = 200;

function readStoredEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredEvents(events: AnalyticsEvent[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_STORED_EVENTS)));
  } catch {
    // noop
  }
}

export function getTrackedEvents(): AnalyticsEvent[] {
  return readStoredEvents();
}

export function clearTrackedEvents() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

type FunnelStepKey =
  | 'landing_cta_click'
  | 'auth_view'
  | 'signup_start'
  | 'signup_complete'
  | 'first_analysis_view';

const FUNNEL_STEPS: FunnelStepKey[] = [
  'landing_cta_click',
  'auth_view',
  'signup_start',
  'signup_complete',
  'first_analysis_view',
];

export type FunnelBaselineMetric = {
  step: FunnelStepKey;
  count: number;
  conversionRate: number | null;
};

export function getFunnelBaselineMetrics(): FunnelBaselineMetric[] {
  const events = readStoredEvents();
  const counts = new Map<FunnelStepKey, number>();

  for (const step of FUNNEL_STEPS) {
    counts.set(step, events.filter((event) => event.name === step).length);
  }

  return FUNNEL_STEPS.map((step, index) => {
    const currentCount = counts.get(step) ?? 0;
    if (index === 0) {
      return {
        step,
        count: currentCount,
        conversionRate: null,
      };
    }

    const prevStep = FUNNEL_STEPS[index - 1];
    const prevCount = counts.get(prevStep) ?? 0;

    return {
      step,
      count: currentCount,
      conversionRate: prevCount > 0 ? currentCount / prevCount : null,
    };
  });
}

export function trackEvent(name: AnalyticsEventName, payload?: AnalyticsPayload) {
  if (typeof window === 'undefined') return;

  const event: AnalyticsEvent = {
    name,
    timestamp: new Date().toISOString(),
    path: window.location.pathname,
    payload,
  };

  const events = readStoredEvents();
  events.push(event);
  saveStoredEvents(events);

  const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({
      event: name,
      ...payload,
      path: event.path,
      timestamp: event.timestamp,
    });
  }
}
