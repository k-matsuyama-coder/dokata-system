export function ok(data: Record<string, unknown> = {}) {
    return Response.json({
      ok: true,
      ...data,
    });
  }
  
  export function badRequest(message = "Bad Request") {
    return Response.json({ error: message }, { status: 400 });
  }
  
  export function unauthorized(message = "Unauthorized") {
    return Response.json({ error: message }, { status: 401 });
  }
  
  export function forbidden(message = "Forbidden") {
    return Response.json({ error: message }, { status: 403 });
  }
  
  export function notFound(message = "Not Found") {
    return Response.json({ error: message }, { status: 404 });
  }
  
  export function serverError(error: unknown) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }