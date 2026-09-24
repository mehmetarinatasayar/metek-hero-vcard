import { publicCard, cardPage, errorPage } from "@/lib/cards";
export async function GET(request: Request, { params }: { params: Promise<{token: string}> }) {
  try { return cardPage(await publicCard((await params).token, new URL(request.url).origin)); }
  catch (error) { return errorPage(error); }
}
