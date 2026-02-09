const fetch = require('node-fetch'); // Kalau error, ganti 'axios' atau pakai native fetch (Node 18+)

async function test() {
  const response = await fetch('http://localhost:5000/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText: "Saya Riswan, web developer jago React dan Next.js tapi belum pernah pakai Docker.",
      jobDescText: "Dicari Web Developer yang menguasai React, Next.js, dan Docker untuk containerization."
    })
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
test();