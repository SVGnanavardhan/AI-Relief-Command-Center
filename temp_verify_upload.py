import json
import urllib.request
from pathlib import Path

p = Path('temp-upload.png')
p.write_bytes(b'placeholder-image')
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
parts = [
    f'--{boundary}\r\n'.encode(),
    b'Content-Disposition: form-data; name="description"\r\n\r\n',
    b'Automated upload verification report\r\n',
    f'--{boundary}\r\n'.encode(),
    b'Content-Disposition: form-data; name="location"\r\n\r\n',
    b'Chennai, Tamil Nadu\r\n',
    f'--{boundary}\r\n'.encode(),
    b'Content-Disposition: form-data; name="image"; filename="temp-upload.png"\r\n',
    b'Content-Type: image/png\r\n\r\n',
    p.read_bytes(),
    b'\r\n',
    f'--{boundary}--\r\n'.encode(),
]
req = urllib.request.Request('http://127.0.0.1:8001/api/report', data=b''.join(parts), headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
with urllib.request.urlopen(req, timeout=60) as response:
    data = json.loads(response.read().decode())
    print('OK', data.get('id'), data.get('status'), data.get('image_url'))
