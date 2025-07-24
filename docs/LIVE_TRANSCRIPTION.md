# Live Earnings Call Transcription

This feature allows authenticated users to open a webcast URL and receive a transcript in real time while listening. Audio is captured in the browser and sent to OpenAI Whisper for transcription.

## Overview
1. **User enters a webcast URL** on the `Dashboard → Live Transcription` page.
2. The page loads the webcast in an iframe and captures its audio using `HTMLMediaElement.captureStream()`.
3. Audio chunks are sent to the backend over WebSockets.
4. The server calls OpenAI Whisper to transcribe each chunk and sends the text back over the same socket.

## Environment Variables
This feature uses the existing `OWNER_OPENAI_API_KEY` environment variable to authenticate with the OpenAI API.

## API Endpoints
### `POST /api/live-transcription/start`
Starts a new live transcription session.
**Body Parameters**
- `callUrl` – URL of the webcast audio or video stream.

The endpoint returns a `sessionId` used to connect to the WebSocket stream.

### `GET /api/live-transcription/stream?sessionId=...`
Upgrades to a WebSocket connection that delivers transcription text as it is produced. Each message contains a JSON payload `{ text: string, timestamp: number }`.

## Usage Flow
1. Navigate to **Dashboard → Live Transcription**.
2. Enter the webcast URL and click **Start**.
3. The page will open a WebSocket connection and display text as it arrives.
4. When the call ends, the final transcript can be copied or downloaded.

This architecture keeps the browser lightweight while the server handles audio processing and transcription duties.
