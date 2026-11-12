/**
 * Secure Somko delivery lookup proxy.
 * Configure SOMKO_TRACKING_API_URL and SOMKO_TRACKING_API_KEY in Netlify.
 * Upstream: POST { orderId, phone }, returning the response contract in README.md.
 */
export default async (request) => {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers: { allow: "POST" } });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Please enter a valid order number and phone number." }, { status: 400 }); }
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!orderId || !phone || orderId.length > 64 || phone.length > 32) return Response.json({ error: "Please enter a valid order number and checkout phone number." }, { status: 400 });
  const endpoint = Netlify.env.get("SOMKO_TRACKING_API_URL");
  const apiKey = Netlify.env.get("SOMKO_TRACKING_API_KEY");
  if (!endpoint || !apiKey) return Response.json({ error: "Online tracking is being connected. Please contact Somko support with your order number for the latest update." }, { status: 503 });
  try {
    const upstream = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ orderId, phone }), signal: AbortSignal.timeout(10000) });
    const result = await upstream.json().catch(() => null);
    if (upstream.status === 404) return Response.json({ error: "We could not find an order matching those details. Check them and try again." }, { status: 404 });
    if (!upstream.ok || !result) return Response.json({ error: "The tracking service is temporarily unavailable. Please try again shortly." }, { status: 502 });
    const safe = {
      orderId: String(result.orderId || orderId), status: String(result.status || ""), statusLabel: String(result.statusLabel || ""),
      estimatedDelivery: result.estimatedDelivery ? String(result.estimatedDelivery) : null, carrier: result.carrier ? String(result.carrier) : null,
      trackingNumber: result.trackingNumber ? String(result.trackingNumber) : null,
      events: Array.isArray(result.events) ? result.events.slice(0, 30).map(item => ({
        status: item.status ? String(item.status) : null, label: item.label ? String(item.label) : null,
        description: item.description ? String(item.description) : null, location: item.location ? String(item.location) : null,
        timestamp: item.timestamp ? String(item.timestamp) : null, completed: item.completed === true
      })) : []
    };
    if (!safe.status || !safe.events.length) return Response.json({ error: "No delivery updates are available for this order yet. Please check again later." }, { status: 404 });
    return Response.json(safe, { headers: { "cache-control": "no-store" } });
  } catch { return Response.json({ error: "The tracking service could not be reached. Please try again shortly." }, { status: 502 }); }
};