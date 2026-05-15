import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

export default async function (request: ZuploRequest, context: ZuploContext) {
  const body = await request.json();
  const token = body.token;

  if (!token) {
    return new Response(
      JSON.stringify({ success: false, message: "Falta el token" }), 
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const secretKey = context.env.TURNSTILE_SECRET_KEY || "";

  const formData = new FormData();
  formData.append("secret", secretKey);
  formData.append("response", token);

  try {
    const cfResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const cfResult = await cfResponse.json();

    if (cfResult.success) {
      return new Response(
        JSON.stringify({ success: true }), 
        { status: 200, headers: { "content-type": "application/json" } }
      );
    } else {
      context.log.warn(`Token inválido: ${JSON.stringify(cfResult)}`);
      return new Response(
        JSON.stringify({ success: false }), 
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }
  } catch (error) {
    context.log.error("Error contactando a Cloudflare", error);
    return new Response(
      JSON.stringify({ success: false }), 
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}