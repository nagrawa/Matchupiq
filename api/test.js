export default async function handler(req, res) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 100,
        messages: [{ role: "user", content: "Say OK" }],
      }),
    });

    const data = await response.json();
    res.status(200).json({ 
      httpStatus: response.status, 
      response: data 
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
