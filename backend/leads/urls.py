from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, LoginView, RegisterView

router = DefaultRouter()
router.register(r"leads", LeadViewSet, basename="lead")  # /api/leads/

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),         # /api/auth/login/
    path("auth/register/", RegisterView.as_view(), name="register"), # /api/auth/register/
]

urlpatterns += router.urls