require('dotenv').config({ path: '.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('--- DIAGNOSTIC START ---');
console.log('Supabase URL:', url);
console.log('URL Length:', url.length);
for (let i = 0; i < url.length; i++) {
  if (url.charCodeAt(i) > 255) {
    console.log(`Found non-ASCII character at URL index ${i}: "${url[i]}" (char code ${url.charCodeAt(i)})`);
  }
}

console.log('Key Length:', key.length);
for (let i = 0; i < key.length; i++) {
  if (key.charCodeAt(i) > 255) {
    console.log(`Found non-ASCII character at Key index ${i}: "${key[i]}" (char code ${key.charCodeAt(i)})`);
  }
}
console.log('--- DIAGNOSTIC END ---');
