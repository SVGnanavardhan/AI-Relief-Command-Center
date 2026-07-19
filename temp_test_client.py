from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
resp = client.post('/api/report', data={'description': 'Automated verification', 'location': 'Chennai'}, files={'image': ('temp-upload.png', b'placeholder-image', 'image/png')})
print(resp.status_code)
print(resp.text)
