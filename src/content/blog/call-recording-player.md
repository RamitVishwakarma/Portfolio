At work we run AI voice agents that call customers. Our customer success managers (CSMs) audit those calls in a View Logs sheet, where each attempt has a recording, an overview, post-call metrics, a transcription and the call's journey. They listen to the recording and read the transcript side by side. The recording player was the slowest part of that sheet and the hardest to read. This post covers what was wrong with it and what a CSM can do with the new one.

## Waiting for the whole file

The old player used WaveSurfer's `load(url)`. That call downloads the whole file and decodes it before play is possible. On a 31-minute WAV of about 58 MB, a CSM waited about 16 seconds before they could press play. They waited that long on every call they opened.

![The old player showing a spinner and "Loading audio..." with the play button disabled.](/blog/call-recording-player/before-loading.webp "The old player 2.5 seconds after opening a call on a slow connection")

## One grey shape for two people

A stereo call recording has one voice on each channel. The old renderer drew channel 1 on top and channel 2 mirrored underneath it, both in the same grey. The customer and the agent ended up in one shape, and you could not tell who spoke when.

![A single grey waveform with bars above and below a centre line.](/blog/call-recording-player/before-waveform.webp "A stereo call in the old player")

## Play first, waveform later

The new player owns an `<audio>` element and hands it the recording URL. The browser streams the file with HTTP Range requests and the server answers with `206 Partial Content`, so playback starts once the first chunk arrives. The same 31-minute recording was playable after 2.5 seconds instead of 16.

The waveform still needs decoded audio. A background fetch downloads the file and decodes it at 8 kHz, and the player swaps the waveform in without interrupting playback. Until it arrives, an animated skeleton takes its place. Play works the whole time.

![A pale animated waveform placeholder above the player controls.](/blog/call-recording-player/skeleton.webp "The skeleton while the waveform decodes. Play does not wait for it.")

The cost is that the file downloads twice, once for the stream and once for the waveform. When the CSM closes the sheet, the player aborts the background fetch.

## Which channel is the customer

I did not want to guess which side was which. I took real calls from three telephony providers and compared each channel's loudness around the turn offsets in the transcript. On every call, the customer was the left channel and the agent was the right.

A stereo call now shows two labelled lanes, Customer in orange and Agent in purple. An organisation-level setting turns the lanes on. It is off by default, and it changes only how the player draws a call, never how calls are recorded. Some providers record mono, with both voices mixed into one channel, and those calls still show one waveform.

![Two waveform lanes with Customer and Agent labels and speaker icons in a wide column on the left.](/blog/call-recording-player/first-lanes.webp "The first two-lane version")

The first version put the lane names in a 96 px column on the left. That column took width from the waveform, and there was still no way to read a time off it. In the current layout each name sits on top of its lane, so the waveform gets the full width. The attempt heading, its status and the call's start time sit on one line, and the playback time moved into the controls row.

![The same call with an orange Customer lane, a purple Agent lane and a time ruler underneath.](/blog/call-recording-player/after-waveform.webp "The same stereo call in the new player")

## A ruler under the waveform

Under the waveform there is now a time ruler, drawn in React. It always splits the call into five equal parts, whatever its length. A 10:01 call reads 0:00, 2:00, 4:00, 6:00, 8:00 and 10:01. An hour-long call reads 0:00, 12:00 and so on up to 1:00:00. Smaller ticks mark the quarters between labels.

Clicking the ruler or dragging on the waveform seeks. While the pointer is over the waveform, a line shows the time under it, so a CSM can find a moment before clicking.

![A ten-minute call with a vertical hover line labelled 6:06.](/blog/call-recording-player/hover.webp "Hovering at 6:06 on a ten-minute call")

![A one-hour call with ruler labels every twelve minutes.](/blog/call-recording-player/hour-long.webp "The ruler on an hour-long call")

## Muting one speaker

When both people talk at once, it is hard to hear either of them. Each lane now has a mic button on its left that mutes that speaker. It uses Web Audio. The `<audio>` element feeds a MediaElementSource, then a ChannelSplitter, then one GainNode per channel, and both gains go to the speakers. Muting sets that channel's gain to 0. With this routing, each voice also plays in both ears instead of one.

I measured it in Chrome. Muting the agent dropped the agent channel's output level from 0.381 to 0, and the volume slider still worked.

Web Audio outputs silence for cross-origin audio. So the player offers mute only when the recording comes through the app's own audio proxy.

![The Agent lane with a crossed-out mic and a grey label.](/blog/call-recording-player/agent-muted.webp "The agent muted")

## The transcript follows the recording

The old transcript showed messages with plain timestamps. Nothing in it changed while the recording played, so a CSM had to work out which line was playing from the audio alone.

![The old transcript during playback at 0:21, with no message marked.](/blog/call-recording-player/before-transcript.webp "The old transcript at 0:21. Nothing marks the current turn.")

Now the turn under the playhead gets a ring. If that turn has scrolled out of view, the transcript scrolls it back in. It does not scroll when the turn is already visible, so a CSM reading ahead keeps their place. Clicking a bubble, or the time above it, plays the recording from that turn's offset.

![The new transcript during playback at 0:21, with the customer's message ringed.](/blog/call-recording-player/after-transcript.webp "The new transcript at 0:21, with a ring on the customer's turn")

Tool calls and old transcripts without per-turn times never get the ring, because they have no offset to match.

![The transcript scrolled to a later agent turn, which is ringed while the recording plays at 0:48.](/blog/call-recording-player/time-click.webp "Clicking the time above a later turn plays from there")

## When a recording will not load

One provider's recording links need a login. Chrome does not report an error for them. It waits forever, and the player showed "Loading audio..." with no end. The new player gives the metadata 15 seconds to arrive. After that it tries the backup URL, and if that also fails, it shows "Failed to load audio." with a Retry button.

That is all it says. We have a rule against helper text in the UI, so the player never explains why a recording failed or why a call has one waveform. The layout has to make that clear.

## What a CSM can do now

- Start listening about 2 seconds after opening a call, instead of waiting for the whole file.
- See who spoke when, with the customer and the agent in separate lanes.
- Mute one side to hear the other clearly.
- Jump to a line in the transcript, such as the moment the customer agreed to pay, and see which line is playing.

## What I took away

- **Check whether a player needs the whole file before it plays.** `load(url)` was the simplest call to write, and it was the reason for the wait. The browser could already stream the file with Range requests.
- **Measure a mapping before you build on it.** Comparing channel loudness with transcript offsets settled which side was the customer, for all three providers.
- **Bound the cost of a trade-off.** Downloading the file twice is fine while a person has the sheet open, as long as closing the sheet cancels the second download.
- **A request that never fails needs a deadline.** The login-gated links never errored, so without the 15-second limit the player would have waited forever.
