import { publicCard, securityHeaders, errorPage } from "@/lib/cards";
import { createVcf } from "@/shared/vcard";
export async function GET(request: Request, { params }: { params: Promise<{token: string}> }) {
  try { return new Response(createVcf(await publicCard((await params).token, new URL(request.url).origin)), {
    headers: {...securityHeaders, "Content-Type":"text/vcard; charset=utf-8", "Content-Disposition":'attachment; filename="contact.vcf"'},
  }); } catch (error) { return errorPage(error); }
}
