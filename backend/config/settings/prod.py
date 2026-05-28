from .base import *  # noqa: F403

DEBUG = False

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["*"])  # noqa: F405

REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"] = [  # noqa: F405
    "rest_framework.permissions.AllowAny",
]

CORS_ALLOW_ALL_ORIGINS = env.bool("CORS_ALLOW_ALL_ORIGINS", default=True)  # noqa: F405

# Railway/Vercel: use CORS_ALLOW_ALL_ORIGINS=true — NOT CORS_ALLOWED_ORIGINS=true
if CORS_ALLOW_ALL_ORIGINS:
    CORS_ALLOWED_ORIGINS = []  # noqa: F405
else:
    CORS_ALLOWED_ORIGINS = [  # noqa: F405
        origin.strip()
        for origin in env.list("CORS_ALLOWED_ORIGINS", default=[])  # noqa: F405
        if origin.strip().startswith(("http://", "https://"))
    ]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
