# BridgeAAC YouTube video

| File | What it is |
| --- | --- |
| `bridgeaac-youtube.mp4` | The video with soft music and the app's speech. Watch this one first. |
| `bridgeaac-youtube-no-music.mp4` | The same video with only the app's speech. The teleprompter and mixer use it. |
| `bridgeaac-youtube-final.mp4` | Made by the mixer once you've recorded your voice. Upload this one. |
| `script.md` | Everything you say, with timecodes. Lines marked APP are spoken by the app. |
| `teleprompter.html` | Plays the video and shows each line as it comes up, and records your mic in sync. |
| `captions.srt` | Captions for YouTube (your lines and the app's lines). |
| `description.txt` | YouTube description with chapters. |
| `thumbnail.png` | YouTube thumbnail. |

## Record your voice

1. Read `script.md` out loud a couple of times. Every line has room to breathe, so speak at a normal, relaxed pace.
2. Open `teleprompter.html` in Chrome, put headphones on, and press **Practice** to run through it once.
3. Press **Record**, allow the microphone, and read each line when it lights up. Stay quiet for the orange APP lines.
4. When the video ends, click **Save recording**. It saves a file like `my-vocals_lead-3.214.webm`. The number in the name keeps your voice in sync.

You can also record in Audacity, GarageBand or on your phone while watching `bridgeaac-youtube-no-music.mp4`. Start recording, then start the video. Measure how many seconds passed between starting the recording and the video's first frame, and pass that as `--lead=SECONDS`.

## Mix

```
node scripts/mix-youtube-vocals.mjs ~/Downloads/my-vocals_lead-3.214.webm
```

You can pass any audio file, including one you've already enhanced elsewhere (MP3, WAV, M4A, WebM). The mixer:

- Finds the sync on its own by matching the app speech your mic picked up, so the file name doesn't need a number.
- Mutes your track during the app's lines, so the app's voice isn't heard twice.
- Raises your voice evenly to YouTube's usual loudness without changing its sound.
- Lowers the music while you talk and writes `bridgeaac-youtube-final.mp4`.

Options:

- `--shift=0.2` moves your voice 0.2 seconds earlier (negative moves it later) if it feels a little off.
- `--music=0.5` makes the music quieter (default 0.7).
- `--voice=2` makes your voice 2 dB louder (`--voice=-2` quieter).
- `--clean` adds light noise reduction and compression, for a raw recording you haven't enhanced.
- `--no-music` leaves the music out.
- `--lead=3.09` sets the sync by hand if it can't be found.

## Upload

1. Upload `bridgeaac-youtube-final.mp4`.
2. Paste `description.txt` into the description. The chapter times are already in it.
3. Set `thumbnail.png` as the thumbnail.
4. Under Subtitles, upload `captions.srt` (choose "With timing").

## Change the video

Edit the scenes and narration in `scripts/generate-youtube-video.mjs`, run `npm run build`, then:

```
PIPER=/path/to/piper PIPER_MODEL=/path/to/en_US-hfc_female-medium.onnx node scripts/generate-youtube-video.mjs
```

Piper is only needed when an app line changes. The current app lines are already in `audio/`. Add `--at=45,120` to render just those seconds as stills in `preview/` for a quick look.
