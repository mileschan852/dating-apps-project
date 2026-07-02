export interface UseChannelFollowOptions {
  channelUrl: string;
  storageSet: (key: string, value: string) => void | Promise<void>;
  storageKey: string;
  openLink: (url: string) => void;
}
export function useChannelFollow({ channelUrl, storageSet, storageKey, openLink }: UseChannelFollowOptions) {
  // Implementation
}
