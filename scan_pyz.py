import re

with open(r'C:\dungdibinhluan\token_generator.exe_extracted\PYZ-00.pyz', 'rb') as f:
    data = f.read()

# The PYZ contains compressed data that may have readable ASCII
# Let's find long ASCII strings
ascii_pattern = re.compile(b'[ -~]{20,}')
strings = ascii_pattern.findall(data)

# Filter for interesting strings
keywords = [b'ea.com', b'token', b'auth', b'license', b'http', b'api', 
            b'machine', b'hash', b'encrypt', b'decrypt', b'origin',
            b'accounts', b'juno', b'client', b'access', b'refresh',
            b'product', b'entitle', b'grant', b'login', b'signin']

seen = set()
for s in strings:
    lower = s.lower()
    for kw in keywords:
        if kw in lower and s not in seen:
            seen.add(s)
            try:
                print(s.decode('ascii'))
            except:
                pass
            if len(seen) >= 50:
                break

if not seen:
    print("No keyword matches found in PYZ.")
    print("Sample strings from PYZ:")
    for s in strings[:20]:
        try:
            print(f"  {s.decode('ascii', errors='replace')[:100]}")
        except:
            pass
