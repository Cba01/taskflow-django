import pytest

from apps.users.models import User

pytestmark = pytest.mark.django_db


class TestUserRegistration:

    def test_register_creates_user(self, api_client):
        # Arrange: los datos que vamos a mandar en el POST
        payload = {
            'username': 'nuevo',
            'email': 'nuevo@test.com',
            'password': 'clave12345',
        }

        # Act: la llamada real al endpoint
        response = api_client.post('/api/v1/auth/register/', payload, format='json')

        # Assert: se creó (201) y la contraseña no viaja en la respuesta
        assert response.status_code == 201
        assert 'password' not in response.data

        # Assert: el usuario realmente existe en la base de datos
        user = User.objects.get(email='nuevo@test.com')
        assert user.username == 'nuevo'

        # Assert: la contraseña se guardó hasheada, no en texto plano
        assert user.check_password('clave12345')

    def test_register_rejects_duplicate_email(self, api_client, create_user):
        # Arrange: ya existe un usuario con ese email
        create_user(email='existente@test.com')

        # Act: intentamos registrar OTRO usuario con el mismo email
        payload = {
            'username': 'otro',
            'email': 'existente@test.com',
            'password': 'clave12345',
        }
        response = api_client.post('/api/v1/auth/register/', payload, format='json')

        # Assert: la API lo rechaza
        assert response.status_code == 400
