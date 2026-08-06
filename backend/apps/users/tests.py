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


class TestMeView:

    def test_unauthenticated_user_cannot_view_profile(self, api_client):
        response = api_client.get('/api/v1/users/me/')

        assert response.status_code == 401

    def test_authenticated_user_can_retrieve_own_profile(self, auth_client, user):
        response = auth_client.get('/api/v1/users/me/')

        assert response.status_code == 200
        assert response.data['id'] == user.id
        assert response.data['email'] == user.email

    def test_user_can_update_username_avatar_and_bio(self, auth_client, user):
        payload = {
            'username': 'nuevo_nombre',
            'avatar': 'https://example.com/avatar.png',
            'bio': 'Una bio de prueba.',
        }

        response = auth_client.patch('/api/v1/users/me/', payload, format='json')

        assert response.status_code == 200
        user.refresh_from_db()
        assert user.username == 'nuevo_nombre'
        assert user.avatar == 'https://example.com/avatar.png'
        assert user.bio == 'Una bio de prueba.'

    def test_user_cannot_change_email_via_profile_update(self, auth_client, user):
        # email es read_only en UserDetailSerializer: el intento de
        # cambiarlo se ignora en vez de fallar.
        original_email = user.email

        response = auth_client.patch(
            '/api/v1/users/me/', {'email': 'otro@test.com'}, format='json'
        )

        assert response.status_code == 200
        user.refresh_from_db()
        assert user.email == original_email
