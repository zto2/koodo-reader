export interface FlomoSettingProps {
  t: (title: string) => string;
}

export interface FlomoSettingState {
  isEnableFlomo: boolean;
  flomoWebhookUrl: string;
  isTesting: boolean;
}
