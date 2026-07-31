<!--
  Routing happens server-side in `+page.server.ts` using the verified session,
  so this is only ever seen mid-redirect. It previously sniffed a `user_type`
  cookie, which was both client-tamperable and missing an `admin` branch.
-->
<p>Redirecting…</p>
