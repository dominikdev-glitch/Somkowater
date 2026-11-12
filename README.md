# Somko Water

Responsive Somko Water landing page with a scroll-driven product experience and a dedicated delivery-tracking page.

## Netlify deployment

The included `netlify.toml` publishes the project root and deploys the function in `netlify/functions`. No build command is required for this static site.

## Enable live delivery tracking

The tracking page is `/track.html`. It submits the order number and checkout phone number to `/.netlify/functions/track-delivery`.

Set these environment variables in Netlify:

- `SOMKO_TRACKING_API_URL`: private endpoint for your order/delivery platform.
- `SOMKO_TRACKING_API_KEY`: private API key. It remains server-side and is never exposed to the browser.

The upstream endpoint must accept a POST JSON body such as:

```json
{ "orderId": "SMK-10482", "phone": "+2348012345678" }
```

It must return JSON with this shape:

```json
{
  "orderId": "SMK-10482",
  "status": "in_transit",
  "statusLabel": "On the way",
  "estimatedDelivery": "14 Nov 2026",
  "carrier": "Delivery partner",
  "trackingNumber": "TRACK-12345",
  "events": [{
    "status": "order_confirmed",
    "label": "Order confirmed",
    "description": "Your order has been confirmed.",
    "location": "Lagos",
    "timestamp": "2026-11-12T08:00:00+01:00",
    "completed": true
  }]
}
```

Return events in chronological order. The upstream service must verify that the phone number belongs to the order and apply rate limiting. Until credentials are configured, the tracker displays a setup message instead of fabricated delivery updates.

## Product video

The homepage references `somko-hero.mp4` in the `site/` publish directory. Keep the original video asset there when deploying.
