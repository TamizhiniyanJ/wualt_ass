from django.db import models
from django.contrib.auth import get_user_model


User = get_user_model()


class Lead(models.Model):
	name = models.CharField(max_length=255)
	email = models.EmailField()
	phone = models.CharField(max_length=50, blank=True)
	source = models.CharField(max_length=100, blank=True)
	status = models.CharField(max_length=50, default="new")
	created_at = models.DateTimeField(auto_now_add=True)
	created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="leads")

	def __str__(self) -> str:
		return f"{self.name} <{self.email}>"
