export interface FlomoSettingProps {
  t: (title: string) => string;
}

export interface FlomoSettingState {
  isEnableFlomo: boolean;
  flomoWebhookUrl: string;
  isTesting: boolean;
  usageStats: {
    used: number;
    remaining: number;
    limit: number;
    percentage: number;
  };
}
