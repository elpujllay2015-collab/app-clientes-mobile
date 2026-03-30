from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)  # <-- LÍNEA INSERTADA
    updated_at = models.DateTimeField(auto_now=True)      # <-- LÍNEA INSERTADA

    class Meta:
        abstract = True  # <-- LÍNEA INSERTADA