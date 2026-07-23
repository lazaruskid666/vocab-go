export default async function handler(request, context) {
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }
    
    try {
        const body = await request.json();
        const word = body.word.trim();
        
        // Mengambil API Key dari Netlify Env
        const apiKey = Netlify.env.get("GEMINI_API_KEY"); 
        
        if (!apiKey) {
            throw new Error("API Key tidak ditemukan di server Netlify.");
        }

        const url = `https://aiplatform.googleapis.com/v1beta/projects/1008715804203/locations/global/publishers/google/models/gemini-1.5-flash:generateContent`;

        const prompt = `Analisis kata/frasa bahasa Inggris berikut: "${word}". 
        Berpatokan teguh pada aturan 8 Parts of Speech dan tata bahasa dari buku "Otodidak Jago Kuasai Bahasa Inggris dari Nol".
        Berikan respons murni dalam format JSON object tanpa teks awalan/akhiran, dengan kunci: 
        - "translation": arti utama/terjemahan baku dalam bahasa Indonesia, 
        - "pos": (Noun/Verb/Adjective/Adverb/Pronoun/Preposition/Conjunction/Interjection/Phrase), 
        - "verb_type": (V1/V2/V3/V-ing/Auxiliary/V1 (Modal) atau "-" jika bukan kata kerja), 
        - "context_type": (Leterlek / Idiom / Frasa / Slang / Peribahasa), 
        - "figurative_meaning": penjelasan makna kiasan atau slang mendalam dalam bahasa Indonesia, atau "-" jika tidak ada.`;

        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Google AI Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        const jsonString = data.candidates[0].content.parts[0].text;
        
        return new Response(jsonString, {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        // Ini akan mengirim detail error ke frontend agar bisa dibaca di F12
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
