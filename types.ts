export enum Page {
  HOME = 'HOME',
  LOGO_GEN = 'LOGO_GEN',
  IMAGE_EDIT = 'IMAGE_EDIT',
  VIDEO_GEN = 'VIDEO_GEN',
  VIDEO_EDIT = 'VIDEO_EDIT',
  SETTINGS = 'SETTINGS',
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type VideoAspectRatio = "16:9" | "9:16";
export type VideoResolution = "720p" | "1080p";