export function GET() {
  return Response.json({ status: 'ok', app: 'SHIFT', modelActive: Boolean(process.env.OPENAI_API_KEY), timestamp: new Date().toISOString() });
}
