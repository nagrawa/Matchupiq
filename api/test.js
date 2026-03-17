export default async function handler(req, res) {
  res.status(200).json({ 
    hasKey: !!process.env.VITE_ANTHROPIC_API_KEY,
    keyPrefix: process.env.VITE_ANTHROPIC_API_KEY?.substring(0, 10) + "...",
  });
}
