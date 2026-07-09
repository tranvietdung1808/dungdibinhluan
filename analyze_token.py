import json, base64, datetime

with open(r'C:\Users\ADMIN\Downloads\DS4Windows_3.3.3_x64\token_data.txt', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('=== TOKEN_DATA.TXT ANALYSIS ===')
print()

# Analyze JWT token
access_token = data['last_access_token'][1]
print('JWT Access Token:')
parts = access_token.split('.')
print(f'  Parts: {len(parts)}')
if len(parts) >= 2:
    # Decode header
    header = base64.urlsafe_b64decode(parts[0] + '==')
    print(f'  Header: {json.loads(header)}')
    
    # Decode payload
    payload = base64.urlsafe_b64decode(parts[1] + '==')
    payload_json = json.loads(payload)
    print(f'  Payload keys: {list(payload_json.keys())}')
    print(f'  Issuer: {payload_json.get("iss")}')
    print(f'  Client: {payload_json.get("azp")}')
    
    # Convert timestamps
    if 'iat' in payload_json:
        iat = datetime.datetime.fromtimestamp(payload_json['iat'], tz=datetime.timezone.utc)
        print(f'  Issued at: {payload_json["iat"]} ({iat})')
    if 'exp' in payload_json:
        exp = datetime.datetime.fromtimestamp(payload_json['exp'], tz=datetime.timezone.utc)
        print(f'  Expires: {payload_json["exp"]} ({exp})')
    
    # Nexus info
    nexus = payload_json.get('nexus', {})
    print(f'  Nexus keys: {list(nexus.keys())}')
    if 'clid' in nexus:
        print(f'    Client ID: {nexus["clid"]}')
    if 'uid' in nexus:
        print(f'    User ID: {nexus["uid"]}')
    if 'pid' in nexus:
        print(f'    Product ID: {nexus["pid"]}')
    if 'scid' in nexus:
        scopes = nexus['scid']
        print(f'    Scopes: {scopes[:200]}...')
    
    # IP Geo
    ipgeo = nexus.get('ipgeo', {})
    print(f'    IP Geo: {ipgeo}')

print()
print(f'Machine Hash: {data["machine_hash"]}')
print(f'Login Automatic: {data["login_automatic"]}')
print()

print('Tokens (license grants):')
for k, v in data['tokens'].items():
    print(f'  Product ID {k}: {v}')
