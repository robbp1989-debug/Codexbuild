export function GET() {
  return Response.json({ status: 'ok', app: 'SHIFT', modelActive: Boolean(process.env.GEMINI_API_KEY), timestamp: new Date().toISOString() });
}
