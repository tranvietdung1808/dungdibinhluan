import re

with open(r'C:\dungdibinhluan\token_generator.exe', 'rb') as f:
    data = f.read()

# Search for Python source code patterns
patterns = [
    (b'def ', 'Function definitions'),
    (b'import ', 'Import statements'),
    (b'class ', 'Class definitions'),
    (b'http://', 'URLs'),
    (b'https://', 'URLs (secure)'),
    (b'localhost', 'Localhost references'),
    (b'.com/', '.com URLs'),
    (b'machine_hash', 'Machine hash'),
    (b'access_token', 'Access token'),
    (b'refresh_token', 'Refresh token'),
    (b'bearer', 'Bearer auth'),
    (b'Authorization', 'Auth header'),
    (b'X-', 'Custom headers'),
    (b'User-Agent', 'User agent'),
    (b'identity', 'Identity'),
    (b'api/', 'API paths'),
    (b'oauth', 'OAuth'),
    (b'v1/', 'API v1'),
    (b'v2/', 'API v2'),
    (b'json', 'JSON'),
]

for pattern, desc in patterns:
    results = []
    for m in re.finditer(pattern, data, re.IGNORECASE):
        start = max(0, m.start() - 30)
        end = min(len(data), m.end() + 50)
        context = data[start:end]
        try:
            ctx_str = context.decode('ascii', errors='replace')
            results.append(ctx_str)
        except:
            pass
    if results:
        print(f'\n=== {desc} ({len(results)} found) ===')
        for r in results[:5]:
            print(f'  {repr(r)[:120]}')
