const API_KEY = "AIzaSyCnxR66-aFZlqNz-08qQ5dVLLmwsfVjO_8";

async function run() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const systemPrompt = "Bạn là chuyên gia marketing.";
    const userPrompt = "Tạo 1 kịch bản video 15s cho sản phẩm cà phê.";
    
    const payload = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json"
            }
        };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Data:", JSON.stringify(data, null, 2));
    } catch(err) {
        console.error("Fetch Error:", err);
    }
}
run();
