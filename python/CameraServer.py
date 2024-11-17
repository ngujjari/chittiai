import asyncio
import websockets
import json
import io
import base64
from picamera2 import Picamera2
import time

class CameraServer:
    def __init__(self):
        self.camera = Picamera2()
        self.camera.configure(self.camera.create_preview_configuration(
            main={"size": (640, 480)},
            lores={"size": (320, 240)},
            display="lores"
        ))
        self.camera.start()
        self.streaming = False
        self.capturing = False
        time.sleep(2)  # Wait for camera to warm up

    async def capture_image(self):
        # Capture a still image
        stream = io.BytesIO()
        self.camera.capture_file(stream, format='jpeg')
        stream.seek(0)
        return base64.b64encode(stream.getvalue()).decode()

    async def handle_client(self, websocket):
        try:
            async for message in websocket:
                data = json.loads(message)
                command = data.get('command')

                if command == 'capture':
                    self.capturing = True
                    # Handle still image capture
                    image_data = await self.capture_image()
                    await websocket.send(json.dumps({
                        'type': 'image',
                        'data': image_data
                    }))
                    self.capturing = False
                elif command == 'stop_capture':
                    self.capturing = False
                elif command == 'stream':
                    # Handle video streaming
                    self.streaming = True
                    while self.streaming:
                        stream = io.BytesIO()
                        self.camera.capture_file(stream, format='jpeg')
                        stream.seek(0)
                        frame = base64.b64encode(stream.getvalue()).decode()
                        await websocket.send(json.dumps({
                            'type': 'stream',
                            'data': frame
                        }))
                        await asyncio.sleep(0.1)  # 10 FPS
                elif command == 'stop_stream':
                    self.streaming = False
        except websockets.exceptions.ConnectionClosed:
            self.streaming = False
            self.capturing = False

    async def start_server(self):
        async with websockets.serve(self.handle_client, "0.0.0.0", 8765):
            await asyncio.Future()  # Run forever

if __name__ == "__main__":
    camera_server = CameraServer()
    asyncio.run(camera_server.start_server())