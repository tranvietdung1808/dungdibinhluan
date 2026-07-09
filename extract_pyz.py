import zlib, struct, os, marshal

extract_dir = r'C:\dungdibinhluan\pyz_extracted'
os.makedirs(extract_dir, exist_ok=True)

with open(r'C:\dungdibinhluan\token_generator.exe_extracted\PYZ-00.pyz', 'rb') as f:
    data = f.read()

# Format: PYZ\x00 (4) + python_magic (4) = 8 bytes header
# Then: chunked zlib streams, each with its own header
# The TOC is at the end of the file

# Let's find the TOC at the end
# Search backwards for the ZlibArchive cookie
# In PyInstaller >= 3.0: cookie is b'MEI\014\013\012\013\016' (8 bytes)
cookie_pos = None
for i in range(len(data) - 100, 0, -1):
    if data[i:i+2] == b'ME':
        cookie_pos = i
        break

if cookie_pos is None:
    print("No cookie found, trying alternative approach")
    # Try to read TOC from end - 4 bytes = TOC length
    toc_len = struct.unpack('<I', data[-4:])[0]
    print(f"TOC length from end: {toc_len}")
    
    # Try the last part as TOC
    toc_data = data[-(4 + toc_len):-4]
    print(f"TOC data size: {len(toc_data)}")
    
    # Parse TOC entries
    pos = 0
    entries = []
    while pos < len(toc_data):
        # Find null terminator
        null_pos = toc_data.find(b'\x00', pos)
        if null_pos == -1:
            break
        name = toc_data[pos:null_pos].decode('ascii', errors='replace')
        pos = null_pos + 1
        # Align to 4 bytes
        while pos % 4 != 0:
            pos += 1
        if pos + 12 > len(toc_data):
            break
        start_pos = struct.unpack('<I', toc_data[pos:pos+4])[0]
        comp_len = struct.unpack('<I', toc_data[pos+4:pos+8])[0]
        decomp_len = struct.unpack('<I', toc_data[pos+8:pos+12])[0]
        pos += 12
        entries.append((name, start_pos, comp_len, decomp_len))
    
    print(f"Found {len(entries)} TOC entries")
    for name, sp, cl, dl in entries[:20]:
        print(f"  {name}: pos={sp}, comp_len={cl}, decomp_len={dl}")
