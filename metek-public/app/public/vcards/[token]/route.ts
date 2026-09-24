import { publicCard, CardError, json } from "@/lib/cards";
export async function GET(request: Request, {params}: {params:Promise<{token:string}>}) {
  try {
    const {id: _id,userId: _owner,publicToken: _token,createdAt: _created,updatedAt: _updated,...data} = await publicCard((await params).token,new URL(request.url).origin);
    return json(data);
  } catch(error) { return json({message:error instanceof CardError ? error.message : "Kartvizit hizmetine ulaşılamıyor."},error instanceof CardError ? error.status : 503); }
}
