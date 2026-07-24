from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        })


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')
        new_password_confirm = request.data.get('new_password_confirm', '')

        if not current_password:
            return Response({'detail': 'Ingresá tu contraseña actual.'}, status=status.HTTP_400_BAD_REQUEST)

        if not new_password:
            return Response({'detail': 'Ingresá la nueva contraseña.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != new_password_confirm:
            return Response({'detail': 'La nueva contraseña y la confirmación no coinciden.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        if not user.check_password(current_password):
            return Response({'detail': 'La contraseña actual es incorrecta.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user=user)
        except ValidationError as exc:
            return Response({'detail': ' '.join(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])

        return Response({'detail': 'Contraseña actualizada correctamente.'}, status=status.HTTP_200_OK)
