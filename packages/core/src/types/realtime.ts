export interface RealtimeMessage {
  type: 'send' | 'receive';
  data: unknown;
  timestamp: string;
}

export interface WebSocketStep {
  action: 'connect' | 'send' | 'receive' | 'disconnect';
  url?: string;
  data?: unknown;
  assertions?: Record<string, unknown>[];
  timeoutMs?: number;
}

export interface SseStep {
  action: 'connect' | 'receive' | 'disconnect';
  url?: string;
  eventName?: string;
  assertions?: Record<string, unknown>[];
  timeoutMs?: number;
  maxEvents?: number;
}

export interface WebSocketScenario {
  name: string;
  steps: WebSocketStep[];
}

export interface SseScenario {
  name: string;
  steps: SseStep[];
}
