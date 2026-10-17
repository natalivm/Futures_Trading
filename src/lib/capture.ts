// Tab capture: the stream players are cross-origin iframes, so the only way to
// get their pixels is to share this tab once per session and crop frames.

const MAX_EDGE = 2576; // Claude's high-resolution vision limit

export class TabCapture {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  onEnded: (() => void) | null = null;

  get active() {
    return !!this.stream && this.stream.getVideoTracks().some(t => t.readyState === 'live');
  }

  async start() {
    if (this.active) return;
    if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('This browser cannot share a tab. Use Chrome or Edge.');
    const options = {
      video: { displaySurface: 'browser', frameRate: 5 },
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'exclude',
    } as DisplayMediaStreamOptions;
    const stream = await navigator.mediaDevices.getDisplayMedia(options);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      this.stop();
      this.onEnded?.();
    });
    this.stream = stream;
    this.video = video;
  }

  stop() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    if (this.video) this.video.srcObject = null;
    this.video = null;
  }

  /** Grab the current frame cropped to `el`, as base64 JPEG (no data: prefix). */
  grab(el: HTMLElement): { data: string; width: number; height: number } {
    const video = this.video;
    if (!video || !this.active || !video.videoWidth) throw new Error('Tab sharing is not running.');
    const rect = el.getBoundingClientRect();
    const sx = video.videoWidth / window.innerWidth;
    const sy = video.videoHeight / window.innerHeight;
    const crop = {
      x: Math.max(0, rect.left * sx),
      y: Math.max(0, rect.top * sy),
      w: Math.min(video.videoWidth, rect.width * sx),
      h: Math.min(video.videoHeight, rect.height * sy),
    };
    const scale = Math.min(1, MAX_EDGE / Math.max(crop.w, crop.h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(crop.w * scale);
    canvas.height = Math.round(crop.h * scale);
    canvas.getContext('2d')!.drawImage(video, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    return { data, width: canvas.width, height: canvas.height };
  }
}
