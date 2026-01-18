import charset_normalizer
import io

file_path = r'c:\Users\dsuth\Documents\Code Projects\Timetable-3\rough-ideas\sample_classrooms_upload.csv'

with open(file_path, 'rb') as f:
    raw_content = f.read()
    
    # Simulate the new logic
    try:
        detection = charset_normalizer.from_bytes(raw_content).best()
        detected_encoding = detection.encoding if detection else None
    except Exception:
        detected_encoding = None
        
    content = None
    for enc in [detected_encoding, 'utf-8-sig', 'cp1252', 'latin-1', 'utf-8']:
        if not enc: continue
        try:
            content = raw_content.decode(enc)
            print(f"Successfully decoded with: {enc}")
            break
        except (UnicodeDecodeError, LookupError):
            continue
            
    if content:
        print("First line:", content.splitlines()[0])
    else:
        print("Failed to decode with any encoding.")
