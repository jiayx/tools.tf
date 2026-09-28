# Shared Google Analytics

All eight apps use `GoogleAnalytics` in their Hono HTML renderer. The shared
measurement ID is `G-K8QNWFNXLL`. Only the explicit production HTTPS hostnames
in `src/index.ts` load the Google tag; localhost and preview hosts are excluded.
New apps must add their production hostname to this list and include the component.

The tag sends the initial page view through GA4's default `config` behavior.
These apps currently do not use client-side history routing. No custom tool-input
or action events are sent. Page location and referrer omit query strings and
fragments (including UTM parameters); automatic advertising signals are disabled.
API and image responses are not instrumented.

In the GA4 Web data stream, disable enhanced measurement of form interactions,
site search, outbound clicks and file downloads if only basic visit statistics
are desired: those Google-controlled features can collect additional URLs and
form metadata beyond this integration's page fields. If routing is introduced,
review page-view handling before enabling automatic history measurement.

After deployment, use Tag Assistant and GA4 Realtime to confirm one initial
page view and the correct hostname per site. This requires access to the GA4
property and cannot be verified by the local tests.
