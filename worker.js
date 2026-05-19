export default {
  async fetch(request) {
    // Serve index.html for all routes
    const url = new URL(request.url);
    let filePath = url.pathname;

    // Default to index.html for root
    if (filePath === '/') {
      filePath = '/index.html';
    }

    try {
      // Try to fetch the requested file
      const response = await fetch(new Request(request.url, request));

      // Add security headers
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-Content-Type-Options', 'nosniff');
      newHeaders.set('X-Frame-Options', 'SAMEORIGIN');
      newHeaders.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; font-src https://fonts.gstatic.com; img-src 'self' data:;");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      // Fallback to index.html for client-side routing
      try {
        const fallback = await fetch(new URL('/index.html', request.url));
        const newHeaders = new Headers(fallback.headers);
        newHeaders.set('X-Content-Type-Options', 'nosniff');
        newHeaders.set('X-Frame-Options', 'SAMEORIGIN');
        newHeaders.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; font-src https://fonts.gstatic.com; img-src 'self' data:;");

        return new Response(fallback.body, {
          status: 200,
          statusText: 'OK',
          headers: newHeaders,
        });
      } catch {
        return new Response('Not found', { status: 404 });
      }
    }
  },
};
