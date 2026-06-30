/// <reference path="../pb_data/types.d.ts" />

routerUse((e) => {
    e.response.header().set("X-Frame-Options", "DENY")
    e.response.header().set("Content-Security-Policy", "frame-ancestors 'none'")
    e.response.header().set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    e.response.header().set("Referrer-Policy", "strict-origin-when-cross-origin")
    e.response.header().set("X-Content-Type-Options", "nosniff")
    e.response.header().set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
    return e.next()
})
